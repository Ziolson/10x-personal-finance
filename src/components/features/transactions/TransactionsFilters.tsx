import { useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useAccounts from "@/components/hooks/useAccounts";
import { useCategories } from "@/components/hooks/useCategories";
import type { TransactionFiltersState } from "./types";
import type { TransactionType } from "@/types";

interface TransactionsFiltersProps {
  filters: TransactionFiltersState;
  onFilterChange: (filters: TransactionFiltersState) => void;
}

export function TransactionsFilters({ filters, onFilterChange }: TransactionsFiltersProps) {
  const { accounts } = useAccounts();
  const { categories, fetchCategories } = useCategories();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleTypeChange = (value: string) => {
    onFilterChange({
      ...filters,
      type: value === "all" ? undefined : (value as TransactionType),
    });
  };

  const handleAccountChange = (value: string) => {
    onFilterChange({
      ...filters,
      accountId: value === "all" ? undefined : value,
    });
  };

  const handleCategoryChange = (value: string) => {
    onFilterChange({
      ...filters,
      categoryId: value === "all" ? undefined : value,
    });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:flex-wrap mb-6">
      <Select value={filters.type || "all"} onValueChange={handleTypeChange}>
        <SelectTrigger className="w-full md:w-[150px]" data-testid="filter-type">
          <SelectValue placeholder="Typ" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Wszystkie typy</SelectItem>
          <SelectItem value="expense">Wydatek</SelectItem>
          <SelectItem value="income">Przychód</SelectItem>
          <SelectItem value="transfer">Transfer</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.accountId || "all"} onValueChange={handleAccountChange}>
        <SelectTrigger className="w-full md:w-[200px]" data-testid="filter-account">
          <SelectValue placeholder="Konto" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Wszystkie konta</SelectItem>
          {accounts?.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              {account.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.categoryId || "all"} onValueChange={handleCategoryChange}>
        <SelectTrigger className="w-full md:w-[200px]" data-testid="filter-category">
          <SelectValue placeholder="Kategoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Wszystkie kategorie</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn("w-full md:w-[240px] justify-start text-left font-normal", !filters.dateRange && "text-muted-foreground")}
            data-testid="filter-date-range"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.dateRange?.from ? (
              filters.dateRange.to ? (
                <>
                  {format(filters.dateRange.from, "dd.MM.yyyy")} - {format(filters.dateRange.to, "dd.MM.yyyy")}
                </>
              ) : (
                format(filters.dateRange.from, "dd.MM.yyyy")
              )
            ) : (
              <span>Wybierz zakres dat</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={filters.dateRange?.from}
            selected={filters.dateRange}
            onSelect={(range) => onFilterChange({ ...filters, dateRange: range })}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      {(filters.type || filters.accountId || filters.categoryId || filters.dateRange) && (
        <Button variant="ghost" onClick={clearFilters} className="h-8 px-2 lg:px-3" data-testid="clear-filters-button">
          Wyczyść
          <X className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
