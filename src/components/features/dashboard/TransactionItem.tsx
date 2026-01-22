import * as React from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { ArrowDownLeft, ArrowUpRight, ArrowRight, Wallet } from "lucide-react";
import type { TransactionDTO } from "@/types";
import { cn } from "@/lib/utils";

interface TransactionItemProps {
  transaction: TransactionDTO;
  categoryName?: string;
}

export function TransactionItem({ transaction, categoryName }: TransactionItemProps) {
  const { amount, date, description, type } = transaction;

  const formattedAmount = new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(amount);

  const formattedDate = format(new Date(date), "d MMM", { locale: pl });

  const getIcon = () => {
    switch (type) {
      case "income":
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case "expense":
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      case "transfer":
        return <ArrowRight className="h-4 w-4 text-blue-600" />;
      default:
        return <Wallet className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/50">
          {getIcon()}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium leading-none">
            {description || categoryName || "Transakcja"}
          </p>
          <p className="text-xs text-muted-foreground">
            {formattedDate} {categoryName && `• ${categoryName}`}
          </p>
        </div>
      </div>
      <div
        className={cn(
          "text-sm font-medium",
          type === "expense"
            ? "text-red-600 dark:text-red-500"
            : type === "income"
            ? "text-green-600 dark:text-green-500"
            : ""
        )}
      >
        {type === "expense" ? "-" : type === "income" ? "+" : ""}
        {formattedAmount}
      </div>
    </div>
  );
}
