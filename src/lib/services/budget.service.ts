/**
 * Budget Service
 *
 * Handles business logic for budget operations including:
 * - Creating new budgets and linking categories
 * - Fetching budgets with optional filtering
 * - Updating budgets and managing category associations
 * - Deleting budgets
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateBudgetCommand, UpdateBudgetCommand, BudgetDTO, GetBudgetsQuery } from "../../types";
import logger from "../logger";

/**
 * Fetches all budgets for a user with optional month/year filtering
 *
 * @param userId - The authenticated user's ID
 * @param supabase - Supabase client instance
 * @param query - Optional query filters (month, year)
 * @returns Promise<BudgetDTO[]> Array of budgets
 */
export async function getBudgets(userId: string, supabase: SupabaseClient, query?: GetBudgetsQuery): Promise<BudgetDTO[]> {
  // Step 1: Build query from the budget_progress view
  let queryBuilder = supabase.from("budget_progress").select("*").eq("user_id", userId);

  // Step 2: Apply filters
  if (query?.month) {
    queryBuilder = queryBuilder.eq("month", query.month);
  }
  if (query?.year) {
    queryBuilder = queryBuilder.eq("year", query.year);
  }

  // Step 3: Order by year, month (descending), then budget_name
  queryBuilder = queryBuilder.order("year", { ascending: false }).order("month", { ascending: false }).order("budget_name");

  const { data: budgets, error } = await queryBuilder;

  if (error) {
    throw new Error(`Database error while fetching budgets: ${error.message}`);
  }

  if (!budgets || budgets.length === 0) {
    return [];
  }

  // Step 4: Transform to BudgetDTO
  return budgets.map((bp) => ({
    id: bp.budget_id || "",
    name: bp.budget_name || "",
    amount: bp.budget_amount || 0,
    month: bp.month || 1,
    year: bp.year || 2024,
    created_at: bp.created_at || new Date().toISOString(),
    categories: Array.isArray(bp.category_ids) ? bp.category_ids : [],
    spent_amount: bp.spent_amount || 0,
    remaining_amount: bp.remaining_amount || bp.budget_amount || 0,
    percentage_used: bp.percentage_used || 0,
  }));
}

/**
 * Creates a new budget for a user
 *
 * @param command - The budget creation data
 * @param userId - The authenticated user's ID
 * @param supabase - Supabase client instance
 * @returns Promise<BudgetDTO> The newly created budget
 */
