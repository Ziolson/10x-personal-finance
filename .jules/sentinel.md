# Sentinel's Journal

## 2026-01-31 - Rate Limiting in Serverless/Node

**Vulnerability:** Missing rate limiting on login endpoint allowed potential brute force attacks.
**Learning:** In-memory rate limiting in Astro (Node adapter) is viable but requires careful memory management (cleanup intervals) and awareness of persistence models. In serverless functions, this approach wouldn't work as state isn't shared.
**Prevention:** Implement rate limiting middleware or utility for sensitive endpoints, preferring external stores (Redis) for distributed systems, but in-memory is a good first step for single-instance deployments.

## 2026-02-04 - Information Leakage in API Errors

**Vulnerability:** API endpoints were catching service layer errors and returning `details: errorMessage` in the 500 response. This could expose database error messages (including table names or constraint violations) to the client.
**Learning:** The initial implementation prioritized debugging convenience (passing errors to frontend) over security. Astro's `Response` object makes it easy to just JSON.stringify whatever you catch.
**Prevention:** Use a centralized error handler (like `handleApiError`) that logs the full error server-side but returns a sanitized, generic message to the client for all 500-level errors.
