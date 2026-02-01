import type { DateRange } from "react-day-picker";
import type { TransactionType } from "@/types";

export interface TransactionFiltersState {
  type?: TransactionType;
  accountId?: string;
  categoryId?: string;
  dateRange?: DateRange;
}

export interface TransactionFormValues {
  type: TransactionType;
  amount: number;
  date: Date;
  description?: string;
  from_account_id?: string;
  to_account_id?: string;
  category_id?: string;
}
