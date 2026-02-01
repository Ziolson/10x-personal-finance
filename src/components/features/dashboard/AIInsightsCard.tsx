import { useEffect } from "react";
import { Brain, Sparkles, RefreshCw, TrendingDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInsights } from "@/components/hooks/useInsights";
import { Skeleton } from "@/components/ui/skeleton";

// Helper function
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "mniej niż godzinę temu";
  if (diffHours === 1) return "1 godzinę temu";
  if (diffHours < 24) return `${diffHours} godz. temu`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "1 dzień temu";
  return `${diffDays} dni temu`;
}

export function AIInsightsCard() {
  const { data, loading, error, fetchLatest, generateInsights } = useInsights();

  // Fetch latest on mount
  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  // Handle refresh
  const handleRefresh = async () => {
    await generateInsights({ months: 3, force_refresh: true });
  };

  // Handle analyze (first time)
  const handleAnalyze = async () => {
    await generateInsights({ months: 3, force_refresh: false });
  };

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <CardTitle>Rekomendacje AI</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <CardTitle>Rekomendacje AI</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Wystąpił błąd: {error}</p>
          <Button onClick={handleRefresh} variant="outline" size="sm" className="mt-4">
            Spróbuj ponownie
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Empty state (no insights yet)
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <CardTitle>Rekomendacje AI</CardTitle>
          </div>
          <CardDescription>Dowiedz się gdzie możesz zaoszczędzić</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <Sparkles className="h-12 w-12 text-purple-400" />
            <p className="text-sm text-muted-foreground">Potrzebujesz co najmniej miesiąca danych, aby AI mogło przeprowadzić analizę</p>
            <Button onClick={handleAnalyze} disabled={loading}>
              Analizuj wydatki
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state with data
  const topInsight = data.data.insights[0]; // Top recommendation
  const totalSavings = data.data.total_potential_savings;

  // Format timestamp
  const generatedAgo = formatTimeAgo(new Date(data.generated_at));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <CardTitle>Możliwości oszczędności</CardTitle>
          </div>
          <Button onClick={handleRefresh} variant="ghost" size="icon" disabled={loading} title="Odśwież analizę">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <CardDescription>Ostatnia analiza: {generatedAgo}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main metric */}
        <div className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4" />
            <span className="text-sm font-medium">Możesz zaoszczędzić</span>
          </div>
          <p className="text-3xl font-bold">
            {totalSavings.toFixed(0)} PLN<span className="text-sm font-normal">/mc</span>
          </p>
        </div>

        {/* Top recommendation */}
        {topInsight && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{topInsight.category}</span>
              <span className="text-sm text-purple-600 font-semibold">{topInsight.potential_savings.toFixed(0)} PLN/mc</span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{topInsight.reasoning}</p>
          </div>
        )}

        {/* CTA */}
        <Button asChild className="w-full">
          <a href="/insights">Zobacz pełną analizę</a>
        </Button>
      </CardContent>
    </Card>
  );
}
