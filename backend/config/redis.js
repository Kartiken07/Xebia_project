import { Redis } from 'ioredis';
import config from './index.js';

const connection = new Redis(config.REDIS_URI || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null, // Required by BullMQ
});

connection.on('error', (err) => {
  console.error('[Redis] Connection Error:', err.message);
});

export default connection;
