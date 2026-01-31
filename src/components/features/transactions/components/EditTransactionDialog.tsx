import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import TransactionForm from "./TransactionForm";
import type { TransactionDTO, UpdateTransactionCommand, AccountDTO, CategoryDTO } from "@/types";
import type { TransactionFormValues } from "../types";

interface EditTransactionDialogProps {
  transaction: TransactionDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (id: string, command: UpdateTransactionCommand) => Promise<void>;
  accounts: AccountDTO[];
  categories: CategoryDTO[];
}

export default function EditTransactionDialog({ transaction, open, onOpenChange, onEdit, accounts, categories }: EditTransactionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values: TransactionFormValues) => {
    if (!transaction) return;

    setIsLoading(true);
    try {
      const command: UpdateTransactionCommand = {
        type: values.type,
        amount: values.amount,
        date: format(values.date, "yyyy-MM-dd"),
        description: values.description,
        // Send null if field is empty/undefined for partial updates or switching types
        from_account_id: values.from_account_id || null,
        to_account_id: values.to_account_id || null,
        category_id: values.category_id || null,
      };

      await onEdit(transaction.id, command);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!transaction) return null;

  const defaultValues: Partial<TransactionFormValues> = {
    type: transaction.type,
    amount: transaction.amount,
    date: new Date(transaction.date),
    description: transaction.description || "",
    from_account_id: transaction.from_account_id || "",
    to_account_id: transaction.to_account_id || "",
    category_id: transaction.category_id || "",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edytuj transakcję</DialogTitle>
        </DialogHeader>
        <TransactionForm defaultValues={defaultValues} accounts={accounts} categories={categories} onSubmit={handleSubmit} isLoading={isLoading} />
      </DialogContent>
    </Dialog>
  );
}
