/**
 * Zod validation schemas for Account-related API endpoints
 */

import { z } from "zod";

/**
 * Schema for validating CreateAccountCommand
 *
 * Validates:
 * - name: required string, min 1 character, max 100 characters
 * - initial_balance: required number, must be >= 0
 * - currency: optional string, exactly 3 characters, defaults to "PLN"
 */
export const CreateAccountSchema = z.object({
  name: z.string().min(1, "Account name is required").max(100, "Account name must be at most 100 characters").trim(),
  initial_balance: z.number().min(0, "Initial balance must be greater than or equal to 0").finite("Initial balance must be a valid number"),
  currency: z.string().length(3, "Currency must be exactly 3 characters").toUpperCase().optional().default("PLN"),
});

/**
 * Schema for validating UpdateAccountCommand
 *
 * All fields are optional (partial update)
 * Currency cannot be changed after creation
 * At least one field must be provided
 */
export const UpdateAccountSchema = z
  .object({
    name: z.string().min(1, "Account name is required").max(100, "Account name must be at most 100 characters").trim().optional(),
    initial_balance: z.number().min(0, "Initial balance must be greater than or equal to 0").finite("Initial balance must be a valid number").optional(),
  })
  .refine((data) => data.name !== undefined || data.initial_balance !== undefined, {
    message: "At least one field (name or initial_balance) must be provided",
    path: ["_form"], // Generic field path for form-level validation
  });
