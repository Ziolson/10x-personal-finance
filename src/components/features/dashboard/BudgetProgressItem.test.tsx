import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BudgetProgressItem } from "./BudgetProgressItem";
import React from "react";

describe("BudgetProgressItem", () => {
  const defaultItem = {
    budget_id: "1",
    budget_name: "Food",
    budget_amount: 1000,
    spent_amount: 500,
    remaining_amount: 500,
    percentage_used: 50,
    month: 1,
    year: 2024,
  };

  it("renders budget name and formatted currency", () => {
    render(<BudgetProgressItem item={defaultItem} />);

    expect(screen.getByText("Food")).toBeInTheDocument();
    // Currency format might vary slightly by environment, but "500,00" or "500" should be there
    // In pl-PL it should be "500 zł" or similar
    expect(screen.getByText(/500/)).toBeInTheDocument();
    expect(screen.getByText(/1\s*000/)).toBeInTheDocument();
  });

  it("shows percentage used", () => {
    render(<BudgetProgressItem item={defaultItem} />);
    expect(screen.getByText("50.0%")).toBeInTheDocument();
  });

  it("applies green color for usage < 80%", () => {
    const { container } = render(<BudgetProgressItem item={{ ...defaultItem, percentage_used: 79 }} />);
    const progress = container.querySelector('[role="progressbar"]');
    expect(progress).toHaveClass("[&>div]:bg-green-600");
  });

  it("applies yellow color for usage between 80% and 100%", () => {
    const { container } = render(<BudgetProgressItem item={{ ...defaultItem, percentage_used: 85 }} />);
    const progress = container.querySelector('[role="progressbar"]');
    expect(progress).toHaveClass("[&>div]:bg-yellow-500");
  });

  it("applies red color for usage > 100%", () => {
    const { container } = render(<BudgetProgressItem item={{ ...defaultItem, percentage_used: 110 }} />);
    const progress = container.querySelector('[role="progressbar"]');
    expect(progress).toHaveClass("[&>div]:bg-destructive");
  });
});
