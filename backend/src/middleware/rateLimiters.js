import rateLimit from 'express-rate-limit';

const jsonRateLimitHandler = (req, res /* , next, options */) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please slow down and try again shortly.',
    code: 'RATE_LIMITED',
  });
};

/** Applied to every /api/* request. Generous — this just stops runaway loops/bots. */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/** Applied to /api/auth/* — a little stricter since these run on every app load. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler,
});

/**
 * Applied ONLY to POST /api/complaints. Keyed by the logged-in user's
 * firebaseUid (set by authMiddleware, which runs before this) rather
 * than IP, so one dorm's shared WiFi/NAT can't get everyone rate
 * limited together, and one spamming student can't just switch IPs.
 */
export const createComplaintLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.firebaseUid || req.ip,
  handler: jsonRateLimitHandler,
});
