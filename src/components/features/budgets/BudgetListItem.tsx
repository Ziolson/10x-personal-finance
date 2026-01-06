import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import type { BudgetDTO, CategoryDTO } from "@/types";

interface BudgetListItemProps {
  budget: BudgetDTO;
  categoriesMap: Record<string, CategoryDTO>;
  onEdit: () => void;
  onDelete: () => void;
}

export default function BudgetListItem({ budget, categoriesMap, onEdit, onDelete }: BudgetListItemProps) {
  // Calculate spent amount (mock for now, will be calculated from transactions)
  const spentAmount = budget.spent_amount ?? 0;
  const percentage = budget.percentage_used ?? 0;
  const remainingAmount = budget.remaining_amount ?? budget.amount;

  // Get category names from IDs
  const categoryNames = budget.categories.map((catId) => categoriesMap[catId]?.name).filter(Boolean);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{budget.name}</h3>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {spentAmount.toFixed(2)} zł / {budget.amount.toFixed(2)} zł
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">Otwórz menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edytuj
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600 dark:text-red-400">
                <Trash2 className="mr-2 h-4 w-4" />
                Usuń
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="space-y-1">
            <Progress value={percentage} className="h-2" />
            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span>{percentage.toFixed(0)}% wykorzystane</span>
              <span>Pozostało: {remainingAmount.toFixed(2)} zł</span>
            </div>
          </div>

          {categoryNames.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categoryNames.map((name, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
