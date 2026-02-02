# Sentinel's Journal

## 2026-01-31 - Rate Limiting in Serverless/Node

**Vulnerability:** Missing rate limiting on login endpoint allowed potential brute force attacks.
**Learning:** In-memory rate limiting in Astro (Node adapter) is viable but requires careful memory management (cleanup intervals) and awareness of persistence models. In serverless functions, this approach wouldn't work as state isn't shared.
**Prevention:** Implement rate limiting middleware or utility for sensitive endpoints, preferring external stores (Redis) for distributed systems, but in-memory is a good first step for single-instance deployments.

## 2026-01-31 - Information Leakage in API Error Responses

**Vulnerability:** API endpoints were returning raw error messages from the database/service layer in the `details` field of 500 responses. This could expose database schema, constraint names, or internal logic to attackers.
**Learning:** Catch-all error blocks in API routes often inadvertently leak sensitive info if they simply wrap and return the caught error.
**Prevention:** Implemented a centralized `handleApiError` utility that logs full error details server-side for debugging but returns a sanitized, generic "Internal Server Error" message to the client, stripping all implementation details.
