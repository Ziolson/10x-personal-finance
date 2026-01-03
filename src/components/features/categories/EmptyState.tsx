export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
      <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        Brak kategorii
      </p>
      <p className="text-sm">
        Dodaj nową kategorię, aby uporządkować swoje finanse.
      </p>
    </div>
  );
}

