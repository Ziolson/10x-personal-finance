/**
 * Categories API Endpoint
 *
 * Handles:
 * - GET /api/categories - Get all categories for authenticated user (with optional type filter)
 * - POST /api/categories - Create a new category
 */

import type { APIRoute } from "astro";

import { GetCategoriesQuerySchema, CreateCategorySchema } from "../../../lib/validators/categories.validators";
import { getCategories, createCategory } from "../../../lib/services/category.service";
import type { CreateCategoryCommand, ApiErrorResponse, ValidationErrorResponse } from "../../../types";

export const prerender = false;

/**
 * GET /api/categories
 *
 * Retrieves all categories for the authenticated user with optional type filtering.
 *
 * Query Parameters:
 * - type (optional): 'income' or 'expense' to filter categories by type
 *
 * Security:
 * - Requires authenticated session (verified via middleware)
 * - Returns only categories belonging to the current user (enforced by RLS policies)
 *
 * Response:
 * - 200 OK: Returns GetCategoriesResponse (CategoryDTO[]) sorted by creation date (newest first)
 * - 401 Unauthorized: User not authenticated
 * - 400 Bad Request: Invalid query parameters
 * - 500 Internal Server Error: Database error or service failure
 *
 * @example
 * // Request: Get all categories
 * GET /api/categories
 *
 * // Request: Get only expense categories
 * GET /api/categories?type=expense
 *
 * // Response (200 OK)
 * [
 *   {
 *     "id": "uuid",
 *     "name": "Groceries",
 *     "type": "expense",
 *     "budget_id": "uuid_or_null",
 *     "created_at": "2025-01-01T10:00:00Z",
 *     "updated_at": "2025-01-01T10:00:00Z"
 *   }
 * ]
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // Step 1: Check authentication
    const user = locals.user;

    if (!user?.id) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Unauthorized: You must be logged in to view categories",
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
    const type = url.searchParams.get("type");
    const queryParams = {
      ...(type && { type }),
    };

    const validationResult = GetCategoriesQuerySchema.safeParse(queryParams);

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

    // Step 3: Call service to fetch categories
    try {
      const categories = await getCategories(user.id, locals.supabase, validationResult.data);

      // Step 4: Return success response with 200 OK
      return new Response(JSON.stringify(categories), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (serviceError) {
      const errorMessage = serviceError instanceof Error ? serviceError.message : "Unknown error";

      // eslint-disable-next-line no-console
      console.error("Error fetching categories:", errorMessage);

      return new Response(
        JSON.stringify({
          error: {
            message: "Failed to fetch categories",
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
    console.error("Unexpected error in GET /api/categories:", error);

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
 * POST /api/categories
 *
 * Creates a new category for the authenticated user.
 *
 * Request Body:
 * - name (required): string, 1-100 characters
 * - type (required): 'income' or 'expense'
 * - budget_id (optional): UUID or null for linking to a budget
 *
 * Security:
 * - Requires authenticated session (verified via middleware)
 * - Category is automatically scoped to the current user
 *
 * Response:
 * - 201 Created: Returns the newly created CategoryDTO
 * - 400 Bad Request: Invalid request body or validation failure
 * - 401 Unauthorized: User not authenticated
 * - 409 Conflict: Category with the same name already exists for this user
 * - 500 Internal Server Error: Database error or service failure
 *
 * @example
 * // Request
 * POST /api/categories
 * {
 *   "name": "Groceries",
 *   "type": "expense",
 *   "budget_id": null
 * }
 *
 * // Response (201 Created)
 * {
 *   "id": "uuid",
 *   "name": "Groceries",
 *   "type": "expense",
 *   "budget_id": null,
 *   "created_at": "2025-01-01T10:00:00Z",
 *   "updated_at": "2025-01-01T10:00:00Z"
 * }
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Check authentication
    const user = locals.user;

    if (!user?.id) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Unauthorized: You must be logged in to create a category",
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
    const validationResult = CreateCategorySchema.safeParse(body);

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

    const command: CreateCategoryCommand = validationResult.data;

    // Step 4: Call service to create category
    try {
      const categoryDTO = await createCategory(command, user.id, locals.supabase);

      // Step 5: Return success response with 201 Created
      return new Response(JSON.stringify(categoryDTO), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (serviceError) {
      const errorMessage = serviceError instanceof Error ? serviceError.message : "Unknown error";

      // Check for duplicate category name
      if (errorMessage === "CATEGORY_NAME_EXISTS") {
        return new Response(
          JSON.stringify({
            error: {
              message: "A category with this name already exists",
              code: "CATEGORY_NAME_EXISTS",
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
      console.error("Error creating category:", errorMessage);

      // Return generic error
      return new Response(
        JSON.stringify({
          error: {
            message: "Failed to create category",
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
    console.error("Unexpected error in POST /api/categories:", error);

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
