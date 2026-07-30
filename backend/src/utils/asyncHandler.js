/**
 * Wrap an async Express handler so any rejected promise (thrown error,
 * failed await) is forwarded to next(err) automatically. Without this,
 * every single controller would need its own try/catch block, and
 * missing just one would crash the process on an unhandled rejection.
 *
 * Usage: router.post('/', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
