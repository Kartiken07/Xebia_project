import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import config from '../config/index.js';

const JWT_SECRET = config.jwt.secret;

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null) || req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access Token Required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch latest user details from DB to ensure they aren't locked/deleted
    const latestUser = await db.users.findById(decoded.userId);
    if (!latestUser) {
      return res.status(403).json({ success: false, message: 'User Account Not Found' });
    }
    if (latestUser.locked) {
      return res.status(403).json({ success: false, message: 'Account Locked. Please Contact Administrator.' });
    }

    req.user = latestUser;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or Expired Token' });
  }
};

export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    if (req.user.role === 'SUPER_ADMIN') {
      // Super Admin bypasses all checks
      return next();
    }

    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({ success: false, message: 'Access Denied: Insufficient Permissions' });
  };
};
