import { useEffect, useState } from "react";
import AccountForm, { type AccountFormServerErrors } from "./AccountForm";
import type { AccountDTO, AccountFormViewModel } from "@/types";
import { extractAccountFormErrors } from "./utils";

export interface EditAccountModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  account: AccountDTO | null;
  onSubmit: (accountId: string, data: AccountFormViewModel) => Promise<void>;
  onSuccess: () => void;
  onError?: (message?: string | null) => void;
}

export default function EditAccountModal({ isOpen, account, onOpenChange, onSubmit, onSuccess, onError }: EditAccountModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<AccountFormServerErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setServerErrors({});
      setGeneralError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (formData: AccountFormViewModel) => {
    if (!account) {
      setGeneralError("Brak kontekstu konta do edycji.");
      return;
    }

    setServerErrors({});
    setGeneralError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(account.id, formData);
      onSuccess();
    } catch (error) {
      const { fieldErrors, generalError } = extractAccountFormErrors(error);
      setServerErrors(fieldErrors);
      setGeneralError(generalError ?? null);
      if (generalError) {
        onError?.(generalError);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !account) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Edytuj konto {account.name}</h2>
          <button type="button" aria-label="Zamknij" className="text-neutral-500 transition hover:text-neutral-700 dark:hover:text-neutral-300" onClick={() => onOpenChange(false)}>
            Zamknij
          </button>
        </div>

        <p className="mt-2 text-sm text-neutral-500">Zaktualizuj dane konta, aby odzwierciedlić bieżący stan.</p>

        <div className="mt-6">
          <AccountForm
            initialData={{ name: account.name, initial_balance: account.initial_balance }}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            serverErrors={serverErrors}
            generalError={generalError}
          />
        </div>
      </div>
    </div>
  );
}
