import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import useAccounts from "./useAccounts";
import type { AccountDTO } from "@/types";

// Mock fetch global
const fetchSpy = vi.spyOn(global, "fetch");

const mockAccounts: AccountDTO[] = [
  { id: "1", name: "Main Account", initial_balance: 1000, current_balance: 1500, currency: "PLN", created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: "2", name: "Savings", initial_balance: 500, current_balance: 600, currency: "PLN", created_at: "2024-01-01", updated_at: "2024-01-01" },
];

describe("useAccounts Hook", () => {
  beforeEach(() => {
    fetchSpy.mockReset();
  });

  it("should fetch accounts on mount", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockAccounts,
    } as Response);

    const { result } = renderHook(() => useAccounts());

    // Initial state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.accounts).toBeUndefined();

    // Wait for data
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.accounts).toEqual(mockAccounts);
    expect(result.current.error).toBeNull();
  });

  it("should handle error during fetching", async () => {
    fetchSpy.mockRejectedValueOnce(new Error("Network Error"));

    const { result } = renderHook(() => useAccounts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Network Error");
    expect(result.current.accounts).toBeUndefined(); // or empty array if setup that way
  });

  it("should create an account and refresh list", async () => {
    // 1. Initial fetch
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    const { result } = renderHook(() => useAccounts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // 2. Create account mock
    const newAccount = mockAccounts[0];
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => newAccount,
    } as Response);

    // 3. Refetch mock
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => [newAccount],
    } as Response);

    await act(async () => {
      await result.current.createAccount({ name: "Main Account", initial_balance: 1000 });
    });

    await waitFor(() => {
      expect(result.current.accounts).toHaveLength(1);
    });

    expect(result.current.accounts?.[0]).toEqual(newAccount);
  });
});
