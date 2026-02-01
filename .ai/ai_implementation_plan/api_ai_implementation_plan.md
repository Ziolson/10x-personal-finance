# Plan Implementacji API i Backend Services - AI Insights

**Projekt:** 10xPersonal Finance  
**Moduł:** AI Insights & Savings Recommendations  
**Typ dokumentu:** Plan implementacji API i backend services  
**Data utworzenia:** 1 lutego 2026  
**Status:** Draft

---

## 1. Cel dokumentu

Niniejszy dokument definiuje **wyłącznie** kroki związane z implementacją backend services, API endpoints i integracją z OpenRouter/OpenAI dla modułu AI Insights.

**Zakres:** Backend services, API endpoints, OpenRouter integration, Zod validation  
**Nie obejmuje:** Baza danych (migracje, tabele), frontend components

**Powiązane dokumenty:**

- `db_ai_changes_plan.md` - implementacja zmian w bazie danych (prerequisite)
- `views_ai_implementation_plan.md` - implementacja frontend components

**Prerequisites:**

- ✅ Tabela `ai_insights` w bazie danych
- ✅ Typy TypeScript wygenerowane z bazy (`src/db/database.types.ts`)

---

## 2. Przegląd komponentów backend

### 2.1 Nowe pliki

| Plik                                    | Opis                                      | Priorytet |
| --------------------------------------- | ----------------------------------------- | --------- |
| `src/types.ts`                          | Typy AI (DTOs, commands, aggregate data)  | MUST      |
| `src/lib/services/insights.service.ts`  | Główny service dla AI Insights            | MUST      |
| `src/lib/services/openrouter.client.ts` | Klient OpenRouter/OpenAI                  | MUST      |
| `src/pages/api/insights/latest.ts`      | GET endpoint - pobierz ostatnią analizę   | MUST      |
| `src/pages/api/insights/analyze.ts`     | POST endpoint - wygeneruj/odśwież analizę | MUST      |
| `.env.example`                          | Dodaj zmienne OpenRouter                  | MUST      |

### 2.2 Modyfikacje istniejących plików

| Plik              | Modyfikacja                    | Priorytet |
| ----------------- | ------------------------------ | --------- |
| `package.json`    | Dodaj dependency: `openai`     | MUST      |
| `.ai/api-plan.md` | Dokumentacja nowych endpointów | SHOULD    |

---

## 3. Szczegółowy plan implementacji

### KROK 1: Instalacja zależności

**Cel:** Dodanie biblioteki OpenAI SDK (kompatybilnej z OpenRouter)

**Komenda:**

```bash
npm install openai
```

**Wersja:** ^4.62.0 (lub nowsza)

**Akcje:**

1. ✅ Uruchom komendę instalacji
2. ✅ Zweryfikuj że `package.json` zawiera dependency
3. ✅ Uruchom `npm install` żeby zaktualizować lock file

---

### KROK 2: Konfiguracja zmiennych środowiskowych

**Plik:** `.env` (lokalnie) oraz Supabase Dashboard (produkcja)

**Zmienne do dodania:**

```bash
# OpenRouter Configuration
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
AI_MODEL=openai/gpt-4o-mini
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7

# Optional: For OpenRouter rankings
APP_URL=https://your-app-url.com
APP_NAME=10xPersonal Finance
```

**Plik:** `.env.example`

**Dodaj do przykładowego pliku:**

```bash
# OpenRouter Configuration (for AI Insights)
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
AI_MODEL=openai/gpt-4o-mini
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
APP_URL=http://localhost:4321
APP_NAME=10xPersonal Finance
```

**Akcje:**

