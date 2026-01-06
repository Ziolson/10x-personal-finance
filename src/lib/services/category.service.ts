/**
 * Category Service
 *
 * Handles business logic for category operations including:
 * - Creating new categories
 * - Fetching categories with optional type filtering
 * - Checking for duplicate category names
 * - Updating category data
 * - Deleting categories
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateCategoryCommand, CategoryDTO, UpdateCategoryCommand, GetCategoriesQuery } from "../../types";

/**
 * Fetches all categories for a user with optional type filtering
 *
 * @param userId - The authenticated user's ID
 * @param supabase - Supabase client instance
 * @param query - Optional query filters (e.g., type: 'income' | 'expense')
 * @returns Promise<CategoryDTO[]> Array of categories
 * @throws Error if database query fails
 * @example
 * const categories = await getCategories(userId, supabase);
 * const expenseCategories = await getCategories(userId, supabase, { type: 'expense' });
 */
export async function getCategories(userId: string, supabase: SupabaseClient, query?: GetCategoriesQuery): Promise<CategoryDTO[]> {
  // Step 1: Build query to fetch user's categories
  let queryBuilder = supabase.from("categories").select("id, name, type, budget_id, created_at, updated_at").eq("user_id", userId);

  // Step 2: Apply optional type filter
  if (query?.type) {
    queryBuilder = queryBuilder.eq("type", query.type);
  }

  // Step 3: Order by creation date (newest first)
  queryBuilder = queryBuilder.order("created_at", { ascending: false });

  const { data: categories, error } = await queryBuilder;

  if (error) {
    throw new Error(`Database error while fetching categories: ${error.message}`);
  }

  if (!categories || categories.length === 0) {
    return [];
  }

  // Step 4: Transform to CategoryDTO format (omit user_id)
  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    type: category.type,
    budget_id: category.budget_id,
    created_at: category.created_at,
    updated_at: category.updated_at,
  }));
}

/**
 * Creates a new category for a user
 *
 * @param command - The category creation data
 * @param userId - The authenticated user's ID
 * @param supabase - Supabase client instance
 * @returns Promise<CategoryDTO> The newly created category
 * @throws Error if category name already exists or database operation fails
 */
export async function createCategory(command: CreateCategoryCommand, userId: string, supabase: SupabaseClient): Promise<CategoryDTO> {
  // Step 1: Check if category with this name already exists for the user
  const { data: existingCategory, error: checkError } = await supabase.from("categories").select("id").eq("user_id", userId).eq("name", command.name).maybeSingle();

  if (checkError) {
    throw new Error(`Database error while checking for existing category: ${checkError.message}`);
  }

  if (existingCategory) {
    throw new Error("CATEGORY_NAME_EXISTS");
  }

  // Step 2: Insert new category
  const { data: newCategory, error: insertError } = await supabase
    .from("categories")
    .insert({
      user_id: userId,
      name: command.name,
      type: command.type,
      budget_id: command.budget_id ?? null,
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Database error while creating category: ${insertError.message}`);
  }

  if (!newCategory) {
    throw new Error("Failed to create category: no data returned");
  }

  // Step 3: Transform to CategoryDTO
  const categoryDTO: CategoryDTO = {
    id: newCategory.id,
    name: newCategory.name,
    type: newCategory.type,
    budget_id: newCategory.budget_id,
    created_at: newCategory.created_at,
    updated_at: newCategory.updated_at,
  };

  return categoryDTO;
}

/**
 * Fetches a single category by ID
 *
 * This is a private helper function used to verify category existence and ownership.
 *
 * @param categoryId - The category ID to fetch (UUID)
 * @param userId - The authenticated user's ID (ensures authorization)
 * @param supabase - Supabase client instance
 * @returns Promise<CategoryDTO | null> The category, or null if not found
 * @throws Error if database query fails
 */
export async function getCategoryById(categoryId: string, userId: string, supabase: SupabaseClient): Promise<CategoryDTO | null> {
  // Step 1: Fetch the category by ID and user_id (authorization check)
  const { data: category, error } = await supabase
    .from("categories")
    .select("id, name, type, budget_id, created_at, updated_at")
    .eq("id", categoryId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Database error while fetching category: ${error.message}`);
  }

  // Category not found or doesn't belong to user
  if (!category) {
    return null;
  }

  // Step 2: Transform to CategoryDTO
  const categoryDTO: CategoryDTO = {
    id: category.id,
    name: category.name,
    type: category.type,
    budget_id: category.budget_id,
    created_at: category.created_at,
    updated_at: category.updated_at,
  };

  return categoryDTO;
}

