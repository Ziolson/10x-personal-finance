import { describe, it, expect } from "vitest";
import { extractAccountFormErrors } from "./utils";

describe("extractAccountFormErrors", () => {
  it("returns generic error message if input is not an Error", () => {
    const result = extractAccountFormErrors("something wrong");
    expect(result.generalError).toBe("Nieoczekiwany błąd. Spróbuj ponownie.");
    expect(result.fieldErrors).toEqual({});
  });

  it("handles validation errors with details array", () => {
    const error = new Error("Validation Error") as Error & { details: { field: string; message: string }[] };
    error.details = [
      { field: "name", message: "Name is too short" },
      { field: "initial_balance", message: "Invalid balance" },
    ];

    const result = extractAccountFormErrors(error);
    expect(result.fieldErrors.name).toBe("Name is too short");
    expect(result.fieldErrors.initial_balance).toBe("Invalid balance");
    expect(result.generalError).toBeUndefined();
  });

  it("handles 409 conflict error (duplicate name)", () => {
    const error = new Error("Conflict") as Error & { status: number };
    error.status = 409;

    const result = extractAccountFormErrors(error);
    expect(result.fieldErrors.name).toBe("Konto o tej nazwie już istnieje.");
  });

  it("handles 404 not found error", () => {
    const error = new Error("Not Found") as Error & { status: number };
    error.status = 404;

    const result = extractAccountFormErrors(error);
    expect(result.generalError).toBe("Nie znaleziono konta. Odśwież stronę i spróbuj ponownie.");
  });

  it("handles 500 server errors", () => {
    const error = new Error("Internal Server Error") as Error & { status: number };
    error.status = 500;

    const result = extractAccountFormErrors(error);
    expect(result.generalError).toBe("Wystąpił błąd serwera. Spróbuj ponownie później.");
  });
});
