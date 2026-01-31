import { describe, it, expect } from "vitest";
import { CreateBudgetSchema, UpdateBudgetSchema, GetBudgetsQuerySchema, BudgetIdParamSchema } from "./budgets.validators";

describe("budgets.validators", () => {
  const validUUID = "550e8400-e29b-41d4-a716-446655440000";

  describe("CreateBudgetSchema", () => {
    it("should validate a correct budget", () => {
      const data = {
        name: "Groceries",
        amount: 500,
        month: 3,
        year: 2024,
        category_ids: [validUUID],
      };
      const result = CreateBudgetSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should fail for invalid month", () => {
      const data = {
        name: "Groceries",
        amount: 500,
        month: 13,
        year: 2024,
      };
      const result = CreateBudgetSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should fail for non-positive amount", () => {
      const data = {
        name: "Groceries",
        amount: 0,
        month: 3,
        year: 2024,
      };
      const result = CreateBudgetSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("UpdateBudgetSchema", () => {
    it("should validate a correct partial update", () => {
      const data = { amount: 600 };
      const result = UpdateBudgetSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should fail if no fields are provided", () => {
      const data = {};
      const result = UpdateBudgetSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("GetBudgetsQuerySchema", () => {
    it("should validate correct query params", () => {
      const data = { month: "3", year: "2024" };
      const result = GetBudgetsQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.month).toBe(3);
        expect(result.data.year).toBe(2024);
      }
    });

    it("should fail for invalid year", () => {
      const data = { year: 1999 };
      const result = GetBudgetsQuerySchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("BudgetIdParamSchema", () => {
    it("should validate a correct UUID", () => {
      const result = BudgetIdParamSchema.safeParse({ id: validUUID });
      expect(result.success).toBe(true);
    });

    it("should fail for invalid UUID", () => {
      const result = BudgetIdParamSchema.safeParse({ id: "not-a-uuid" });
      expect(result.success).toBe(false);
    });
  });
});
