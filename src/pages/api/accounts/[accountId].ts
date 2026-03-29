/**
 * Dynamic Account Management API Endpoint
 *
 * Handles:
 * - GET /api/accounts/{accountId} - Retrieve a specific account
 * - PUT /api/accounts/{accountId} - Update a specific account
 * - DELETE /api/accounts/{accountId} - Delete a specific account
 */

import type { APIRoute } from "astro";

import { UpdateAccountSchema } from "../../../lib/validators/account.validators";
import { getAccountById, updateAccount, deleteAccount } from "../../../lib/services/account.service";
import type { UpdateAccountCommand, ApiErrorResponse, ValidationErrorResponse } from "../../../types";
import { handleApiError } from "../../../lib/server-utils";

export const prerender = false;

/**
 * UUID validation regex pattern
 * Matches standard UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a valid UUID
 */
function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

/**
 * GET /api/accounts/{accountId}
 *
 * Retrieves a specific account for the authenticated user with current balance.
 *
 * Security:
 * - Requires authenticated session (verified via middleware)
 * - Returns only accounts belonging to the current user (enforced by service)
 *
 * Response:
 * - 200 OK: Returns GetAccountResponse (AccountDTO)
 * - 400 Bad Request: Invalid accountId format
 * - 401 Unauthorized: User not authenticated
 * - 404 Not Found: Account not found or doesn't belong to user
 * - 500 Internal Server Error: Database error or service failure
 *
 * @example
 * // Request
 * GET /api/accounts/550e8400-e29b-41d4-a716-446655440000
 *
 * // Response (200 OK)
 * {
 *   "id": "550e8400-e29b-41d4-a716-446655440000",
 *   "name": "Main Bank Account",
 *   "initial_balance": 1000,
 *   "currency": "PLN",
 *   "created_at": "2025-01-01T10:00:00Z",
 *   "updated_at": "2025-01-01T10:00:00Z",
 *   "current_balance": 1250.50
 * }
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Check authentication
    const user = locals.user;

    if (!user?.id) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Unauthorized: You must be logged in to view accounts",
            code: "UNAUTHORIZED",
          },
        } satisfies ApiErrorResponse),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Validate accountId parameter
    const accountId = params.accountId as string;

    if (!accountId || !isValidUUID(accountId)) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Invalid account ID format",
            code: "INVALID_ACCOUNT_ID",
          },
        } satisfies ApiErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Call service to fetch account
    try {
      const account = await getAccountById(accountId, user.id, locals.supabase);

      // If account not found or doesn't belong to user
      if (!account) {
        return new Response(
          JSON.stringify({
            error: {
              message: "Account not found",
              code: "ACCOUNT_NOT_FOUND",
            },
          } satisfies ApiErrorResponse),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Step 4: Return success response
      return new Response(JSON.stringify(account), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (serviceError) {
      return handleApiError(serviceError, "GET /api/accounts/[accountId]");
    }
  } catch (error) {
    return handleApiError(error, "GET /api/accounts/[accountId]");
  }
};

/**
 * PUT /api/accounts/{accountId}
 *
 * Updates a specific account for the authenticated user.
 *
 * Security:
 * - Requires authenticated session (verified via middleware)
 * - Allows updating only accounts belonging to the current user
 * - Validates that updated name doesn't conflict with existing accounts
 *
 * Request Body:
 * - name (optional): string, 1-100 characters
 * - initial_balance (optional): number, >= 0
 * - At least one field must be provided
 *
 * Response:
 * - 200 OK: Returns UpdateAccountResponse (AccountDTO) with updated data
 * - 400 Bad Request: Invalid accountId format or invalid/empty request body
 * - 401 Unauthorized: User not authenticated
 * - 404 Not Found: Account not found or doesn't belong to user
 * - 409 Conflict: Account name already exists for this user
 * - 500 Internal Server Error: Database error or service failure
 *
 * @example
 * // Request
 * PUT /api/accounts/550e8400-e29b-41d4-a716-446655440000
 * {
 *   "name": "Updated Account Name"
 * }
 *
 * // Response (200 OK)
 * {
 *   "id": "550e8400-e29b-41d4-a716-446655440000",
 *   "name": "Updated Account Name",
 *   "initial_balance": 1000,
 *   "currency": "PLN",
 *   "created_at": "2025-01-01T10:00:00Z",
 *   "updated_at": "2025-01-01T10:30:00Z",
 *   "current_balance": 1250.50
 * }
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // Step 1: Check authentication
    const user = locals.user;

    if (!user?.id) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Unauthorized: You must be logged in to update accounts",
            code: "UNAUTHORIZED",
          },
        } satisfies ApiErrorResponse),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Validate accountId parameter
    const accountId = params.accountId as string;

    if (!accountId || !isValidUUID(accountId)) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Invalid account ID format",
            code: "INVALID_ACCOUNT_ID",
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
    const validationResult = UpdateAccountSchema.safeParse(body);

    if (!validationResult.success) {
      const validationErrors = validationResult.error.errors.map((err) => ({
        field: err.path.join(".") || "_form",
        message: err.message,
      }));

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

    const command: UpdateAccountCommand = validationResult.data;

    // Step 5: Call service to update account
    try {
      const updatedAccount = await updateAccount(accountId, user.id, command, locals.supabase);

      // Step 6: Return success response with 200 OK
      return new Response(JSON.stringify(updatedAccount), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (serviceError) {
      const errorMessage = serviceError instanceof Error ? serviceError.message : "Unknown error";

      // Handle "not found" error
      if (errorMessage === "NOT_FOUND") {
        return new Response(
          JSON.stringify({
            error: {
              message: "Account not found",
              code: "ACCOUNT_NOT_FOUND",
            },
          } satisfies ApiErrorResponse),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Handle duplicate name error
      if (errorMessage === "ACCOUNT_NAME_EXISTS") {
        return new Response(
          JSON.stringify({
            error: {
              message: "An account with this name already exists",
              code: "ACCOUNT_NAME_EXISTS",
            },
          } satisfies ApiErrorResponse),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return handleApiError(serviceError, "PUT /api/accounts/[accountId]");
    }
  } catch (error) {
    return handleApiError(error, "PUT /api/accounts/[accountId]");
  }
};

/**
 * DELETE /api/accounts/{accountId}
 *
 * Deletes a specific account for the authenticated user.
 *
 * Security:
 * - Requires authenticated session (verified via middleware)
 * - Allows deleting only accounts belonging to the current user
 * - Account deletion cascades to associated transactions (via database triggers)
 *
 * Response:
 * - 204 No Content: Success (response body is empty)
 * - 400 Bad Request: Invalid accountId format
 * - 401 Unauthorized: User not authenticated
 * - 404 Not Found: Account not found or doesn't belong to user
 * - 500 Internal Server Error: Database error or service failure
 *
 * @example
 * // Request
 * DELETE /api/accounts/550e8400-e29b-41d4-a716-446655440000
 *
 * // Response (204 No Content)
 * // No body
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Check authentication
    const user = locals.user;

    if (!user?.id) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Unauthorized: You must be logged in to delete accounts",
            code: "UNAUTHORIZED",
          },
        } satisfies ApiErrorResponse),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Validate accountId parameter
    const accountId = params.accountId as string;

    if (!accountId || !isValidUUID(accountId)) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Invalid account ID format",
            code: "INVALID_ACCOUNT_ID",
          },
        } satisfies ApiErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Verify account exists before deletion
    try {
      const accountExists = await getAccountById(accountId, user.id, locals.supabase);

      if (!accountExists) {
        return new Response(
          JSON.stringify({
            error: {
              message: "Account not found",
              code: "ACCOUNT_NOT_FOUND",
            },
          } satisfies ApiErrorResponse),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Step 4: Call service to delete account
      await deleteAccount(accountId, user.id, locals.supabase);

      // Step 5: Return success response with 204 No Content
      return new Response(null, {
        status: 204,
        headers: { "Content-Type": "application/json" },
      });
    } catch (serviceError) {
      return handleApiError(serviceError, "DELETE /api/accounts/[accountId]");
    }
  } catch (error) {
    return handleApiError(error, "DELETE /api/accounts/[accountId]");
  }
};
