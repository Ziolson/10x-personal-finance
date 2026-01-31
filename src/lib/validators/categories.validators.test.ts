import { describe, it, expect } from "vitest";
import { CreateCategorySchema, UpdateCategorySchema, GetCategoriesQuerySchema, CategoryIdParamSchema } from "./categories.validators";

describe("categories.validators", () => {
  const validUUID = "550e8400-e29b-41d4-a716-446655440000";

  describe("CreateCategorySchema", () => {
    it("should validate a correct category", () => {
      const data = {
        name: "Dining Out",
        type: "expense",
        budget_id: validUUID,
      };
      const result = CreateCategorySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should fail for invalid type", () => {
      const data = {
        name: "Dining Out",
        type: "other",
      };
      const result = CreateCategorySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should allow null budget_id", () => {
      const data = {
        name: "Salary",
        type: "income",
        budget_id: null,
      };
      const result = CreateCategorySchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("UpdateCategorySchema", () => {
    it("should validate a correct partial update", () => {
      const data = { name: "Updated Name" };
      const result = UpdateCategorySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should fail if no fields are provided", () => {
      const data = {};
      const result = UpdateCategorySchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("GetCategoriesQuerySchema", () => {
    it("should validate correct query params", () => {
      const data = { type: "expense" };
      const result = GetCategoriesQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should fail for invalid type", () => {
      const data = { type: "invalid" };
      const result = GetCategoriesQuerySchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("CategoryIdParamSchema", () => {
    it("should validate a correct UUID", () => {
      const result = CategoryIdParamSchema.safeParse({ categoryId: validUUID });
      expect(result.success).toBe(true);
    });

    it("should fail for invalid UUID", () => {
      const result = CategoryIdParamSchema.safeParse({ categoryId: "not-a-uuid" });
      expect(result.success).toBe(false);
    });
  });
});
