import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import TransactionForm from "./TransactionForm";
import useAccounts from "@/components/hooks/useAccounts";
import { useCategories } from "@/components/hooks/useCategories";
import type { CreateTransactionCommand } from "@/types";
import type { TransactionFormValues } from "../types";

interface AddTransactionDialogProps {
  onAdd: (command: CreateTransactionCommand) => Promise<void>;
}

export default function AddTransactionDialog({ onAdd }: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { accounts, refetch: fetchAccounts } = useAccounts();
  const { categories, fetchCategories } = useCategories();

  useEffect(() => {
    if (open) {
      fetchAccounts();
      fetchCategories();
    }
  }, [open, fetchAccounts, fetchCategories]);

  const handleSubmit = async (values: TransactionFormValues) => {
    setIsLoading(true);
    try {
      // Cast values to conform to CreateTransactionCommand union
      const command = {
        ...values,
        date: format(values.date, "yyyy-MM-dd"),
      } as any; // Type casting simplified here, logic handled in hook/backend

      // But we should be precise for runtime correctness
      if (values.type === "expense") {
        // cleanup unused fields if any
        delete command.to_account_id;
      } else if (values.type === "income") {
        delete command.from_account_id;
      } else if (values.type === "transfer") {
        delete command.category_id;
      }

      await onAdd(command as CreateTransactionCommand);
      setOpen(false);
    } catch (error) {
      // Error handling is usually done in the parent or hook,
      // but we could show toast here if needed.
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Dodaj transakcję
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Dodaj nową transakcję</DialogTitle>
        </DialogHeader>
        <TransactionForm accounts={accounts || []} categories={categories} onSubmit={handleSubmit} isLoading={isLoading} />
      </DialogContent>
    </Dialog>
  );
}
