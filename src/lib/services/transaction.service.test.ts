import { describe, it, expect, vi } from "vitest";
import { getTransactions } from "./transaction.service";
import type { SupabaseClient } from "../../db/supabase.client";

describe("Transaction Service - getTransactions", () => {
  it("should fetch transactions and count successfully", async () => {
    const userId = "test-user-id";
    const mockData = [
      {
        id: "1",
        type: "expense",
        amount: 100,
        date: "2023-01-01",
        description: "test",
        from_account_id: "acc1",
        to_account_id: null,
        category_id: "cat1",
        created_at: "2023-01-01T00:00:00Z",
      },
    ];

    const createMockBuilder = (result: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const builder: any = {};
      builder.eq = vi.fn().mockReturnValue(builder);
      builder.or = vi.fn().mockReturnValue(builder);
      builder.gte = vi.fn().mockReturnValue(builder);
      builder.lte = vi.fn().mockReturnValue(builder);
      builder.order = vi.fn().mockReturnValue(builder);
      // for data query terminator
      builder.range = vi.fn().mockResolvedValue(result);
      // for count query terminator (it's awaited directly)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      builder.then = (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject);
      return builder;
    };

    const mockCountBuilder = createMockBuilder({ count: 1, error: null });
    const mockDataBuilder = createMockBuilder({ data: mockData, error: null });

    const mockSupabase = {
      from: vi.fn().mockImplementation((table) => {
        if (table === "transactions") {
          return {
            select: vi.fn().mockImplementation((columns, options) => {
              if (options?.count === "exact") {
                return mockCountBuilder;
              }
              return mockDataBuilder;
            }),
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient;

    const result = await getTransactions({ page: 1, limit: 10 }, userId, mockSupabase);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe("1");
    expect(result.pagination.totalItems).toBe(1);

    // Verify mocks were called
    expect(mockSupabase.from).toHaveBeenCalledWith("transactions");
    expect(mockCountBuilder.eq).toHaveBeenCalledWith("user_id", userId);
    expect(mockDataBuilder.eq).toHaveBeenCalledWith("user_id", userId);
  });
});
