# Bolt's Journal ⚡

## 2025-02-20 - Independent Supabase Queries

**Learning:** Sequential Supabase queries for independent data (like count + data for pagination) introduce unnecessary latency.
**Action:** Always use `Promise.all` when fetching count and data simultaneously, or when fetching independent datasets (e.g. accounts + balances).
