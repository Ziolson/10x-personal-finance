# FRD - AI Rekomendacje Oszczędnościowe
## Functional Requirements Document

**Projekt:** 10xPersonal Finance  
**Moduł:** AI Insights & Savings Recommendations  
**Wersja:** 1.0 (Proof of Concept)  
**Data utworzenia:** 1 lutego 2026  
**Status:** Draft

---

## 1. Wstęp

### 1.1 Cel dokumentu

Niniejszy dokument definiuje wymagania funkcjonalne dla modułu AI Rekomendacji Oszczędnościowych w aplikacji 10xPersonal Finance. Moduł ma na celu wykorzystanie sztucznej inteligencji do analizy historycznych wydatków użytkownika i generowania spersonalizowanych, actionable rekomendacji gdzie można zaoszczędzić.

### 1.2 Zakres funkcjonalności

Jest to implementacja **Proof of Concept** - podstawowa wersja funkcjonalności AI, która:
- Analizuje wydatki użytkownika z ostatnich 1-3 miesięcy
- Generuje spersonalizowane rekomendacje oszczędnościowe
- Prezentuje wyniki w formie wizualnej (wykresy + karty rekomendacji)
- Umożliwia projekcję oszczędności w czasie
- Cache'uje wyniki w bazie danych dla lepszej wydajności i UX

### 1.3 Kontekst biznesowy

**Problem:** Użytkownicy nie wiedzą, gdzie mogą zoptymalizować swoje wydatki i ile realistycznie mogą zaoszczędzić, co prowadzi do frustracji i braku motywacji do zmian.

**Rozwiązanie:** AI analizuje wzorce wydatków i proponuje konkretne, realistyczne cele oszczędnościowe z praktycznymi wskazówkami ich osiągnięcia.

**Wartość:** 
- Natychmiastowy "wow effect" pokazujący wartość aplikacji
- Motywacja użytkowników do dalszego śledzenia transakcji
- Wyróżnik na tle konkurencji
- Fundament pod przyszłe zaawansowane funkcje AI

---

## 2. Wymagania funkcjonalne

### 2.1 Generowanie rekomendacji AI

**ID:** FR-AI-001  
**Priorytet:** MUST HAVE (MVP)

**Opis:**  
System musi umożliwiać użytkownikowi wygenerowanie analizy AI jego wydatków z ostatnich 1-3 miesięcy.

**Szczegóły:**
- Użytkownik wybiera okres analizy: 1, 2 lub 3 miesiące (domyślnie 3)
- Minimum wymagane: 1 pełny miesiąc transakcji (co najmniej 28 dni)
- System pobiera dane o wydatkach z wybranego okresu
- System agreguje dane według kategorii
- System wysyła zagregowane dane do AI (nie pojedyncze transakcje - privacy)
- AI (GPT-4o-mini) zwraca strukturowane rekomendacje w formacie JSON
- System zapisuje wyniki w bazie danych z timestampem

**Warunki brzegowe:**
- Jeśli użytkownik ma mniej niż 1 miesiąc danych → wyświetl komunikat "Potrzebujesz co najmniej miesiąca historii transakcji"
- Jeśli użytkownik nie ma żadnych wydatków → wyświetl komunikat "Brak wydatków do analizy"
- Jeśli API AI zwróci błąd → wyświetl przyjazny komunikat + możliwość retry
- Jeśli istnieje świeża analiza (< 24h) → pokaż z cache, ale umożliw odświeżenie

**Kryteria akceptacji:**
1. Użytkownik z 1+ miesiącem danych może wygenerować analizę
2. Podczas generowania wyświetlany jest loading indicator
3. Proces nie trwa dłużej niż 10 sekund
4. Wyniki są zapisywane w bazie danych
5. Komunikaty błędów są przyjazne i zrozumiałe

---

### 2.2 Cache'owanie rekomendacji w bazie danych

**ID:** FR-AI-002  
**Priorytet:** MUST HAVE (MVP)

**Opis:**  
System zapisuje wygenerowane rekomendacje AI w bazie danych, aby użytkownik mógł je przeglądać bez potrzeby regeneracji.

**Szczegóły:**
- Każda wygenerowana analiza jest zapisywana w tabeli `ai_insights`
- Jeden użytkownik ma tylko jedną aktywną analizę (upsert)
- Analiza zawiera: dane JSON, timestamp generowania, okres analizy
- System automatycznie pobiera ostatnią analizę przy wejściu na dashboard lub /insights
- Użytkownik może ręcznie odświeżyć analizę (przycisk "Odśwież")
- Po odświeżeniu: nowa analiza zastępuje starą w bazie

