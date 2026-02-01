/**
 * AI Insights API Endpoint - Analyze
 *
 * Handles:
 * - POST /api/insights/analyze - Generate or refresh AI insights
 */

import type { APIRoute } from "astro";
import { z } from "zod";
import { generateInsights } from "../../../lib/services/insights.service";
import type { GenerateAIInsightsCommand, GenerateInsightsResponse, ApiErrorResponse, ValidationErrorResponse } from "../../../types";
import logger from "../../../lib/logger";

export const prerender = false;

// Zod schema for request validation
const GenerateInsightsSchema = z
  .object({
    months: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    force_refresh: z.boolean().optional(),
  })
  .strict();

/**
 * POST /api/insights/analyze
 *
 * Generates a new AI analysis or returns cached result if fresh (< 24h)
 * and not forcing refresh.
 *
 * Request Body:
 * - months: 1 | 2 | 3 (required) - Number of months to analyze
 * - force_refresh: boolean (optional) - Force new analysis even if cache is fresh
 *
 * Security:
 * - Requires authenticated session (verified via middleware)
 * - Generates insights only for the current user
 *
 * Response:
 * - 200 OK: Returns AIInsightsDTO
 * - 400 Bad Request: Validation error or insufficient data
 * - 401 Unauthorized: User not authenticated
 * - 503 Service Unavailable: AI service error
 * - 500 Internal Server Error: Other errors
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Get user from locals (set by middleware)
    const user = locals.user;

    if (!user?.id) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Unauthorized: You must be logged in to generate insights",
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
    const validationResult = GenerateInsightsSchema.safeParse(body);

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

    const command: GenerateAIInsightsCommand = validationResult.data;

    // Step 4: Generate insights using service
    try {
      const insights = await generateInsights(user.id, command, locals.supabase);

      // Step 5: Return success response
      return new Response(JSON.stringify(insights satisfies GenerateInsightsResponse), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (serviceError) {
      const errorMessage = serviceError instanceof Error ? serviceError.message : "Unknown error";

      // Handle specific service errors
      if (errorMessage === "INSUFFICIENT_DATA") {
        return new Response(
          JSON.stringify({
            error: {
              message: "Insufficient data for AI analysis. Need at least 1 month of transactions.",
              code: "INSUFFICIENT_DATA",
            },
          } satisfies ApiErrorResponse),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (errorMessage === "AI_SERVICE_ERROR") {
        return new Response(
          JSON.stringify({
            error: {
              message: "AI service temporarily unavailable. Please try again later.",
              code: "AI_SERVICE_ERROR",
            },
          } satisfies ApiErrorResponse),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (errorMessage === "FAILED_TO_SAVE_INSIGHTS" || errorMessage === "FAILED_TO_RETRIEVE_INSIGHTS") {
        return new Response(
          JSON.stringify({
            error: {
              message: "Failed to save or retrieve insights",
              code: errorMessage,
            },
          } satisfies ApiErrorResponse),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Generic service error
      logger.error("Error generating insights:", errorMessage);

      return new Response(
        JSON.stringify({
          error: {
            message: "Failed to generate insights",
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
    logger.error("Unexpected error in POST /api/insights/analyze:", error);

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
