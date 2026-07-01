import dotenv from 'dotenv';
dotenv.config();

/**
 * Centralized configuration module.
 * Reads from environment variables and validates that critical secrets are present.
 * Throws at startup if any required variable is missing — fail fast, not silently.
 */

function requireEnv(name, fallback) {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. Set it in your .env file.`);
  }
  return value;
}

const config = {
  // Server
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  mongoUri: requireEnv('MONGO_URI', 'mongodb://127.0.0.1:27017/workforce'),
  redisUri: process.env.REDIS_URI || 'redis://127.0.0.1:6379',

  // Authentication
  jwt: {
    // In development, allow the fallback. In production, require an explicit secret.
    secret: process.env.NODE_ENV === 'production'
      ? requireEnv('JWT_SECRET')
      : (process.env.JWT_SECRET || 'dev-only-jwt-secret-do-not-use-in-prod'),
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshSecret: process.env.NODE_ENV === 'production'
      ? requireEnv('JWT_REFRESH_SECRET')
      : (process.env.JWT_REFRESH_SECRET || 'dev-only-refresh-secret-123'),
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  // CORS
  cors: {
    // Comma-separated list of allowed origins, or '*' for development
    allowedOrigins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
      : ['http://localhost:5173', 'http://localhost:5000'],
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    authMaxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '10', 10),
  },

  // AI / Gemini
  geminiApiKey: process.env.GEMINI_API_KEY || '',
};

export default config;
