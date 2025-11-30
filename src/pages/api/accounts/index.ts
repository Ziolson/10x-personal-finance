/**
 * Accounts API Endpoint
 *
 * Handles:
 * - POST /api/accounts - Create a new account
 * - GET /api/accounts - Get all accounts for authenticated user
 */

import type { APIRoute } from "astro";

import { CreateAccountSchema } from "../../../lib/validators/account.validators";
import { createAccount, getAccounts } from "../../../lib/services/account.service";
import type { CreateAccountCommand, ApiErrorResponse, ValidationErrorResponse } from "../../../types";

export const prerender = false;

/**
 * POST /api/accounts
 * Creates a new account for the authenticated user
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Get user from locals (set by middleware)
    // TODO: When authentication is implemented, middleware will extract user from session
    // For now, middleware sets a mock user for testing
    const user = locals.user;

    if (!user?.id) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Unauthorized: You must be logged in to create an account",
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

    // Step 3: Validate with Zod schema
    const validationResult = CreateAccountSchema.safeParse(body);

    if (!validationResult.success) {
      const validationErrors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
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

    const command: CreateAccountCommand = validationResult.data;

    // Step 4: Call service to create account
    try {
      const accountDTO = await createAccount(command, user.id, locals.supabase);

      // Step 5: Return success response with 201 Created
      return new Response(JSON.stringify(accountDTO), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (serviceError) {
      // Handle specific service errors
      const errorMessage = serviceError instanceof Error ? serviceError.message : "Unknown error";

      // Check for duplicate account name
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

      // Log the error for debugging
      // eslint-disable-next-line no-console
      console.error("Error creating account:", errorMessage);

      // Return generic error
      return new Response(
        JSON.stringify({
          error: {
            message: "Failed to create account",
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
    console.error("Unexpected error in POST /api/accounts:", error);

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
 * GET /api/accounts
 *
 * Retrieves all accounts for the authenticated user with their current balances.
 *
 * Security:
 * - Requires authenticated session (verified via middleware)
 * - Returns only accounts belonging to the current user (enforced by RLS policies)
 *
 * Response:
 * - 200 OK: Returns GetAccountsResponse (AccountDTO[]) sorted by creation date (newest first)
 * - 401 Unauthorized: User not authenticated
 * - 500 Internal Server Error: Database error or service failure
 *
 * @example
 * // Request
 * GET /api/accounts
 *
 * // Response (200 OK)
 * [
 *   {
 *     "id": "uuid-1",
 *     "name": "Main Bank Account",
 *     "initial_balance": 1000,
 *     "currency": "PLN",
 *     "created_at": "2025-01-01T10:00:00Z",
 *     "updated_at": "2025-01-01T10:00:00Z",
 *     "current_balance": 1250.50
 *   }
 * ]
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Step 1: Get user from locals (set by middleware)
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

    // Step 2: Fetch accounts with current balances from service layer
    try {
      const accounts = await getAccounts(user.id, locals.supabase);

      // Step 3: Return success response with 200 OK
      return new Response(JSON.stringify(accounts), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (serviceError) {
      // Handle service layer errors
      const errorMessage = serviceError instanceof Error ? serviceError.message : "Unknown error";

      // Log error for debugging (production: use structured logging)
      // eslint-disable-next-line no-console
      console.error("Error fetching accounts:", errorMessage);

      return new Response(
        JSON.stringify({
          error: {
            message: "Failed to fetch accounts",
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
    console.error("Unexpected error in GET /api/accounts:", error);

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
