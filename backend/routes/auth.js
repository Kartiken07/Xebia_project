import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import asyncHandler from '../middleware/asyncHandler.js';
import validate from '../middleware/validate.js';
import config from '../config/index.js';
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../schemas/auth.schemas.js';

const router = express.Router();
const JWT_SECRET = config.jwt.secret;
const REFRESH_SECRET = config.jwt.refreshSecret;

// Helper to set cookies
const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

// Validate password requirements (BR-02 & BR-03)
export const validatePassword = (password) => {
  if (password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUpper && hasLower && hasNumber && hasSpecial;
};

// User Login (FR-A01)
router.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await db.users.findOne({ email });

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid Credentials' });
  }

  if (user.locked) {
    return res.status(403).json({ success: false, message: 'Account locked due to 5 failed login attempts. Contact Admin.' });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    const attempts = (user.failedLoginAttempts || 0) + 1;
    const isLocked = attempts >= 5;
    
    await db.users.findByIdAndUpdate(user._id, {
      failedLoginAttempts: attempts,
      locked: isLocked
    });

    if (isLocked) {
      await db.auditLogs.create({
        userId: user._id,
        action: 'Account Locked',
        details: `Account locked for email ${email} after 5 failed attempts`,
        timestamp: new Date().toISOString()
      });
      return res.status(403).json({ success: false, message: 'Account locked due to 5 failed login attempts. Contact Admin.' });
    }

    return res.status(401).json({ success: false, message: `Invalid Credentials. ${5 - attempts} attempts remaining.` });
  }

  // Clear failed login attempts on success
  await db.users.findByIdAndUpdate(user._id, { failedLoginAttempts: 0 });

  // Generate tokens
  const token = jwt.sign(
    { userId: user._id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: config.jwt.accessTokenExpiry }
  );

  const refreshToken = crypto.randomBytes(40).toString('hex');
  const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

  await db.users.findByIdAndUpdate(user._id, {
    refreshToken: hashedRefreshToken
  });

  await db.auditLogs.create({
    userId: user._id,
    action: 'User Login',
    details: `Successful login from ${email}`,
    timestamp: new Date().toISOString()
  });

  setAuthCookies(res, token, refreshToken);

  res.json({
    success: true,
    role: user.role,
    employeeId: user.employeeId || null,
    name: user.name,
    accessToken: token
  });
}));

// Refresh Token (FR-A06)
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Refresh token not found' });
  }

  const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const user = await db.users.findOne({ refreshToken: hashedToken });

  if (!user || user.locked) {
    res.clearCookie('accessToken', { sameSite: config.nodeEnv === 'production' ? 'none' : 'lax', secure: config.nodeEnv === 'production' });
    res.clearCookie('refreshToken', { sameSite: config.nodeEnv === 'production' ? 'none' : 'lax', secure: config.nodeEnv === 'production' });
    return res.status(403).json({ success: false, message: 'Invalid refresh token or account locked' });
  }

  const newAccessToken = jwt.sign(
    { userId: user._id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: config.jwt.accessTokenExpiry }
  );

  const newRefreshToken = crypto.randomBytes(40).toString('hex');
  const newHashedRefreshToken = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

  await db.users.findByIdAndUpdate(user._id, {
    refreshToken: newHashedRefreshToken
  });

  setAuthCookies(res, newAccessToken, newRefreshToken);

  res.json({ success: true, message: 'Tokens refreshed', accessToken: newAccessToken });
}));

// User Logout (FR-A07)
router.post('/logout', asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;
  if (refreshToken) {
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await db.users.updateOne({ refreshToken: hashedToken }, { refreshToken: null });
  }
  
  res.clearCookie('accessToken', { sameSite: config.nodeEnv === 'production' ? 'none' : 'lax', secure: config.nodeEnv === 'production' });
  res.clearCookie('refreshToken', { sameSite: config.nodeEnv === 'production' ? 'none' : 'lax', secure: config.nodeEnv === 'production' });
  res.json({ success: true, message: 'Logged out successfully' });
}));

// Forgot Password (FR-A02)
// Generates a cryptographically secure token, hashes it, stores it with expiry.
router.post('/forgot-password', validate(forgotPasswordSchema), asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await db.users.findOne({ email });

  if (!user) {
    // Security: return the same success message whether or not the email exists.
    // This prevents email enumeration attacks.
    return res.json({
      success: true,
      message: 'If this email is registered, reset instructions have been sent.',
    });
  }

  // Generate a secure reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const resetExpiry = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes

  await db.users.findByIdAndUpdate(user._id, {
    resetToken: hashedToken,
    resetTokenExpiry: resetExpiry,
  });

  // In production, this token would be sent via email.
  // For development/testing, we return it in the response.
  res.json({
    success: true,
    message: 'If this email is registered, reset instructions have been sent.',
    ...(config.nodeEnv !== 'production' && { resetToken }), // Only expose in non-production
  });
}));

// Reset Password (FR-A03) — now requires and validates the reset token
router.post('/reset-password', validate(resetPasswordSchema), asyncHandler(async (req, res) => {
  const { email, resetToken, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match' });
  }

  if (!validatePassword(newPassword)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long, contain uppercase, lowercase, numeric and special characters.'
    });
  }

  const user = await db.users.findOne({ email });
  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
  }

  // Verify the token
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  if (!user.resetToken || user.resetToken !== hashedToken) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
  }

  // Verify token hasn't expired
  if (!user.resetTokenExpiry || new Date(user.resetTokenExpiry) < new Date()) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await db.users.findByIdAndUpdate(user._id, {
    password: hashedPassword,
    locked: false,
    failedLoginAttempts: 0,
    resetToken: null,
    resetTokenExpiry: null,
  });

  await db.auditLogs.create({
    userId: user._id,
    action: 'Password Reset',
    details: `Password reset successfully for ${email}`,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, message: 'Password has been reset successfully.' });
}));

// Change Password (FR-A04)
router.post('/change-password', authenticateToken, validate(changePasswordSchema), asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match' });
  }

  const isMatch = await bcrypt.compare(currentPassword, req.user.password);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }

  if (!validatePassword(newPassword)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long, contain uppercase, lowercase, numeric and special characters.'
    });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await db.users.findByIdAndUpdate(req.user._id, { password: hashedPassword });

  await db.auditLogs.create({
    userId: req.user._id,
    action: 'Password Changed',
    details: 'User password changed from profile settings',
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, message: 'Password changed successfully' });
}));

// Profile Management (FR-A09)
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const user = req.user;
  let employee = null;

  if (user.employeeId) {
    employee = await db.employees.findOne({ employeeId: user.employeeId });
  }

  res.json({
    success: true,
    user: {
      email: user.email,
      role: user.role,
      name: user.name,
      employeeId: user.employeeId
    },
    employee
  });
}));

export default router;
