/**
 * Dashboard Service
 *
 * Handles business logic for fetching aggregated data for the user dashboard.
 * - Financial Summary (Income, Expense, Balance)
 * - Expenses by Category
 * - Recent Transactions
 * - Budget Progress
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { DashboardDTO, DashboardSummary, ExpenseByCategory, TransactionDTO, BudgetProgressItem } from "../../types";

/**
 * Retrieves all data required for the dashboard
 *
 * @param client - Supabase client with user context
 * @param userId - User ID
 * @param month - Month (1-12)
 * @param year - Year (YYYY)
 * @returns Promise<DashboardDTO> Aggregated dashboard data
 */
export async function getDashboardData(client: SupabaseClient, userId: string, month: number, year: number): Promise<DashboardDTO> {
  // Step 1: Prepare date range for the selected month
  // Format: YYYY-MM-DD
  const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
  // Last day of the month
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${month.toString().padStart(2, "0")}-${lastDay}`;

  try {
    // Step 2: Execute queries in parallel
    const [summary, expensesByCategory, recentTransactions, budgetProgress] = await Promise.all([
      getSummary(client, userId, startDate, endDate),
      getExpensesByCategory(client, userId, startDate, endDate),
      getRecentTransactions(client, userId),
      getBudgetProgress(client, userId, month, year),
    ]);

    // Step 3: Return aggregated DTO
    return {
      summary,
      expense_by_category: expensesByCategory,
      recent_transactions: recentTransactions,
      budget_progress: budgetProgress,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    // eslint-disable-next-line no-console
    console.error("[DashboardService.getDashboardData] Error fetching dashboard data:", error);
    throw new Error(`Failed to fetch dashboard data: ${errorMessage}`);
  }
}

/**
 * Calculates total income, total expense, and balance for the period
 */
async function getSummary(client: SupabaseClient, userId: string, startDate: string, endDate: string): Promise<DashboardSummary> {
  const { data: transactions, error } = await client.from("transactions").select("type, amount").eq("user_id", userId).gte("date", startDate).lte("date", endDate);

  if (error) {
    throw new Error(`Failed to fetch dashboard summary: ${error.message}`);
  }

  let total_income = 0;
  let total_expense = 0;

  for (const t of transactions || []) {
    if (t.type === "income") {
      total_income += t.amount;
    } else if (t.type === "expense") {
      total_expense += t.amount;
    }
    // Transfers are neutral for overall balance change in this context
  }

  return {
    total_income,
    total_expense,
    balance: total_income - total_expense,
  };
}

/**
 * Aggregates expenses by category for the period
 */
async function getExpensesByCategory(client: SupabaseClient, userId: string, startDate: string, endDate: string): Promise<ExpenseByCategory[]> {
  // Fetch expenses with category details
  const { data: transactions, error } = await client
    .from("transactions")
    .select(
      `
      amount,
      categories (
        name
      )
    `
    )
    .eq("user_id", userId)
    .eq("type", "expense")
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) {
    throw new Error(`Failed to fetch expense breakdown: ${error.message}`);
  }

  const categoryMap = new Map<string, number>();
  let totalExpenses = 0;

  // Aggregate
  for (const t of transactions || []) {
    // @ts-ignore - Supabase type inference for joined tables can be tricky
    const categoryName = t.categories?.name || "Uncategorized";
    const current = categoryMap.get(categoryName) || 0;
    categoryMap.set(categoryName, current + t.amount);
    totalExpenses += t.amount;
  }

  // Format result
  const result: ExpenseByCategory[] = [];
  for (const [name, amount] of categoryMap.entries()) {
    result.push({
      category_name: name,
      amount,
      percentage: totalExpenses > 0 ? Number(((amount / totalExpenses) * 100).toFixed(1)) : 0,
    });
  }

  // Sort by amount desc
  return result.sort((a, b) => b.amount - a.amount);
}

/**
 * Fetches the 5 most recent transactions
 */
async function getRecentTransactions(client: SupabaseClient, userId: string): Promise<TransactionDTO[]> {
  const { data, error } = await client
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false }) // Secondary sort for stable order
    .limit(5);

  if (error) {
    throw new Error(`Failed to fetch recent transactions: ${error.message}`);
  }

  // Map to DTO (omit user_id, updated_at)
  return (data || []).map((t) => ({
    id: t.id,
    amount: t.amount,
    date: t.date,
    description: t.description,
    type: t.type,
    category_id: t.category_id,
    from_account_id: t.from_account_id,
    to_account_id: t.to_account_id,
    created_at: t.created_at,
  }));
}

/**
 * Fetches budget progress from the budget_progress view
 */
async function getBudgetProgress(client: SupabaseClient, userId: string, month: number, year: number): Promise<BudgetProgressItem[]> {
  const { data, error } = await client.from("budget_progress").select("*").eq("user_id", userId).eq("month", month).eq("year", year);

  if (error) {
    throw new Error(`Failed to fetch budget progress: ${error.message}`);
  }

  // Map DB Type to DTO Type
  return (data || []).map((b) => ({
    budget_id: b.budget_id!,
    budget_name: b.budget_name!,
    budget_amount: b.budget_amount!,
    spent_amount: b.spent_amount!,
    remaining_amount: b.remaining_amount!,
    percentage_used: b.percentage_used!,
  }));
}
