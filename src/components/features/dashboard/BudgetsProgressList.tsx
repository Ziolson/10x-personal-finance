import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { BudgetProgressItem as BudgetProgressItemType } from "@/types";
import { BudgetProgressItem } from "./BudgetProgressItem";

interface BudgetsProgressListProps {
  budgets: BudgetProgressItemType[];
}

export function BudgetsProgressList({ budgets }: BudgetsProgressListProps) {
  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle>Budżety</CardTitle>
          <CardDescription>
            Status Twoich budżetów w tym miesiącu.
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
          <a href="/budgets">
            Zarządzaj
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardHeader>
      <CardContent>
        {budgets.length > 0 ? (
          <div className="space-y-4">
            {budgets.map((budget) => (
              <BudgetProgressItem key={budget.budget_id} item={budget} />
            ))}
          </div>
        ) : (
          <div className="flex h-[200px] flex-col items-center justify-center text-center text-muted-foreground">
            <p className="text-sm">Brak aktywnych budżetów</p>
            <Button variant="link" className="mt-2" asChild>
              <a href="/budgets">Dodaj budżet</a>
            </Button>
          </div>
        )}
        <Button variant="link" className="mt-4 w-full sm:hidden" asChild>
          <a href="/budgets">Zarządzaj budżetami</a>
        </Button>
      </CardContent>
    </Card>
  );
}
