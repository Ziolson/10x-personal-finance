## 2026-02-02 - Sequential Supabase Queries
**Learning:** Paginated lists were fetching count and data sequentially, doubling the latency.
**Action:** Use `Promise.all` for independent Supabase queries like count + data fetching.
