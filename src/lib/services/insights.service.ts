/**
 * Insights Service
 *
 * Handles business logic for AI-powered savings recommendations including:
 * - Checking if user has enough transaction data for analysis
 * - Aggregating transaction data by category
 * - Communicating with OpenRouter/OpenAI API
 * - Managing caching of insights (24-hour cache)
 * - Generating and storing AI-powered savings recommendations
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { AIInsightsSummary, AIInsightsDTO, AggregatedTransactionData, GenerateAIInsightsCommand } from "../../types";
import { openRouterClient, AI_CONFIG } from "./openrouter.client";
import logger from "../logger";

/**
 * Checks if user has enough transaction data for AI analysis
 *
 * This function verifies that the user has at least 28 days (1 full month)
 * of expense transactions in the database. This is the minimum required
 * for meaningful AI analysis and savings recommendations.
 *
 * @param userId - The authenticated user's ID
 * @param supabase - Supabase client instance for database access
 * @returns Promise<boolean> True if user has at least 28 days of expense data, false otherwise
 * @throws Error if database query fails
 */
export async function hasEnoughData(userId: string, supabase: SupabaseClient): Promise<boolean> {
  // Step 1: Get earliest expense transaction date
  const { data: transactions, error } = await supabase.from("transactions").select("date").eq("user_id", userId).eq("type", "expense").order("date", { ascending: true }).limit(1);

  if (error) {
    throw new Error(`Database error while checking transaction data: ${error.message}`);
  }

  if (!transactions || transactions.length === 0) {
    return false;
  }

  // Step 2: Calculate days between earliest transaction and today
  const earliestDate = new Date(transactions[0].date);
  const today = new Date();
  const daysDiff = Math.floor((today.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24));

  // Step 3: Return true if at least 28 days of data exists
  return daysDiff >= 28;
}

/**
 * Retrieves the latest cached AI insights for a user
 *
 * This function fetches the most recent AI analysis from the database.
 * Returns null if no insights have been generated yet.
 *
 * @param userId - The authenticated user's ID
 * @param supabase - Supabase client instance for database access
 * @returns Promise<AIInsightsDTO | null> The latest insights or null if none exist
 * @throws Error if database query fails
 */
export async function getLatestInsights(userId: string, supabase: SupabaseClient): Promise<AIInsightsDTO | null> {
  const { data, error } = await supabase.from("ai_insights").select("id, data, generated_at, months_analyzed").eq("user_id", userId).single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    data: data.data as unknown as AIInsightsSummary,
    generated_at: data.generated_at,
    months_analyzed: data.months_analyzed as 1 | 2 | 3,
  };
}

/**
 * Checks if cached insights are still fresh (less than 24 hours old)
 *
 * This function determines whether cached insights can be reused or if
 * new analysis should be generated. The 24-hour cache helps optimize
 * AI API costs while keeping recommendations reasonably up-to-date.
 *
 * @param generatedAt - ISO timestamp of when insights were generated
 * @returns boolean True if insights are less than 24 hours old
 */
export function isCacheFresh(generatedAt: string): boolean {
  const generated = new Date(generatedAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - generated.getTime()) / (1000 * 60 * 60);
  return hoursDiff < 24;
}

/**
 * Aggregates transaction data for AI analysis
 *
 * This function retrieves and processes expense transactions over a specified period,
 * grouping them by category and calculating spending statistics. It also includes
 * budget information if the user has budgets defined.
 *
 * @param userId - The authenticated user's ID
 * @param months - Number of months to analyze (1, 2, or 3)
 * @param supabase - Supabase client instance for database access
 * @returns Promise<AggregatedTransactionData> Structured data ready for AI analysis
 * @throws Error with message "FAILED_TO_AGGREGATE_DATA" if transaction fetching fails
 */
