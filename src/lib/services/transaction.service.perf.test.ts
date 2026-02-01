import { describe, it, expect, vi } from "vitest";
import { getTransactions } from "./transaction.service";
import type { SupabaseClient } from "../../db/supabase.client";
import type { GetTransactionsQuery } from "../../types";

// Helper to create a delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("TransactionService Performance", () => {
  it("should measure execution time of getTransactions", async () => {
    const DELAY_MS = 100;

    // Create a mock builder that can handle chainable methods
    const createMockBuilder = (type: "count" | "data") => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const builder: any = {
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        // The 'then' method makes it a Thenable (Promise-like)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        then: (resolve: any, reject: any) => {
          const execution = async () => {
            await delay(DELAY_MS);
            if (type === "count") {
              return { count: 10, error: null };
            } else {
              return { data: [], error: null };
            }
          };
          return execution().then(resolve, reject);
        },
      };
      return builder;
    };

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn((columns, options) => {
          // Identify if it is the count query based on options
          const isCount = options && options.count === "exact";
          return createMockBuilder(isCount ? "count" : "data");
        }),
      }),
    } as unknown as SupabaseClient;

    const query: GetTransactionsQuery = {
      page: 1,
      limit: 10,
    };
    const userId = "test-user";

    const startTime = Date.now();
    await getTransactions(query, userId, mockSupabase);
    const endTime = Date.now();
    const duration = endTime - startTime;

    // eslint-disable-next-line no-console
    console.log(`Execution time: ${duration}ms`);

    // We expect it to be around 200ms (sequential) initially or > 150ms
    // After optimization it should be around 100ms

    // It should be faster than sequential execution (100ms + 100ms)
    // We add some buffer for overhead, so < 150ms is a safe check for concurrent execution
    expect(duration).toBeLessThan(150);
  });
});
