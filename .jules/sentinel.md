# Sentinel's Journal

## 2026-01-31 - Rate Limiting in Serverless/Node
**Vulnerability:** Missing rate limiting on login endpoint allowed potential brute force attacks.
**Learning:** In-memory rate limiting in Astro (Node adapter) is viable but requires careful memory management (cleanup intervals) and awareness of persistence models. In serverless functions, this approach wouldn't work as state isn't shared.
**Prevention:** Implement rate limiting middleware or utility for sensitive endpoints, preferring external stores (Redis) for distributed systems, but in-memory is a good first step for single-instance deployments.
