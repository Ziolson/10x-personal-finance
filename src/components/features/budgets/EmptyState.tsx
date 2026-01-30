import React from "react";
import { Wallet } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 py-12 text-center dark:border-neutral-700">
      <div className="rounded-full bg-neutral-100 p-3 dark:bg-neutral-800">
        <Wallet className="h-6 w-6 text-neutral-400" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Brak budżetów</h3>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Nie masz jeszcze żadnych budżetów dla tego miesiąca.</p>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">Kliknij przycisk "Dodaj budżet" aby utworzyć pierwszy budżet.</p>
    </div>
  );
}
