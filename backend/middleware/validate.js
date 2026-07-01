import { ZodError } from 'zod';

/**
 * Express middleware factory for request validation using Zod schemas.
 *
 * Validates req.body, req.query, and/or req.params against provided schemas.
 * Returns a structured 400 error if validation fails.
 *
 * Usage:
 *   import { z } from 'zod';
 *   const schema = { body: z.object({ email: z.string().email() }) };
 *   router.post('/login', validate(schema), handler);
 */
const validate = (schemas) => (req, res, next) => {
  try {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    if (schemas.query) {
      req.query = schemas.query.parse(req.query);
    }
    if (schemas.params) {
      req.params = schemas.params.parse(req.params);
    }
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const errors = err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }
    next(err);
  }
};

export default validate;
