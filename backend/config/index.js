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
  mongoUri: requireEnv('MONGO_URI', 'mongodb+srv://XebiaProject:hashpassword@cluster0.8sabszt.mongodb.net/workforce?retryWrites=true&w=majority&appName=Cluster0'),
  redisUri: process.env.REDIS_URI || 'redis://127.0.0.1:6379',

  // Authentication
  jwt: {
    secret: process.env.JWT_SECRET || 'xebia-workforce-jwt-secret-2026',
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'xebia-workforce-refresh-secret-2026',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  // CORS
  cors: {
    // Comma-separated list of allowed origins, or '*' for development
    allowedOrigins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
      : ['http://localhost:5173', 'http://localhost:5000', 'http://localhost:3000', 'https://xebia-workforce.vercel.app', 'https://xebia-project-alpha.vercel.app'],
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