**Korzyści:**
- ✅ Użytkownik widzi ostatnią analizę bez czekania
- ✅ Redukcja kosztów API (nie generujemy za każdym razem)
- ✅ Lepsza wydajność (instant load z DB)
- ✅ Możliwość późniejszej analizy historii rekomendacji (v2.0)

**Kryteria akceptacji:**
1. Po wygenerowaniu, analiza jest zapisana w bazie
2. Przy ponownym wejściu użytkownik widzi ostatnią analizę natychmiast
3. Timestamp "Ostatnia analiza: X godz. temu" jest wyświetlany
4. Przycisk "Odśwież" regeneruje analizę i aktualizuje bazę
5. Stara analiza jest nadpisywana przez nową

---

### 2.3 Prezentacja rekomendacji na dashboardzie (Compact View)

**ID:** FR-AI-003  
**Priorytet:** MUST HAVE (MVP)

**Opis:**  
Dashboard zawiera kompaktowy widget z podsumowaniem rekomendacji AI.

**Szczegóły:**
- Widget "Rekomendacje AI" wyświetlany na dashboardzie
- Zawartość widgetu:
  - Ikona AI (mózg/sparkles)
  - Tytuł: "Możliwości oszczędności"
  - Główna metryka: Całkowita kwota potencjalnych oszczędności/miesiąc (duża, wyróżniona)
  - Top rekomendacja: kategoria, kwota oszczędności, krótkie wyjaśnienie (1-2 zdania)
  - Przycisk CTA: "Zobacz pełną analizę" (link do /insights)
  - Timestamp: "Ostatnia analiza: X godz. temu"
  - Przycisk "Odśwież" (ikona)

**Stan "Empty State":**
- Jeśli brak danych do analizy:
  - Komunikat: "Potrzebujesz co najmniej miesiąca danych, aby AI mogło przeprowadzić analizę"
  - Przycisk "Analizuj wydatki" jest disabled
  
- Jeśli użytkownik ma dane ale nie wygenerował jeszcze analizy:
  - Komunikat: "Dowiedz się gdzie możesz zaoszczędzić"
  - Przycisk "Analizuj wydatki" jest enabled
  
**Stan "Loading":**
- Skeleton UI z animacją ładowania podczas regeneracji

**Kryteria akceptacji:**
1. Widget wyświetla się poprawnie na desktop i mobile
2. Główna metryka jest czytelna i wyróżniona
3. Kliknięcie "Zobacz pełną analizę" przenosi do /insights
4. Kliknięcie "Odśwież" regeneruje analizę
5. Empty state wyświetla się gdy brak danych lub analizy
6. Dane są pobierane z cache (baza danych) jeśli istnieją

---

### 2.4 Dedykowana strona rekomendacji (/insights)

**ID:** FR-AI-004  
**Priorytet:** MUST HAVE (MVP)

**Opis:**  
Dedykowana strona z pełną analizą AI i wszystkimi rekomendacjami.

**Struktura strony:**

#### A. Header
- Tytuł: "Rekomendacje AI"
- Opis: Ogólna rekomendacja AI (1-2 zdania)
- Kontrolki:
  - Dropdown wyboru okresu (1, 2, 3 miesiące)
  - Przycisk "Odśwież" z ikoną

#### B. Summary Banner (gradient purple-to-pink)
Trzy metryki obok siebie:
- **Analizowany okres:** X miesiące/miesiąc
- **Średnie wydatki:** X PLN/mc
- **Możesz zaoszczędzić:** X PLN/mc (największa, wyróżniona)

#### C. Wykresy (grid 2 kolumny na desktop, 1 na mobile)

**Wykres 1: Porównanie wydatków (Bar Chart)**
- Oś X: Kategorie wydatków
- Oś Y: Kwota w PLN
- Dwa słupki obok siebie dla każdej kategorii:
  - Szary: Obecne wydatki
  - Kolorowy (według priorytetu): Proponowany cel
- Tooltip: Pokazuje obie kwoty + oszczędność
- Legenda priorytetów (czerwony=wysoki, pomarańczowy=średni, niebieski=niski)

