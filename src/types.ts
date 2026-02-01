/**
 * Type definitions for DTOs (Data Transfer Objects) and Command Models
 *
 * This file contains all the types used for API requests and responses.
 * All types are derived from the database models to ensure type safety
 * and consistency between the database layer and the API layer.
 */

import type { Tables, Enums } from "./db/database.types";

// =============================================================================
// Database Entity Types (Re-exports for convenience)
// =============================================================================

export type Account = Tables<"accounts">;
export type Category = Tables<"categories">;
export type Budget = Tables<"budgets">;
export type Transaction = Tables<"transactions">;
export type Profile = Tables<"profiles">;

export type AccountBalance = Tables<"account_balances">;
export type BudgetProgress = Tables<"budget_progress">;

export type CategoryType = Enums<"category_type">;
export type TransactionType = Enums<"transaction_type">;

// =============================================================================
// Account DTOs and Commands
// =============================================================================

/**
 * Account DTO - Response type for account endpoints
 * Extends the base account entity with calculated current_balance
 * Omits user_id for security reasons (handled by RLS)
 */
export interface AccountDTO extends Omit<Account, "user_id"> {
  current_balance: number;
}

/**
 * Form view model used by the client-side account form.
 */
export interface AccountFormViewModel {
  name: string;
  initial_balance: number;
}

/**
 * Create Account Command - Request payload for creating a new account
 * Only requires fields that the user must provide
 */
export interface CreateAccountCommand {
  name: string;
  initial_balance: number;
  currency?: string; // Optional, defaults to PLN
}

/**
 * Update Account Command - Request payload for updating an account
 * All fields are optional (partial update)
 * Currency cannot be changed after creation
 */
export interface UpdateAccountCommand {
  name?: string;
  initial_balance?: number;
}

// =============================================================================
// Category DTOs and Commands
// =============================================================================

/**
 * Category DTO - Response type for category endpoints
 * Omits user_id for security reasons (handled by RLS)
 */
export type CategoryDTO = Omit<Category, "user_id">;

/**
 * Create Category Command - Request payload for creating a new category
 */
export interface CreateCategoryCommand {
  name: string;
  type: CategoryType;
  budget_id?: string | null;
}

/**
 * Update Category Command - Request payload for updating a category
 * Category type cannot be changed after creation
 */
export interface UpdateCategoryCommand {
  name?: string;
  budget_id?: string | null;
}

/**
 * Get Categories Query - Query parameters for filtering categories
 */
export interface GetCategoriesQuery {
  type?: CategoryType;
}

// =============================================================================
// Transaction DTOs and Commands
// =============================================================================

/**
 * Transaction DTO - Response type for transaction endpoints
 * Omits user_id for security and updated_at as it's not needed in responses
 */
export type TransactionDTO = Omit<Transaction, "user_id" | "updated_at">;

/**
 * Base fields common to all transaction types
 */
interface BaseTransactionCommand {
  amount: number;
  date: string; // ISO date string (YYYY-MM-DD)
  description?: string | null;
}

/**
 * Create Expense Command - Request payload for creating an expense transaction
 * Requires from_account_id and category_id
 */
export interface CreateExpenseCommand extends BaseTransactionCommand {
  type: "expense";
  from_account_id: string;
  category_id: string;
}

/**
 * Create Income Command - Request payload for creating an income transaction
 * Requires to_account_id and category_id
 */
export interface CreateIncomeCommand extends BaseTransactionCommand {
  type: "income";
  to_account_id: string;
  category_id: string;
}

/**
 * Create Transfer Command - Request payload for creating a transfer transaction
 * Requires both from_account_id and to_account_id (must be different)
 */
export interface CreateTransferCommand extends BaseTransactionCommand {
  type: "transfer";
  from_account_id: string;
  to_account_id: string;
}

/**
 * Create Transaction Command - Union type for all transaction creation commands
 * The discriminated union on 'type' ensures type safety for required fields
 */
export type CreateTransactionCommand = CreateExpenseCommand | CreateIncomeCommand | CreateTransferCommand;

/**
 * Update Transaction Command - Request payload for updating a transaction
 * All fields are optional (partial update)
 * Type-specific required fields are not enforced here (handled by business logic)
 */
export interface UpdateTransactionCommand {
  type?: TransactionType;
  amount?: number;
  date?: string;
  description?: string | null;
  from_account_id?: string | null;
  to_account_id?: string | null;
  category_id?: string | null;
}

/**
 * Get Transactions Query - Query parameters for filtering and paginating transactions
 */
