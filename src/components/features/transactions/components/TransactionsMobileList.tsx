import { format } from "date-fns";
import { MoreHorizontal, ArrowRight, TrendingUp, TrendingDown, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { TransactionDTO, AccountDTO, CategoryDTO } from "@/types";
import { cn } from "@/lib/utils";

interface TransactionsMobileListProps {
  transactions: TransactionDTO[];
  accounts: AccountDTO[];
  categories: CategoryDTO[];
  onEdit: (transaction: TransactionDTO) => void;
  onDelete: (transaction: TransactionDTO) => void;
}

export default function TransactionsMobileList({ transactions, accounts, categories, onEdit, onDelete }: TransactionsMobileListProps) {
  const getAccountName = (id?: string | null) => {
    if (!id) return "-";
    return accounts.find((a) => a.id === id)?.name || "Nieznane konto";
  };

  const getCategoryName = (id?: string | null) => {
    if (!id) return "-";
    return categories.find((c) => c.id === id)?.name || "Bez kategorii";
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "income":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "expense":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "transfer":
        return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="flex flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn("rounded-full p-2 bg-muted", {
                  "bg-green-100 dark:bg-green-900/20": transaction.type === "income",
                  "bg-red-100 dark:bg-red-900/20": transaction.type === "expense",
                  "bg-blue-100 dark:bg-blue-900/20": transaction.type === "transfer",
                })}
              >
                {getTransactionIcon(transaction.type)}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold">{transaction.description || (transaction.type === "transfer" ? "Transfer" : "Bez opisu")}</span>
                <span className="text-xs text-muted-foreground">{format(new Date(transaction.date), "dd.MM.yyyy")}</span>
              </div>
            </div>
            <div
              className={cn("font-bold", {
                "text-green-600": transaction.type === "income",
                "text-red-600": transaction.type === "expense",
              })}
            >
              {new Intl.NumberFormat("pl-PL", {
                style: "currency",
                currency: "PLN",
              }).format(transaction.amount)}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-2 mt-1">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                {transaction.type === "expense" && <span>{getAccountName(transaction.from_account_id)}</span>}
                {transaction.type === "income" && <span>{getAccountName(transaction.to_account_id)}</span>}
                {transaction.type === "transfer" && (
                  <div className="flex items-center gap-1">
                    <span>{getAccountName(transaction.from_account_id)}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>{getAccountName(transaction.to_account_id)}</span>
                  </div>
                )}
              </div>
              {transaction.type !== "transfer" && <span className="text-xs bg-muted px-2 py-0.5 rounded-full w-fit">{getCategoryName(transaction.category_id)}</span>}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">Otwórz menu akcji</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(transaction)}>Edytuj</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(transaction)} className="text-red-600 focus:text-red-600">
                  Usuń
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
}
