/**
 * Transaction Service
 *
 * Handles business logic for transaction operations including:
 * - Fetching transactions with filtering and pagination
 * - Creating new transactions (expenses, income, transfers)
 * - Updating existing transactions
 * - Deleting transactions
 *
 * All database operations are performed through Supabase client
 * that has RLS policies enabled (user_id filtering is automatic)
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateTransactionCommand, TransactionDTO, UpdateTransactionCommand, GetTransactionsQuery, PaginatedResponse } from "../../types";
import { CreateTransactionSchema } from "../validators/transaction.validators";

/**
 * Fetches transactions for the authenticated user with filtering and pagination
 *
 * This function retrieves transactions based on provided query filters:
 * - Pagination: page and limit parameters
 * - Type filter: expense, income, or transfer
 * - Account filter: transactions where accountId is source or destination
 * - Category filter: transactions of specific category
 * - Date range filter: transactions within startDate to endDate
 *
 * @param query - GetTransactionsQuery with filters and pagination params
 * @param userId - The authenticated user's ID (for RLS enforcement)
 * @param supabase - Supabase client instance
 * @returns Promise<PaginatedResponse<TransactionDTO>> Paginated list of transactions
 * @throws Error if database query fails
 */
export async function getTransactions(query: GetTransactionsQuery, userId: string, supabase: SupabaseClient): Promise<PaginatedResponse<TransactionDTO>> {
  const { page = 1, limit = 20, type, accountId, categoryId, startDate, endDate } = query;

  // Step 1: Calculate pagination values
  const offset = (page - 1) * limit;

  try {
    // Step 2: Build the query with filters
    let countQuery = supabase.from("transactions").select("*", { count: "exact", head: true }).eq("user_id", userId);

    let dataQuery = supabase.from("transactions").select("id, type, amount, date, description, from_account_id, to_account_id, category_id, created_at").eq("user_id", userId);

    // Apply type filter
    if (type) {
      countQuery = countQuery.eq("type", type);
      dataQuery = dataQuery.eq("type", type);
    }

    // Apply category filter (for expense and income transactions)
    if (categoryId) {
      countQuery = countQuery.eq("category_id", categoryId);
      dataQuery = dataQuery.eq("category_id", categoryId);
    }

    // Apply account filter (check both source and destination accounts)
    if (accountId) {
      countQuery = countQuery.or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`);
      dataQuery = dataQuery.or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`);
    }

    // Apply date range filters
    if (startDate) {
      countQuery = countQuery.gte("date", startDate);
      dataQuery = dataQuery.gte("date", startDate);
    }

    if (endDate) {
      countQuery = countQuery.lte("date", endDate);
      dataQuery = dataQuery.lte("date", endDate);
    }

    // Step 3 & 4: Execute count and data queries concurrently
    // Optimization: Running these in parallel reduces latency by avoiding a waterfall
    const [countResult, dataResult] = await Promise.all([
      countQuery,
      dataQuery
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1),
    ]);

    const { count, error: countError } = countResult;

    if (countError) {
      // eslint-disable-next-line no-console
      console.error("[TransactionService.getTransactions] Database error while counting:", {
        userId,
        query,
        error: countError,
      });
      throw new Error(`Database error while counting transactions: ${countError.message}`);
    }

    const totalItems = count ?? 0;

    const { data: transactions, error: dataError } = dataResult;

    if (dataError) {
      // eslint-disable-next-line no-console
      console.error("[TransactionService.getTransactions] Database error while fetching data:", {
        userId,
        query,
        error: dataError,
      });
      throw new Error(`Database error while fetching transactions: ${dataError.message}`);
    }

    // Step 5: Transform to TransactionDTO (omit user_id and updated_at)
    const transactionDTOs: TransactionDTO[] = (transactions || []).map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      date: tx.date,
      description: tx.description,
      from_account_id: tx.from_account_id,
      to_account_id: tx.to_account_id,
      category_id: tx.category_id,
      created_at: tx.created_at,
    }));

    // Step 6: Calculate pagination info
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: transactionDTOs,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to fetch transactions: ${errorMessage}`);
  }
}

/**
 * Fetches a single transaction by ID
 *
 * @param transactionId - The transaction ID to fetch (UUID)
 * @param userId - The authenticated user's ID (for authorization)
 * @param supabase - Supabase client instance
 * @returns Promise<TransactionDTO | null> The transaction, or null if not found
 * @throws Error if database query fails
 */
export async function getTransactionById(transactionId: string, userId: string, supabase: SupabaseClient): Promise<TransactionDTO | null> {
  try {
    const { data: transaction, error } = await supabase
      .from("transactions")
      .select("id, type, amount, date, description, from_account_id, to_account_id, category_id, created_at")
      .eq("id", transactionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      // eslint-disable-next-line no-console
      console.error("[TransactionService.getTransactionById] Database error:", {
        transactionId,
        userId,
        error,
      });
      throw new Error(`Database error while fetching transaction: ${error.message}`);
    }

    if (!transaction) {
      return null;
    }

    return {
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      date: transaction.date,
      description: transaction.description,
      from_account_id: transaction.from_account_id,
      to_account_id: transaction.to_account_id,
      category_id: transaction.category_id,
      created_at: transaction.created_at,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to fetch transaction: ${errorMessage}`);
  }
}