1. ✅ Utwórz konto na [OpenRouter.ai](https://openrouter.ai/)
2. ✅ Wygeneruj API key
3. ✅ Dodaj zmienne do `.env` lokalnie
4. ✅ Dodaj zmienne do Supabase Dashboard (Settings → Environment Variables)
5. ✅ Zaktualizuj `.env.example`
6. ✅ **Ważne:** Dodaj `.env` do `.gitignore` (jeśli jeszcze nie jest)

---

### KROK 3: Dodanie typów AI do `src/types.ts`

**Plik:** `src/types.ts`

**Opis:** Dodanie wszystkich typów związanych z AI Insights zgodnie z FRD.

**Miejsce:** Na końcu pliku, w nowej sekcji.

**Zawartość do dodania:**

```typescript
// =============================================================================
// AI Insights Types
// =============================================================================

/**
 * AI Insight Entity - Re-export from database types
 */
export type AIInsightEntity = Tables<"ai_insights">;

/**
 * Single AI insight recommendation for a specific category
 */
export interface AIInsight {
  id: string;
  category: string;
  category_id?: string; // Optional reference to categories table (not enforced)
  current_spending: number;
  suggested_target: number;
  potential_savings: number;
  priority: "high" | "medium" | "low";
  reasoning: string;
  actionable_tips: string[];
}

/**
 * Analysis period metadata
 */
export interface AIAnalysisPeriod {
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  months_analyzed: 1 | 2 | 3;
}

/**
 * Complete AI insights summary structure (stored in JSONB)
 */
export interface AIInsightsSummary {
  analysis_period: AIAnalysisPeriod;
  total_spending: number;
  average_monthly_spending: number;
  total_potential_savings: number;
  general_recommendation: string;
  insights: AIInsight[];
  confidence_score?: number; // Optional 0-100
}

/**
 * AI Insights DTO - Response type for AI insights endpoints
 * Omits user_id for security reasons (handled by RLS)
 */
export interface AIInsightsDTO {
  id: string;
  data: AIInsightsSummary;
  generated_at: string;
  months_analyzed: 1 | 2 | 3;
}

/**
 * Generate AI Insights Command - Request payload for generating new insights
 */
export interface GenerateAIInsightsCommand {
  months: 1 | 2 | 3;
  force_refresh?: boolean; // Optional flag to bypass cache
}

/**
 * Aggregated transaction data for AI analysis (input for OpenAI)
 */
export interface AggregatedTransactionData {
  period: {
    start_date: string;
    end_date: string;
    months: number;
  };
  total_spending: number;
  average_monthly_spending: number;
  category_breakdown: {
    category_id: string;
    category_name: string;
    total_amount: number;
    monthly_average: number;
    transaction_count: number;
  }[];
  budgets?: {
    budget_name: string;
    budget_amount: number;
    category_names: string[];
  }[];
}
```

**Akcje:**

1. ✅ Otwórz plik `src/types.ts`
2. ✅ Dodaj nową sekcję na końcu pliku
3. ✅ Wklej powyższe typy
4. ✅ Upewnij się że import `Tables` jest na początku pliku
5. ✅ Zapisz plik i sprawdź czy nie ma błędów TypeScript

---

### KROK 4: Utworzenie OpenRouter Client

**Plik:** `src/lib/services/openrouter.client.ts`

**Opis:** Klient do komunikacji z OpenRouter API używając OpenAI SDK.

**Zawartość:**

```typescript
import OpenAI from "openai";

/**
 * OpenRouter client configuration
 * Uses OpenAI SDK with custom baseURL pointing to OpenRouter
 */
export const openRouterClient = new OpenAI({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
  baseURL: import.meta.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": import.meta.env.APP_URL || "",
    "X-Title": import.meta.env.APP_NAME || "10xPersonal Finance",
  },
});

/**
 * AI Model configuration
 */
export const AI_CONFIG = {
  model: import.meta.env.AI_MODEL || "openai/gpt-4o-mini",
  maxTokens: parseInt(import.meta.env.AI_MAX_TOKENS || "2000", 10),
  temperature: parseFloat(import.meta.env.AI_TEMPERATURE || "0.7"),
} as const;
```

**Akcje:**

1. ✅ Utwórz katalog `src/lib/services/` jeśli nie istnieje
2. ✅ Utwórz plik `openrouter.client.ts`
3. ✅ Wklej powyższą zawartość
4. ✅ Zweryfikuj że zmienne środowiskowe są dostępne

---

### KROK 5: Utworzenie Insights Service (część 1 - pomocnicze funkcje)

**Plik:** `src/lib/services/insights.service.ts`

**Opis:** Service zawierający całą logikę biznesową dla AI Insights.

**Część 1: Struktura i pomocnicze funkcje**

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { AIInsightsSummary, AIInsightsDTO, AggregatedTransactionData, GenerateAIInsightsCommand } from "../../types";
import { openRouterClient, AI_CONFIG } from "./openrouter.client";

/**
 * Insights Service
 * Handles all business logic for AI-powered savings recommendations
 */
export class InsightsService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Check if user has enough transaction data for AI analysis
   * Minimum: 28 days (1 full month) of transactions
   */
  async hasEnoughData(userId: string): Promise<boolean> {
    // Get earliest transaction date
    const { data: transactions, error } = await this.supabase
      .from("transactions")
      .select("date")
      .eq("user_id", userId)
      .eq("type", "expense")
      .order("date", { ascending: true })
      .limit(1);

    if (error || !transactions || transactions.length === 0) {
      return false;
    }

    const earliestDate = new Date(transactions[0].date);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24));

    return daysDiff >= 28; // At least 28 days
  }

  /**
   * Get the latest cached AI insights for user
   */
  async getLatestInsights(userId: string): Promise<AIInsightsDTO | null> {
    const { data, error } = await this.supabase.from("ai_insights").select("id, data, generated_at, months_analyzed").eq("user_id", userId).single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      data: data.data as AIInsightsSummary,
      generated_at: data.generated_at,
      months_analyzed: data.months_analyzed as 1 | 2 | 3,
    };
  }

  /**
   * Check if cached insights are fresh (less than 24 hours old)
   */
  isCacheFresh(generatedAt: string): boolean {
    const generated = new Date(generatedAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - generated.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 24;
  }
}
```

**Akcje:**

1. ✅ Utwórz plik `src/lib/services/insights.service.ts`
2. ✅ Wklej powyższą zawartość (część 1)
3. ✅ Zweryfikuj importy

---

### KROK 6: Insights Service (część 2 - agregacja danych)

**Dodaj do pliku:** `src/lib/services/insights.service.ts`

**Zawartość do dodania (w klasie `InsightsService`):**

```typescript
  /**
   * Aggregate transaction data for AI analysis
   * Groups expenses by category over specified period
   */
  async aggregateTransactionsForAI(
    userId: string,
    months: 1 | 2 | 3
  ): Promise<AggregatedTransactionData> {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Format dates as YYYY-MM-DD
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Fetch all expense transactions in period
    const { data: transactions, error: txError } = await this.supabase
      .from('transactions')
      .select(`
        amount,
        date,
        category_id,
        categories (
          id,
          name,
          budget_id,
          budgets (
            id,
            name,
            amount
          )
        )
      `)
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', startDateStr)
      .lte('date', endDateStr);

    if (txError || !transactions) {
      throw new Error('Failed to fetch transactions for AI analysis');
    }

    // Calculate totals
    const totalSpending = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const averageMonthlySpending = totalSpending / months;

    // Group by category
    const categoryMap = new Map<
      string,
      {
        category_id: string;
        category_name: string;
        total_amount: number;
        transaction_count: number;
      }
    >();

    for (const tx of transactions) {
      const categoryId = tx.category_id || 'uncategorized';
      const categoryName = tx.categories?.name || 'Uncategorized';

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          category_id: categoryId,
          category_name: categoryName,
          total_amount: 0,
          transaction_count: 0,
        });
      }

      const entry = categoryMap.get(categoryId)!;
      entry.total_amount += Number(tx.amount);
      entry.transaction_count += 1;
    }

    // Convert to array and add monthly average
    const categoryBreakdown = Array.from(categoryMap.values())
      .map((cat) => ({
        ...cat,
        monthly_average: cat.total_amount / months,
      }))
      .sort((a, b) => b.total_amount - a.total_amount); // Sort by total spending (descending)

    // Extract budget information (if any)
    const budgetMap = new Map<string, { budget_name: string; budget_amount: number; category_names: string[] }>();

    for (const tx of transactions) {
      if (tx.categories?.budgets) {
        const budget = tx.categories.budgets;
        const budgetId = budget.id;

        if (!budgetMap.has(budgetId)) {
          budgetMap.set(budgetId, {
            budget_name: budget.name,
            budget_amount: Number(budget.amount),
            category_names: [],
          });
        }

        const budgetEntry = budgetMap.get(budgetId)!;
        if (!budgetEntry.category_names.includes(tx.categories.name)) {
          budgetEntry.category_names.push(tx.categories.name);
        }
      }
    }

    const budgets = Array.from(budgetMap.values());

    return {
      period: {
        start_date: startDateStr,
        end_date: endDateStr,
        months,
      },
      total_spending: totalSpending,
      average_monthly_spending: averageMonthlySpending,
      category_breakdown: categoryBreakdown,
      budgets: budgets.length > 0 ? budgets : undefined,
    };
  }
