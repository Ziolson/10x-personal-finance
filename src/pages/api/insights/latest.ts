/**
 * AI Insights API Endpoint - GET Latest
 *
 * Handles:
 * - GET /api/insights/latest - Get the latest cached AI insights
 */

import type { APIRoute } from "astro";
import { getLatestInsights } from "../../../lib/services/insights.service";
import type { GetLatestInsightsResponse, ApiErrorResponse } from "../../../types";
import logger from "../../../lib/logger";

export const prerender = false;

/**
 * GET /api/insights/latest
 *
 * Retrieves the latest cached AI insights for the authenticated user.
 * Returns 404 if no insights have been generated yet.
 *
 * Security:
 * - Requires authenticated session (verified via middleware)
 * - Returns only insights belonging to the current user (via RLS)
 *
 * Response:
 * - 200 OK: Returns AIInsightsDTO
 * - 401 Unauthorized: User not authenticated
 * - 404 Not Found: No insights available yet
 * - 500 Internal Server Error: Service failure
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Step 1: Get user from locals (set by middleware)
    const user = locals.user;

    if (!user?.id) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Unauthorized: You must be logged in to view insights",
            code: "UNAUTHORIZED",
          },
        } satisfies ApiErrorResponse),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Get latest insights from service
    const insights = await getLatestInsights(user.id, locals.supabase);

    if (!insights) {
      return new Response(
        JSON.stringify({
          error: {
            message: "No insights available yet. Generate your first analysis.",
            code: "NOT_FOUND",
          },
        } satisfies ApiErrorResponse),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Return success response
    return new Response(JSON.stringify(insights satisfies GetLatestInsightsResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Catch-all for unexpected errors
    logger.error("Unexpected error in GET /api/insights/latest:", error);

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
