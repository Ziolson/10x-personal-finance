interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
}

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitInfo>();

// Cleanup interval (every 1 minute)
const CLEANUP_INTERVAL = 60 * 1000;

let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupInterval) return;
  // Use unref() if available so this interval doesn't prevent the process from exiting
  // in case it's used in a script, though for a server it doesn't matter much.
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, info] of rateLimitStore.entries()) {
      if (now > info.resetTime) {
        rateLimitStore.delete(ip);
      }
    }
  }, CLEANUP_INTERVAL);

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
}

/**
 * Checks if a request from an IP is rate limited.
 * @param ip The client IP address
 * @param config The rate limit configuration
 * @returns true if the request should be blocked, false otherwise
 */
export function isRateLimited(ip: string, config: RateLimitConfig): boolean {
  startCleanup(); // Ensure cleanup is running

  const now = Date.now();
  const info = rateLimitStore.get(ip);

  if (!info) {
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return false;
  }

  if (now > info.resetTime) {
    // Window expired, reset
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return false;
  }

  info.count += 1;
  return info.count > config.max;
}
