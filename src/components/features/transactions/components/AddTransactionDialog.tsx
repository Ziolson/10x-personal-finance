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
import logger from "@/lib/logger";

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
      const dateStr = format(values.date, "yyyy-MM-dd");
      let command: CreateTransactionCommand;

      if (values.type === "expense") {
        if (!values.from_account_id || !values.category_id) {
          throw new Error("Brak wymaganych pól dla wydatku");
        }
        command = {
          type: "expense",
          amount: values.amount,
          date: dateStr,
          description: values.description,
          from_account_id: values.from_account_id,
          category_id: values.category_id,
        };
      } else if (values.type === "income") {
        if (!values.to_account_id || !values.category_id) {
          throw new Error("Brak wymaganych pól dla przychodu");
        }
        command = {
          type: "income",
          amount: values.amount,
          date: dateStr,
          description: values.description,
          to_account_id: values.to_account_id,
          category_id: values.category_id,
        };
      } else {
        // transfer
        if (!values.from_account_id || !values.to_account_id) {
          throw new Error("Brak wymaganych pól dla transferu");
        }
        command = {
          type: "transfer",
          amount: values.amount,
          date: dateStr,
          description: values.description,
          from_account_id: values.from_account_id,
          to_account_id: values.to_account_id,
        };
      }

      await onAdd(command);
      setOpen(false);
    } catch (error) {
      logger.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="add-transaction-button">
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
