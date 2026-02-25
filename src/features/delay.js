/**
 * Response delay middleware.
 *
 * Adds configurable latency to simulate slow networks.
 *
 * Config:
 *   latency: 500            → fixed 500ms delay
 *   latency: [200, 1000]    → random delay between 200-1000ms
 *   latency: { min: 200, max: 1000 }
 */
export function delayMiddleware(latency) {
  if (!latency) return (_req, _res, next) => next();

  return (_req, _res, next) => {
    const ms = calculateDelay(latency);
    if (ms <= 0) return next();
    setTimeout(next, ms);
  };
}

/**
 * Calculate delay in ms from various config formats
 */
function calculateDelay(latency) {
  if (typeof latency === 'number') {
    return latency;
  }

  if (Array.isArray(latency) && latency.length === 2) {
    const [min, max] = latency;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  if (typeof latency === 'object' && latency.min !== undefined && latency.max !== undefined) {
    const { min, max } = latency;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  return 0;
}
