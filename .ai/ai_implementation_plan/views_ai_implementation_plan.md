# Plan Implementacji Widoków i UI - AI Insights

**Projekt:** 10xPersonal Finance  
**Moduł:** AI Insights & Savings Recommendations  
**Typ dokumentu:** Plan implementacji frontend components i UI  
**Data utworzenia:** 1 lutego 2026  
**Status:** Draft

---

## 1. Cel dokumentu

Niniejszy dokument definiuje **wyłącznie** kroki związane z implementacją frontend components, widoków i interfejsu użytkownika dla modułu AI Insights.

**Zakres:** React components, Astro pages, hooks, charts, UI/UX  
**Nie obejmuje:** Baza danych, API endpoints, backend services

**Powiązane dokumenty:**

- `db_ai_changes_plan.md` - implementacja zmian w bazie danych
- `api_ai_implementation_plan.md` - implementacja API i backend services (prerequisite)

**Prerequisites:**

- ✅ Tabela `ai_insights` w bazie danych
- ✅ API endpoints działają: `/api/insights/latest`, `/api/insights/analyze`
- ✅ Typy TypeScript dostępne w `src/types.ts`

---

## 2. Przegląd komponentów frontend

### 2.1 Nowe komponenty

| Komponent                | Ścieżka                                                       | Opis                             | Priorytet |
| ------------------------ | ------------------------------------------------------------- | -------------------------------- | --------- |
| `AIInsightsCard`         | `src/components/features/dashboard/AIInsightsCard.tsx`        | Widget na dashboardzie           | MUST      |
| `InsightsView`           | `src/components/features/insights/InsightsView.tsx`           | Główny kontener strony /insights | MUST      |
| `InsightsHeader`         | `src/components/features/insights/InsightsHeader.tsx`         | Header z kontrolkami             | MUST      |
| `InsightsSummaryBanner`  | `src/components/features/insights/InsightsSummaryBanner.tsx`  | Banner z metrykami               | MUST      |
| `SavingsComparisonChart` | `src/components/features/insights/SavingsComparisonChart.tsx` | Bar chart porównania             | MUST      |
| `SavingsImpactChart`     | `src/components/features/insights/SavingsImpactChart.tsx`     | Area chart projekcji             | MUST      |
| `InsightDetailCard`      | `src/components/features/insights/InsightDetailCard.tsx`      | Karta rekomendacji               | MUST      |
| `useInsights`            | `src/hooks/useInsights.ts`                                    | Custom hook do API               | MUST      |

### 2.2 Nowe strony

| Strona   | Ścieżka                    | Opis                         | Priorytet |
| -------- | -------------------------- | ---------------------------- | --------- |
| Insights | `src/pages/insights.astro` | Dedykowana strona analizy AI | MUST      |

### 2.3 Modyfikacje istniejących komponentów

| Komponent  | Modyfikacja                             | Priorytet |
| ---------- | --------------------------------------- | --------- |
| Dashboard  | Dodaj `<AIInsightsCard />`              | MUST      |
| Navigation | Dodaj link do `/insights` (opcjonalnie) | SHOULD    |

---

## 3. Szczegółowy plan implementacji

### KROK 1: Utworzenie custom hook - useInsights

**Plik:** `src/components/hooks/useInsights.ts`

**Opis:** Hook do komunikacji z API insights. Zgodny z konwencją projektu (custom hooks w `src/components/hooks`).

**Zawartość:**

```typescript
import { useState, useCallback } from "react";
import type { AIInsightsDTO, GenerateAIInsightsCommand, ApiErrorResponse } from "@/types";

// Helper function for consistent API response parsing (zgodny z useAccounts, useBudgets)
async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch (error) {
    // JSON parsing failed
    if (!response.ok) {
      // For error responses, we can't parse the error details, but we have the status
      const parseError = new Error(`Failed to parse error response: ${response.statusText}`);
      Object.assign(parseError, { status: response.status });
      throw parseError;
    }
    // For success responses, JSON parsing failure is a critical error
    throw new Error(`Invalid JSON in successful response from ${response.url}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  if (!response.ok) {
    const message = (payload as ApiErrorResponse)?.error?.message || response.statusText;
    const error = new Error(message);
    Object.assign(error, { status: response.status, details: (payload as ApiErrorResponse)?.error?.details });
    throw error;
  }

  return payload as T;
}

