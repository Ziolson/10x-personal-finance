import { useState, useCallback } from "react";
import type { AIInsightsDTO, GenerateAIInsightsCommand, ApiErrorResponse } from "@/types";

// Helper function for consistent API response parsing (zgodny z useAccounts, useBudgets)
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

interface UseInsightsState {
  data: AIInsightsDTO | null;
  loading: boolean;
  error: string | null;
}

export function useInsights() {
  const [state, setState] = useState<UseInsightsState>({
    data: null,
    loading: false,
    error: null,
  });

  /**
   * Fetch latest insights from cache
   */
  const fetchLatest = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch("/api/insights/latest");

      // Handle 404 as empty state (no insights yet)
      if (response.status === 404) {
        setState({ data: null, loading: false, error: null });
        return null;
      }

      const data = await parseResponse<AIInsightsDTO>(response);
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setState((prev) => ({ ...prev, loading: false, error: message }));
      return null;
    }
  }, []);

  /**
   * Generate or refresh insights
   */
  const generateInsights = useCallback(async (command: GenerateAIInsightsCommand) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch("/api/insights/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      const data = await parseResponse<AIInsightsDTO>(response);
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setState((prev) => ({ ...prev, loading: false, error: message }));
      return null;
    }
  }, []);

  return {
    ...state,
    fetchLatest,
    generateInsights,
  };
}
