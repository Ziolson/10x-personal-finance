import { atom } from "nanostores";

/**
 * Store for managing global layout state.
 * Centralized state management for modal visibility and other layout-related state.
 */

/**
 * Controls visibility of the "Add Transaction" modal.
 * Used by the global layout to toggle the modal from various components.
 */
export const isAddTransactionModalOpen = atom<boolean>(false);

/**
 * Opens the Add Transaction modal
 */
export function openAddTransactionModal() {
  isAddTransactionModalOpen.set(true);
}

/**
 * Closes the Add Transaction modal
 */
export function closeAddTransactionModal() {
  isAddTransactionModalOpen.set(false);
}

/**
 * Toggles the Add Transaction modal visibility
 */
export function toggleAddTransactionModal() {
  isAddTransactionModalOpen.set(!isAddTransactionModalOpen.get());
}