**Wykres 2: Projekcja w czasie (Area Chart)**
- Oś X: Miesiące (12 miesięcy)
- Oś Y: Skumulowane wydatki
- Dwie linie:
  - Szara (z półprzezroczystym wypełnieniem): Bez optymalizacji
  - Zielona (z półprzezroczystym wypełnieniem): Z optymalizacją
- Tooltip: Pokazuje obie wartości + zaoszczędzoną kwotę
- Nad wykresem: 3 karty z metrykami (za 3 mc, za 6 mc, za rok)

#### D. Szczegółowe rekomendacje
Lista kart, każda zawiera:
- Numer rankingu (1, 2, 3...) w kółku
- Nazwa kategorii
- Badge priorytetu (wysoki/średni/niski) z odpowiednim kolorem
- Kwota oszczędności (duża, fioletowa) z tekstem "/miesiąc"
- Obecne wydatki (kwota + progress bar 100%)
- Proponowany cel (kwota + progress bar) z ikoną celu
- Procent redukcji (np. "Redukcja o 15%")
- Box z wyjaśnieniem (tło zależne od priorytetu)
- Lista actionable tips (2-4 punkty) z ikoną żarówki

**Kryteria akceptacji:**
1. Strona dostępna pod /insights
2. Responsive design (desktop + mobile)
3. Wszystkie wykresy poprawnie wyświetlają dane
4. Tooltips działają prawidłowo
5. Zmiana okresu analizy regeneruje całą analizę
6. Rekomendacje posortowane według priorytetu (high → low)
7. Wszystkie kolory zgodne z design system (Tailwind)
8. Dane są pobierane z cache (baza danych)

---

### 2.5 Struktura danych AI

**ID:** FR-AI-005  
**Priorytet:** MUST HAVE (MVP)

**Opis:**  
Definicja struktury danych zwracanej przez AI i przechowywanych w aplikacji.

**TypeScript Types:**

```typescript
interface AIInsight {
  id: string; // unique identifier
  category: string; // nazwa kategorii
  category_id?: string; // ID z bazy danych
  current_spending: number; // obecne wydatki
  suggested_target: number; // proponowany cel
  potential_savings: number; // oszczędności (current - target)
  priority: 'high' | 'medium' | 'low';
  reasoning: string; // 1-2 zdania wyjaśnienia
  actionable_tips: string[]; // 2-4 konkretne wskazówki
}

interface AIInsightsSummary {
  analysis_period: {
    start_date: string; // YYYY-MM-DD
    end_date: string; // YYYY-MM-DD
    months_analyzed: number; // 1, 2, lub 3
  };
  total_spending: number;
  average_monthly_spending: number;
  total_potential_savings: number;
  insights: AIInsight[]; // posortowane po priority
  general_recommendation: string; // ogólna rada
  confidence_score?: number; // opcjonalnie 0-100
}

interface AIInsightsResponse {
  data: AIInsightsSummary;
  generated_at: string; // ISO timestamp
}
```

**Kryteria akceptacji:**
1. Wszystkie typy są zgodne z TypeScript strict mode
2. Dane są walidowane po otrzymaniu z AI
3. Struktura jest gotowa na rozszerzenia (np. confidence_score)

---

## 3. Wymagania dotyczące AI

### 3.1 Wybór modelu AI

**Model:** GPT-4o-mini (przez OpenRouter)

**Uzasadnienie:**
- Wystarczająca inteligencja do analizy finansowej
- Niski koszt
- Szybka odpowiedź (< 5 sekunds)
- Structured output (JSON mode)
- Bardzo dobry stosunek jakości do ceny
- OpenRouter jako unified interface do różnych providerów

**Parametry API:**
```javascript
{
  model: "openai/gpt-4o-mini",
  temperature: 0.7,
  max_tokens: 2000,
  response_format: { type: "json_object" }
}
```

### 3.2 Struktura promptu

**System Prompt:**
```
Jesteś ekspertem finansowym pomagającym użytkownikom 
aplikacji do zarządzania finansami osobistymi.

Analizuj dane o wydatkach i proponuj KONKRETNE, 
REALISTYCZNE sposoby oszczędzania pieniędzy.

Zasady:
- Bądź empatyczny i wspierający
- Dawaj konkretne liczby
- Sugeruj małe zmiany (łatwiejsze do wdrożenia)
- Nie krytykuj, tylko proponuj
- Uwzględniaj polskie realia (PLN, lokalne zwyczaje)
- Format odpowiedzi: JSON według podanego schematu
- Znajdź 3-5 najlepszych możliwości oszczędności
- Priorytetyzuj kategorie z największym potencjałem oszczędności
```

