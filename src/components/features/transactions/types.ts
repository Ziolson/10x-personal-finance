import type { TransactionType } from "@/types";

export interface TransactionFiltersState {
  type?: TransactionType;
  accountId?: string;
  categoryId?: string;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
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
