/**
 * Dashboard API Endpoint
 *
 * Handles:
 * - GET /api/dashboard - Get aggregated dashboard data
 */

import type { APIRoute } from "astro";
import { z } from "zod";
import { getDashboardData } from "../../../lib/services/dashboard.service";
import type { DashboardDTO, ApiErrorResponse, ValidationErrorResponse } from "../../../types";
import { handleApiError } from "../../../lib/server-utils";

export const prerender = false;

// Validation schema for query parameters
const GetDashboardQuerySchema = z
  .object({
    month: z.coerce.number().min(1).max(12).optional(),
    year: z.coerce.number().min(2000).max(2100).optional(),
  })
  .strict();

/**
 * GET /api/dashboard
 *
 * Retrieves aggregated financial data for the authenticated user.
 *
 * Query Parameters (all optional):
 * - month (number): Month (1-12), defaults to current month
 * - year (number): Year (YYYY), defaults to current year
 *
 * Security:
 * - Requires authenticated session (verified via middleware)
 * - Returns only data belonging to the current user
 *
 * Response:
 * - 200 OK: Returns DashboardDTO
 * - 400 Bad Request: Invalid query parameters
 * - 401 Unauthorized: User not authenticated
 * - 500 Internal Server Error: Database error or service failure
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Get user from locals (set by middleware)
    const user = locals.user;

    if (!user?.id) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Unauthorized: You must be logged in to view dashboard",
            code: "UNAUTHORIZED",
          },
        } satisfies ApiErrorResponse),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Parse and validate query params
    const url = new URL(request.url);
    const result = GetDashboardQuerySchema.safeParse(Object.fromEntries(url.searchParams));

    if (!result.success) {
      const validationErrors = result.error.errors.map((err) => ({
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

    // Set defaults: user's local time ideally, but server time is a reasonable fallback
    const now = new Date();
    const month = result.data.month ?? now.getMonth() + 1;
    const year = result.data.year ?? now.getFullYear();

    // Step 3: Fetch dashboard data from service layer
    try {
      const dashboardData: DashboardDTO = await getDashboardData(locals.supabase, user.id, month, year);

      // Step 4: Return success response
      return new Response(JSON.stringify(dashboardData), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (serviceError) {
      return handleApiError(serviceError, "GET /api/dashboard");
    }
  } catch (error) {
    // Catch-all for unexpected errors
    return handleApiError(error, "GET /api/dashboard");
  }
};
