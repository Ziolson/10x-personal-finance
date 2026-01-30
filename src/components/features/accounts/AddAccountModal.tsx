import { useEffect, useState } from "react";
import AccountForm, { type AccountFormServerErrors } from "./AccountForm";
import type { AccountFormViewModel } from "@/types";
import { extractAccountFormErrors } from "./utils";

export interface AddAccountModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: AccountFormViewModel) => Promise<void>;
  onError?: (message?: string | null) => void;
  onSuccess: () => void;
}

export default function AddAccountModal({ isOpen, onOpenChange, onSubmit, onSuccess, onError }: AddAccountModalProps) {
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

  const handleSubmit = async (data: AccountFormViewModel) => {
    setServerErrors({});
    setGeneralError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(data);
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

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Dodaj konto</h2>
          <button type="button" aria-label="Zamknij" className="text-neutral-500 transition hover:text-neutral-700 dark:hover:text-neutral-300" onClick={() => onOpenChange(false)}>
            Zamknij
          </button>
        </div>

        <p className="mt-2 text-sm text-neutral-500">Dodaj nowe konto, które będziemy śledzić w aplikacji.</p>

        <div className="mt-6">
          <AccountForm isSubmitting={isSubmitting} onSubmit={handleSubmit} serverErrors={serverErrors} generalError={generalError} />
        </div>
      </div>
    </div>
  );
}
