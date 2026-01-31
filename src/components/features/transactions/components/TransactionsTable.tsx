import { format } from "date-fns";
import { MoreHorizontal, ArrowRight, ArrowRightLeft, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TransactionDTO, AccountDTO, CategoryDTO } from "@/types";
import { cn } from "@/lib/utils";

interface TransactionsTableProps {
  transactions: TransactionDTO[];
  accounts: AccountDTO[];
  categories: CategoryDTO[];
  onEdit: (transaction: TransactionDTO) => void;
  onDelete: (transaction: TransactionDTO) => void;
}

export default function TransactionsTable({ transactions, accounts, categories, onEdit, onDelete }: TransactionsTableProps) {
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead>Opis / Kategoria</TableHead>
            <TableHead>Konto</TableHead>
            <TableHead className="text-right">Kwota</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id} data-testid="transaction-row">
              <TableCell className="font-medium">{format(new Date(transaction.date), "dd.MM.yyyy")}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getTransactionIcon(transaction.type)}
                  <span className="capitalize">{transaction.type === "expense" ? "Wydatek" : transaction.type === "income" ? "Przychód" : "Transfer"}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{transaction.description || "-"}</span>
                  <span className="text-xs text-muted-foreground">{transaction.type === "transfer" ? "Transfer środków" : getCategoryName(transaction.category_id)}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col text-sm">
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
              </TableCell>
              <TableCell
                className={cn("text-right font-bold", {
                  "text-green-600": transaction.type === "income",
                  "text-red-600": transaction.type === "expense",
                })}
              >
                {new Intl.NumberFormat("pl-PL", {
                  style: "currency",
                  currency: "PLN", // Assuming PLN for now as per simple DTO
                }).format(transaction.amount)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0" data-testid="action-menu-trigger">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Akcje</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onEdit(transaction)} data-testid="action-edit">
                      Edytuj
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(transaction)} className="text-red-600 focus:text-red-600" data-testid="action-delete">
                      Usuń
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