export async function aggregateTransactionsForAI(userId: string, months: 1 | 2 | 3, supabase: SupabaseClient): Promise<AggregatedTransactionData> {
  // Step 1: Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  // Format dates as YYYY-MM-DD
  const startDateStr = startDate.toISOString().split("T")[0];
  const endDateStr = endDate.toISOString().split("T")[0];

  // Step 2: Fetch all expense transactions in period with category and budget info
  const { data: transactions, error: txError } = await supabase
    .from("transactions")
    .select(
      `
        amount,
        date,
        category_id,
        categories (
          id,
          name,
          budget_id,
          budgets (
            id,
            name,
            amount
          )
        )
      `
    )
    .eq("user_id", userId)
    .eq("type", "expense")
    .gte("date", startDateStr)
    .lte("date", endDateStr);

  if (txError) {
    throw new Error(`Database error while fetching transactions: ${txError.message}`);
  }

  if (!transactions) {
    throw new Error("FAILED_TO_AGGREGATE_DATA");
  }

  // Step 3: Calculate spending totals
  const totalSpending = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const averageMonthlySpending = totalSpending / months;

  // Step 4: Group transactions by category
  const categoryMap = new Map<
    string,
    {
      category_id: string;
      category_name: string;
      total_amount: number;
      transaction_count: number;
    }
  >();

  for (const tx of transactions) {
    const categoryId = tx.category_id || "uncategorized";
    const categoryName = tx.categories?.name || "Uncategorized";

    if (!categoryMap.has(categoryId)) {
      categoryMap.set(categoryId, {
        category_id: categoryId,
        category_name: categoryName,
        total_amount: 0,
        transaction_count: 0,
      });
    }

    const entry = categoryMap.get(categoryId);
    if (entry) {
      entry.total_amount += Number(tx.amount);
      entry.transaction_count += 1;
    }
  }

  // Step 5: Convert to array with monthly averages and sort by spending
  const categoryBreakdown = Array.from(categoryMap.values())
    .map((cat) => ({
      ...cat,
      monthly_average: cat.total_amount / months,
    }))
    .sort((a, b) => b.total_amount - a.total_amount); // Sort by total spending (descending)

  // Step 6: Extract budget information (if any)
  const budgetMap = new Map<string, { budget_name: string; budget_amount: number; category_names: string[] }>();

  for (const tx of transactions) {
    if (tx.categories?.budgets) {
      const budget = tx.categories.budgets;
      const budgetId = budget.id;

      if (!budgetMap.has(budgetId)) {
        budgetMap.set(budgetId, {
          budget_name: budget.name,
          budget_amount: Number(budget.amount),
          category_names: [],
        });
      }

      const budgetEntry = budgetMap.get(budgetId);
      if (budgetEntry && !budgetEntry.category_names.includes(tx.categories.name)) {
        budgetEntry.category_names.push(tx.categories.name);
      }
    }
  }

  const budgets = Array.from(budgetMap.values());

  // Step 7: Return aggregated data structure
  return {
    period: {
      start_date: startDateStr,
      end_date: endDateStr,
      months,
    },
    total_spending: totalSpending,
    average_monthly_spending: averageMonthlySpending,
    category_breakdown: categoryBreakdown,
    budgets: budgets.length > 0 ? budgets : undefined,
  };
}

/**
 * Calls OpenRouter/OpenAI API to generate AI insights from aggregated data
 *
 * This function sends the aggregated transaction data to the AI API with
 * a structured prompt requesting savings recommendations. The AI analyzes
 * spending patterns and returns actionable suggestions in Polish.
 *
 * @param aggregatedData - Structured transaction data for analysis
 * @returns Promise<AIInsightsSummary> AI-generated insights and recommendations
 * @throws Error with message "AI_SERVICE_ERROR" if API call fails or returns invalid data
 */
