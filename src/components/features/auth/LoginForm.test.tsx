import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginForm from "./LoginForm";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

describe("LoginForm", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("handles 429 rate limit response", async () => {
    // Mock 429 response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.fetch as any).mockResolvedValue({
      status: 429,
      headers: {
        get: (header: string) => (header === "Retry-After" ? "2" : null),
      },
      json: async () => ({ error: "Too many attempts" }),
    });

    render(<LoginForm />);

    // Fill form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password123" },
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toHaveValue("test@example.com");
      expect(screen.getByPlaceholderText("••••••••")).toHaveValue("password123");
    });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /zaloguj się/i }));

    // Wait for error message
    // Use findByText which includes waitFor
    await screen.findByText(/zbyt wiele prób logowania/i);

    // Check button disabled state and text
    // We can't query by role button easily if there are multiple, but name helps
    // Name changes to "Poczekaj 2s"
    const button = await screen.findByRole("button", { name: /poczekaj 2s/i });
    expect(button).toBeDisabled();

    // Wait for countdown to tick (real time)
    await new Promise((resolve) => setTimeout(resolve, 1100));

    expect(button).toHaveTextContent(/poczekaj 1s/i);
  }, 10000);
});
