import { z } from 'zod';

/**
 * Zod schemas for authentication endpoints.
 * These ensure all input is a string of expected shape,
 * preventing NoSQL injection (where an attacker sends { "$gt": "" } instead of a string).
 */

export const loginSchema = {
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
};

export const forgotPasswordSchema = {
  body: z.object({
    email: z.string().email('Invalid email format'),
  }),
};

export const resetPasswordSchema = {
  body: z.object({
    email: z.string().email('Invalid email format'),
    resetToken: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  }),
};

export const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  }),
};
