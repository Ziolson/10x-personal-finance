import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransactionItem } from "./TransactionItem";
import React from "react";
import type { TransactionDTO } from "@/types";

describe("TransactionItem", () => {
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

  it("renders transaction description and formatted date", () => {
    render(<TransactionItem transaction={baseTransaction} />);
    expect(screen.getByText("Test Transaction")).toBeInTheDocument();
    // 15 Jan in Polish is "15 sty" (approx)
    expect(screen.getByText(/15/)).toBeInTheDocument();
  });

  it("adds minus sign and red color for expenses", () => {
    render(<TransactionItem transaction={baseTransaction} />);
    const amountDiv = screen.getByText(/-.*100/);
    expect(amountDiv).toBeInTheDocument();
    expect(amountDiv).toHaveClass("text-red-600");
  });

  it("adds plus sign and green color for income", () => {
    const incomeTransaction: TransactionDTO = { ...baseTransaction, type: "income" };
    render(<TransactionItem transaction={incomeTransaction} />);
    const amountDiv = screen.getByText(/\+.*100/);
    expect(amountDiv).toBeInTheDocument();
    expect(amountDiv).toHaveClass("text-green-600");
  });

  it("shows category name if provided", () => {
    render(<TransactionItem transaction={baseTransaction} categoryName="Food" />);
    expect(screen.getByText(/Food/)).toBeInTheDocument();
  });
});
