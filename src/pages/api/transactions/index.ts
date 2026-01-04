/**
 * Transactions API Endpoint
 *
 * Handles:
 * - POST /api/transactions - Create a new transaction
 * - GET /api/transactions - Get transactions with filtering and pagination
 */

import type { APIRoute } from "astro";

import { GetTransactionsQuerySchema, CreateTransactionSchema } from "../../../lib/validators/transaction.validators";
import { getTransactions, createTransaction } from "../../../lib/services/transaction.service";
import type { ApiErrorResponse, ValidationErrorResponse, GetTransactionsResponse } from "../../../types";

export const prerender = false;

/**
 * POST /api/transactions
 *
 * Creates a new transaction for the authenticated user.
 * Supports three transaction types: expense, income, and transfer.
 *
 * Request Body:
 * - For expense: { type: "expense", amount, date, from_account_id, category_id, description? }
 * - For income: { type: "income", amount, date, to_account_id, category_id, description? }
 * - For transfer: { type: "transfer", amount, date, from_account_id, to_account_id, description? }
 *
 * Security:
 * - Requires authenticated session (verified via middleware)
 * - User ID is extracted from context.locals
 *
 * Response:
 * - 201 Created: Returns TransactionDTO with created transaction data
 * - 400 Bad Request: Validation errors (invalid JSON, missing fields, invalid types)
 * - 401 Unauthorized: User not authenticated
 * - 409 Conflict: Business logic violation (e.g., transfer to same account)
 * - 500 Internal Server Error: Database error or service failure
 *
 * @example
 * // Request - Create expense
 * POST /api/transactions
 * {
 *   "type": "expense",
 *   "amount": 50.00,
 *   "date": "2025-01-03",
 *   "from_account_id": "uuid-account",
 *   "category_id": "uuid-category",
 *   "description": "Coffee"
 * }
 *
 * // Response (201 Created)
 * {
 *   "id": "uuid-tx",
 *   "type": "expense",
 *   "amount": 50.00,
 *   "date": "2025-01-03",
 *   "from_account_id": "uuid-account",
 *   "to_account_id": null,
 *   "category_id": "uuid-category",
 *   "description": "Coffee",
 *   "created_at": "2025-01-03T12:00:00Z"
 * }
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Get user from locals (set by middleware)
    const user = locals.user;

    if (!user?.id) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Unauthorized: You must be logged in to create a transaction",
            code: "UNAUTHORIZED",
          },
        } satisfies ApiErrorResponse),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: {
            message: "Invalid JSON in request body",
            code: "INVALID_JSON",
          },
        } satisfies ApiErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Validate with Zod schema (discriminated union)
    const validationResult = CreateTransactionSchema.safeParse(body);

    if (!validationResult.success) {
      const validationErrors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      // eslint-disable-next-line no-console
      console.warn("[API /api/transactions] Validation failed:", {
        body,
        errors: validationErrors,
      });

      return new Response(
        JSON.stringify({
          error: {
            message: "Validation failed",
            code: "VALIDATION_ERROR",
            details: validationErrors,
          },
        } satisfies ValidationErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const command = validationResult.data;

    // Step 4: Call service to create transaction
    try {
      const transactionDTO = await createTransaction(command, user.id, locals.supabase);

      // Step 5: Return success response with 201 Created
      return new Response(JSON.stringify(transactionDTO), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (serviceError) {
      const errorMessage = serviceError instanceof Error ? serviceError.message : "Unknown error";

      // Check for specific business logic errors
      if (
        errorMessage.includes("INVALID_TRANSFER") ||
        errorMessage.includes("Cannot transfer to the same account")
      ) {
        return new Response(
          JSON.stringify({
            error: {
              message: "Invalid transfer: source and destination must be different",
              code: "INVALID_TRANSFER",
            },
          } satisfies ApiErrorResponse),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (errorMessage.includes("INVALID_EXPENSE") || errorMessage.includes("INVALID_INCOME")) {
        return new Response(
          JSON.stringify({
            error: {
              message: "Invalid transaction: missing required fields for this type",
              code: "VALIDATION_ERROR",
            },
          } satisfies ApiErrorResponse),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Log the error for debugging
      // eslint-disable-next-line no-console
      console.error("Error creating transaction:", errorMessage);

      // Return generic error
      return new Response(
        JSON.stringify({
          error: {
            message: "Failed to create transaction",
            code: "INTERNAL_SERVER_ERROR",
            details: errorMessage,
          },
        } satisfies ApiErrorResponse),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    // Catch-all for unexpected errors
    // eslint-disable-next-line no-console
    console.error("Unexpected error in POST /api/transactions:", error);

    return new Response(
      JSON.stringify({
        error: {
          message: "An unexpected error occurred",
          code: "INTERNAL_SERVER_ERROR",
        },
      } satisfies ApiErrorResponse),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * GET /api/transactions
 *
 * Retrieves transactions for the authenticated user with advanced filtering and pagination.
 *
 * Query Parameters (all optional):
 * - page (number, default 1): Page number for pagination
 * - limit (number, default 20, max 100): Items per page
 * - type (string): Filter by transaction type ('expense', 'income', 'transfer')
 * - accountId (uuid): Filter by account (source or destination)
 * - categoryId (uuid): Filter by category
 * - startDate (YYYY-MM-DD): Filter transactions from this date onwards
 * - endDate (YYYY-MM-DD): Filter transactions up to this date
 *
 * Security:
 * - Requires authenticated session (verified via middleware)
 * - Returns only transactions belonging to the current user (enforced by RLS policies)
 *
 * Response:
 * - 200 OK: Returns GetTransactionsResponse (PaginatedResponse<TransactionDTO>)
 * - 400 Bad Request: Invalid query parameters (invalid UUIDs, dates, etc.)
 * - 401 Unauthorized: User not authenticated
 * - 500 Internal Server Error: Database error or service failure
 *
 * @example
 * // Request - Get expenses from January 2025
 * GET /api/transactions?type=expense&startDate=2025-01-01&endDate=2025-01-31&limit=20&page=1
 *
 * // Response (200 OK)
 * {
 *   "data": [
 *     {
 *       "id": "uuid-tx1",
 *       "type": "expense",
 *       "amount": 50.00,
 *       "date": "2025-01-03",
 *       "from_account_id": "uuid-account",
 *       "to_account_id": null,
 *       "category_id": "uuid-category",
 *       "description": "Coffee",
 *       "created_at": "2025-01-03T12:00:00Z"
 *     }
 *   ],
 *   "pagination": {
 *     "currentPage": 1,
 *     "totalPages": 1,
 *     "totalItems": 1
 *   }
 * }
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Get user from locals (set by middleware)
    const user = locals.user;

    if (!user?.id) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Unauthorized: You must be logged in to view transactions",
            code: "UNAUTHORIZED",
          },
        } satisfies ApiErrorResponse),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);

    const validationResult = GetTransactionsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      const validationErrors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: {
            message: "Invalid query parameters",
            code: "VALIDATION_ERROR",
            details: validationErrors,
          },
        } satisfies ValidationErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const query = validationResult.data;

    // Step 3: Fetch transactions with filters from service layer
    try {
      const result = await getTransactions(query, user.id, locals.supabase);

      // Step 4: Return success response with 200 OK
      return new Response(JSON.stringify(result) as unknown as GetTransactionsResponse, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (serviceError) {
      const errorMessage = serviceError instanceof Error ? serviceError.message : "Unknown error";

      // Log error for debugging (production: use structured logging)
      // eslint-disable-next-line no-console
      console.error("Error fetching transactions:", errorMessage);

      return new Response(
        JSON.stringify({
          error: {
            message: "Failed to fetch transactions",
            code: "INTERNAL_SERVER_ERROR",
            details: errorMessage,
          },
        } satisfies ApiErrorResponse),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    // Catch unexpected errors at endpoint level
    // eslint-disable-next-line no-console
    console.error("Unexpected error in GET /api/transactions:", error);

    return new Response(
      JSON.stringify({
        error: {
          message: "An unexpected error occurred",
          code: "INTERNAL_SERVER_ERROR",
        },
      } satisfies ApiErrorResponse),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

