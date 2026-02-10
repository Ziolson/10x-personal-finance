import { render, screen } from "@testing-library/react";
import EmptyState from "./EmptyState";
import { describe, it, expect } from "vitest";

describe("EmptyState", () => {
  it("renders the empty state message", () => {
    render(<EmptyState />);
    expect(screen.getByText("Brak transakcji do wyświetlenia")).toBeInTheDocument();
    expect(screen.getByText("Dodaj pierwszą transakcję lub zmień filtry, aby zobaczyć wyniki.")).toBeInTheDocument();
  });
});
