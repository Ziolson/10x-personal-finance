import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TransactionsMobileList from "./TransactionsMobileList";
import React from "react";
import type { TransactionDTO, AccountDTO, CategoryDTO } from "@/types";

describe("TransactionsMobileList", () => {
  const baseTransaction: TransactionDTO = {
    id: "1",
    amount: 100,
    date: "2024-01-15T12:00:00Z",
    description: "Test Transaction",
    type: "expense",
    from_account_id: "acc1",
    to_account_id: null,
    category_id: "cat1",
    created_at: "2024-01-15T12:00:00Z",
  };

  const accounts: AccountDTO[] = [
    {
      id: "acc1",
      name: "Konto Główne",
      // type: "checking", // Removed extra property not in AccountDTO
      current_balance: 1000,
      created_at: "2024-01-01",
      currency: "PLN", // Added required or optional property if needed? No, AccountDTO is Omit<Account, "user_id"> + current_balance.
      // Let's check db types if needed, but error says 'type' does not exist.
      // Account likely has: id, name, currency, initial_balance, created_at, updated_at
      initial_balance: 0,
      updated_at: "2024-01-01", // Added potentially missing property
    },
  ];

  const categories: CategoryDTO[] = [
    {
      id: "cat1",
      name: "Jedzenie",
      type: "expense",
      created_at: "2024-01-01",
      // Added missing properties based on error: budget_id, updated_at
      budget_id: null,
      updated_at: "2024-01-01",
    },
  ];

  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  it("renders transaction details correctly", () => {
    render(<TransactionsMobileList transactions={[baseTransaction]} accounts={accounts} categories={categories} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByText("Test Transaction")).toBeInTheDocument();
    expect(screen.getByText("Konto Główne")).toBeInTheDocument();
    expect(screen.getByText("Jedzenie")).toBeInTheDocument();
  });

  it("renders action button with accessible label", () => {
    render(<TransactionsMobileList transactions={[baseTransaction]} accounts={accounts} categories={categories} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    // This is expected to fail initially or we check for it
    // The label we want to add is "Otwórz menu akcji"
    const actionButton = screen.getByRole("button", { name: /Otwórz menu akcji/i });
    expect(actionButton).toBeInTheDocument();
  });
});
