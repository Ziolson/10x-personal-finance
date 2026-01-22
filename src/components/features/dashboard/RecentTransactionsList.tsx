import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { TransactionDTO } from "@/types";
import { TransactionItem } from "./TransactionItem";

interface RecentTransactionsListProps {
  transactions: TransactionDTO[];
}

export function RecentTransactionsList({ transactions }: RecentTransactionsListProps) {
  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle>Ostatnie transakcje</CardTitle>
          <CardDescription>
            Twoich 5 ostatnich operacji finansowych.
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
          <a href="/transactions">
            Wszystkie
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardHeader>
      <CardContent>
        {transactions.length > 0 ? (
          <div className="divide-y divide-border">
            {transactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </div>
        ) : (
          <div className="flex h-[200px] flex-col items-center justify-center text-center text-muted-foreground">
            <p className="text-sm">Brak transakcji w tym miesiącu</p>
          </div>
        )}
        <Button variant="link" className="mt-4 w-full sm:hidden" asChild>
          <a href="/transactions">Zobacz wszystkie transakcje</a>
        </Button>
      </CardContent>
    </Card>
  );
}
