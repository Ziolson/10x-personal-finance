/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect } from "vitest";
import { getTransactions } from "./transaction.service";
import type { SupabaseClient } from "../../db/supabase.client";

// Mock implementation of a thenable query builder
const createMockQuery = (latency: number, result: any) => {
  return {
    eq: function () {
      return this;
    },
    or: function () {
      return this;
    },
    gte: function () {
      return this;
    },
    lte: function () {
      return this;
    },
    order: function () {
      return this;
    },
    range: function () {
      return this;
    },
    then: function (onFulfilled: any, onRejected: any) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(result);
        }, latency);
      }).then(onFulfilled, onRejected);
    },
  };
};

const createMockSupabase = (latency: number) => {
  return {
    from: (_table: string) => ({
      select: (_columns: string, options?: any) => {
        if (options?.count) {
          return createMockQuery(latency, { count: 100, error: null });
        }
        return createMockQuery(latency, { data: [{ id: "1", amount: 100, date: "2023-01-01" }], error: null });
      },
    }),
  } as unknown as SupabaseClient;
};

describe("Transaction Service", () => {
  it("should fetch transactions correctly", async () => {
    const supabase = createMockSupabase(10);
    const result = await getTransactions({}, "user-1", supabase);

    expect(result.pagination.totalItems).toBe(100);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].amount).toBe(100);
  });

  it("should execute queries in parallel", async () => {
    const latency = 100;
    const supabase = createMockSupabase(latency);

    const start = performance.now();
    await getTransactions({}, "user-1", supabase);
    const end = performance.now();
    const duration = end - start;

    // If sequential: duration >= 2 * latency (200ms)
    // If parallel: duration >= latency (100ms) and < 2 * latency
    // We add some buffer for execution overhead

    // NOTE: This test will FAIL initially because the implementation is sequential.
    // It will PASS after the optimization.

    // We expect it to be faster than 1.5x latency if parallel
    expect(duration).toBeLessThan(latency * 1.8);
  });
});
