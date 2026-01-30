import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { CategoryDTO } from "@/types";

interface CategoryListItemProps {
  category: CategoryDTO;
  onEdit: (category: CategoryDTO) => void;
  onDelete: (category: CategoryDTO) => void;
}

export default function CategoryListItem({ category, onEdit, onDelete }: CategoryListItemProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white/80 p-3 shadow-sm transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800/50">
      <div className="flex items-center gap-3">
        {/* Placeholder for icon if added in future */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{category.name.charAt(0).toUpperCase()}</span>
        </div>
        <span className="font-medium text-neutral-900 dark:text-neutral-100">{category.name}</span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Otwórz menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(category)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edytuj
          </DropdownMenuItem>
          <DropdownMenuItem className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400" onClick={() => onDelete(category)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Usuń
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
