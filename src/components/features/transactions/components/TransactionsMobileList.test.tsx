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

  const accounts: AccountDTO[] = [{ id: "acc1", name: "Konto Główne", type: "checking", current_balance: 1000, created_at: "2024-01-01" }];

  const categories: CategoryDTO[] = [{ id: "cat1", name: "Jedzenie", type: "expense", created_at: "2024-01-01" }];

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
