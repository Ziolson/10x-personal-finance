import { describe, it, expect } from "vitest";
import { CreateTransactionSchema, UpdateTransactionSchema, GetTransactionsQuerySchema } from "./transaction.validators";

describe("transaction.validators", () => {
  const validUUID1 = "550e8400-e29b-41d4-a716-446655440000";
  const validUUID2 = "550e8400-e29b-41d4-a716-446655440001";
  const validUUID3 = "550e8400-e29b-41d4-a716-446655440002";

  describe("CreateTransactionSchema", () => {
    describe("Expense", () => {
      it("should validate a correct expense", () => {
        const data = {
          type: "expense",
          amount: 100.5,
          date: "2024-03-20",
          description: "Grocery shopping",
          from_account_id: validUUID1,
          category_id: validUUID2,
        };
        const result = CreateTransactionSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should fail if category_id is missing for expense", () => {
        const data = {
          type: "expense",
          amount: 100.5,
          date: "2024-03-20",
          from_account_id: validUUID1,
        };
        const result = CreateTransactionSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe("Income", () => {
      it("should validate a correct income", () => {
        const data = {
          type: "income",
          amount: 5000,
          date: "2024-03-01",
          to_account_id: validUUID1,
          category_id: validUUID2,
        };
        const result = CreateTransactionSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe("Transfer", () => {
      it("should validate a correct transfer", () => {
        const data = {
          type: "transfer",
          amount: 200,
          date: "2024-03-15",
          from_account_id: validUUID1,
          to_account_id: validUUID2,
        };
        const result = CreateTransactionSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should fail if from_account_id and to_account_id are the same", () => {
        const data = {
          type: "transfer",
          amount: 200,
          date: "2024-03-15",
          from_account_id: validUUID1,
          to_account_id: validUUID1,
        };
        const result = CreateTransactionSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Transfer source and destination accounts must be different");
        }
      });
    });

    describe("General Validation", () => {
      it("should fail for negative amount", () => {
        const data = {
          type: "expense",
          amount: -10,
          date: "2024-03-20",
          from_account_id: validUUID1,
          category_id: validUUID2,
        };
        const result = CreateTransactionSchema.safeParse(data);
        expect(result.success).toBe(false);
      });

      it("should fail for invalid date format", () => {
        const data = {
          type: "expense",
          amount: 10,
          date: "20-03-2024",
          from_account_id: validUUID1,
          category_id: validUUID2,
        };
        const result = CreateTransactionSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("UpdateTransactionSchema", () => {
    it("should validate a correct partial update", () => {
      const data = { amount: 150 };
      const result = UpdateTransactionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should fail for empty update object", () => {
      const data = {};
      const result = UpdateTransactionSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("At least one field must be provided for update");
      }
    });

    it("should allow setting fields to null if permitted", () => {
      const data = { description: null, category_id: null };
      const result = UpdateTransactionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("GetTransactionsQuerySchema", () => {
    it("should provide default values for pagination", () => {
      const result = GetTransactionsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it("should coerce string pagination parameters to numbers", () => {
      const data = { page: "2", limit: "50" };
      const result = GetTransactionsQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
      }
    });

    it("should fail for out of range pagination", () => {
      const data = { limit: "150" };
      const result = GetTransactionsQuerySchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
