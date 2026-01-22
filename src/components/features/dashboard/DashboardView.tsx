import * as React from "react";
import { PageHeader } from "@/components/PageHeader";
import MonthNavigator from "@/components/features/budgets/MonthNavigator";
// Import atomic components
import { SummaryCards } from "./SummaryCards";
import { RecentTransactionsList } from "./RecentTransactionsList";
import { BudgetsProgressList } from "./BudgetsProgressList";
import { ExpensesPieChart } from "./ExpensesPieChart";
import { EmptyState } from "./EmptyState";
// Import data fetching
import { getDashboard } from "@/lib/api";
import type { DashboardDTO } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import useAccounts from "@/components/hooks/useAccounts";

export default function DashboardView() {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [data, setData] = React.useState<DashboardDTO | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Use accounts hook to determine empty state directly
  // This is a robust way to know if user is completely new vs just has no data for month
  const { accounts, isLoading: isAccountsLoading } = useAccounts();

  React.useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        const month = currentDate.getMonth() + 1; // 1-12
        const year = currentDate.getFullYear();

        const dashboardData = await getDashboard(month, year);

        if (isMounted) {
          setData(dashboardData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [currentDate]);

  // Loading state (initial)
  if (isAccountsLoading || (isLoading && !data)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  // True Empty State: No accounts created yet
  if (!accounts || accounts.length === 0) {
    return <EmptyState />;
  }

  if (error) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-semibold text-red-600">Błąd pobierania danych</p>
        <p className="text-sm text-neutral-500">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  // Normal Dashboard View
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title="Pulpit" description="Podsumowanie Twoich finansów osobistych." />
        <MonthNavigator currentDate={currentDate} onDateChange={setCurrentDate} />
      </div>

      {data && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <SummaryCards summary={data.summary} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column (2/3 width on large screens) */}
            <div className="space-y-6 lg:col-span-2">
              <div className="grid gap-6 md:grid-cols-2">
                <ExpensesPieChart data={data.expense_by_category} />
                <BudgetsProgressList budgets={data.budget_progress} />
              </div>
            </div>

            {/* Right Column (1/3 width) */}
            <div className="space-y-6">
              <RecentTransactionsList transactions={data.recent_transactions} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
