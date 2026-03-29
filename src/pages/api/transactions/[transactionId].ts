/**
 * Transaction Detail API Endpoint
 *
 * Handles:
 * - PUT /api/transactions/[transactionId] - Update an existing transaction
 * - DELETE /api/transactions/[transactionId] - Delete a transaction
 */

import type { APIRoute } from "astro";

import { UpdateTransactionSchema } from "../../../lib/validators/transaction.validators";
import { updateTransaction, deleteTransaction } from "../../../lib/services/transaction.service";
import type { ApiErrorResponse, ValidationErrorResponse } from "../../../types";
import { handleApiError } from "../../../lib/server-utils";

export const prerender = false;

/**
 * PUT /api/transactions/[transactionId]
 *
 * Updates an existing transaction for the authenticated user.
 * Only the provided fields will be updated (partial update).
 *
 * Request Body (all optional):
 * - type: "expense" | "income" | "transfer"
 * - amount: number > 0
 * - date: YYYY-MM-DD format
 * - description: optional string
 * - from_account_id: optional UUID
 * - to_account_id: optional UUID
 * - category_id: optional UUID
 *
 * Security:
 * - Requires authenticated session (verified via middleware)
 * - User can only update their own transactions (enforced by RLS)
 *
 * Response:
 * - 200 OK: Returns updated TransactionDTO
 * - 400 Bad Request: Validation errors or missing required body
 * - 401 Unauthorized: User not authenticated
 * - 404 Not Found: Transaction not found or doesn't belong to user
 * - 500 Internal Server Error: Database error or service failure
 *
 * @example
 * // Request - Update transaction amount
 * PUT /api/transactions/uuid-tx-id
 * {
 *   "amount": 75.50
 * }
 *
 * // Response (200 OK)
 * {
 *   "id": "uuid-tx-id",
 *   "type": "expense",
 *   "amount": 75.50,
 *   "date": "2025-01-03",
 *   "from_account_id": "uuid-account",
 *   "to_account_id": null,
 *   "category_id": "uuid-category",
 *   "description": "Coffee",
 *   "created_at": "2025-01-03T12:00:00Z"
 * }
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // Step 1: Get user from locals (set by middleware)
    const user = locals.user;

    if (!user?.id) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Unauthorized: You must be logged in to update a transaction",
            code: "UNAUTHORIZED",
          },
        } satisfies ApiErrorResponse),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Validate transaction ID parameter
    const transactionId = params.transactionId;

    if (!transactionId) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Invalid request: transaction ID is required",
            code: "INVALID_REQUEST",
          },
        } satisfies ApiErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Parse and validate request body
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

    // Step 4: Validate with Zod schema
    const validationResult = UpdateTransactionSchema.safeParse(body);

    if (!validationResult.success) {
      const validationErrors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      // eslint-disable-next-line no-console
      console.warn(`[API /api/transactions/${transactionId}] Validation failed:`, {
        transactionId,
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

    // Step 5: Call service to update transaction
    try {
      const transactionDTO = await updateTransaction(transactionId, user.id, command, locals.supabase);

      // Step 6: Return success response with 200 OK
      return new Response(JSON.stringify(transactionDTO), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (serviceError) {
      const errorMessage = serviceError instanceof Error ? serviceError.message : "Unknown error";

      // Check for not found error (RLS or transaction doesn't exist)
      if (errorMessage === "NOT_FOUND") {
        return new Response(
          JSON.stringify({
            error: {
              message: "Transaction not found",
              code: "NOT_FOUND",
            },
          } satisfies ApiErrorResponse),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Return generic error
      return handleApiError(serviceError, "PUT /api/transactions/[transactionId]");
    }
  } catch (error) {
    // Catch-all for unexpected errors
    return handleApiError(error, "PUT /api/transactions/[transactionId]");
  }
};

/**
 * DELETE /api/transactions/[transactionId]
 *
 * Permanently deletes a transaction belonging to the authenticated user.
 *
 * Security:
 * - Requires authenticated session (verified via middleware)
 * - User can only delete their own transactions (enforced by RLS)
 *
 * Response:
 * - 204 No Content: Transaction successfully deleted
 * - 401 Unauthorized: User not authenticated
 * - 404 Not Found: Transaction not found or doesn't belong to user
 * - 500 Internal Server Error: Database error or service failure
 *
 * @example
 * // Request
 * DELETE /api/transactions/uuid-tx-id
 *
 * // Response (204 No Content)
 * (empty body)
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Get user from locals (set by middleware)
    const user = locals.user;

    if (!user?.id) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Unauthorized: You must be logged in to delete a transaction",
            code: "UNAUTHORIZED",
          },
        } satisfies ApiErrorResponse),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Validate transaction ID parameter
    const transactionId = params.transactionId;

    if (!transactionId) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Invalid request: transaction ID is required",
            code: "INVALID_REQUEST",
          },
        } satisfies ApiErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Call service to delete transaction
    try {
      await deleteTransaction(transactionId, user.id, locals.supabase);

      // Step 4: Return success response with 204 No Content
      return new Response(null, {
        status: 204,
        headers: { "Content-Type": "application/json" },
      });
    } catch (serviceError) {
      // Return generic error
      return handleApiError(serviceError, "DELETE /api/transactions/[transactionId]");
    }
  } catch (error) {
    // Catch-all for unexpected errors
    return handleApiError(error, "DELETE /api/transactions/[transactionId]");
  }
};
