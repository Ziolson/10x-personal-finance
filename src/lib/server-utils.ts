import { type ApiErrorResponse } from "../types";
import logger from "./logger";

/**
 * Standardized error handler for API routes.
 * Logs the error server-side and returns a sanitized 500 response to the client.
 *
 * @param error - The error object caught in the try-catch block
 * @param context - The context where the error occurred (e.g., "POST /api/accounts")
 * @returns A Response object with status 500 and a sanitized JSON body
 */
export function handleApiError(error: unknown, context: string): Response {
  // Log full details server-side
  logger.error(`[${context}] Error:`, error);

  return new Response(
    JSON.stringify({
      error: {
        message: "An internal server error occurred",
        code: "INTERNAL_SERVER_ERROR",
        // details are intentionally omitted to prevent leakage
      },
    } satisfies ApiErrorResponse),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
