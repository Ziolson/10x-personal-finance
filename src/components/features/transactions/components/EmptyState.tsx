import { Receipt } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-600 dark:border-neutral-700 dark:text-neutral-400 gap-2">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/10 mb-2">
        <Receipt className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Brak transakcji do wyświetlenia</p>
      <p className="text-sm text-muted-foreground max-w-sm">Dodaj pierwszą transakcję lub zmień filtry, aby zobaczyć wyniki.</p>
    </div>
  );
}