**User Prompt:**
```
Przeanalizuj wydatki użytkownika z ostatnich {X} miesięcy:

Okres: {start_date} - {end_date}
Całkowite wydatki: {total_spending} PLN
Średnio miesięcznie: {avg_monthly} PLN

Wydatki według kategorii:
{category_breakdown}

Budżety użytkownika (jeśli istnieją):
{budgets}

Znajdź 3-5 najlepszych możliwości oszczędności i wyjaśnij
każdą w sposób praktyczny i motywujący.

Zwróć odpowiedź w formacie JSON zgodnie ze schematem:
{json_schema}
```

**Dane wysyłane do AI:**
- ✅ Zagregowane sumy według kategorii
- ✅ Informacje o budżetach
- ✅ Okres analizy
- ❌ NIE wysyłamy pojedynczych transakcji
- ❌ NIE wysyłamy opisów transakcji
- ❌ NIE wysyłamy danych osobowych

### 3.3 Privacy & Security

**Zasady:**
- Dane są anonimizowane przed wysyłką
- Nie przechowujemy danych w systemach AI providera
- User consent nie jest wymagany (przesyłamy tylko agregaty, nie dane osobowe)
- Compliance z GDPR
- Wyniki cache'owane w naszej bazie danych
- OpenRouter jako pośrednik zapewnia dodatkową warstwę abstrakcji

---

### 4.1 Tabela ai_insights

**ID:** FR-DB-001  
**Priorytet:** MUST HAVE (MVP)

**Schemat tabeli:**

```sql
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  months_analyzed INTEGER NOT NULL CHECK (months_analyzed IN (1, 2, 3)),
  CONSTRAINT one_insight_per_user UNIQUE(user_id)
);

-- Index dla szybkiego pobierania
CREATE INDEX idx_ai_insights_user_id ON ai_insights(user_id);

-- Index dla JSONB queries (jeśli będziemy filtrować po danych w przyszłości)
CREATE INDEX idx_ai_insights_data ON ai_insights USING gin(data);
```

**Wyjaśnienie:**
- `id` - UUID primary key
- `user_id` - foreign key do tabeli profiles
- `data` - JSONB z całą analizą AI (elastyczne, łatwo rozszerzać)
- `generated_at` - timestamp automatyczny
- `months_analyzed` - ile miesięcy analizowano (1, 2, lub 3)
- `UNIQUE(user_id)` - jeden użytkownik = jedna aktywna analiza (upsert)

**Operacje:**

```sql
-- INSERT lub UPDATE (upsert)
INSERT INTO ai_insights (user_id, data, months_analyzed)
VALUES ($1, $2, $3)
ON CONFLICT (user_id) 
DO UPDATE SET 
  data = EXCLUDED.data,
  generated_at = NOW(),
  months_analyzed = EXCLUDED.months_analyzed;

-- SELECT ostatniej analizy
SELECT * FROM ai_insights WHERE user_id = $1;

-- DELETE (gdy użytkownik usuwa konto - CASCADE)
-- Automatyczne przez ON DELETE CASCADE
```

### 4.2 Row Level Security (RLS)

**Wymagane polityki:**

```sql
-- Enable RLS
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Policy: użytkownik widzi tylko swoje insighty
CREATE POLICY "Users can view their own insights"
ON ai_insights FOR SELECT
USING (auth.uid() = user_id);

-- Policy: użytkownik może wstawiać swoje insighty
CREATE POLICY "Users can insert their own insights"
ON ai_insights FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: użytkownik może aktualizować swoje insighty
CREATE POLICY "Users can update their own insights"
ON ai_insights FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: użytkownik może usuwać swoje insighty
CREATE POLICY "Users can delete their own insights"
ON ai_insights FOR DELETE
USING (auth.uid() = user_id);
```

**Kryteria akceptacji:**
1. Tabela ai_insights istnieje w bazie danych
2. RLS jest włączone i polityki działają
3. Użytkownik nie może widzieć insightów innych użytkowników
4. Upsert działa poprawnie (nie tworzy duplikatów)

---

## 5. Wymagania UI/UX

### 5.1 Komponenty React

**Struktura komponentów:**