```

**Akcje:**

1. ✅ Dodaj metodę do klasy `InsightsService`
2. ✅ Zweryfikuj że typy są poprawne
3. ✅ Test lokalnie z przykładowymi danymi

---

### KROK 7: Insights Service (część 3 - komunikacja z AI)

**Dodaj do pliku:** `src/lib/services/insights.service.ts`

**Zawartość do dodania (w klasie `InsightsService`):**

```typescript
  /**
   * System prompt for OpenAI
   */
  private readonly SYSTEM_PROMPT = `Jesteś ekspertem finansowym pomagającym użytkownikom aplikacji do zarządzania finansami osobistymi.

Analizuj dane o wydatkach i proponuj KONKRETNE, REALISTYCZNE sposoby oszczędzania pieniędzy.

Zasady:
- Bądź empatyczny i wspierający
- Dawaj konkretne liczby
- Sugeruj małe zmiany (łatwiejsze do wdrożenia)
- Nie krytykuj, tylko proponuj
- Uwzględniaj polskie realia (PLN, lokalne zwyczaje)
- Format odpowiedzi: JSON według podanego schematu
- Znajdź 3-5 najlepszych możliwości oszczędności
- Priorytetyzuj kategorie z największym potencjałem oszczędności`;

  /**
   * Generate user prompt from aggregated data
   */
  private generateUserPrompt(data: AggregatedTransactionData): string {
    const categoryList = data.category_breakdown
      .map((cat) => `- ${cat.category_name}: ${cat.monthly_average.toFixed(2)} PLN/mc`)
      .join('\n');

    const budgetList = data.budgets
      ? data.budgets
          .map((b) => `- ${b.budget_name}: ${b.budget_amount} PLN (kategorie: ${b.category_names.join(', ')})`)
          .join('\n')
      : 'Brak zdefiniowanych budżetów';

    return `Przeanalizuj wydatki użytkownika z ostatnich ${data.period.months} miesięcy:

Okres: ${data.period.start_date} - ${data.period.end_date}
Całkowite wydatki: ${data.total_spending.toFixed(2)} PLN
Średnio miesięcznie: ${data.average_monthly_spending.toFixed(2)} PLN

Wydatki według kategorii:
${categoryList}

Budżety użytkownika:
${budgetList}

Znajdź 3-5 najlepszych możliwości oszczędności i wyjaśnij każdą w sposób praktyczny i motywujący.

Zwróć odpowiedź w formacie JSON zgodnie ze schematem:
{
  "analysis_period": {
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD",
    "months_analyzed": number
  },
  "total_spending": number,
  "average_monthly_spending": number,
  "total_potential_savings": number,
  "general_recommendation": "string",
  "insights": [
    {
      "id": "string",
      "category": "string",
      "current_spending": number,
      "suggested_target": number,
      "potential_savings": number,
      "priority": "high" | "medium" | "low",
      "reasoning": "string (1-2 zdania)",
      "actionable_tips": ["string", "string", ...]
    }
  ]
}`;
  }

  /**
   * Call OpenAI API to generate insights
   */
  private async callOpenAI(aggregatedData: AggregatedTransactionData): Promise<AIInsightsSummary> {
    try {
      const response = await openRouterClient.chat.completions.create({
        model: AI_CONFIG.model,
        messages: [
          { role: 'system', content: this.SYSTEM_PROMPT },
          { role: 'user', content: this.generateUserPrompt(aggregatedData) },
        ],
        temperature: AI_CONFIG.temperature,
        max_tokens: AI_CONFIG.maxTokens,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from AI');
      }

      const parsed = JSON.parse(content) as AIInsightsSummary;

      // Validate structure (basic validation)
      if (!parsed.insights || !Array.isArray(parsed.insights)) {
        throw new Error('Invalid AI response structure');
      }

      return parsed;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate AI insights');
    }
  }
```

**Akcje:**

1. ✅ Dodaj metody do klasy `InsightsService`
2. ✅ Zweryfikuj że prompt jest zgodny z FRD
3. ✅ Test z przykładowymi danymi

---

### KROK 8: Insights Service (część 4 - zapis do DB i główna logika)

**Dodaj do pliku:** `src/lib/services/insights.service.ts`

**Zawartość do dodania (w klasie `InsightsService`):**

```typescript
  /**
   * Save AI insights to database (upsert)
   */
  private async saveInsights(
    userId: string,
    insights: AIInsightsSummary,
    months: 1 | 2 | 3
  ): Promise<void> {
    const { error } = await this.supabase
      .from('ai_insights')
      .upsert(
        {
          user_id: userId,
          data: insights as any, // Cast to any for JSONB
          months_analyzed: months,
          generated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      );

    if (error) {
      console.error('Failed to save insights:', error);
      throw new Error('Failed to save AI insights to database');
    }
  }

  /**
   * Main orchestrator: Generate or retrieve AI insights
   */
  async generateInsights(
    userId: string,
    command: GenerateAIInsightsCommand
  ): Promise<AIInsightsDTO> {
    const { months, force_refresh = false } = command;

    // Check if user has enough data
    const hasData = await this.hasEnoughData(userId);
    if (!hasData) {
      throw new Error('Insufficient data for AI analysis. Need at least 1 month of transactions.');
    }

    // Check cache if not forcing refresh
    if (!force_refresh) {
      const cached = await this.getLatestInsights(userId);
      if (cached && this.isCacheFresh(cached.generated_at)) {
        return cached;
      }
    }

    // Generate new insights
    const aggregatedData = await this.aggregateTransactionsForAI(userId, months);
    const aiInsights = await this.callOpenAI(aggregatedData);
    await this.saveInsights(userId, aiInsights, months);

    // Return fresh insights
    const result = await this.getLatestInsights(userId);
    if (!result) {
      throw new Error('Failed to retrieve saved insights');
    }

    return result;
  }
}
```

**Akcje:**

1. ✅ Dodaj metody do klasy `InsightsService`
2. ✅ Zweryfikuj logikę cache
3. ✅ Test całego flow end-to-end

---

### KROK 9: Utworzenie API Endpoint - GET /api/insights/latest

**Plik:** `src/pages/api/insights/latest.ts`

**Opis:** Endpoint do pobierania ostatniej cache'owanej analizy.

**Zawartość:**

```typescript
import type { APIRoute } from "astro";
import { InsightsService } from "../../../lib/services/insights.service";

export const GET: APIRoute = async ({ locals }) => {
  try {
    const supabase = locals.supabase;

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get latest insights
    const insightsService = new InsightsService(supabase);
    const insights = await insightsService.getLatestInsights(user.id);

    if (!insights) {
      return new Response(JSON.stringify({ error: "No insights available yet" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(insights), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GET /api/insights/latest error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

**Akcje:**

1. ✅ Utwórz katalog `src/pages/api/insights/`
2. ✅ Utwórz plik `latest.ts`
3. ✅ Wklej powyższą zawartość
4. ✅ Test endpoint: `GET http://localhost:4321/api/insights/latest`

---

### KROK 10: Utworzenie API Endpoint - POST /api/insights/analyze

**Plik:** `src/pages/api/insights/analyze.ts`

**Opis:** Endpoint do generowania/odświeżania analizy AI.

**Zawartość:**

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { InsightsService } from "../../../lib/services/insights.service";
import type { GenerateAIInsightsCommand } from "../../../types";

// Zod schema for request validation
const GenerateInsightsSchema = z.object({
  months: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  force_refresh: z.boolean().optional(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const supabase = locals.supabase;

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = GenerateInsightsSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const command: GenerateAIInsightsCommand = validationResult.data;

    // Generate insights
    const insightsService = new InsightsService(supabase);
    const insights = await insightsService.generateInsights(user.id, command);

    return new Response(JSON.stringify(insights), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("POST /api/insights/analyze error:", error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes("Insufficient data")) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (error.message.includes("Failed to generate AI insights")) {
        return new Response(JSON.stringify({ error: "AI service temporarily unavailable. Please try again later." }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

**Akcje:**

1. ✅ Utwórz plik `analyze.ts` w `src/pages/api/insights/`
2. ✅ Wklej powyższą zawartość
3. ✅ Test endpoint: `POST http://localhost:4321/api/insights/analyze`

---

### KROK 11: Aktualizacja dokumentacji API

**Plik:** `.ai/api-plan.md`

**Dodaj nową sekcję:**

````markdown
### 2.7. AI Insights

Resource Path: `/api/insights`

---

- **`GET /api/insights/latest`**
  - **Description**: Retrieves the latest cached AI insights for the authenticated user.
  - **Response Payload (200 OK)**:
    ```json
    {
      "id": "uuid",
      "data": {
        "analysis_period": {
          "start_date": "2025-11-01",
          "end_date": "2026-01-31",
          "months_analyzed": 3
        },
        "total_spending": 37500,
        "average_monthly_spending": 12500,
        "total_potential_savings": 850,
        "general_recommendation": "Widzę kilka obszarów...",
        "insights": [
          {
            "id": "ins_1",
            "category": "Jedzenie",
            "current_spending": 3500,
            "suggested_target": 3100,
            "potential_savings": 400,
            "priority": "high",
            "reasoning": "Wydajesz 3500 PLN miesięcznie...",
            "actionable_tips": ["...", "..."]
          }
        ]
      },
      "generated_at": "2026-02-01T10:00:00Z",
      "months_analyzed": 3
    }
    ```
  - **Error Codes**: `404 Not Found` (no insights available yet).

- **`POST /api/insights/analyze`**
  - **Description**: Generates a new AI analysis or returns cached result if fresh (< 24h) and not forcing refresh.
  - **Request Payload**:
    ```json
    {
      "months": 3,
      "force_refresh": false
    }
    ```
  - **Response Payload (200 OK)**: Same as GET /api/insights/latest.
  - **Error Codes**:
    - `400 Bad Request` (validation error, insufficient data)
    - `503 Service Unavailable` (AI service error)
    - `500 Internal Server Error` (other errors)
````

**Akcje:**

1. ✅ Otwórz plik `.ai/api-plan.md`
2. ✅ Znajdź sekcję 1 (Resources) i dodaj AI Insights
3. ✅ Dodaj sekcję 2.7 z endpointami
4. ✅ Zapisz plik

---

## 4. Testowanie API

### Test 1: Sprawdź czy backend działa

```bash
# Start dev server
npm run dev

# Test GET (przed wygenerowaniem - powinno być 404)
curl -X GET http://localhost:4321/api/insights/latest \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Oczekiwany wynik: 404 Not Found
```

### Test 2: Wygeneruj pierwszą analizę

```bash
# Test POST (wygeneruj analizę)
curl -X POST http://localhost:4321/api/insights/analyze \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"months": 3, "force_refresh": false}'

# Oczekiwany wynik: 200 OK z danymi AI
```

### Test 3: Pobierz cache'owaną analizę

```bash
# Test GET (po wygenerowaniu - powinno być 200)
curl -X GET http://localhost:4321/api/insights/latest \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Oczekiwany wynik: 200 OK z tymi samymi danymi
```

### Test 4: Wymuś odświeżenie

```bash
# Test POST z force_refresh
curl -X POST http://localhost:4321/api/insights/analyze \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"months": 2, "force_refresh": true}'

# Oczekiwany wynik: 200 OK z nowymi danymi (2 miesiące zamiast 3)
```

---

## 5. Podsumowanie kroków - tylko API/backend

| #   | Krok                     | Plik/Akcja                              | Priorytet | Status  |
| --- | ------------------------ | --------------------------------------- | --------- | ------- |
| 1   | Instaluj OpenAI SDK      | `npm install openai`                    | MUST      | ⏳ TODO |
| 2   | Konfiguruj env vars      | `.env`, `.env.example`                  | MUST      | ⏳ TODO |
| 3   | Dodaj typy AI            | `src/types.ts`                          | MUST      | ⏳ TODO |
| 4   | Utwórz OpenRouter client | `src/lib/services/openrouter.client.ts` | MUST      | ⏳ TODO |
| 5   | InsightsService (cz. 1)  | Pomocnicze funkcje                      | MUST      | ⏳ TODO |
| 6   | InsightsService (cz. 2)  | Agregacja danych                        | MUST      | ⏳ TODO |
| 7   | InsightsService (cz. 3)  | Komunikacja z AI                        | MUST      | ⏳ TODO |
| 8   | InsightsService (cz. 4)  | Główna logika                           | MUST      | ⏳ TODO |
| 9   | GET endpoint             | `/api/insights/latest`                  | MUST      | ⏳ TODO |
| 10  | POST endpoint            | `/api/insights/analyze`                 | MUST      | ⏳ TODO |
| 11  | Zaktualizuj docs         | `.ai/api-plan.md`                       | SHOULD    | ⏳ TODO |
| 12  | Testuj API               | curl/Postman                            | MUST      | ⏳ TODO |

---

## 6. Uwagi końcowe - perspektywa API/backend

### 6.1 Najważniejsze decyzje projektowe

1. **OpenAI SDK z OpenRouter**: Używamy oficjalnego SDK z customowym baseURL
2. **InsightsService jako klasa**: Dependency injection Supabase client dla testowania
3. **Cache w DB**: Sprawdzamy freshness (24h) przed regeneracją
4. **Zod validation**: Walidacja request body w endpoints
5. **Error handling**: Dedykowane komunikaty dla różnych typów błędów

### 6.2 Potencjalne problemy

| Problem                      | Rozwiązanie                                  |
| ---------------------------- | -------------------------------------------- |
| OpenRouter timeout           | Zwiększ `max_tokens` lub dodaj retry logic   |
| AI zwraca nieprawidłowy JSON | Dodaj Zod schema validation dla AI response  |
| Rate limiting OpenRouter     | Implementuj exponential backoff              |
| User ma 0 transakcji         | `hasEnoughData()` zwraca false, zwracamy 400 |

### 6.3 Następne kroki

Po zakończeniu implementacji API:

1. **`views_ai_implementation_plan.md`** - implementacja frontend components
2. Testy E2E z Playwright
3. Monitoring i logging (opcjonalnie)

---

**Dokument przygotowany:** 1.02.2026  
**Autor:** AI Assistant (Claude)  
**Zakres:** Tylko API i backend services  
**Status:** Ready for implementation
