import { Button } from "@/components/ui/button";
import type { AccountDTO } from "@/types";

export interface AccountListItemProps {
  account: AccountDTO;
  onEdit: (account: AccountDTO) => void;
  onDelete: (account: AccountDTO) => void;
}

export default function AccountListItem({ account, onEdit, onDelete }: AccountListItemProps) {
  const formattedBalance = new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: account.currency ?? "PLN",
  }).format(account.current_balance);

  return (
    <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white/80 p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
      <div>
        <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{account.name}</p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Saldo: {formattedBalance}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(account)}>
          Edytuj
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(account)}>
          Usuń
        </Button>
      </div>
    </div>
  );
}
