import { describe, it, expect } from "vitest";
import { CreateAccountSchema, UpdateAccountSchema } from "./account.validators";

describe("account.validators", () => {
  describe("CreateAccountSchema", () => {
    it("should validate a correct account", () => {
      const data = {
        name: "Main Savings",
        initial_balance: 1000,
        currency: "USD",
      };
      const result = CreateAccountSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currency).toBe("USD");
      }
    });

    it("should use default currency PLN and uppercase it", () => {
      const data = {
        name: "Wallet",
        initial_balance: 50,
      };
      const result = CreateAccountSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currency).toBe("PLN");
      }
    });

    it("should fail for negative initial balance", () => {
      const data = {
        name: "Debt",
        initial_balance: -100,
      };
      const result = CreateAccountSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should fail for too long name", () => {
      const data = {
        name: "a".repeat(101),
        initial_balance: 0,
      };
      const result = CreateAccountSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("UpdateAccountSchema", () => {
    it("should validate a correct partial update", () => {
      const data = { name: "New Name" };
      const result = UpdateAccountSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should fail if no fields are provided", () => {
      const data = {};
      const result = UpdateAccountSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
