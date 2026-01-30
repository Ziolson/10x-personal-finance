import { Button } from "@/components/ui/button";
import type { AccountDTO } from "@/types";

export interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
  account: AccountDTO | null;
  isDeleting: boolean;
}

export default function DeleteConfirmationDialog({ isOpen, onOpenChange, onConfirm, account, isDeleting }: DeleteConfirmationDialogProps) {
  if (!isOpen || !account) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        aria-describedby="delete-account-description"
        className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
      >
        <p id="delete-account-title" className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Potwierdź usunięcie
        </p>
        <p id="delete-account-description" className="mt-2 text-sm text-neutral-500">
          Chcesz usunąć konto <strong>{account.name}</strong>? Ta operacja jest nieodwracalna.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? (
              <span className="flex items-center gap-2">
                <span className="inline-flex h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Usuwanie...
              </span>
            ) : (
              "Usuń konto"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
