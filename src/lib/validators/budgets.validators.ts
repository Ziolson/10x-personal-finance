/**
 * Zod validation schemas for Budget-related API endpoints
 */

import { z } from "zod";

/**
 * Schema for validating GetBudgetsQuery
 *
 * Validates:
 * - month: optional number (1-12)
 * - year: optional number (YYYY)
 */
export const GetBudgetsQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

/**
 * Schema for validating CreateBudgetCommand
 *
 * Validates:
 * - name: required string, min 1 character, trimmed
 * - amount: required number, positive
 * - month: required number, 1-12
 * - year: required number, YYYY
 * - category_ids: optional array of UUIDs
 */
export const CreateBudgetSchema = z.object({
  name: z.string().trim().min(1, { message: "Budget name is required" }).max(100, { message: "Budget name must be at most 100 characters" }),
  amount: z.number({ invalid_type_error: "Amount must be a number" }).positive({ message: "Amount must be positive" }),
  month: z.number().int().min(1, { message: "Month must be between 1 and 12" }).max(12, { message: "Month must be between 1 and 12" }),
  year: z.number().int().min(2000, { message: "Year must be valid (>= 2000)" }).max(2100, { message: "Year must be valid (<= 2100)" }),
  category_ids: z.array(z.string().uuid({ message: "Invalid category ID" })).optional(),
});

/**
 * Schema for validating UpdateBudgetCommand
 *
 * All fields are optional but at least one must be provided.
 * Validates:
 * - name: optional string
 * - amount: optional number
 * - category_ids: optional array of UUIDs
 */
export const UpdateBudgetSchema = z
  .object({
    name: z.string().trim().min(1, { message: "Budget name is required" }).max(100, { message: "Budget name must be at most 100 characters" }).optional(),
    amount: z.number().positive({ message: "Amount must be positive" }).optional(),
    category_ids: z.array(z.string().uuid({ message: "Invalid category ID" })).optional(),
  })
  .refine((data) => data.name !== undefined || data.amount !== undefined || data.category_ids !== undefined, {
    message: "At least one field (name, amount, or category_ids) must be provided for update.",
    path: ["_form"],
  });

/**
 * Schema for validating budgetId parameter
 */
export const BudgetIdParamSchema = z.object({
  id: z.string().uuid({ message: "Invalid budget ID format" }),
});