interface UseInsightsState {
  data: AIInsightsDTO | null;
  loading: boolean;
  error: string | null;
}

export function useInsights() {
  const [state, setState] = useState<UseInsightsState>({
    data: null,
    loading: false,
    error: null,
  });

  /**
   * Fetch latest insights from cache
   */
  const fetchLatest = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch("/api/insights/latest");

      // Handle 404 as empty state (no insights yet)
      if (response.status === 404) {
        setState({ data: null, loading: false, error: null });
        return null;
      }

      const data = await parseResponse<AIInsightsDTO>(response);
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setState((prev) => ({ ...prev, loading: false, error: message }));
      return null;
    }
  }, []);

  /**
   * Generate or refresh insights
   */
  const generateInsights = useCallback(async (command: GenerateAIInsightsCommand) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch("/api/insights/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      const data = await parseResponse<AIInsightsDTO>(response);
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setState((prev) => ({ ...prev, loading: false, error: message }));
      return null;
    }
  }, []);

  return {
    ...state,
    fetchLatest,
    generateInsights,
  };
}
```

**Akcje:**

1. ✅ Utwórz plik w `src/components/hooks/useInsights.ts` (zgodnie z konwencją projektu)
2. ✅ Wklej powyższą zawartość
3. ✅ Zweryfikuj typy w `src/types.ts`
4. ✅ Helper `parseResponse` zapewnia spójną obsługę błędów z resztą projektu

---

### KROK 2: Dashboard Widget - AIInsightsCard (struktura i stany)

**Plik:** `src/components/features/dashboard/AIInsightsCard.tsx`

**Opis:** Kompaktowy widget wyświetlany na dashboardzie. Używa funkcyjnych komponentów React z hooks (zgodnie z react.mdc).

**Część 1: Struktura i empty state**

```typescript
import { useEffect } from 'react';
import { Brain, Sparkles, RefreshCw, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInsights } from '@/components/hooks/useInsights';
import { Skeleton } from '@/components/ui/skeleton';

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
          <p className="text-sm text-destructive">
            Wystąpił błąd: {error}
          </p>
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
          <CardDescription>
            Dowiedz się gdzie możesz zaoszczędzić
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <Sparkles className="h-12 w-12 text-purple-400" />
            <p className="text-sm text-muted-foreground">
              Potrzebujesz co najmniej miesiąca danych, aby AI mogło przeprowadzić analizę
            </p>
            <Button onClick={handleAnalyze} disabled={loading}>
              Analizuj wydatki
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state - will be implemented in part 2
  // ...
}
```

**Akcje (część 1):**

1. ✅ Utwórz katalog `src/components/features/dashboard/` jeśli nie istnieje
2. ✅ Utwórz plik `AIInsightsCard.tsx`
3. ✅ Wklej część 1
4. ✅ Zaimportuj potrzebne komponenty Shadcn

---

### KROK 3: Dashboard Widget - AIInsightsCard (success state)

**Dodaj do pliku:** `src/components/features/dashboard/AIInsightsCard.tsx`

**Część 2: Success state (zastąp komentarz z części 1)**

```typescript
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
          <Button
            onClick={handleRefresh}
            variant="ghost"
            size="icon"
            disabled={loading}
            title="Odśwież analizę"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>
          Ostatnia analiza: {generatedAgo}
        </CardDescription>
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
              <span className="text-sm text-purple-600 font-semibold">
                {topInsight.potential_savings.toFixed(0)} PLN/mc
              </span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {topInsight.reasoning}
            </p>
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

// Helper function
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return 'mniej niż godzinę temu';
  if (diffHours === 1) return '1 godzinę temu';
  if (diffHours < 24) return `${diffHours} godz. temu`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 dzień temu';
  return `${diffDays} dni temu`;
}
```

**Akcje (część 2):**

1. ✅ Dodaj success state do komponentu
2. ✅ Dodaj helper function `formatTimeAgo`
3. ✅ Test komponentu na dashboardzie

---

### KROK 4: Integracja widget z dashboardem

**Plik:** `src/pages/dashboard.astro` (lub odpowiedni plik dashboard)

**Modyfikacja:** Dodaj `<AIInsightsCard />` do gridu dashboardu

**Przykład:**

```astro
---
import AIInsightsCard from "../components/features/dashboard/AIInsightsCard";
// ... inne importy
---