export interface GetTransactionsQuery {
  page?: number;
  limit?: number;
  type?: TransactionType;
  accountId?: string;
  categoryId?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

// =============================================================================
// Budget DTOs and Commands
// =============================================================================

/**
 * Budget DTO - Response type for budget endpoints
 * Extends the base budget entity with an array of associated category IDs
 * Omits user_id and updated_at
 */
export interface BudgetDTO extends Omit<Budget, "user_id" | "updated_at"> {
  categories: string[]; // Array of category IDs
  spent_amount?: number;
  remaining_amount?: number;
  percentage_used?: number;
}

/**
 * Create Budget Command - Request payload for creating a new budget
 */
export interface CreateBudgetCommand {
  name: string;
  amount: number;
  month: number; // 1-12
  year: number; // YYYY
  category_ids?: string[];
}

/**
 * Update Budget Command - Request payload for updating a budget
 * Month and year cannot be changed after creation
 */
export interface UpdateBudgetCommand {
  name?: string;
  amount?: number;
  category_ids?: string[];
}

/**
 * Get Budgets Query - Query parameters for filtering budgets
 */
export interface GetBudgetsQuery {
  month?: number;
  year?: number;
}

// =============================================================================
// Dashboard DTOs and Commands
// =============================================================================

/**
 * Dashboard Summary - High-level financial summary for a period
 */
export interface DashboardSummary {
  total_income: number;
  total_expense: number;
  balance: number;
}

/**
 * Expense By Category - Breakdown of expenses by category
 */
export interface ExpenseByCategory {
  category_name: string;
  amount: number;
  percentage: number;
}

/**
 * Budget Progress Item - Budget utilization information
 * Derived from the budget_progress database view
 */
export interface BudgetProgressItem {
  budget_id: string;
  budget_name: string;
  budget_amount: number;
  spent_amount: number;
  remaining_amount: number;
  percentage_used: number;
}

/**
 * Dashboard DTO - Response type for dashboard endpoint
 * Aggregates multiple data sources for a comprehensive overview
 */
export interface DashboardDTO {
  summary: DashboardSummary;
  expense_by_category: ExpenseByCategory[];
  recent_transactions: TransactionDTO[];
  budget_progress: BudgetProgressItem[];
}

/**
 * Get Dashboard Query - Query parameters for dashboard data
 */
export interface GetDashboardQuery {
  month?: number; // Defaults to current month
  year?: number; // Defaults to current year
}

// =============================================================================
// Pagination
// =============================================================================

/**
 * Pagination Info - Metadata for paginated responses
 */
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

/**
 * Paginated Response - Generic wrapper for paginated data
 * Used by endpoints that return lists with pagination
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

// =============================================================================
// API Response Types (Convenience types for specific endpoints)
// =============================================================================

export type GetAccountsResponse = AccountDTO[];
export type GetAccountResponse = AccountDTO;
export type CreateAccountResponse = AccountDTO;
export type UpdateAccountResponse = AccountDTO;

export type GetCategoriesResponse = CategoryDTO[];
export type GetCategoryResponse = CategoryDTO;
export type CreateCategoryResponse = CategoryDTO;
export type UpdateCategoryResponse = CategoryDTO;

export type GetTransactionsResponse = PaginatedResponse<TransactionDTO>;
export type GetTransactionResponse = TransactionDTO;
export type CreateTransactionResponse = TransactionDTO;
export type UpdateTransactionResponse = TransactionDTO;

export type GetBudgetsResponse = BudgetDTO[];
export type GetBudgetResponse = BudgetDTO;
export type CreateBudgetResponse = BudgetDTO;
export type UpdateBudgetResponse = BudgetDTO;

export type GetDashboardResponse = DashboardDTO;

// =============================================================================
// Error Response Types
// =============================================================================

/**
 * API Error Response - Standard error response structure
 */
export interface ApiErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

/**
 * Validation Error - Error response for validation failures
 */
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationErrorResponse {
  error: {
    message: string;
    code: "VALIDATION_ERROR";
    details: ValidationError[];
  };
}

// =============================================================================
// AI Insights Types
// =============================================================================

/**
 * AI Insight Entity - Re-export from database types
 */
export type AIInsightEntity = Tables<"ai_insights">;

/**
 * Single AI insight recommendation for a specific category
 */
export interface AIInsight {
  id: string;
  category: string;
  category_id?: string; // Optional reference to categories table (not enforced)
  current_spending: number;
  suggested_target: number;
  potential_savings: number;
  priority: "high" | "medium" | "low";
  reasoning: string;
  actionable_tips: string[];
}

/**
 * Analysis period metadata
 */
export interface AIAnalysisPeriod {
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  months_analyzed: 1 | 2 | 3;
}

/**
 * Complete AI insights summary structure (stored in JSONB)
 */
export interface AIInsightsSummary {
  analysis_period: AIAnalysisPeriod;
  total_spending: number;
  average_monthly_spending: number;
  total_potential_savings: number;
  general_recommendation: string;
  insights: AIInsight[];
  confidence_score?: number; // Optional 0-100
}

/**
 * AI Insights DTO - Response type for AI insights endpoints
 * Omits user_id for security reasons (handled by RLS)
 */
export interface AIInsightsDTO {
  id: string;
  data: AIInsightsSummary;
  generated_at: string;
  months_analyzed: 1 | 2 | 3;
}

/**
 * Generate AI Insights Command - Request payload for generating new insights
 */
export interface GenerateAIInsightsCommand {
  months: 1 | 2 | 3;
  force_refresh?: boolean; // Optional flag to bypass cache
}

/**
 * Aggregated transaction data for AI analysis (input for OpenAI)
 */
export interface AggregatedTransactionData {
  period: {
    start_date: string;
    end_date: string;
    months: number;
  };
  total_spending: number;
  average_monthly_spending: number;
  category_breakdown: {
    category_id: string;
    category_name: string;
    total_amount: number;
    monthly_average: number;
    transaction_count: number;
  }[];
  budgets?: {
    budget_name: string;
    budget_amount: number;
    category_names: string[];
  }[];
}

// =============================================================================
// AI Insights Response Types
// =============================================================================

export type GetLatestInsightsResponse = AIInsightsDTO;
export type GenerateInsightsResponse = AIInsightsDTO;
