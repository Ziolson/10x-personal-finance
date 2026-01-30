import { useEffect } from "react";
import useAccounts from "@/components/hooks/useAccounts";
import { useCategories } from "@/components/hooks/useCategories";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import type { TransactionDTO, PaginationInfo } from "@/types";
import TransactionsTable from "./TransactionsTable";
import TransactionsMobileList from "./TransactionsMobileList";
import SkeletonLoader from "./SkeletonLoader";
import EmptyState from "./EmptyState";

interface TransactionsListProps {
  transactions: TransactionDTO[];
  isLoading: boolean;
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onEdit: (transaction: TransactionDTO) => void;
  onDelete: (transaction: TransactionDTO) => void;
}

export default function TransactionsList({ transactions, isLoading, pagination, onPageChange, onEdit, onDelete }: TransactionsListProps) {
  // Fetch lookups
  const { accounts, refetch: fetchAccounts } = useAccounts();
  const { categories, fetchCategories } = useCategories();

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
  }, [fetchAccounts, fetchCategories]);

  if (isLoading) {
    return <SkeletonLoader />;
  }

  if (!transactions.length) {
    return <EmptyState />;
  }

  // Generate page numbers for pagination
  const pages = Array.from({ length: pagination.totalPages }, (_, i) => i + 1);

  // Pagination logic to show limited pages could be improved here,
  // but for now we show what Shadcn/pagination supports or simple list
  // If total pages > 10 we might want to truncate.

  return (
    <div className="space-y-4">
      {/* Desktop View */}
      <div className="hidden md:block">
        <TransactionsTable transactions={transactions} accounts={accounts || []} categories={categories} onEdit={onEdit} onDelete={onDelete} />
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        <TransactionsMobileList transactions={transactions} accounts={accounts || []} categories={categories} onEdit={onEdit} onDelete={onDelete} />
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (pagination.currentPage > 1) onPageChange(pagination.currentPage - 1);
                }}
                className={pagination.currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>

            {pages.map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  isActive={page === pagination.currentPage}
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(page);
                  }}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (pagination.currentPage < pagination.totalPages) onPageChange(pagination.currentPage + 1);
                }}
                className={pagination.currentPage === pagination.totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