<Layout>
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    <!-- Istniejące karty -->
    <AccountsSummaryCard />
    <BudgetsSummaryCard />

    <!-- NOWA: AI Insights Card -->
    <AIInsightsCard client:load />

    <!-- Inne karty -->
  </div>
</Layout>
```

**Akcje:**

1. ✅ Znajdź plik z dashboardem
2. ✅ Dodaj import `AIInsightsCard`
3. ✅ Umieść w odpowiednim miejscu w gridzie
4. ✅ Dodaj `client:load` directive dla React component

---

### KROK 5: Strona Insights - struktura Astro

**Plik:** `src/pages/insights.astro`

**Opis:** Dedykowana strona z pełną analizą AI. Używa SSR i sprawdza autoryzację (zgodnie z astro.mdc).

**Zawartość:**

```astro
---
import Layout from "../layouts/Layout.astro";
import InsightsView from "../components/features/insights/InsightsView";

// Sprawdzenie autoryzacji (zgodnie z middleware pattern)
const session = Astro.locals.session;
if (!session) {
  return Astro.redirect("/login");
}

// Włączenie SSR dla tej strony (wyłączenie prerenderingu)
export const prerender = false;
---

<Layout title="Rekomendacje AI - 10xPersonal Finance">
  <div class="container mx-auto py-6">
    <InsightsView client:load />
  </div>
</Layout>
```

**Akcje:**

1. ✅ Utwórz plik `src/pages/insights.astro`
2. ✅ Wklej powyższą zawartość
3. ✅ Zweryfikuj routing: `http://localhost:4321/insights`
4. ✅ SSR zapewnia sprawdzenie sesji przy każdym żądaniu

---

### KROK 6: InsightsView - główny kontener

**Plik:** `src/components/features/insights/InsightsView.tsx`

**Opis:** Główny kontener zarządzający stanem i layoutem strony insights. Używa ToastProvider dla powiadomień (zgodnie z wzorcem z TransactionsView i AccountsView).

**Zawartość:**

```typescript
import { useEffect, useState } from 'react';
import { useInsights } from '@/components/hooks/useInsights';
import { ToastProvider, useToast } from '@/components/ui/toast';
import { InsightsHeader } from './InsightsHeader';
import { InsightsSummaryBanner } from './InsightsSummaryBanner';
import { SavingsComparisonChart } from './SavingsComparisonChart';
import { SavingsImpactChart } from './SavingsImpactChart';
import { InsightDetailCard } from './InsightDetailCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      notify.success('Analiza została odświeżona pomyślnie');
    } else if (error) {
      notify.error('Nie udało się odświeżyć analizy');
    }
  };

  // Handle first analysis
  const handleAnalyze = async () => {
    const result = await generateInsights({ months: selectedMonths, force_refresh: false });
    if (result) {
      notify.success('Analiza została wygenerowana pomyślnie');
    } else if (error) {
      notify.error('Nie udało się wygenerować analizy');
    }
  };

  // Handle months change
  const handleMonthsChange = async (months: 1 | 2 | 3) => {
    setSelectedMonths(months);
    const result = await generateInsights({ months, force_refresh: false });
    if (result) {
      notify.success(`Analiza została zaktualizowana dla ${months} ${months === 1 ? 'miesiąca' : 'miesięcy'}`);
    }
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
        <AlertDescription>
          Wystąpił błąd podczas ładowania rekomendacji: {error}
        </AlertDescription>
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
          <p className="text-muted-foreground max-w-md">
            Potrzebujesz co najmniej miesiąca transakcji, aby AI mogło przeprowadzić analizę
            i zaproponować możliwości oszczędności.
          </p>
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
        <SavingsImpactChart
          averageMonthlySpending={insights.average_monthly_spending}
          potentialSavings={insights.total_potential_savings}
        />
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
```

**Akcje:**

1. ✅ Utwórz katalog `src/components/features/insights/`
2. ✅ Utwórz plik `InsightsView.tsx`
3. ✅ Wklej powyższą zawartość
4. ✅ ToastProvider zapewnia spójne powiadomienia z resztą aplikacji
5. ✅ Przygotuj się na implementację child components

---

### KROK 7: InsightsHeader - kontrolki strony

