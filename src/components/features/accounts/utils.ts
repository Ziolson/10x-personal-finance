import type { ValidationError, AccountFormViewModel } from "@/types";
import type { AccountFormServerErrors } from "./AccountForm";

interface ApiClientError extends Error {
  status?: number;
  details?: ValidationError[];
}

export function extractAccountFormErrors(error: unknown): {
  fieldErrors: AccountFormServerErrors;
  generalError?: string;
} {
  if (!(error instanceof Error)) {
    return { generalError: "Nieoczekiwany błąd. Spróbuj ponownie.", fieldErrors: {} };
  }

  const apiError = error as ApiClientError;
  const fieldErrors: AccountFormServerErrors = {};

  if (Array.isArray(apiError.details)) {
    for (const detail of apiError.details) {
      if (detail.field === "name" || detail.field === "initial_balance") {
        fieldErrors[detail.field as keyof AccountFormViewModel] = detail.message;
      }
    }
  }

  if (Object.keys(fieldErrors).length === 0) {
    if (apiError.status === 409 || apiError.message === "ACCOUNT_NAME_EXISTS") {
      fieldErrors.name = "Konto o tej nazwie już istnieje.";
    }
  }

  if (Object.keys(fieldErrors).length === 0) {
    if (apiError.status === 404) {
      return { fieldErrors, generalError: "Nie znaleziono konta. Odśwież stronę i spróbuj ponownie." };
    }

    if (apiError.status && apiError.status >= 500) {
      return { fieldErrors, generalError: "Wystąpił błąd serwera. Spróbuj ponownie później." };
    }

    return { fieldErrors, generalError: apiError.message || "Nie udało się wykonać operacji." };
  }

  return { fieldErrors };
}