export async function callOpenAI(aggregatedData: AggregatedTransactionData): Promise<AIInsightsSummary> {
  const systemPrompt = `Jesteś ekspertem finansowym pomagającym użytkownikom aplikacji do zarządzania finansami osobistymi.

Analizuj dane o wydatkach i proponuj KONKRETNE, REALISTYCZNE sposoby oszczędzania pieniędzy.

Zasady:
- Bądź empatyczny i wspierający
- Dawaj konkretne liczby
- Sugeruj małe zmiany (łatwiejsze do wdrożenia)
- Nie krytykuj, tylko proponuj
- Uwzględniaj polskie realia (PLN, lokalne zwyczaje)
- Format odpowiedzi: JSON według podanego schematu
- Znajdź 3-5 najlepszych możliwości oszczędności
- Priorytetyzuj kategorie z największym potencjałem oszczędności`;

  const categoryList = aggregatedData.category_breakdown.map((cat) => `- ${cat.category_name}: ${cat.monthly_average.toFixed(2)} PLN/mc`).join("\n");

  const budgetList = aggregatedData.budgets
    ? aggregatedData.budgets.map((b) => `- ${b.budget_name}: ${b.budget_amount} PLN (kategorie: ${b.category_names.join(", ")})`).join("\n")
    : "Brak zdefiniowanych budżetów";

  const userPrompt = `Przeanalizuj wydatki użytkownika z ostatnich ${aggregatedData.period.months} miesięcy:

Okres: ${aggregatedData.period.start_date} - ${aggregatedData.period.end_date}
Całkowite wydatki: ${aggregatedData.total_spending.toFixed(2)} PLN
Średnio miesięcznie: ${aggregatedData.average_monthly_spending.toFixed(2)} PLN

Wydatki według kategorii:
${categoryList}

Budżety użytkownika:
${budgetList}

Znajdź 3-5 najlepszych możliwości oszczędności i wyjaśnij każdą w sposób praktyczny i motywujący.

Zwróć odpowiedź w formacie JSON zgodnie ze schematem:
{
  "analysis_period": {
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD",
    "months_analyzed": number
  },
  "total_spending": number,
  "average_monthly_spending": number,
  "total_potential_savings": number,
  "general_recommendation": "string",
  "insights": [
    {
      "id": "string",
      "category": "string",
      "current_spending": number,
      "suggested_target": number,
      "potential_savings": number,
      "priority": "high" | "medium" | "low",
      "reasoning": "string (1-2 zdania)",
      "actionable_tips": ["string", "string", ...]
    }
  ]
}`;

  try {
    const response = await openRouterClient.chat.completions.create({
      model: AI_CONFIG.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: AI_CONFIG.temperature,
      max_tokens: AI_CONFIG.maxTokens,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from AI");
    }

    const parsed = JSON.parse(content) as AIInsightsSummary;

    // Validate structure (basic validation)
    if (!parsed.insights || !Array.isArray(parsed.insights)) {
      throw new Error("Invalid AI response structure");
    }

    return parsed;
  } catch (error) {
    logger.error("OpenAI API error:", error);
    throw new Error("AI_SERVICE_ERROR");
  }
}

/**
 * Saves AI insights to database
 *
 * This function stores the generated insights in the ai_insights table.
 * Uses upsert to update existing record if one exists for the user.
 *
 * @param userId - The authenticated user's ID
 * @param insights - The AI-generated insights to save
 * @param months - Number of months analyzed (1, 2, or 3)
 * @param supabase - Supabase client instance for database access
 * @throws Error with message "FAILED_TO_SAVE_INSIGHTS" if database operation fails
 */
export async function saveInsights(userId: string, insights: AIInsightsSummary, months: 1 | 2 | 3, supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase.from("ai_insights").upsert(
    {
      user_id: userId,
      data: insights as never, // Cast to never for JSONB (Supabase expects Json type)
      months_analyzed: months,
      generated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) {
    logger.error("Failed to save insights:", error);
    throw new Error("FAILED_TO_SAVE_INSIGHTS");
  }
}

/**
 * Generates AI insights for a user or returns cached results
 *
 * This is the main orchestrator function that coordinates the entire
 * AI insights generation process. It checks data availability, manages
 * caching, aggregates transaction data, calls the AI API, and stores results.
 *
 * The function implements smart caching: if fresh insights (< 24h old) exist
 * and force_refresh is false, it returns the cached version to optimize costs.
 *
 * @param userId - The authenticated user's ID
 * @param command - Command object with months (1-3) and optional force_refresh flag
 * @param supabase - Supabase client instance for database access
 * @returns Promise<AIInsightsDTO> The generated or cached AI insights
 * @throws Error with message "INSUFFICIENT_DATA" if user doesn't have enough transactions
 * @throws Error with message "AI_SERVICE_ERROR" if AI API call fails
 * @throws Error with message "FAILED_TO_SAVE_INSIGHTS" if database save fails
 * @throws Error with message "FAILED_TO_RETRIEVE_INSIGHTS" if retrieval after save fails
 */
export async function generateInsights(userId: string, command: GenerateAIInsightsCommand, supabase: SupabaseClient): Promise<AIInsightsDTO> {
  const { months, force_refresh = false } = command;

  // Step 1: Check if user has enough data
  const hasData = await hasEnoughData(userId, supabase);
  if (!hasData) {
    throw new Error("INSUFFICIENT_DATA");
  }

  // Step 2: Check cache if not forcing refresh
  if (!force_refresh) {
    const cached = await getLatestInsights(userId, supabase);
    if (cached && isCacheFresh(cached.generated_at)) {
      return cached;
    }
  }

  // Step 3: Aggregate transaction data
  const aggregatedData = await aggregateTransactionsForAI(userId, months, supabase);

  // Step 4: Generate insights using AI
  const aiInsights = await callOpenAI(aggregatedData);

  // Step 5: Save insights to database
  await saveInsights(userId, aiInsights, months, supabase);

  // Step 6: Return fresh insights
  const result = await getLatestInsights(userId, supabase);
  if (!result) {
    throw new Error("FAILED_TO_RETRIEVE_INSIGHTS");
  }

  return result;
}
