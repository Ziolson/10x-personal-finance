import type { AccountDTO } from "@/types";
import AccountListItem from "./AccountListItem";

export interface AccountsListProps {
  accounts: AccountDTO[];
  onEdit: (account: AccountDTO) => void;
  onDelete: (account: AccountDTO) => void;
}

export default function AccountsList({ accounts, onEdit, onDelete }: AccountsListProps) {
  if (accounts.length === 0) {
    return null;
  }

  return (
    <ul role="list" className="space-y-3">
      {accounts.map((account) => (
        <li key={account.id}>
          <AccountListItem account={account} onEdit={onEdit} onDelete={onDelete} />
        </li>
      ))}
    </ul>
  );
}
