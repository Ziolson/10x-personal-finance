import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { TransactionDTO } from "@/types";

interface DeleteTransactionDialogProps {
  transaction: TransactionDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => Promise<void>;
}

export default function DeleteTransactionDialog({ transaction, open, onOpenChange, onDelete }: DeleteTransactionDialogProps) {
  if (!transaction) return null;

  const handleDelete = async () => {
    await onDelete(transaction.id);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Czy na pewno chcesz usunąć tę transakcję?</AlertDialogTitle>
          <AlertDialogDescription>Tej operacji nie można cofnąć. Transakcja zostanie trwale usunięta z Twojej historii.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Anuluj</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
            Usuń
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
