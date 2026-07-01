import NodeCache from 'node-cache';
import { successResponse } from '../utils/responseHelper.js';

// Cache instance with standard TTL of 5 minutes (300 seconds)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * Express middleware to cache responses.
 * @param {number} duration Cache duration in seconds.
 */
export const cacheResponse = (duration = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Construct a unique key based on the URL and query parameters
    const key = `__express__${req.originalUrl || req.url}`;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      // If we have a cached response, serve it directly
      return successResponse(res, 200, cachedResponse.message, { ...cachedResponse.data, _cached: true });
    }

    // Intercept the response JSON method to cache it before sending
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Only cache successful responses (where our helper wraps in { success: true })
      if (body && body.success) {
        const cacheData = {
          message: body.message,
          data: {}
        };
        // Extract everything except success and message into the data object
        for (const [key, value] of Object.entries(body)) {
          if (key !== 'success' && key !== 'message') {
            cacheData.data[key] = value;
          }
        }
        cache.set(key, cacheData, duration);
      }
      originalJson(body);
    };

    next();
  };
};

/**
 * Utility to manually clear cache for a specific path prefix
 * (e.g., when a POST/PUT/DELETE invalidates a GET collection)
 */
export const clearCache = (prefix) => {
  const keys = cache.keys();
  const keysToDelete = keys.filter(key => key.startsWith(`__express__${prefix}`));
  if (keysToDelete.length > 0) {
    cache.del(keysToDelete);
  }
};
