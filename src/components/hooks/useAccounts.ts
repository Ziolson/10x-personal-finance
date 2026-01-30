import { useCallback, useEffect, useState } from "react";
import type { AccountDTO, ApiErrorResponse, CreateAccountCommand, UpdateAccountCommand } from "@/types";

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch (error) {
    // JSON parsing failed
    if (!response.ok) {
      // For error responses, we can't parse the error details, but we have the status
      const parseError = new Error(`Failed to parse error response: ${response.statusText}`);
      Object.assign(parseError, { status: response.status });
      throw parseError;
    }
    // For success responses, JSON parsing failure is a critical error
    throw new Error(`Invalid JSON in successful response from ${response.url}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  if (!response.ok) {
    const message = (payload as ApiErrorResponse)?.error?.message || response.statusText;
    const error = new Error(message);
    Object.assign(error, { status: response.status, details: (payload as ApiErrorResponse)?.error?.details });
    throw error;
  }

  return payload as T;
}

export default function useAccounts() {
  const [accounts, setAccounts] = useState<AccountDTO[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/accounts", { method: "GET" });
      const data = await parseResponse<AccountDTO[]>(response);
      setAccounts(data ?? []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(() => fetchAccounts(), [fetchAccounts]);

  const createAccount = useCallback(
    async (command: CreateAccountCommand) => {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      const payload = await parseResponse<AccountDTO>(response);
      await fetchAccounts();
      return payload;
    },
    [fetchAccounts]
  );

  const updateAccount = useCallback(
    async (accountId: string, command: UpdateAccountCommand) => {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      const payload = await parseResponse<AccountDTO>(response);
      await fetchAccounts();
      return payload;
    },
    [fetchAccounts]
  );

  const deleteAccount = useCallback(
    async (accountId: string) => {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: "DELETE",
      });

      await parseResponse<void>(response);
      await fetchAccounts();
    },
    [fetchAccounts]
  );

  useEffect(() => {
    void fetchAccounts();
  }, [fetchAccounts]);

  return {
    accounts,
    isLoading,
    error,
    refetch,
    createAccount,
    updateAccount,
    deleteAccount,
  };
}