```
src/components/features/
├── dashboard/
│   └── AIInsightsCard.tsx          # Widget na dashboardzie
└── insights/
    ├── InsightsView.tsx             # Główny widok strony
    ├── InsightDetailCard.tsx        # Karta pojedynczej rekomendacji
    ├── SavingsComparisonChart.tsx   # Wykres porównania (Bar)
    └── SavingsImpactChart.tsx       # Wykres projekcji (Area)
```

### 5.2 Design System

**Kolory:**
- Primary: Purple (#9333ea - Tailwind purple-600)
- Accent: Pink (#ec4899)
- Priority colors:
  - High: Red (#ef4444)
  - Medium: Amber (#f59e0b)
  - Low: Blue (#3b82f6)

**Biblioteki:**
- Recharts (już w projekcie) - do wykresów
- Lucide React (już w projekcie) - ikony
- Shadcn/ui (już w projekcie) - komponenty bazowe

**Ikony:**
- Brain (mózg) - główna ikona AI
- Sparkles - dekoracyjna
- TrendingDown - oszczędności
- Lightbulb - wskazówki
- Target - cele
- RefreshCw - odświeżanie

### 5.3 Responsywność

**Breakpoints:**
- Mobile: < 768px
  - Widget: pełna szerokość
  - Wykresy: stack vertically
  - Karty: pojedyncza kolumna
  
- Desktop: ≥ 768px
  - Widget: część szerokości dashboardu (w grid)
  - Wykresy: grid 2 kolumny
  - Karty: pojedyncza kolumna (dla czytelności)

### 5.4 Accessibility

- Semantic HTML
- ARIA labels dla wykresów
- Keyboard navigation
- Screen reader friendly
- Proper color contrast (WCAG AA)

---

## 6. Wymagania techniczne

### 6.1 API Endpoints

**Nowe endpointy:**

```typescript
// POST /api/insights/analyze
// Generuje nową analizę AI (lub pobiera z cache jeśli świeża)
Request Body: { 
  months: 1 | 2 | 3,
  forceRefresh?: boolean // opcjonalnie wymusza regenerację
}
Response: AIInsightsResponse

// GET /api/insights/latest
// Pobiera ostatnią analizę z bazy danych
Response: AIInsightsResponse | null
```

### 6.2 Backend Service

**Nowy serwis:**

```typescript
// src/lib/services/insights.service.ts

class InsightsService {
  // Główna funkcja - generuje lub pobiera z cache
  async generateInsights(
    userId: string, 
    months: number,
    forceRefresh: boolean = false
  ): Promise<AIInsightsResponse>
  
  // Pobiera ostatnią analizę z DB
  async getLatestInsights(userId: string): Promise<AIInsightsResponse | null>
  
  // Agreguje transakcje dla AI
  async aggregateTransactionsForAI(
    userId: string, 
    months: number
  ): Promise<AggregatedData>
  
  // Wywołuje OpenAI API
  async callOpenAI(aggregatedData: AggregatedData): Promise<AIInsightsSummary>
  
  // Zapisuje wyniki do DB (upsert)
  async saveInsights(
    userId: string, 
    insights: AIInsightsSummary,
    months: number
  ): Promise<void>
  
  // Sprawdza czy użytkownik ma wystarczająco danych
  async hasEnoughData(userId: string): Promise<boolean>
}
```

### 6.3 Migracja bazy danych

**Nowy plik migracji:**

```
supabase/migrations/YYYYMMDDHHMMSS_create_ai_insights_table.sql
```

Zawartość: schemat tabeli + RLS policies (z sekcji 4)

### 6.4 Environment Variables

```bash
# OpenRouter Configuration  
OPENROUTER_API_KEY=sk-or-v1-...
AI_MODEL=openai/gpt-4o-mini
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
```

### 6.5 Dependencies

**Nowa zależność:**
```json
{
  "dependencies": {
    "openai": "^4.62.0"
  }
}
```

**Uwaga:** Biblioteka OpenAI SDK jest kompatybilna z OpenRouter - wystarczy zmienić baseURL.

Wszystkie inne (Recharts, React, Tailwind) już są w projekcie.

---

## 7. Implementacja krok po kroku

### Faza 1: Backend & Database (Priorytet 1)

**Dzień 1-2:**

1. **Migracja bazy danych**
   - Utwórz plik migracji dla tabeli `ai_insights`
   - Zastosuj migrację: `npx supabase migration up`
   - Zweryfikuj w Supabase Dashboard

2. **Setup OpenRouter client**
   - Instalacja: `npm install openai`
   - Konfiguracja API key w `.env`
   - Konfiguracja baseURL dla OpenRouter
   - Test połączenia

3. **Insights Service (część 1)**
   - `aggregateTransactionsForAI()` - pobierz i zagreguj dane z DB
   - `hasEnoughData()` - walidacja minimalnych danych
   - Testy jednostkowe

**Dzień 2-3:**

4. **Insights Service (część 2)**
   - `callOpenAI()` - komunikacja z GPT-4o-mini przez OpenRouter
   - Prompt engineering i testy
   - `saveInsights()` - zapis do DB (upsert)
   - `getLatestInsights()` - odczyt z DB

5. **Główna logika**
   - `generateInsights()` - orchestrator:
     - Sprawdź cache w DB
     - Jeśli brak lub forceRefresh → generuj nową
     - Zapisz w DB
     - Zwróć wynik

6. **API Endpoints**
   - POST `/api/insights/analyze`
   - GET `/api/insights/latest`
   - Validacja z Zod
   - Error handling
   - Rate limiting (opcjonalnie)

### Faza 2: Frontend Components (Priorytet 2)

**Dzień 3-4:**

7. **Types i struktura danych**
   - Dodaj typy do `src/types.ts`
   - Walidacja z Zod

8. **Hook do fetchowania**
   - `useInsights()` hook
   - Obsługa loading/error states
   - Cache w React Query (opcjonalnie)

9. **AIInsightsCard (Dashboard Widget)**
   - Implementacja komponentu
   - Stany: loading, empty, success, error
   - Integracja z API
   - Przycisk "Odśwież"

**Dzień 4-5:**

10. **Strona /insights**
    - Routing (`src/pages/insights.astro`)
    - Layout strony
    - InsightsView główny kontener

### Faza 3: Wizualizacje (Priorytet 3)

**Dzień 5-6:**

11. **Header i Summary Banner**
    - Kontrolki (dropdown okresu, przycisk odśwież)
    - Banner z metrykami

12. **SavingsComparisonChart**
    - Bar chart z Recharts
    - Custom tooltip
    - Responsywność
    - Legenda priorytetów

13. **SavingsImpactChart**
    - Area chart z Recharts
    - Projekcja 12 miesięcy
    - Karty z metrykami (3mc, 6mc, rok)

**Dzień 6-7:**

14. **InsightDetailCard**
    - Karta pojedynczej rekomendacji
    - Progress bars
    - Lista tips
    - Styling według priorytetu

### Faza 4: Polish & Testing (Priorytet 4)

**Dzień 7-8:**

15. **Error handling**
    - Retry logic dla API
    - User-friendly messages
    - Fallback UI
    - Toast notifications

16. **Performance**
    - Loading states (skeleton UI)
    - Optimistic updates (opcjonalnie)
    - Debouncing dla przycisków

17. **Testing**
    - Unit tests (services)
    - Component tests (React Testing Library)
    - E2E test (całego flow z Playwright)

18. **Documentation**
    - Komentarze w kodzie
    - README dla AI module
    - Prompt engineering notes

---

## Appendix A: Przykładowa odpowiedź AI (GPT-4o-mini)

```json
{
  "analysis_period": {
    "start_date": "2025-11-01",
    "end_date": "2026-01-31",
    "months_analyzed": 3
  },
  "total_spending": 37500,
  "average_monthly_spending": 12500,
  "total_potential_savings": 850,
  "general_recommendation": "Widzę kilka obszarów gdzie możesz zoptymalizować wydatki bez drastycznych zmian w stylu życia. Największy potencjał to jedzenie i subskrypcje.",
  "insights": [
    {
      "id": "ins_1",
      "category": "Jedzenie",
      "category_id": "cat_123",
      "current_spending": 3500,
      "suggested_target": 3100,
      "potential_savings": 400,
      "priority": "high",
      "reasoning": "Wydajesz 3500 PLN miesięcznie na jedzenie, co stanowi 28% Twoich wydatków i jest 17% powyżej Twojego budżetu. Regularne zakupy w drogich sklepach i częste zamówienia jedzenia na wynos zwiększają koszty.",
      "actionable_tips": [
        "Planuj posiłki na tydzień i twórz listę zakupów - pozwala to uniknąć impulsywnych zakupów",
        "Rozważ zakupy w tańszych sieciach (np. Biedronka, Lidl) zamiast premium markets",
        "Ogranicz jedzenie na wynos do 1-2 razy w tygodniu zamiast 4-5",
        "Gotuj w większych ilościach i mroź porcje na kolejne dni"
      ]
    },
    {
      "id": "ins_2",
      "category": "Subskrypcje",
      "category_id": "cat_456",
      "current_spending": 250,
      "suggested_target": 100,
      "potential_savings": 150,
      "priority": "medium",
      "reasoning": "Posiadasz wiele subskrypcji (Netflix, Spotify, Disney+, ChatGPT, gym), z których część może być nieużywana lub da się je połączyć.",
      "actionable_tips": [
        "Sprawdź ostatnio używane aplikacje - anuluj te, których nie używałeś w ciągu ostatniego miesiąca",
        "Rozważ family plans dla platform VOD - dzieląc się z rodziną płacisz mniej",
        "Zamień niektóre płatne subskrypcje na darmowe alternatywy (np. YouTube zamiast premium VOD)"
      ]
    },
    {
      "id": "ins_3",
      "category": "Zakupy",
      "category_id": "cat_789",
      "current_spending": 1200,
      "suggested_target": 900,
      "potential_savings": 300,
      "priority": "medium",
      "reasoning": "Zauważyłem wiele małych transakcji (poniżej 50 PLN) rozłożonych chaotycznie w miesiącu, co sugeruje impulse purchases.",
      "actionable_tips": [
        "Wprowadź regułę 24 godzin - przed zakupem poczekaj dobę na decyzję",
        "Usuń zapisane karty płatnicze ze stron e-commerce - zwiększa to tarcie przy zakupach",
        "Ustal miesięczny limit na 'przyjemności' i śledź go w osobnym budżecie"
      ]
    }
  ]
}
```

---

## Appendix B: Przykładowy kod integracji z OpenRouter

```javascript
import OpenAI from 'openai';

// Konfiguracja klienta dla OpenRouter
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.APP_URL, // Opcjonalnie dla rankingów
    'X-Title': '10xPersonal Finance', // Opcjonalnie dla rankingów
  }
});

const systemPrompt = `Jesteś ekspertem finansowym pomagającym użytkownikom 
aplikacji do zarządzania finansami osobistymi.

Analizuj dane o wydatkach i proponuj KONKRETNE, REALISTYCZNE 
sposoby oszczędzania pieniędzy.

Zasady:
- Bądź empatyczny i wspierający
- Dawaj konkretne liczby
- Sugeruj małe zmiany (łatwiejsze do wdrożenia)
- Nie krytykuj, tylko proponuj
- Uwzględniaj polskie realia (PLN, lokalne zwyczaje)
- Format odpowiedzi: JSON według podanego schematu
- Znajdź 3-5 najlepszych możliwości oszczędności
- Priorytetyzuj kategorie z największym potencjałem`;

const userPrompt = `Przeanalizuj wydatki użytkownika z ostatnich 3 miesięcy:

Okres: 2025-11-01 do 2026-01-31
Całkowite wydatki: 37,500 PLN
Średnio miesięcznie: 12,500 PLN

Wydatki według kategorii:
- Jedzenie: 3,500 PLN/mc (budżet: 3,000 PLN)
- Transport: 1,200 PLN/mc (brak budżetu)
- Zakupy: 1,200 PLN/mc (brak budżetu)
- Rozrywka: 800 PLN/mc (budżet: 600 PLN)
- Subskrypcje: 250 PLN/mc (brak budżetu)
- Rachunki: 2,000 PLN/mc (brak budżetu)
- Inne: 3,550 PLN/mc

Znajdź 3-5 najlepszych możliwości oszczędności.

Zwróć odpowiedź w formacie JSON zgodnym ze schematem:
{
  "analysis_period": { "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD", "months_analyzed": number },
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
      "reasoning": "string",
      "actionable_tips": ["string"]
    }
  ]
}`;

// Wywołanie API
const response = await openai.chat.completions.create({
  model: "openai/gpt-4o-mini",
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ],
  temperature: 0.7,
  max_tokens: 2000,
  response_format: { type: "json_object" }
});

const aiInsights = JSON.parse(response.choices[0].message.content);
```

---

**Dokument przygotowany na podstawie dyskusji z dnia 1.02.2026**  
**Autor:** AI Assistant (Claude)  
**Reviewer:** M. Ziółek  
**Wersja:** 1.2 (zaktualizowana: DB, GPT-4o-mini, OpenRouter)
