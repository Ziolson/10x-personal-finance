import React from "react";
import { useStore } from "@nanostores/react";
import { isAddTransactionModalOpen } from "@/lib/stores/layoutStore";

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

  return (
    <>
      {/* Add Transaction Modal Placeholder */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          {/* TODO: Replace with AddTransactionModal component when ready */}
          <div className="rounded-lg bg-white p-6 dark:bg-neutral-900">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Add Transaction
            </h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Modal content will be implemented here
            </p>
          </div>
        </div>
      )}

      {/* Additional global modals can be added here */}
      {/* Example: */}
      {/* {isDeleteConfirmModalOpen && <DeleteConfirmModal />} */}
      {/* {isSettingsModalOpen && <SettingsModal />} */}
    </>
  );
});

GlobalModalsWrapper.displayName = "GlobalModalsWrapper";
