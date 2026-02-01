/**
 * Budgets API Endpoint (ID Operations)
 *
 * Handles:
 * - PUT /api/budgets/[id] - Update a budget
 * - DELETE /api/budgets/[id] - Delete a budget
 */

import type { APIRoute } from "astro";

import { BudgetIdParamSchema, UpdateBudgetSchema } from "../../../lib/validators/budgets.validators";
import { updateBudget, deleteBudget } from "../../../lib/services/budget.service";
import type { UpdateBudgetCommand, ApiErrorResponse, ValidationErrorResponse } from "../../../types";
import logger from "../../../lib/logger";

export const prerender = false;

/**
 * PUT /api/budgets/[id]
 *
 * Updates an existing budget for the authenticated user.
 *
 * Path Parameters:
 * - id (required): UUID of the budget to update
 *
 * Request Body: UpdateBudgetCommand (partial update)
 * - name (optional)
 * - amount (optional)
 * - category_ids (optional)
 *
 * Response:
 * - 200 OK: Returns updated BudgetDTO
 * - 400 Bad Request
 * - 401 Unauthorized
 * - 404 Not Found
 * - 409 Conflict (e.g. duplicate name)
 * - 500 Internal Server Error
 */
export const PUT: APIRoute = async ({ request, params, locals }) => {
  try {
    // Step 1: Check authentication
    const user = locals.user;

    if (!user?.id) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Unauthorized: You must be logged in to update a budget",
            code: "UNAUTHORIZED",
          },
        } satisfies ApiErrorResponse),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Validate ID parameter
    const idValidation = BudgetIdParamSchema.safeParse(params);
    if (!idValidation.success) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Invalid budget ID",
            code: "VALIDATION_ERROR",
            details: idValidation.error.formErrors.fieldErrors,
          },
        } satisfies ApiErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const budgetId = idValidation.data.id;

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

    const validationResult = UpdateBudgetSchema.safeParse(body);

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

    const command: UpdateBudgetCommand = validationResult.data;

    // Step 4: Call service
    try {
      const updatedBudget = await updateBudget(budgetId, user.id, command, locals.supabase);

      return new Response(JSON.stringify(updatedBudget), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (serviceError) {
      const errorMessage = serviceError instanceof Error ? serviceError.message : "Unknown error";

      if (errorMessage === "NOT_FOUND") {
        return new Response(
          JSON.stringify({
            error: {
              message: "Budget not found",
              code: "NOT_FOUND",
            },
          } satisfies ApiErrorResponse),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (errorMessage === "BUDGET_ALREADY_EXISTS") {
        return new Response(
          JSON.stringify({
            error: {
              message: "A budget with this name already exists for the same period",
              code: "BUDGET_ALREADY_EXISTS",
            },
          } satisfies ApiErrorResponse),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      logger.error("Error updating budget:", errorMessage);

      return new Response(
        JSON.stringify({
          error: {
            message: "Failed to update budget",
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
    logger.error("Unexpected error in PUT /api/budgets/[id]:", error);
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
 * DELETE /api/budgets/[id]
 *
 * Deletes a budget.
 *
 * Path Parameters:
 * - id (required): UUID of the budget
 *
 * Response:
 * - 204 No Content
 * - 401 Unauthorized
 * - 404 Not Found
 * - 500 Internal Server Error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Check authentication
    const user = locals.user;

    if (!user?.id) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Unauthorized: You must be logged in to delete a budget",
            code: "UNAUTHORIZED",
          },
        } satisfies ApiErrorResponse),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Validate ID parameter
    const idValidation = BudgetIdParamSchema.safeParse(params);
    if (!idValidation.success) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Invalid budget ID",
            code: "VALIDATION_ERROR",
            details: idValidation.error.formErrors.fieldErrors,
          },
        } satisfies ApiErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const budgetId = idValidation.data.id;

    // Step 3: Delete (service now handles existence check via RETURNING)
    try {
      await deleteBudget(budgetId, user.id, locals.supabase);

      return new Response(null, {
        status: 204,
      });
    } catch (serviceError) {
      const errorMessage = serviceError instanceof Error ? serviceError.message : "Unknown error";

      if (errorMessage === "NOT_FOUND") {
        return new Response(
          JSON.stringify({
            error: {
              message: "Budget not found",
              code: "NOT_FOUND",
            },
          } satisfies ApiErrorResponse),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      logger.error("Error deleting budget:", errorMessage);

      return new Response(
        JSON.stringify({
          error: {
            message: "Failed to delete budget",
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
    logger.error("Unexpected error in DELETE /api/budgets/[id]:", error);

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