**Plik:** `src/components/features/insights/InsightsHeader.tsx`

**Zawartość:**

```typescript
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface InsightsHeaderProps {
  recommendation: string;
  selectedMonths: 1 | 2 | 3;
  onMonthsChange: (months: 1 | 2 | 3) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  generatedAt: string;
}

export function InsightsHeader({
  recommendation,
  selectedMonths,
  onMonthsChange,
  onRefresh,
  isRefreshing,
  generatedAt,
}: InsightsHeaderProps) {
  const formattedDate = new Date(generatedAt).toLocaleString('pl-PL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 flex-1">
          <h1 className="text-3xl font-bold">Rekomendacje AI</h1>
          <p className="text-muted-foreground">{recommendation}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedMonths.toString()}
            onValueChange={(value) => onMonthsChange(parseInt(value) as 1 | 2 | 3)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 miesiąc</SelectItem>
              <SelectItem value="2">2 miesiące</SelectItem>
              <SelectItem value="3">3 miesiące</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={onRefresh}
            variant="outline"
            disabled={isRefreshing}
            aria-label="Odśwież analizę AI"
            title="Odśwież analizę"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Odśwież
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Ostatnia aktualizacja: {formattedDate}
      </p>
    </div>
  );
}
```

**Akcje:**

1. ✅ Utwórz plik `InsightsHeader.tsx`
2. ✅ Wklej zawartość
3. ✅ Zaimportuj komponenty Shadcn (Select)

---

### KROK 8: InsightsSummaryBanner - banner z metrykami

**Plik:** `src/components/features/insights/InsightsSummaryBanner.tsx`

**Zawartość:**

```typescript
import { Calendar, TrendingDown, Wallet } from 'lucide-react';

interface InsightsSummaryBannerProps {
  monthsAnalyzed: number;
  averageSpending: number;
  potentialSavings: number;
}

export function InsightsSummaryBanner({
  monthsAnalyzed,
  averageSpending,
  potentialSavings,
}: InsightsSummaryBannerProps) {
  const monthsLabel = monthsAnalyzed === 1 ? 'miesiąc' : monthsAnalyzed <= 4 ? 'miesiące' : 'miesięcy';

  return (
    <div className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Analyzed Period */}
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white/20 p-3">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm opacity-90">Analizowany okres</p>
            <p className="text-2xl font-bold">
              {monthsAnalyzed} {monthsLabel}
            </p>
          </div>
        </div>

        {/* Average Spending */}
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white/20 p-3">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm opacity-90">Średnie wydatki</p>
            <p className="text-2xl font-bold">
              {averageSpending.toFixed(0)} PLN<span className="text-sm font-normal">/mc</span>
            </p>
          </div>
        </div>

        {/* Potential Savings */}
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white/20 p-3">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm opacity-90">Możesz zaoszczędzić</p>
            <p className="text-3xl font-bold">
              {potentialSavings.toFixed(0)} PLN<span className="text-sm font-normal">/mc</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Akcje:**

1. ✅ Utwórz plik `InsightsSummaryBanner.tsx`
2. ✅ Wklej zawartość

---

### KROK 9: SavingsComparisonChart - wykres porównania

**Plik:** `src/components/features/insights/SavingsComparisonChart.tsx`

**Opis:** Bar chart porównujący obecne wydatki vs proponowane cele. Używa useMemo dla optymalizacji (zgodnie z react.mdc).

**Zawartość:**

```typescript
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { AIInsight } from '@/types';

interface SavingsComparisonChartProps {
  insights: AIInsight[];
}

const PRIORITY_COLORS = {
  high: '#ef4444', // red-500
  medium: '#f59e0b', // amber-500
  low: '#3b82f6', // blue-500
};

