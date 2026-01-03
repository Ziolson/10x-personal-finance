/**
 * Zod validation schemas for Transaction-related API endpoints
 *
 * This file contains validation schemas for:
 * - GetTransactionsQuery: Query parameters for listing transactions
 * - CreateTransactionCommand: Request body for creating transactions (discriminated union)
 * - UpdateTransactionCommand: Request body for updating transactions
 */

import { z } from "zod";

/**
 * Base schema for fields common to all transaction types
 */
const BaseTransactionSchema = z.object({
  amount: z.number().gt(0, "Amount must be greater than 0").finite("Amount must be a valid number"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  description: z.string().max(500, "Description must not exceed 500 characters").nullable().optional(),
});

/**
 * Schema for validating CreateExpenseCommand
 *
 * Validates:
 * - type: must be "expense"
 * - from_account_id: required UUID (account money comes from)
 * - category_id: required UUID (expense category)
 * - amount, date, description: inherited from BaseTransactionSchema
 */
const CreateExpenseSchema = BaseTransactionSchema.extend({
  type: z.literal("expense"),
  from_account_id: z.string().uuid("from_account_id must be a valid UUID"),
  category_id: z.string().uuid("category_id must be a valid UUID"),
});

/**
 * Schema for validating CreateIncomeCommand
 *
 * Validates:
 * - type: must be "income"
 * - to_account_id: required UUID (account money goes to)
 * - category_id: required UUID (income category)
 * - amount, date, description: inherited from BaseTransactionSchema
 */
const CreateIncomeSchema = BaseTransactionSchema.extend({
  type: z.literal("income"),
  to_account_id: z.string().uuid("to_account_id must be a valid UUID"),
  category_id: z.string().uuid("category_id must be a valid UUID"),
});

/**
 * Schema for validating CreateTransferCommand
 *
 * Validates:
 * - type: must be "transfer"
 * - from_account_id: required UUID (source account)
 * - to_account_id: required UUID (destination account)
 * - amount, date, description: inherited from BaseTransactionSchema
 * - Ensures from_account_id !== to_account_id (no self-transfers)
 */
const CreateTransferSchema = BaseTransactionSchema.extend({
  type: z.literal("transfer"),
  from_account_id: z.string().uuid("from_account_id must be a valid UUID"),
  to_account_id: z.string().uuid("to_account_id must be a valid UUID"),
});

/**
 * CreateTransactionSchema - Discriminated union for all transaction creation commands
 *
 * Uses z.discriminatedUnion to ensure type-safe validation where the 'type' field
 * determines which schema is applied. This prevents:
 * - Expense with to_account_id
 * - Income with from_account_id and to_account_id
 * - Transfer with category_id
 * - Transfer with same source and destination
 */
export const CreateTransactionSchema = z.discriminatedUnion("type", [CreateExpenseSchema, CreateIncomeSchema, CreateTransferSchema]).refine(
  (data) => {
    if (data.type === "transfer") {
      return data.from_account_id !== data.to_account_id;
    }
    return true;
  },
  {
    message: "Transfer source and destination accounts must be different",
    path: ["to_account_id"],
  }
);

/**
 * Schema for validating UpdateTransactionCommand
 *
 * All fields are optional (partial update).
 * Type-specific required fields are not enforced at schema level;
 * business logic validation happens at the service layer.
 */
export const UpdateTransactionSchema = z
  .object({
    type: z.enum(["expense", "income", "transfer"]).optional(),
    amount: z.number().gt(0, "Amount must be greater than 0").finite("Amount must be a valid number").optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .optional(),
    description: z.string().max(500, "Description must not exceed 500 characters").nullable().optional(),
    from_account_id: z.string().uuid("from_account_id must be a valid UUID").nullable().optional(),
    to_account_id: z.string().uuid("to_account_id must be a valid UUID").nullable().optional(),
    category_id: z.string().uuid("category_id must be a valid UUID").nullable().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "At least one field must be provided for update",
    path: ["_form"],
  });

/**
 * Schema for validating GetTransactionsQuery
 *
 * Validates all optional query parameters for transaction listing:
 * - page: pagination page number (min 1)
 * - limit: items per page (min 1, max 100)
 * - type: filter by transaction type
 * - accountId: filter by account (source or destination)
 * - categoryId: filter by category
 * - startDate: filter by date range start (YYYY-MM-DD)
 * - endDate: filter by date range end (YYYY-MM-DD)
 */
export const GetTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1, "Page must be at least 1").optional().default(1),
  limit: z.coerce.number().int().min(1, "Limit must be at least 1").max(100, "Limit must not exceed 100").optional().default(20),
  type: z.enum(["expense", "income", "transfer"]).optional(),
  accountId: z.string().uuid("accountId must be a valid UUID").optional(),
  categoryId: z.string().uuid("categoryId must be a valid UUID").optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "startDate must be in YYYY-MM-DD format")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "endDate must be in YYYY-MM-DD format")
    .optional(),
});
