import { useEffect, useState } from "react";
import { useInsights } from "@/components/hooks/useInsights";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { InsightsHeader } from "./InsightsHeader";
import { InsightsSummaryBanner } from "./InsightsSummaryBanner";
import { SavingsComparisonChart } from "./SavingsComparisonChart";
import { SavingsImpactChart } from "./SavingsImpactChart";
import { InsightDetailCard } from "./InsightDetailCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

function InsightsViewContent() {
  const notify = useToast();
  const { data, loading, error, fetchLatest, generateInsights } = useInsights();
  const [selectedMonths, setSelectedMonths] = useState<1 | 2 | 3>(3);

  // Fetch latest on mount
  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  // Handle refresh with toast notification
  const handleRefresh = async () => {
    const result = await generateInsights({ months: selectedMonths, force_refresh: true });
    if (result) {
      notify.success("Analiza została odświeżona pomyślnie");
    } else if (error) {
      notify.error("Nie udało się odświeżyć analizy");
    }
  };

  // Handle first analysis
  const handleAnalyze = async () => {
    const result = await generateInsights({ months: selectedMonths, force_refresh: false });
    if (result) {
      notify.success("Analiza została wygenerowana pomyślnie");
    } else if (error) {
      notify.error("Nie udało się wygenerować analizy");
    }
  };

  // Handle months change (silent - no toast notification)
  const handleMonthsChange = async (months: 1 | 2 | 3) => {
    setSelectedMonths(months);
    await generateInsights({ months, force_refresh: false });
  };

  // Loading state (initial)
  if (loading && !data) {
    return (
      <div className="space-y-6" role="status" aria-label="Ładowanie analizy AI">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Wystąpił błąd podczas ładowania rekomendacji: {error}</AlertDescription>
      </Alert>
    );
  }

  // Empty state
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <Sparkles className="h-16 w-16 text-purple-400" />
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Brak analizy AI</h2>
          <p className="text-muted-foreground max-w-md">Potrzebujesz co najmniej miesiąca transakcji, aby AI mogło przeprowadzić analizę i zaproponować możliwości oszczędności.</p>
        </div>
        <Button onClick={handleAnalyze} size="lg" disabled={loading}>
          Wygeneruj pierwszą analizę
        </Button>
      </div>
    );
  }

  // Success state with data
  const insights = data.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <InsightsHeader
        recommendation={insights.general_recommendation}
        selectedMonths={selectedMonths}
        onMonthsChange={handleMonthsChange}
        onRefresh={handleRefresh}
        isRefreshing={loading}
        generatedAt={data.generated_at}
      />

      {/* Summary Banner */}
      <InsightsSummaryBanner
        monthsAnalyzed={insights.analysis_period.months_analyzed}
        averageSpending={insights.average_monthly_spending}
        potentialSavings={insights.total_potential_savings}
      />

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <SavingsComparisonChart insights={insights.insights} />
        <SavingsImpactChart averageMonthlySpending={insights.average_monthly_spending} potentialSavings={insights.total_potential_savings} />
      </div>

      {/* Detailed Recommendations */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Szczegółowe rekomendacje</h2>
        <div className="space-y-4">
          {insights.insights.map((insight, index) => (
            <InsightDetailCard key={insight.id} insight={insight} rank={index + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Wrapper with ToastProvider (zgodny z wzorcem z TransactionsView, AccountsView)
export default function InsightsView() {
  return (
    <ToastProvider>
      <InsightsViewContent />
    </ToastProvider>
  );
}
