/**
 * Dynamic Category Management API Endpoint
 *
 * Handles:
 * - GET /api/categories/{categoryId} - Retrieve a specific category
 * - PUT /api/categories/{categoryId} - Update a specific category
 * - DELETE /api/categories/{categoryId} - Delete a specific category
 */

import type { APIRoute } from "astro";

import { UpdateCategorySchema, CategoryIdParamSchema } from "../../../lib/validators/categories.validators";
import { getCategoryById, updateCategory, deleteCategory } from "../../../lib/services/category.service";
import type { UpdateCategoryCommand, ApiErrorResponse, ValidationErrorResponse } from "../../../types";

export const prerender = false;

/**
 * GET /api/categories/{categoryId}
 *
 * Retrieves a specific category for the authenticated user.
 *
 * Security:
 * - Requires authenticated session (verified via middleware)
 * - Returns only categories belonging to the current user (enforced by service)
 *
 * Response:
 * - 200 OK: Returns the CategoryDTO
 * - 400 Bad Request: Invalid categoryId format
 * - 401 Unauthorized: User not authenticated
 * - 404 Not Found: Category not found or doesn't belong to user
 * - 500 Internal Server Error: Database error or service failure
 *
 * @example
 * // Request
 * GET /api/categories/550e8400-e29b-41d4-a716-446655440000
 *
 * // Response (200 OK)
 * {
 *   "id": "550e8400-e29b-41d4-a716-446655440000",
 *   "name": "Groceries",
 *   "type": "expense",
 *   "budget_id": "uuid_or_null",
 *   "created_at": "2025-01-01T10:00:00Z",
 *   "updated_at": "2025-01-01T10:00:00Z"
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

    // Step 2: Validate categoryId parameter
    const paramValidation = CategoryIdParamSchema.safeParse({ categoryId: params.categoryId });

    if (!paramValidation.success) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Invalid category ID format",
            code: "INVALID_CATEGORY_ID",
          },
        } satisfies ApiErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const categoryId = paramValidation.data.categoryId;

    // Step 3: Call service to fetch category
    try {
      const category = await getCategoryById(categoryId, user.id, locals.supabase);

      // If category not found or doesn't belong to user
      if (!category) {
        return new Response(
          JSON.stringify({
            error: {
              message: "Category not found",
              code: "CATEGORY_NOT_FOUND",
            },
          } satisfies ApiErrorResponse),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Step 4: Return success response
      return new Response(JSON.stringify(category), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (serviceError) {
      const errorMessage = serviceError instanceof Error ? serviceError.message : "Unknown error";
      // eslint-disable-next-line no-console
      console.error("Error fetching category:", errorMessage);

      return new Response(
        JSON.stringify({
          error: {
            message: "Failed to fetch category",
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
    // eslint-disable-next-line no-console
    console.error("Unexpected error in GET /api/categories/[categoryId]:", error);

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
 * PUT /api/categories/{categoryId}
 *
 * Updates a specific category for the authenticated user.
 *
 * Security:
 * - Requires authenticated session (verified via middleware)
 * - Allows updating only categories belonging to the current user
 * - Validates that updated name doesn't conflict with existing categories
 * - Category type cannot be changed (by design - not included in update payload)
 *
 * Request Body:
 * - name (optional): string, 1-100 characters
 * - budget_id (optional): UUID or null
 * - At least one field must be provided
 *
 * Response:
 * - 200 OK: Returns the updated CategoryDTO
 * - 400 Bad Request: Invalid categoryId format or invalid/empty request body
 * - 401 Unauthorized: User not authenticated
 * - 404 Not Found: Category not found or doesn't belong to user
 * - 409 Conflict: Category name already exists for this user
 * - 500 Internal Server Error: Database error or service failure
 *
 * @example
 * // Request
 * PUT /api/categories/550e8400-e29b-41d4-a716-446655440000
 * {
 *   "name": "Updated Category Name"
 * }
 *
 * // Response (200 OK)
 * {
 *   "id": "550e8400-e29b-41d4-a716-446655440000",
 *   "name": "Updated Category Name",
 *   "type": "expense",
 *   "budget_id": "uuid_or_null",
 *   "created_at": "2025-01-01T10:00:00Z",
 *   "updated_at": "2025-01-01T10:30:00Z"
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
            message: "Unauthorized: You must be logged in to update categories",
            code: "UNAUTHORIZED",
          },
        } satisfies ApiErrorResponse),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Validate categoryId parameter
    const paramValidation = CategoryIdParamSchema.safeParse({ categoryId: params.categoryId });

    if (!paramValidation.success) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Invalid category ID format",
            code: "INVALID_CATEGORY_ID",
          },
        } satisfies ApiErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const categoryId = paramValidation.data.categoryId;

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
    const validationResult = UpdateCategorySchema.safeParse(body);

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

    const command: UpdateCategoryCommand = validationResult.data;

    // Step 5: Call service to update category
    try {
      const updatedCategory = await updateCategory(categoryId, user.id, command, locals.supabase);

      // Step 6: Return success response with 200 OK
      return new Response(JSON.stringify(updatedCategory), {
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
              message: "Category not found",
              code: "CATEGORY_NOT_FOUND",
            },
          } satisfies ApiErrorResponse),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Handle duplicate name error
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

      // eslint-disable-next-line no-console
      console.error("Error updating category:", errorMessage);

      return new Response(
        JSON.stringify({
          error: {
            message: "Failed to update category",
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
    // eslint-disable-next-line no-console
    console.error("Unexpected error in PUT /api/categories/[categoryId]:", error);

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
 * DELETE /api/categories/{categoryId}
 *
 * Deletes a specific category for the authenticated user.
 *
 * Security:
 * - Requires authenticated session (verified via middleware)
 * - Allows deleting only categories belonging to the current user
 * - Prevents deletion of categories with associated transactions (RESTRICT constraint)
 *
 * Response:
 * - 204 No Content: Success (response body is empty)
 * - 400 Bad Request: Invalid categoryId format
 * - 401 Unauthorized: User not authenticated
 * - 404 Not Found: Category not found or doesn't belong to user
 * - 409 Conflict: Category has associated transactions (RESTRICT constraint)
 * - 500 Internal Server Error: Database error or service failure
 *
 * @example
 * // Request
 * DELETE /api/categories/550e8400-e29b-41d4-a716-446655440000
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
            message: "Unauthorized: You must be logged in to delete categories",
            code: "UNAUTHORIZED",
          },
        } satisfies ApiErrorResponse),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Validate categoryId parameter
    const paramValidation = CategoryIdParamSchema.safeParse({ categoryId: params.categoryId });

    if (!paramValidation.success) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Invalid category ID format",
            code: "INVALID_CATEGORY_ID",
          },
        } satisfies ApiErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const categoryId = paramValidation.data.categoryId;

    // Step 3: Delete (service now handles existence check via RETURNING)
    try {
      await deleteCategory(categoryId, user.id, locals.supabase);

      // Step 4: Return success response with 204 No Content
      return new Response(null, {
        status: 204,
      });
    } catch (serviceError) {
      const errorMessage = serviceError instanceof Error ? serviceError.message : "Unknown error";

      if (errorMessage === "NOT_FOUND") {
        return new Response(
          JSON.stringify({
            error: {
              message: "Category not found",
              code: "CATEGORY_NOT_FOUND",
            },
          } satisfies ApiErrorResponse),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Handle RESTRICT constraint violation (category has transactions)
      if (errorMessage === "CATEGORY_HAS_TRANSACTIONS") {
        return new Response(
          JSON.stringify({
            error: {
              message: "Cannot delete category that has associated transactions",
              code: "CATEGORY_HAS_TRANSACTIONS",
            },
          } satisfies ApiErrorResponse),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // eslint-disable-next-line no-console
      console.error("Error deleting category:", errorMessage);

      return new Response(
        JSON.stringify({
          error: {
            message: "Failed to delete category",
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
    // eslint-disable-next-line no-console
    console.error("Unexpected error in DELETE /api/categories/[categoryId]:", error);

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
