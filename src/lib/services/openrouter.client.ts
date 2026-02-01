/**
 * OpenRouter Client
 *
 * Handles communication with OpenRouter API using OpenAI SDK
 * for AI-powered savings recommendations.
 */

import OpenAI from "openai";

/**
 * OpenRouter client configuration
 * Uses OpenAI SDK with custom baseURL pointing to OpenRouter
 */
export const openRouterClient = new OpenAI({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
  baseURL: import.meta.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": import.meta.env.APP_URL || "",
    "X-Title": import.meta.env.APP_NAME || "10xPersonal Finance",
  },
});

/**
 * AI Model configuration
 */
export const AI_CONFIG = {
  model: import.meta.env.AI_MODEL || "openai/gpt-4o-mini",
  maxTokens: parseInt(import.meta.env.AI_MAX_TOKENS || "2000", 10),
  temperature: parseFloat(import.meta.env.AI_TEMPERATURE || "0.7"),
} as const;
