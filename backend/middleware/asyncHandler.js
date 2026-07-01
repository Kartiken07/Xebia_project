/**
 * Wraps an async Express route handler to catch rejected promises
 * and forward them to Express's error-handling middleware.
 *
 * Without this, an unhandled promise rejection inside an async route
 * will crash the Node.js process because Express does not natively
 * catch errors from async functions.
 *
 * Usage:
 *   router.get('/path', asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
