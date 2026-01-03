import type { CategoryDTO } from "@/types";
import CategoryListItem from "./CategoryListItem";
import EmptyState from "./EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoriesListProps {
  categories: CategoryDTO[];
  isLoading: boolean;
  onEdit: (category: CategoryDTO) => void;
  onDelete: (category: CategoryDTO) => void;
}

export default function CategoriesList({
  categories,
  isLoading,
  onEdit,
  onDelete,
}: CategoriesListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 dark:border-neutral-700"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return <EmptyState />;
  }

  return (
    <ul className="space-y-3">
      {categories.map((category) => (
        <li key={category.id}>
          <CategoryListItem
            category={category}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </li>
      ))}
    </ul>
  );
}

