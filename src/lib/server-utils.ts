import type { ApiErrorResponse } from "../types";

/**
 * Handles API errors centrally to prevent sensitive information leakage.
 * Logs the full error details to the server console but returns a sanitized
 * response to the client.
 *
 * @param error - The error object (unknown type)
 * @param message - Optional user-facing message (default: "An unexpected error occurred")
 * @returns Response object with 500 status and sanitized JSON body
 */
export function handleApiError(error: unknown, message = "An unexpected error occurred"): Response {
  // Log the full error for server-side debugging
  // eslint-disable-next-line no-console
  console.error(`[API Error] ${message}:`, error);

  // Return sanitized response to client
  // We explicitly do NOT include error details/stack traces to prevent info leakage
  return new Response(
    JSON.stringify({
      error: {
        message,
        code: "INTERNAL_SERVER_ERROR",
      },
    } satisfies ApiErrorResponse),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
