# API Layer Architecture Guide

This document outlines the architectural standard for communicating with the Backend API in the frontend application.

## Core Principle: Separation of Concerns

We separate the **API Client logic** (how to fetch) from the **React State Management logic** (when to fetch/render).

### 1. API Client Layer (`src/lib/api.ts` or `src/lib/api/*.ts`)

- **Responsibility**: Pure TypeScript functions that handle HTTP requests.
- **Scope**: URL construction, headers, request body serialization, response parsing, error throwing.
- **Dependencies**: No React dependencies. Can be used in any JS/TS context.
- **Naming**: `get*`, `create*`, `update*`, `delete*`.

**Example:**

```typescript
// src/lib/api.ts
export async function getDashboard(month: number, year: number): Promise<DashboardDTO> {
  const params = new URLSearchParams({ month: month.toString(), year: year.toString() });
  const res = await fetch(`/api/dashboard?${params}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}
```

### 2. React Composition Layer (Hooks / Components)

- **Responsibility**: Managing `data`, `isLoading`, `error` states.
- **Scope**: Calling the API Client functions within `useEffect` or event handlers.
- **Dependencies**: React (`useState`, `useEffect`, `useCallback`).

**Example Usage in Component:**

```tsx
const [data, setData] = useState<DashboardDTO | null>(null);

useEffect(() => {
  getDashboard(month, year).then(setData).catch(setError);
}, [month, year]);
```

## Refactoring Roadmap

To align existing features with this architecture:

1.  Extract `fetch` calls from existing hooks (e.g., `useAccounts`) into pure functions in `src/lib/api.ts`.
2.  Update the hooks to call these pure functions instead of using `fetch` directly.
