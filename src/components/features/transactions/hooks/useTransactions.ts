import { useState, useCallback, useEffect } from "react";
import type { TransactionDTO, PaginationInfo, CreateTransactionCommand, UpdateTransactionCommand, GetTransactionsQuery } from "@/types";
import type { TransactionFiltersState } from "../types";
import { format } from "date-fns";
import logger from "@/lib/logger";

interface UseTransactionsResult {
  transactions: TransactionDTO[];
  pagination: PaginationInfo;
  filters: TransactionFiltersState;
  status: "idle" | "loading" | "success" | "error";
  setFilters: (filters: TransactionFiltersState) => void;
  setPage: (page: number) => void;
  fetchTransactions: () => Promise<void>;
  addTransaction: (command: CreateTransactionCommand) => Promise<void>;
  updateTransaction: (id: string, command: UpdateTransactionCommand) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

export const useTransactions = (): UseTransactionsResult => {
  const [transactions, setTransactions] = useState<TransactionDTO[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [filters, setFiltersState] = useState<TransactionFiltersState>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const fetchTransactions = useCallback(async () => {
    setStatus("loading");
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("page", pagination.currentPage.toString());
      queryParams.append("limit", "10"); // Default limit

      if (filters.type) {
        queryParams.append("type", filters.type);
      }
      if (filters.accountId) {
        queryParams.append("accountId", filters.accountId);
      }
      if (filters.categoryId) {
        queryParams.append("categoryId", filters.categoryId);
      }
      if (filters.dateRange?.from) {
        queryParams.append("startDate", format(filters.dateRange.from, "yyyy-MM-dd"));
      }
      if (filters.dateRange?.to) {
        queryParams.append("endDate", format(filters.dateRange.to, "yyyy-MM-dd"));
      }

      const response = await fetch(`/api/transactions?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      const data = await response.json();
      setTransactions(data.data);
      setPagination(data.pagination);
      setStatus("success");
    } catch (error) {
      logger.error(error);
      setStatus("error");
    }
  }, [pagination.currentPage, filters]);

  // Initial fetch and fetch on dependencies change
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const setFilters = (newFilters: TransactionFiltersState) => {
    setFiltersState(newFilters);
    setPagination((prev) => ({ ...prev, currentPage: 1 })); // Reset to page 1 on filter change
  };

  const setPage = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const addTransaction = async (command: CreateTransactionCommand) => {
    setStatus("loading");
    try {
      const response = await fetch("/api/transactions/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        logger.error(response);
        throw new Error("Failed to create transaction");
      }

      await fetchTransactions(); // Refresh list
    } catch (error) {
      logger.error(error);
      setStatus("error");
      throw error;
    }
  };

  const updateTransaction = async (id: string, command: UpdateTransactionCommand) => {
    setStatus("loading");
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        throw new Error("Failed to update transaction");
      }

      await fetchTransactions(); // Refresh list
    } catch (error) {
      logger.error(error);
      setStatus("error");
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    setStatus("loading");
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete transaction");
      }

      await fetchTransactions(); // Refresh list
    } catch (error) {
      logger.error(error);
      setStatus("error");
      throw error;
    }
  };

  return {
    transactions,
    pagination,
    filters,
    status,
    setFilters,
    setPage,
    fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
};
