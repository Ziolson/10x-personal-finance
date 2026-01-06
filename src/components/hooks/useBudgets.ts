import { useState, useCallback, useEffect } from "react";
import type { 
  BudgetDTO, 
  CreateBudgetCommand, 
  UpdateBudgetCommand,
  ApiErrorResponse 
} from "@/types";

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
    throw new Error(
      `Invalid JSON in successful response from ${response.url}: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  if (!response.ok) {
    const message = (payload as ApiErrorResponse)?.error?.message || response.statusText;
    const error = new Error(message);
    Object.assign(error, { status: response.status, details: (payload as ApiErrorResponse)?.error?.details });
    throw error;
  }

  return payload as T;
}

interface UseBudgetsParams {
  month?: number;
  year?: number;
}

interface UseBudgetsResult {
  budgets: BudgetDTO[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createBudget: (data: CreateBudgetCommand) => Promise<BudgetDTO>;
  updateBudget: (id: string, data: UpdateBudgetCommand) => Promise<BudgetDTO>;
  deleteBudget: (id: string) => Promise<void>;
}

export function useBudgets(params?: UseBudgetsParams): UseBudgetsResult {
  const [budgets, setBudgets] = useState<BudgetDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBudgets = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (params?.month !== undefined) {
        queryParams.append("month", params.month.toString());
      }
      if (params?.year !== undefined) {
        queryParams.append("year", params.year.toString());
      }

      const url = `/api/budgets${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, { method: "GET" });
      const data = await parseResponse<BudgetDTO[]>(response);
      setBudgets(data ?? []);
    } catch (err) {
      setIsError(true);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [params?.month, params?.year]);

  const refetch = useCallback(() => fetchBudgets(), [fetchBudgets]);

  const createBudget = useCallback(
    async (command: CreateBudgetCommand): Promise<BudgetDTO> => {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      const payload = await parseResponse<BudgetDTO>(response);
      await fetchBudgets();
      return payload;
    },
    [fetchBudgets]
  );

  const updateBudget = useCallback(
    async (budgetId: string, command: UpdateBudgetCommand): Promise<BudgetDTO> => {
      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      const payload = await parseResponse<BudgetDTO>(response);
      await fetchBudgets();
      return payload;
    },
    [fetchBudgets]
  );

  const deleteBudget = useCallback(
    async (budgetId: string): Promise<void> => {
      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: "DELETE",
      });

      await parseResponse<void>(response);
      await fetchBudgets();
    },
    [fetchBudgets]
  );

  useEffect(() => {
    void fetchBudgets();
  }, [fetchBudgets]);

  return {
    budgets,
    isLoading,
    isError,
    error,
    refetch,
    createBudget,
    updateBudget,
    deleteBudget,
  };
}
