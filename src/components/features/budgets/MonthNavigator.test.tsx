import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MonthNavigator from "./MonthNavigator";
import React from "react";

describe("MonthNavigator", () => {
  it("renders the current month and year in Polish", () => {
    const date = new Date(2024, 0, 15); // January 2024
    render(<MonthNavigator currentDate={date} onDateChange={vi.fn()} />);

    expect(screen.getByText("Styczeń 2024")).toBeInTheDocument();
  });

  it("calls onDateChange with the previous month when the left button is clicked", () => {
    const date = new Date(2024, 5, 15); // June 2024
    const onDateChange = vi.fn();
    render(<MonthNavigator currentDate={date} onDateChange={onDateChange} />);

    const prevButton = screen.getByLabelText("Poprzedni miesiąc");
    fireEvent.click(prevButton);

    expect(onDateChange).toHaveBeenCalledWith(new Date(2024, 4, 15)); // May 2024
  });

  it("calls onDateChange with the next month when the right button is clicked", () => {
    const date = new Date(2024, 5, 15); // June 2024
    const onDateChange = vi.fn();
    render(<MonthNavigator currentDate={date} onDateChange={onDateChange} />);

    const nextButton = screen.getByLabelText("Następny miesiąc");
    fireEvent.click(nextButton);

    expect(onDateChange).toHaveBeenCalledWith(new Date(2024, 6, 15)); // July 2024
  });

  it("handles year transition correctly when moving from January to previous month", () => {
    const date = new Date(2024, 0, 15); // January 2024
    const onDateChange = vi.fn();
    render(<MonthNavigator currentDate={date} onDateChange={onDateChange} />);

    const prevButton = screen.getByLabelText("Poprzedni miesiąc");
    fireEvent.click(prevButton);

    expect(onDateChange).toHaveBeenCalledWith(new Date(2023, 11, 15)); // December 2023
  });

  it("handles year transition correctly when moving from December to next month", () => {
    const date = new Date(2023, 11, 15); // December 2023
    const onDateChange = vi.fn();
    render(<MonthNavigator currentDate={date} onDateChange={onDateChange} />);

    const nextButton = screen.getByLabelText("Następny miesiąc");
    fireEvent.click(nextButton);

    expect(onDateChange).toHaveBeenCalledWith(new Date(2024, 0, 15)); // January 2024
  });
});
