import { describe, it, expect, beforeEach, vi } from "vitest";
import { isRateLimited } from "./rate-limiter";

describe("RateLimiter", () => {
  const config = { windowMs: 1000, max: 2 }; // 1 second, max 2 requests

  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should allow requests within limit", () => {
    const testIp = "1.1.1.1";
    expect(isRateLimited(testIp, config)).toBe(false); // 1st
    expect(isRateLimited(testIp, config)).toBe(false); // 2nd
  });

  it("should block requests exceeding limit", () => {
    const testIp = "2.2.2.2";
    isRateLimited(testIp, config); // 1st
    isRateLimited(testIp, config); // 2nd
    expect(isRateLimited(testIp, config)).toBe(true); // 3rd (blocked)
  });

  it("should reset after window expires", () => {
    const testIp = "3.3.3.3";
    isRateLimited(testIp, config); // 1st
    isRateLimited(testIp, config); // 2nd
    expect(isRateLimited(testIp, config)).toBe(true); // 3rd (blocked)

    // Fast forward time
    vi.advanceTimersByTime(1001);

    expect(isRateLimited(testIp, config)).toBe(false); // Should be allowed again
  });
});
