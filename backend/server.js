import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/index.js';

// Route imports
import authRouter from './routes/auth.js';
import orgRouter from './routes/organization.js';
import employeeRouter from './routes/employees.js';
import recruitRouter from './routes/recruitment.js';
import attendRouter from './routes/attendance.js';
import leaveRouter from './routes/leaves.js';
import payrollRouter from './routes/payroll.js';
import projectRouter from './routes/projects.js';
import performRouter from './routes/performance.js';
import assetRouter from './routes/assets.js';
import ticketRouter from './routes/tickets.js';
import aiRouter from './routes/ai.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ──────────────────────────────────────────────
// Security Middleware
// ──────────────────────────────────────────────

// Helmet: sets secure HTTP headers (X-Content-Type-Options, X-Frame-Options, etc.)
app.use(helmet());

// CORS: restrict to known origins instead of accepting all
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
}));

// Body parser with size limit to prevent payload-based DoS
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Compression for payload reduction
app.use(compression());

// Global rate limiter: broad protection against API abuse
const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api/', globalLimiter);

// Strict rate limiter for authentication endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.rateLimit.authMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again in 15 minutes.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// ──────────────────────────────────────────────
// Logging Middleware
// ──────────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ──────────────────────────────────────────────
// Ensure DB is connected before any API route
// ──────────────────────────────────────────────
import { connectDB } from './db.js';

app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('[DB Middleware] Failed to connect:', err.message);
    res.status(503).json({ success: false, message: 'Database unavailable. Please try again shortly.' });
  }
});

// ──────────────────────────────────────────────
// API Routes
// ──────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/organization', orgRouter);
app.use('/api/employees', employeeRouter);
app.use('/api/recruitment', recruitRouter);
app.use('/api/attendance', attendRouter);
app.use('/api/leaves', leaveRouter);
app.use('/api/payroll', payrollRouter);
app.use('/api/projects', projectRouter);
app.use('/api/performance', performRouter);
app.use('/api/assets', assetRouter);
app.use('/api/tickets', ticketRouter);
app.use('/api/ai', aiRouter);

// Health check — verifies both server and DB connectivity
app.get('/api/health', async (req, res) => {
  const mongoose = (await import('mongoose')).default;
  const dbStateNames = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    success: true,
    status: 'Healthy',
    database: dbStateNames[mongoose.connection.readyState] || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

// Root route so visitors don't see "Cannot GET /"
app.get('/', (req, res) => {
  res.send('Workforce API Server is running!');
});

// ──────────────────────────────────────────────
// Global Error Handler
// ──────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.url}:`, err.message);
  if (config.nodeEnv !== 'production') {
    console.error(err.stack);
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error', // Temporarily exposed for debugging
    stack: err.stack // Temporarily exposed for debugging
  });
});

// ──────────────────────────────────────────────
// Start Server
// ──────────────────────────────────────────────
const PORT = process.env.PORT || config.port;
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 Workforce API Server running on port ${PORT}`);
  console.log(`🔒 Environment: ${config.nodeEnv}`);
  console.log(`🌐 CORS Origins: ${config.cors.allowedOrigins.join(', ')}`);
  console.log(`==================================================`);
});

export default app;