export async function createBudget(command: CreateBudgetCommand, userId: string, supabase: SupabaseClient): Promise<BudgetDTO> {
  // Step 1: Check for duplicate budget (name + month + year)
  const { data: existingBudget, error: checkError } = await supabase
    .from("budgets")
    .select("id")
    .eq("user_id", userId)
    .eq("name", command.name)
    .eq("month", command.month)
    .eq("year", command.year)
    .maybeSingle();

  if (checkError) {
    throw new Error(`Database error while checking for existing budget: ${checkError.message}`);
  }

  if (existingBudget) {
    throw new Error("BUDGET_ALREADY_EXISTS");
  }

  // Step 2: Create budget
  const { data: newBudget, error: insertError } = await supabase
    .from("budgets")
    .insert({
      user_id: userId,
      name: command.name,
      amount: command.amount,
      month: command.month,
      year: command.year,
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Database error while creating budget: ${insertError.message}`);
  }

  if (!newBudget) {
    throw new Error("Failed to create budget");
  }

  // Step 3: Link categories if provided
  if (command.category_ids && command.category_ids.length > 0) {
    const { error: linkError } = await supabase.from("categories").update({ budget_id: newBudget.id }).in("id", command.category_ids).eq("user_id", userId);

    if (linkError) {
      logger.error("Failed to link categories to budget", linkError);
      // We continue as the budget itself was created successfully.
    }
  }

  // Step 4: Return fresh DTO with progress data
  // Since new budget has 0 progress, we can return it manually but the easiest way
  // to get consistent formatting (and ensure categories are correctly mapped) is to fetch it.
  const budgetDTO = await getBudgetById(newBudget.id, userId, supabase);
  if (!budgetDTO) throw new Error("Failed to retrieve newly created budget");

  return budgetDTO;
}

/**
 * Gets a budget by ID helper
 */
export async function getBudgetById(budgetId: string, userId: string, supabase: SupabaseClient): Promise<BudgetDTO | null> {
  const { data: bp, error } = await supabase.from("budget_progress").select("*").eq("budget_id", budgetId).eq("user_id", userId).maybeSingle();

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  if (!bp) return null;

  return {
    id: bp.budget_id || "",
    name: bp.budget_name || "",
    amount: bp.budget_amount || 0,
    month: bp.month || 1,
    year: bp.year || 2024,
    created_at: bp.created_at || new Date().toISOString(),
    categories: Array.isArray(bp.category_ids) ? (bp.category_ids as string[]) : [],
    spent_amount: bp.spent_amount || 0,
    remaining_amount: bp.remaining_amount || bp.budget_amount || 0,
    percentage_used: bp.percentage_used || 0,
  };
}

/**
 * Updates a budget
 */
export async function updateBudget(budgetId: string, userId: string, data: UpdateBudgetCommand, supabase: SupabaseClient): Promise<BudgetDTO> {
  // Step 1: Verify budget exists
  const existingDTO = await getBudgetById(budgetId, userId, supabase);
  if (!existingDTO) {
    throw new Error("NOT_FOUND");
  }

  // Step 2: Check name uniqueness if changed
  if (data.name !== undefined && data.name !== existingDTO.name) {
    const { data: duplicate, error: dupError } = await supabase
      .from("budgets")
      .select("id")
      .eq("user_id", userId)
      .eq("name", data.name)
      .eq("month", existingDTO.month)
      .eq("year", existingDTO.year)
      .neq("id", budgetId)
      .maybeSingle();

    if (dupError) throw new Error(dupError.message);
    if (duplicate) throw new Error("BUDGET_ALREADY_EXISTS");
  }

  // Step 3: Update fields
  const updatePayload: { name?: string; amount?: number } = {};
  if (data.name !== undefined) updatePayload.name = data.name;
  if (data.amount !== undefined) updatePayload.amount = data.amount;

  if (Object.keys(updatePayload).length > 0) {
    const { error: updateError } = await supabase.from("budgets").update(updatePayload).eq("id", budgetId).eq("user_id", userId);

    if (updateError) throw new Error(updateError.message);
  }

  // Handle category associations by unlinking current and linking new ones
  if (data.category_ids !== undefined) {
    // Unlink all old ones
    const { error: unlinkError } = await supabase.from("categories").update({ budget_id: null }).eq("budget_id", budgetId).eq("user_id", userId);

    if (unlinkError) throw new Error(`Unlink categories error: ${unlinkError.message}`);

    // Link new ones
    if (data.category_ids.length > 0) {
      const { error: linkError } = await supabase.from("categories").update({ budget_id: budgetId }).in("id", data.category_ids).eq("user_id", userId);

      if (linkError) throw new Error(`Link categories error: ${linkError.message}`);
    }
  }

  // Step 5: Return updated DTO
  // Re-fetch to be sure
  const updated = await getBudgetById(budgetId, userId, supabase);
  if (!updated) throw new Error("Failed to retrieve updated budget");
  return updated;
}

/**
 * Deletes a budget and unlinks associated categories
 *
 * @param budgetId - ID of the budget to delete
 * @param userId - ID of the user owning the budget
 * @param supabase - Supabase client instance
 * @throws Error with message "NOT_FOUND" if budget doesn't exist
 */
export async function deleteBudget(budgetId: string, userId: string, supabase: SupabaseClient): Promise<void> {
  const { data, error } = await supabase.from("budgets").delete().eq("id", budgetId).eq("user_id", userId).select("id");

  if (error) {
    throw new Error(`Database error while deleting budget: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error("NOT_FOUND");
  }
}