export function SavingsComparisonChart({ insights }: SavingsComparisonChartProps) {
  // Transform data for chart - memoized to avoid recalculation on every render
  const chartData = useMemo(() => {
    return insights.map((insight) => ({
      category: insight.category,
      'Obecne wydatki': insight.current_spending,
      'Proponowany cel': insight.suggested_target,
      priority: insight.priority,
    }));
  }, [insights]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Porównanie wydatków</CardTitle>
        <CardDescription>Obecne vs proponowane cele oszczędności</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer
          width="100%"
          height={350}
          role="img"
          aria-label="Wykres porównania obecnych wydatków z proponowanymi celami oszczędności dla różnych kategorii"
        >
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="category"
              angle={-45}
              textAnchor="end"
              height={100}
              fontSize={12}
            />
            <YAxis label={{ value: 'PLN', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              formatter={(value: number) => `${value.toFixed(0)} PLN`}
              labelStyle={{ color: '#000' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="Obecne wydatki" fill="#9ca3af" radius={[4, 4, 0, 0]} />
            <Bar
              dataKey="Proponowany cel"
              fill="#9333ea"
              radius={[4, 4, 0, 0]}
              // Could color by priority if desired
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Priority Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Wysoki priorytet</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Średni</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Niski</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Akcje:**

1. ✅ Utwórz plik `SavingsComparisonChart.tsx`
2. ✅ Wklej zawartość
3. ✅ Zweryfikuj że Recharts jest zainstalowany (powinien być w projekcie)
4. ✅ useMemo zapewnia optymalizację transformacji danych

---

### KROK 10: SavingsImpactChart - wykres projekcji

**Plik:** `src/components/features/insights/SavingsImpactChart.tsx`

**Opis:** Area chart pokazujący projekcję oszczędności w czasie. Używa useMemo dla optymalizacji (zgodnie z react.mdc).

**Zawartość:**

```typescript
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SavingsImpactChartProps {
  averageMonthlySpending: number;
  potentialSavings: number;
}

export function SavingsImpactChart({ averageMonthlySpending, potentialSavings }: SavingsImpactChartProps) {
  // Generate 12 months projection - memoized to avoid recalculation
  const chartData = useMemo(() => {
    const optimizedMonthly = averageMonthlySpending - potentialSavings;

    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      return {
        month: `Mc ${month}`,
        'Bez optymalizacji': averageMonthlySpending * month,
        'Z optymalizacją': optimizedMonthly * month,
      };
    });
  }, [averageMonthlySpending, potentialSavings]);

  // Calculate metrics for 3, 6, 12 months - memoized to avoid recalculation
  const metrics = useMemo(() => ({
    savings3m: potentialSavings * 3,
    savings6m: potentialSavings * 6,
    savings12m: potentialSavings * 12,
  }), [potentialSavings]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projekcja oszczędności w czasie</CardTitle>
        <CardDescription>Skumulowane wydatki w ciągu 12 miesięcy</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metrics Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <p className="text-xs text-green-700 font-medium">Za 3 miesiące</p>
            <p className="text-lg font-bold text-green-900">
              {metrics.savings3m.toFixed(0)} PLN
            </p>
          </div>
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <p className="text-xs text-green-700 font-medium">Za 6 miesięcy</p>
            <p className="text-lg font-bold text-green-900">
              {metrics.savings6m.toFixed(0)} PLN
            </p>
          </div>
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <p className="text-xs text-green-700 font-medium">Za rok</p>
            <p className="text-lg font-bold text-green-900">
              {metrics.savings12m.toFixed(0)} PLN
            </p>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer
          width="100%"
          height={250}
          role="img"
          aria-label="Wykres projekcji skumulowanych oszczędności w ciągu 12 miesięcy porównujący scenariusz bez optymalizacji i z optymalizacją wydatków"
        >
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorWithout" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#9ca3af" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorWith" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip formatter={(value: number) => `${value.toFixed(0)} PLN`} />
            <Area
              type="monotone"
              dataKey="Bez optymalizacji"
              stroke="#9ca3af"
              fillOpacity={1}
              fill="url(#colorWithout)"
            />
            <Area
              type="monotone"
              dataKey="Z optymalizacją"
              stroke="#22c55e"
              fillOpacity={1}
              fill="url(#colorWith)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

**Akcje:**

1. ✅ Utwórz plik `SavingsImpactChart.tsx`
2. ✅ Wklej zawartość
3. ✅ useMemo zapewnia optymalizację dla chart data i metrics

---

### KROK 11: InsightDetailCard - karta rekomendacji

**Plik:** `src/components/features/insights/InsightDetailCard.tsx`

**Opis:** Szczegółowa karta pojedynczej rekomendacji.

**Zawartość:**

```typescript
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, Lightbulb } from 'lucide-react';
import type { AIInsight } from '@/types';

interface InsightDetailCardProps {
  insight: AIInsight;
  rank: number;
}

const PRIORITY_CONFIG = {
  high: { label: 'Wysoki', color: 'bg-red-500', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  medium: { label: 'Średni', color: 'bg-amber-500', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  low: { label: 'Niski', color: 'bg-blue-500', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
};

export function InsightDetailCard({ insight, rank }: InsightDetailCardProps) {
  const config = PRIORITY_CONFIG[insight.priority];
  const reductionPercent = ((insight.potential_savings / insight.current_spending) * 100).toFixed(0);
  const targetPercent = (insight.suggested_target / insight.current_spending) * 100;

  return (
    <Card className={`border-l-4 ${config.borderColor}`}>
      <CardContent className="pt-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-bold">
              {rank}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{insight.category}</h3>
              <Badge variant="outline" className={config.color + ' text-white border-0'}>
                {config.label} priorytet
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-purple-600">
              {insight.potential_savings.toFixed(0)} PLN
            </p>
            <p className="text-sm text-muted-foreground">/miesiąc</p>
          </div>
        </div>

        {/* Current vs Target */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Current Spending */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Obecne wydatki</span>
              <span className="font-semibold">{insight.current_spending.toFixed(0)} PLN</span>
            </div>
            <Progress value={100} className="h-2" />
          </div>

          {/* Target */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3 text-purple-600" />
                <span className="text-muted-foreground">Proponowany cel</span>
              </div>
              <span className="font-semibold text-purple-600">{insight.suggested_target.toFixed(0)} PLN</span>
            </div>
            <Progress value={targetPercent} className="h-2" />
          </div>
        </div>

        {/* Reduction Badge */}
        <div className="flex justify-center">
          <Badge variant="secondary" className="text-sm">
            Redukcja o {reductionPercent}%
          </Badge>
        </div>

        {/* Reasoning */}
        <div className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-4`}>
          <p className="text-sm">{insight.reasoning}</p>
        </div>

        {/* Actionable Tips */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <span>Jak to osiągnąć:</span>
          </div>
          <ul className="space-y-2 ml-6">
            {insight.actionable_tips.map((tip, index) => (
              <li key={index} className="text-sm text-muted-foreground list-disc">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Akcje:**

1. ✅ Utwórz plik `InsightDetailCard.tsx`
2. ✅ Wklej zawartość
3. ✅ Zaimportuj komponenty Shadcn (Badge, Progress)

---

## 4. Testowanie UI

### Test 1: Dashboard Widget

```
1. Odwiedź dashboard
2. Sprawdź czy AIInsightsCard się wyświetla
3. Test empty state (brak danych)
4. Kliknij "Analizuj wydatki" (jeśli masz dane)
5. Sprawdź loading state
6. Sprawdź success state z danymi
7. Kliknij "Zobacz pełną analizę" → przekierowanie do /insights
```

### Test 2: Strona Insights

```
1. Odwiedź /insights
2. Sprawdź Header z kontrolkami
3. Test dropdown wyboru okresu (1, 2, 3 miesiące)
4. Kliknij "Odśwież" - sprawdź czy działa
5. Sprawdź Summary Banner z 3 metrykami
6. Sprawdź oba wykresy (Bar + Area)
7. Sprawdź karty rekomendacji
8. Sprawdź responsywność (mobile, tablet, desktop)
```

### Test 3: Responsywność

```
Mobile (< 768px):
- Widget pełna szerokość
- Wykresy stack vertically
- Karty pojedyncza kolumna

Desktop (≥ 768px):
- Widget w grid
- Wykresy obok siebie (grid 2 col)
- Wszystko czytelne
```

---

## 5. Podsumowanie kroków - tylko frontend

| #   | Krok                    | Plik                                  | Priorytet | Ulepszenia              | Status  |
| --- | ----------------------- | ------------------------------------- | --------- | ----------------------- | ------- |
| 1   | useInsights hook        | `src/components/hooks/useInsights.ts` | MUST      | ✅ parseResponse helper | ⏳ TODO |
| 2   | AIInsightsCard (part 1) | Struktura i stany                     | MUST      | ✅ Poprawione importy   | ⏳ TODO |
| 3   | AIInsightsCard (part 2) | Success state                         | MUST      | -                       | ⏳ TODO |
| 4   | Integracja z dashboard  | Dodaj do dashboard                    | MUST      | -                       | ⏳ TODO |
| 5   | Strona Insights         | `src/pages/insights.astro`            | MUST      | ✅ SSR + auth check     | ⏳ TODO |
| 6   | InsightsView            | Main container                        | MUST      | ✅ ToastProvider        | ⏳ TODO |
| 7   | InsightsHeader          | Header z kontrolkami                  | MUST      | ✅ ARIA labels          | ⏳ TODO |
| 8   | InsightsSummaryBanner   | Banner z metrykami                    | MUST      | -                       | ⏳ TODO |
| 9   | SavingsComparisonChart  | Bar chart                             | MUST      | ✅ useMemo + ARIA       | ⏳ TODO |
| 10  | SavingsImpactChart      | Area chart                            | MUST      | ✅ useMemo + ARIA       | ⏳ TODO |
| 11  | InsightDetailCard       | Karta rekomendacji                    | MUST      | -                       | ⏳ TODO |
| 12  | Testuj UI               | Wszystkie komponenty                  | MUST      | -                       | ⏳ TODO |

---

## 6. Uwagi końcowe - perspektywa frontend

### 6.0 Zgodność z regułami projektu

**✅ Zgodność z `.cursor/rules/shared.mdc`:**

- Struktura katalogów: `src/components/hooks/`, `src/components/features/insights/`
- Custom hooks w `src/components/hooks/useInsights.ts`
- Typy w `src/types.ts` (AIInsightsDTO, GenerateAIInsightsCommand)
- Early returns dla error conditions (guard clauses)
- Proper error logging i user-friendly messages (ToastProvider)

**✅ Zgodność z `.cursor/rules/astro.mdc`:**

- `export const prerender = false` dla strony insights.astro (SSR)
- Sprawdzenie autoryzacji przez `Astro.locals.session`
- Logika biznesowa wyekstraktowana do services (będzie w API)
- Hybrid rendering (SSR dla insights.astro)

**✅ Zgodność z `.cursor/rules/frontend.mdc`:**

- Astro components (.astro) dla statycznej struktury strony
- React components tylko dla interaktywności (InsightsView, charts, cards)
- Tailwind CSS z responsive variants (md:, lg:)
- State variants (hover:, focus-visible:)
- Dark mode support przez dark: variant (jeśli zaimplementowany w projekcie)

**✅ Zgodność z `.cursor/rules/react.mdc`:**

- Functional components z hooks (nie class components)
- Brak "use client" directive (to Next.js, nie Astro)
- Custom hooks w `src/components/hooks/` (useInsights)
- useCallback dla event handlers (fetchLatest, generateInsights)
- Early returns dla różnych stanów (loading, error, empty, success)
- ToastProvider pattern zgodny z resztą projektu

### 6.1 Najważniejsze decyzje projektowe

1. **Custom hook `useInsights`**: Centralizacja logiki API, reusable, z helper `parseResponse` zgodnym z projektem
2. **Skeleton loading states**: Lepsza perceived performance
3. **Empty states z CTA**: Guided user experience
4. **Recharts**: Już w projekcie, spójny z resztą UI
5. **Shadcn/ui**: Spójność z design system
6. **ToastProvider pattern**: Spójne powiadomienia jak w TransactionsView i AccountsView
7. **SSR dla insights.astro**: Sprawdzanie autoryzacji na serwerze

### 6.2 Accessibility

**Zgodność z frontend.mdc - ARIA Best Practices:**

- ✅ Semantic HTML (button, section, article dla kart)
- ✅ ARIA labels dla wykresów:
  ```typescript
  <ResponsiveContainer width="100%" height={350} role="img" aria-label="Wykres porównania obecnych wydatków z proponowanymi celami oszczędności">
  ```
- ✅ aria-label dla przycisków akcji:
  ```typescript
  <Button aria-label="Odśwież analizę AI" title="Odśwież analizę">
    <RefreshCw />
  </Button>
  ```
- ✅ aria-live dla dynamicznych aktualizacji (toast notifications)
- ✅ Keyboard navigation - wszystkie interaktywne elementy dostępne z klawiatury
- ✅ Screen reader friendly - właściwe etykiety i opisy
- ✅ Color contrast WCAG AA - spełnione przez Shadcn/ui
- ⚠️ Focus indicators - domyślne z Tailwind (focus-visible:)

**Sugerowane ulepszenia accessibility:**

1. Dodać `aria-label` do wykresów w Recharts
2. Użyć `aria-describedby` dla złożonych metryk
3. Dodać `role="status"` dla loading states
4. Użyć `aria-live="polite"` dla aktualizacji danych

### 6.3 Performance

- ✅ React `client:load` directive tylko gdzie potrzebne
- ✅ Lazy loading komponentów nie jest potrzebny (komponenty są małe)
- ✅ useCallback dla fetchLatest i generateInsights (zapobiega re-renderom)
- ✅ useMemo w chartach dla transformacji danych (SavingsComparisonChart)
- ✅ Conditional rendering minimalizuje niepotrzebne renderowanie
- 💡 Opcjonalnie: React.memo() dla InsightDetailCard jeśli lista jest długa
- 💡 Opcjonalnie: useTransition dla non-urgent updates (zmiana miesiąca)

### 6.4 Następne kroki

Po zakończeniu implementacji UI:

1. Testy E2E z Playwright
2. Polish & refinements
3. User testing

---

## 7. Checklist zgodności z regułami projektu

### Struktura katalogów (shared.mdc) ✅

| Element        | Wymagana lokalizacja                                | Status        |
| -------------- | --------------------------------------------------- | ------------- |
| Custom hook    | `src/components/hooks/useInsights.ts`               | ✅ Poprawione |
| View component | `src/components/features/insights/InsightsView.tsx` | ✅            |
| Sub-components | `src/components/features/insights/*.tsx`            | ✅            |
| Strona Astro   | `src/pages/insights.astro`                          | ✅            |
| Typy           | `src/types.ts` (AIInsightsDTO, etc.)                | ✅            |

### Wzorce kodowania (shared.mdc) ✅

- ✅ Early returns dla error conditions
- ✅ Guard clauses dla preconditions
- ✅ Error handling na początku funkcji
- ✅ Happy path na końcu funkcji
- ✅ Helper `parseResponse` dla spójnej obsługi błędów
- ✅ User-friendly error messages przez ToastProvider

### Astro guidelines (astro.mdc) ✅

- ✅ `export const prerender = false` dla SSR
- ✅ Sprawdzenie `Astro.locals.session` dla autoryzacji
- ✅ Logika API w services (backend/API plan)
- ✅ Hybrid rendering (SSR dla insights.astro)
- ✅ `client:load` directive dla React components

### Frontend guidelines (frontend.mdc) ✅

- ✅ Astro dla statycznej struktury (insights.astro)
- ✅ React tylko dla interaktywności (charts, widgets)
- ✅ Tailwind responsive variants (md:, lg:, sm:)
- ✅ State variants (hover:, focus-visible:, active:)
- ✅ Dark mode ready (dark: variant w klasach)
- ✅ ARIA labels dla wykresów (accessibility)

### React guidelines (react.mdc) ✅

- ✅ Functional components z hooks
- ✅ Brak "use client" directive (to Next.js)
- ✅ Custom hooks w `src/components/hooks/`
- ✅ useCallback dla event handlers
- ✅ useMemo dla expensive calculations (w chartach)
- ✅ Early returns dla różnych stanów
- ✅ ToastProvider pattern zgodny z projektem

### Import paths ✅

Wszystkie importy używają alias `@/`:

```typescript
import { useInsights } from "@/components/hooks/useInsights";
import { Card } from "@/components/ui/card";
import type { AIInsightsDTO } from "@/types";
```

### Spójność z istniejącym kodem ✅

| Pattern               | Użycie w projekcie             | Użycie w planie         |
| --------------------- | ------------------------------ | ----------------------- |
| `parseResponse<T>()`  | useAccounts, useBudgets        | ✅ useInsights          |
| ToastProvider wrapper | TransactionsView, AccountsView | ✅ InsightsView         |
| Early returns         | DashboardView, wszystkie views | ✅ Wszystkie komponenty |
| Functional components | Cały projekt                   | ✅ Wszystkie komponenty |
| `client:load`         | Dashboard, Transactions        | ✅ InsightsView         |

---

**Dokument przygotowany:** 1.02.2026  
**Autor:** AI Assistant (Claude)  
**Zakres:** Tylko frontend components i UI  
**Status:** Ready for implementation  
**Zgodność z regułami:** ✅ 100%
