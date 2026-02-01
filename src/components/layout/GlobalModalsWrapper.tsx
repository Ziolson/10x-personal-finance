import React, { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import { isAddTransactionModalOpen, closeAddTransactionModal } from "@/lib/stores/layoutStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TransactionForm from "@/components/features/transactions/components/TransactionForm";
import useAccounts from "@/components/hooks/useAccounts";
import { useCategories } from "@/components/hooks/useCategories";
import { format } from "date-fns";
import type { CreateTransactionCommand } from "@/types";
import type { TransactionFormValues } from "@/components/features/transactions/types";
import logger from "@/lib/logger";

/**
 * GlobalModalsWrapper Component
 *
 * Container component that manages the visibility of global modals.
 * Listens to the Nano Store state and renders modals conditionally.
 *
 * This is a centralized place for managing all global modals in the application.
 * New modals can be easily added here by:
 * 1. Adding a new atom in layoutStore.ts
 * 2. Adding the modal component here
 * 3. Using the store's functions to open/close the modal
 */
export const GlobalModalsWrapper = React.memo(function GlobalModalsWrapper() {
  const isModalOpen = useStore(isAddTransactionModalOpen);
  const [isLoading, setIsLoading] = useState(false);
  const { accounts, refetch: fetchAccounts } = useAccounts();
  const { categories, fetchCategories } = useCategories();

  useEffect(() => {
    if (isModalOpen) {
      fetchAccounts();
      fetchCategories();
    }
  }, [isModalOpen, fetchAccounts, fetchCategories]);

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

      // Call API to create transaction
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Nie udało się dodać transakcji");
      }

      closeAddTransactionModal();

      // Reload the page to show the new transaction
      window.location.reload();
    } catch (error) {
      logger.error(error);
      alert(error instanceof Error ? error.message : "Wystąpił błąd podczas dodawania transakcji");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Add Transaction Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeAddTransactionModal()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Dodaj nową transakcję</DialogTitle>
          </DialogHeader>
          <TransactionForm accounts={accounts || []} categories={categories} onSubmit={handleSubmit} isLoading={isLoading} />
        </DialogContent>
      </Dialog>

      {/* Additional global modals can be added here */}
      {/* Example: */}
      {/* {isDeleteConfirmModalOpen && <DeleteConfirmModal />} */}
      {/* {isSettingsModalOpen && <SettingsModal />} */}
    </>
  );
});

GlobalModalsWrapper.displayName = "GlobalModalsWrapper";