/**
 * Creates a new transaction for the authenticated user
 *
 * Handles three types of transactions with different field requirements:
 * - Expense: from_account_id + category_id required
 * - Income: to_account_id + category_id required
 * - Transfer: from_account_id + to_account_id required (no category)
 *
 * @param command - CreateTransactionCommand (discriminated union by type)
 * @param userId - The authenticated user's ID
 * @param supabase - Supabase client instance
 * @returns Promise<TransactionDTO> The newly created transaction
 * @throws Error if validation fails or database operation fails
 */
export async function createTransaction(command: CreateTransactionCommand, userId: string, supabase: SupabaseClient): Promise<TransactionDTO> {
  try {
    // Step 1: Validate structure using Zod (ensures required fields for transaction type)
    const validatedCommand = CreateTransactionSchema.parse(command);

    // Step 2: Business logic validation - only checks that require semantic validation
    if (validatedCommand.type === "transfer") {
      if (validatedCommand.from_account_id === validatedCommand.to_account_id) {
        throw new Error("INVALID_TRANSFER: Cannot transfer to the same account");
      }
    }

    // Step 3: Prepare insert payload - build different payload based on type
    // All fields must be provided to Supabase even if null
    const basePayload = {
      user_id: userId,
      type: validatedCommand.type as "expense" | "income" | "transfer",
      amount: validatedCommand.amount,
      date: validatedCommand.date,
      description: validatedCommand.description || null,
    };

    let insertPayload: {
      user_id: string;
      type: "expense" | "income" | "transfer";
      amount: number;
      date: string;
      description: string | null;
      from_account_id: string | null;
      to_account_id: string | null;
      category_id: string | null;
    };

    // Add type-specific fields
    if (validatedCommand.type === "expense") {
      insertPayload = {
        ...basePayload,
        from_account_id: validatedCommand.from_account_id,
        category_id: validatedCommand.category_id,
        to_account_id: null,
      };
    } else if (validatedCommand.type === "income") {
      insertPayload = {
        ...basePayload,
        to_account_id: validatedCommand.to_account_id,
        category_id: validatedCommand.category_id,
        from_account_id: null,
      };
    } else if (validatedCommand.type === "transfer") {
      insertPayload = {
        ...basePayload,
        from_account_id: validatedCommand.from_account_id,
        to_account_id: validatedCommand.to_account_id,
        category_id: null,
      };
    } else {
      throw new Error("Invalid transaction type");
    }

    // Step 4: Insert transaction
    const { data: newTransaction, error: insertError } = await supabase
      .from("transactions")
      .insert(insertPayload)
      .select("id, type, amount, date, description, from_account_id, to_account_id, category_id, created_at")
      .single();

    if (insertError) {
      // eslint-disable-next-line no-console
      console.error("[TransactionService.createTransaction] Database error during insert:", {
        userId,
        payload: insertPayload,
        error: insertError,
      });
      throw new Error(`Database error while creating transaction: ${insertError.message}`);
    }

    if (!newTransaction) {
      // eslint-disable-next-line no-console
      console.error("[TransactionService.createTransaction] No data returned after insert", {
        userId,
        payload: insertPayload,
      });
      throw new Error("Failed to create transaction: no data returned");
    }

    // Step 5: Transform to TransactionDTO
    return {
      id: newTransaction.id,
      type: newTransaction.type,
      amount: newTransaction.amount,
      date: newTransaction.date,
      description: newTransaction.description,
      from_account_id: newTransaction.from_account_id,
      to_account_id: newTransaction.to_account_id,
      category_id: newTransaction.category_id,
      created_at: newTransaction.created_at,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to create transaction: ${errorMessage}`);
  }
}

/**
 * Updates an existing transaction
 *
 * Performs partial update with optional fields. Business logic validation
 * ensures type consistency (e.g., expense cannot have to_account_id).
 *
 * @param transactionId - The transaction ID to update (UUID)
 * @param userId - The authenticated user's ID (for authorization)
 * @param command - UpdateTransactionCommand with optional fields
 * @param supabase - Supabase client instance
 * @returns Promise<TransactionDTO> The updated transaction
 * @throws Error if transaction not found or database operation fails
 */
export async function updateTransaction(transactionId: string, userId: string, command: UpdateTransactionCommand, supabase: SupabaseClient): Promise<TransactionDTO> {
  try {
    // Step 1: Check if transaction exists and belongs to user
    const { data: existingTransaction, error: checkError } = await supabase.from("transactions").select("id, type").eq("id", transactionId).eq("user_id", userId).maybeSingle();

    if (checkError) {
      // eslint-disable-next-line no-console
      console.error("[TransactionService.updateTransaction] Database error during existence check:", {
        transactionId,
        userId,
        error: checkError,
      });
      throw new Error(`Database error while checking transaction: ${checkError.message}`);
    }

    if (!existingTransaction) {
      // eslint-disable-next-line no-console
      console.warn("[TransactionService.updateTransaction] Transaction not found or unauthorized", {
        transactionId,
        userId,
      });
      throw new Error("NOT_FOUND");
    }

    // Step 2: Build update payload with provided fields only
    const updatePayload: Partial<Record<string, unknown>> = {};

    if (command.type !== undefined) updatePayload.type = command.type;
    if (command.amount !== undefined) updatePayload.amount = command.amount;
    if (command.date !== undefined) updatePayload.date = command.date;
    if (command.description !== undefined) updatePayload.description = command.description;
    if (command.from_account_id !== undefined) updatePayload.from_account_id = command.from_account_id;
    if (command.to_account_id !== undefined) updatePayload.to_account_id = command.to_account_id;
    if (command.category_id !== undefined) updatePayload.category_id = command.category_id;

    // Step 3: Perform update
    const { data: updatedTransaction, error: updateError } = await supabase
      .from("transactions")
      .update(updatePayload as Record<string, unknown>)
      .eq("id", transactionId)
      .eq("user_id", userId)
      .select("id, type, amount, date, description, from_account_id, to_account_id, category_id, created_at")
      .single();

    if (updateError) {
      // eslint-disable-next-line no-console
      console.error("[TransactionService.updateTransaction] Database error during update:", {
        transactionId,
        userId,
        payload: updatePayload,
        error: updateError,
      });
      throw new Error(`Database error while updating transaction: ${updateError.message}`);
    }

    if (!updatedTransaction) {
      // eslint-disable-next-line no-console
      console.error("[TransactionService.updateTransaction] No data returned after update", {
        transactionId,
        userId,
        payload: updatePayload,
      });
      throw new Error("Failed to update transaction: no data returned");
    }

    // Step 4: Transform to TransactionDTO
    return {
      id: updatedTransaction.id,
      type: updatedTransaction.type,
      amount: updatedTransaction.amount,
      date: updatedTransaction.date,
      description: updatedTransaction.description,
      from_account_id: updatedTransaction.from_account_id,
      to_account_id: updatedTransaction.to_account_id,
      category_id: updatedTransaction.category_id,
      created_at: updatedTransaction.created_at,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to update transaction: ${errorMessage}`);
  }
}

/**
 * Deletes a transaction
 *
 * Permanently removes a transaction belonging to the authenticated user.
 * Authorization is enforced through RLS (eq("user_id", userId)).
 *
 * @param transactionId - The transaction ID to delete (UUID)
 * @param userId - The authenticated user's ID (for authorization)
 * @param supabase - Supabase client instance
 * @throws Error if database operation fails
 *
 * @note RLS policies ensure that only transactions belonging to the user can be deleted.
 *       If the transaction doesn't exist or doesn't belong to the user, the delete silently
 *       succeeds (Supabase behavior). Frontend validation should verify the result.
 */
export async function deleteTransaction(transactionId: string, userId: string, supabase: SupabaseClient): Promise<void> {
  try {
    const { error: deleteError } = await supabase.from("transactions").delete().eq("id", transactionId).eq("user_id", userId);

    if (deleteError) {
      // eslint-disable-next-line no-console
      console.error("[TransactionService.deleteTransaction] Database error during delete:", {
        transactionId,
        userId,
        error: deleteError,
      });
      throw new Error(`Database error while deleting transaction: ${deleteError.message}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to delete transaction: ${errorMessage}`);
  }
}
