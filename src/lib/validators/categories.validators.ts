/**
 * Zod validation schemas for Category-related API endpoints
 */

import { z } from "zod";

/**
 * Schema for validating GetCategoriesQuery
 *
 * Validates:
 * - type: optional enum, must be 'income' or 'expense'
 */
export const GetCategoriesQuerySchema = z.object({
  type: z.enum(["income", "expense"]).optional(),
});

/**
 * Schema for validating CreateCategoryCommand
 *
 * Validates:
 * - name: required string, min 1 character, trimmed
 * - type: required enum, must be 'income' or 'expense'
 * - budget_id: optional UUID or null
 */
export const CreateCategorySchema = z.object({
  name: z.string().trim().min(1, { message: "Category name is required" }).max(100, { message: "Category name must be at most 100 characters" }),
  type: z.enum(["income", "expense"], {
    errorMap: () => ({ message: "Type must be either 'income' or 'expense'" }),
  }),
  budget_id: z.string().uuid().nullable().optional(),
});

/**
 * Schema for validating UpdateCategoryCommand
 *
 * All fields are optional but at least one must be provided.
 * Validates:
 * - name: optional string, min 1 character, trimmed
 * - budget_id: optional UUID or null
 */
export const UpdateCategorySchema = z
  .object({
    name: z.string().trim().min(1, { message: "Category name is required" }).max(100, { message: "Category name must be at most 100 characters" }).optional(),
    budget_id: z.string().uuid().nullable().optional(),
  })
  .refine((data) => data.name !== undefined || data.budget_id !== undefined, {
    message: "At least one field (name or budget_id) must be provided for update.",
    path: ["_form"],
  });

/**
 * Schema for validating categoryId parameter
 *
 * Validates:
 * - categoryId: required UUID
 */
export const CategoryIdParamSchema = z.object({
  categoryId: z.string().uuid({ message: "Invalid category ID format" }),
});