/**
 * Updates an existing category
 *
 * @param categoryId - The category ID to update (UUID)
 * @param userId - The authenticated user's ID (ensures authorization)
 * @param data - The update command with optional name and budget_id
 * @param supabase - Supabase client instance
 * @returns Promise<CategoryDTO> The updated category
 * @throws Error if category not found or if duplicate name is detected
 */
export async function updateCategory(categoryId: string, userId: string, data: UpdateCategoryCommand, supabase: SupabaseClient): Promise<CategoryDTO> {
  // Step 1: Verify category exists and belongs to user
  const { data: existingCategory, error: checkError } = await supabase.from("categories").select("id, name").eq("id", categoryId).eq("user_id", userId).maybeSingle();

  if (checkError) {
    throw new Error(`Database error while checking category: ${checkError.message}`);
  }

  if (!existingCategory) {
    throw new Error("NOT_FOUND");
  }

  // Step 2: If updating name, check for duplicates
  if (data.name !== undefined) {
    const { data: duplicateCategory, error: dupError } = await supabase
      .from("categories")
      .select("id")
      .eq("user_id", userId)
      .eq("name", data.name)
      .neq("id", categoryId)
      .maybeSingle();

    if (dupError) {
      throw new Error(`Database error while checking for duplicate name: ${dupError.message}`);
    }

    if (duplicateCategory) {
      throw new Error("CATEGORY_NAME_EXISTS");
    }
  }

  // Step 3: Update the category with only provided fields
  const updatePayload: Record<string, unknown> = {};
  if (data.name !== undefined) updatePayload.name = data.name;
  if (data.budget_id !== undefined) updatePayload.budget_id = data.budget_id;

  const { data: updatedCategory, error: updateError } = await supabase.from("categories").update(updatePayload).eq("id", categoryId).eq("user_id", userId).select().single();

  if (updateError) {
    throw new Error(`Database error while updating category: ${updateError.message}`);
  }

  if (!updatedCategory) {
    throw new Error("Failed to update category: no data returned");
  }

  // Step 4: Transform to CategoryDTO
  const categoryDTO: CategoryDTO = {
    id: updatedCategory.id,
    name: updatedCategory.name,
    type: updatedCategory.type,
    budget_id: updatedCategory.budget_id,
    created_at: updatedCategory.created_at,
    updated_at: updatedCategory.updated_at,
  };

  return categoryDTO;
}

/**
 * Deletes a category
 *
 * Note: If there are transactions associated with the category, the deletion will fail
 * with a RESTRICT constraint error. This is enforced at the database level.
 *
 * @param categoryId - The category ID to delete (UUID)
 * @param userId - The authenticated user's ID (ensures authorization)
 * @param supabase - Supabase client instance
 * @throws Error if category not found or database operation fails (including RESTRICT constraint violations)
 */
export async function deleteCategory(categoryId: string, userId: string, supabase: SupabaseClient): Promise<void> {
  const { data, error: deleteError } = await supabase.from("categories").delete().eq("id", categoryId).eq("user_id", userId).select("id");

  if (deleteError) {
    if (deleteError.message.includes("violates foreign key constraint")) {
      throw new Error("CATEGORY_HAS_TRANSACTIONS");
    }
    throw new Error(`Database error while deleting category: ${deleteError.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error("NOT_FOUND");
  }
}
