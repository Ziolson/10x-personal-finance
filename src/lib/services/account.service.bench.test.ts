import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAccounts } from "./account.service";
import type { SupabaseClient } from "../../db/supabase.client";

// Mock Supabase Client
const mockSupabase = {
  from: vi.fn(),
} as unknown as SupabaseClient;

const DELAY_MS = 100;

describe("Account Service Performance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("benchmark getAccounts", async () => {
    const userId = "user-123";

    // Mock for accounts table
    const accountsData = [
      { id: "1", name: "Acc 1", initial_balance: 100, currency: "PLN", created_at: "2023-01-01", updated_at: "2023-01-01" },
      { id: "2", name: "Acc 2", initial_balance: 200, currency: "USD", created_at: "2023-01-02", updated_at: "2023-01-02" },
    ];

    // Mock for balances view
    const balancesData = [
      { account_id: "1", current_balance: 150 },
      { account_id: "2", current_balance: 250 },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockSupabase.from as any).mockImplementation((table: string) => {
      if (table === "accounts") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockImplementation(async () => {
                await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
                return { data: accountsData, error: null };
              }),
            }),
          }),
        };
      } else if (table === "account_balances") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation(async () => {
              await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
              return { data: balancesData, error: null };
            }),
          }),
        };
      }
      return { select: vi.fn() };
    });

    const start = performance.now();
    const result = await getAccounts(userId, mockSupabase);
    const end = performance.now();

    const duration = end - start;
    // eslint-disable-next-line no-console
    console.log(`getAccounts execution time: ${duration.toFixed(2)}ms`);

    // Verification
    expect(result).toHaveLength(2);
    expect(result[0].current_balance).toBe(150);
    expect(result[1].current_balance).toBe(250);

    // With parallel execution, it should be close to the longest delay (100ms)
    // rather than the sum (200ms).
    expect(duration).toBeLessThan(150); // Allowing 50ms overhead
  });
});
