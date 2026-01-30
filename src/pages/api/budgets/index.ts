/**
 * Budgets API Endpoint
 *
 * Handles:
 * - GET /api/budgets - Get all budgets for authenticated user (with optional month/year filter)
 * - POST /api/budgets - Create a new budget
 */

import type { APIRoute } from "astro";

import { GetBudgetsQuerySchema, CreateBudgetSchema } from "../../../lib/validators/budgets.validators";
import { getBudgets, createBudget } from "../../../lib/services/budget.service";
import type { CreateBudgetCommand, ApiErrorResponse, ValidationErrorResponse } from "../../../types";

export const prerender = false;

/**
 * GET /api/budgets
 *
 * Retrieves all budgets for the authenticated user with optional month/year filtering.
 *
 * Query Parameters:
 * - month (optional): 1-12
 * - year (optional): YYYY
 *
 * Security:
 * - Requires authenticated session
 * - Returns only budgets belonging to the current user
 *
 * Response:
 * - 200 OK: Returns BudgetDTO[] sorted by year/month (descending)
 * - 401 Unauthorized
 * - 400 Bad Request
 * - 500 Internal Server Error
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // Step 1: Check authentication
    const user = locals.user;

    if (!user?.id) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Unauthorized: You must be logged in to view budgets",
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
    const monthStr = url.searchParams.get("month");
    const yearStr = url.searchParams.get("year");

    // Construct query object only with provided params
    const queryParams: Record<string, unknown> = {};
    if (monthStr) queryParams.month = monthStr;
    if (yearStr) queryParams.year = yearStr;

    const validationResult = GetBudgetsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      const validationErrors = validationResult.error.errors.map((err) => ({
        field: err.path.join(".") || "_query",
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

    // Step 3: Call service to fetch budgets
    try {
      const budgets = await getBudgets(user.id, locals.supabase, validationResult.data);

      // Step 4: Return success response with 200 OK
      return new Response(JSON.stringify(budgets), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (serviceError) {
      const errorMessage = serviceError instanceof Error ? serviceError.message : "Unknown error";

      console.error("Error fetching budgets:", errorMessage);

      return new Response(
        JSON.stringify({
          error: {
            message: "Failed to fetch budgets",
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
    console.error("Unexpected error in GET /api/budgets:", error);

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
 * POST /api/budgets
 *
 * Creates a new budget for the authenticated user.
 *
 * Request Body: CreateBudgetCommand
 *
 * Response:
 * - 201 Created: Returns the newly created BudgetDTO
 * - 400 Bad Request
 * - 401 Unauthorized
 * - 409 Conflict: Budget already exists for this month/year/name
 * - 500 Internal Server Error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Check authentication
    const user = locals.user;

    if (!user?.id) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Unauthorized: You must be logged in to create a budget",
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
    const validationResult = CreateBudgetSchema.safeParse(body);

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

    const command: CreateBudgetCommand = validationResult.data;

    // Step 4: Call service to create budget
    try {
      const budgetDTO = await createBudget(command, user.id, locals.supabase);

      return new Response(JSON.stringify(budgetDTO), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (serviceError) {
      const errorMessage = serviceError instanceof Error ? serviceError.message : "Unknown error";

      // Check for duplicate budget
      if (errorMessage === "BUDGET_ALREADY_EXISTS") {
        return new Response(
          JSON.stringify({
            error: {
              message: "A budget with this name already exists for the specified month and year",
              code: "BUDGET_ALREADY_EXISTS",
            },
          } satisfies ApiErrorResponse),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      console.error("Error creating budget:", errorMessage);

      return new Response(
        JSON.stringify({
          error: {
            message: "Failed to create budget",
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
    console.error("Unexpected error in POST /api/budgets:", error);

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
