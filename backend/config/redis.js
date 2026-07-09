import config from './index.js';

let connection = null;

/**
 * Lazy Redis connection — only created when explicitly requested.
 * Returns null if Redis is unavailable (e.g. on Vercel serverless).
 */
export function getRedisConnection() {
  if (connection) return connection;

  // Don't even attempt Redis on Vercel serverless — it will never work
  if (process.env.VERCEL || !config.redisUri) {
    console.warn('[Redis] Skipped — running in serverless / no REDIS_URI configured.');
    return null;
  }

  try {
    const { Redis } = await import('ioredis');
    connection = new Redis(config.redisUri, {
      maxRetriesPerRequest: null,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 2000)),
    });
    connection.on('error', (err) => {
      console.error('[Redis] Connection Error:', err.message);
    });
    return connection;
  } catch {
    console.warn('[Redis] ioredis not available, skipping.');
    return null;
  }
}

export default connection;
