# Plan Implementacji Zmian w Bazie Danych - AI Insights

**Projekt:** 10xPersonal Finance  
**Moduł:** AI Insights & Savings Recommendations  
**Typ dokumentu:** Plan implementacji zmian w bazie danych  
**Data utworzenia:** 1 lutego 2026  
**Status:** Draft

---

## 1. Cel dokumentu

Niniejszy dokument definiuje **wyłącznie** kroki związane z implementacją tabeli `ai_insights` w bazie danych PostgreSQL/Supabase. Obejmuje migracje SQL, indeksy, polityki RLS oraz weryfikację poprawności zmian.

**Zakres:** Tylko i wyłącznie baza danych (PostgreSQL/Supabase)  
**Nie obejmuje:** API endpoints, services, typy TypeScript, frontend components

**Powiązane dokumenty:**
- `api_ai_implementation_plan.md` - implementacja API i backend services
- `views_ai_implementation_plan.md` - implementacja frontend components

---

## 2. Przegląd zmian w bazie danych

### 2.1 Nowe obiekty

| Typ obiektu | Nazwa | Opis |
|-------------|-------|------|
| Tabela | `ai_insights` | Cache'owane rekomendacje AI |
| Index | UNIQUE na `user_id` | Automatyczny z UNIQUE constraint |
| Index | GIN na `data` | Dla JSONB queries (opcjonalnie) |
| RLS Policy | 4 polityki | SELECT, INSERT, UPDATE, DELETE |

### 2.2 Modyfikacje istniejących obiektów

**BRAK** - Nie modyfikujemy żadnych istniejących tabel, triggerów, widoków ani funkcji.

---

## 3. Szczegółowy plan implementacji

### KROK 1: Utworzenie migracji dla tabeli `ai_insights`

**Plik:** `supabase/migrations/YYYYMMDDHHMMSS_create_ai_insights_table.sql`

**Opis:** Utworzenie nowej tabeli wraz z indeksami i politykami RLS.

**Zawartość migracji:**

```sql
-- migration: create ai_insights table
-- purpose: add support for AI-powered savings recommendations
-- affected tables: ai_insights (new)
-- special considerations: 
--   - uses JSONB for storing full AI response
--   - one active insight per user (UNIQUE constraint)
--   - no updated_at column (cache is always fully replaced via upsert)

-- =============================================================================
-- table: ai_insights
-- purpose: cache AI-generated savings recommendations
-- =============================================================================
create table ai_insights (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id) on delete cascade,
    data jsonb not null,
    generated_at timestamptz not null default now(),
    months_analyzed integer not null check (months_analyzed in (1, 2, 3)),
    
    -- ensure one active insight per user
    constraint ai_insights_user_id_unique unique (user_id)
);

-- enable row level security
-- policies will be defined below
alter table ai_insights enable row level security;

-- add comments
comment on table ai_insights is 'AI-generated savings recommendations (cached responses from OpenAI API)';
comment on column ai_insights.data is 'Full AIInsightsSummary structure as JSONB';
comment on column ai_insights.generated_at is 'Timestamp when the AI analysis was generated';
comment on column ai_insights.months_analyzed is 'Number of months analyzed (1, 2, or 3)';

-- =============================================================================
-- indexes
-- =============================================================================

-- index on user_id (for fast lookups) - automatically created by UNIQUE constraint
-- note: unique constraint on user_id creates implicit index

-- gin index for jsonb queries (optional, for future use)
create index idx_ai_insights_data on ai_insights using gin(data);

comment on index idx_ai_insights_data is 'GIN index for JSONB queries on AI insights data';

-- =============================================================================
-- row level security policies
-- =============================================================================

-- policy: users can view their own insights
create policy "Users can view their own insights"
    on ai_insights for select
    using (auth.uid() = user_id);

-- policy: users can insert their own insights
create policy "Users can insert their own insights"
    on ai_insights for insert
    with check (auth.uid() = user_id);

-- policy: users can update their own insights
create policy "Users can update their own insights"
    on ai_insights for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- policy: users can delete their own insights
create policy "Users can delete their own insights"
    on ai_insights for delete
    using (auth.uid() = user_id);
```

**Akcje:**
1. ✅ Utwórz plik migracji zgodnie z konwencją nazewnictwa
2. ✅ Skopiuj powyższą zawartość SQL
3. ✅ Zastosuj migrację: `npx supabase db push` (lokalnie) lub `npx supabase db push --linked` (produkcja)
4. ✅ Zweryfikuj w Supabase Dashboard:
   - Czy tabela `ai_insights` istnieje
   - Czy ma poprawne kolumny i typy
   - Czy UNIQUE constraint na `user_id` działa
   - Czy RLS jest włączone
   - Czy wszystkie 4 polityki są aktywne

---

### KROK 2: Wygenerowanie typów TypeScript z bazy danych

**Plik:** `src/db/database.types.ts`

**Opis:** Po dodaniu nowej tabeli, należy wygenerować nowe typy TypeScript z bazy danych.

**Komenda:**

```bash
npx supabase gen types typescript --linked > src/db/database.types.ts
```

Lub dla lokalnej instancji:

```bash
npx supabase gen types typescript --local > src/db/database.types.ts
```

**Akcje:**
1. ✅ Uruchom komendę generowania typów
2. ✅ Zweryfikuj że w pliku `database.types.ts` pojawiła się definicja dla:
   - `Tables<'ai_insights'>`
   - Pola: `id`, `user_id`, `data`, `generated_at`, `months_analyzed`
3. ✅ Sprawdź czy typ `data` jest poprawnie rozpoznany jako `Json` lub `JsonValue`

**Oczekiwany wynik:**

```typescript
export interface Database {
  public: {
    Tables: {
      // ... inne tabele ...
      ai_insights: {
        Row: {
          id: string;
          user_id: string;
          data: Json;
          generated_at: string;
          months_analyzed: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          data: Json;
          generated_at?: string;
          months_analyzed: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          data?: Json;
          generated_at?: string;
          months_analyzed?: number;
        };
      };
    };
  };
}
```

**Uwaga:** To jedyny plik TypeScript w tym planie. Pozostałe typy (DTOs, commands) będą w `api_ai_implementation_plan.md`.

---

### KROK 3: Weryfikacja integracji z istniejącymi migracjami

**Cel:** Upewnić się że nowa migracja nie koliduje z istniejącymi.

**Istniejące migracje:**
- `20251109170000_create_enum_types.sql` - typy ENUM
- `20251109170100_create_core_tables.sql` - tabele bazowe
- `20251109170200_create_indexes.sql` - indeksy
- `20251109170300_create_triggers_and_functions.sql` - triggery
- `20251109170400_create_rls_policies.sql` - polityki RLS
- `20251109170500_create_views_and_helper_functions.sql` - widoki
- `20260106100000_update_budget_progress_view.sql` - update widoku

**Sprawdzenia:**

| Aspekt | Sprawdzenie | Status |
|--------|-------------|--------|
| Nazwa tabeli | `ai_insights` nie istnieje w żadnej migracji | ✅ OK |
| Referencje | `profiles(id)` istnieje i jest stabilna | ✅ OK |
| Typy ENUM | Nie używamy nowych typów ENUM | ✅ OK |
| Triggery | Nie potrzebujemy triggera `updated_at` | ✅ OK |
| Widoki | Nie modyfikujemy istniejących widoków | ✅ OK |
| RLS | Wszystkie polityki w jednej migracji | ✅ OK |

**Akcje:**
1. ✅ Przejrzyj wszystkie istniejące migracje
2. ✅ Upewnij się że nie ma konfliktów nazw
3. ✅ Zweryfikuj że `profiles` jest dostępna (utworzona wcześniej)

---

### KROK 4: Testowanie migracji

**Cel:** Przetestować migrację przed wdrożeniem na produkcję.

#### 6.1 Test lokalny

```bash
# Reset lokalnej bazy danych (UWAGA: usuwa wszystkie dane)
npx supabase db reset

# Sprawdź czy wszystkie migracje przeszły pomyślnie
# Powinno być OK dla wszystkich migracji włącznie z nową
```

#### 6.2 Test integralności danych

```sql
-- Test 1: Sprawdź czy tabela istnieje
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'ai_insights';

-- Test 2: Sprawdź strukturę kolumn
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'ai_insights'
ORDER BY ordinal_position;

-- Test 3: Sprawdź constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public' 
  AND table_name = 'ai_insights';

-- Test 4: Sprawdź RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'ai_insights';

-- Test 5: Sprawdź indeksy
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'ai_insights';
```

#### 6.3 Test operacji CRUD

```sql
-- Test INSERT (jako authenticated user)
-- Wymaga połączenia z aktywnym auth.uid()
INSERT INTO ai_insights (user_id, data, months_analyzed)
VALUES (
  auth.uid(),
  '{"analysis_period": {"start_date": "2026-01-01", "end_date": "2026-01-31", "months_analyzed": 1}, "total_spending": 1000, "average_monthly_spending": 1000, "total_potential_savings": 100, "general_recommendation": "Test", "insights": []}'::jsonb,
  1
);

-- Test SELECT
SELECT * FROM ai_insights WHERE user_id = auth.uid();

-- Test UPSERT (powinno nadpisać istniejący rekord)
INSERT INTO ai_insights (user_id, data, months_analyzed)
VALUES (
  auth.uid(),
  '{"analysis_period": {"start_date": "2026-01-01", "end_date": "2026-02-29", "months_analyzed": 2}, "total_spending": 2000, "average_monthly_spending": 1000, "total_potential_savings": 200, "general_recommendation": "Test Updated", "insights": []}'::jsonb,
  2
)
ON CONFLICT (user_id) 
DO UPDATE SET 
  data = EXCLUDED.data,
  generated_at = NOW(),
  months_analyzed = EXCLUDED.months_analyzed;

-- Test DELETE
DELETE FROM ai_insights WHERE user_id = auth.uid();
```

#### 6.4 Test JSONB queries

```sql
-- Query 1: Pobierz total_potential_savings z JSONB
SELECT 
  id,
  user_id,
  data->>'total_potential_savings' as potential_savings,
  generated_at
FROM ai_insights;

-- Query 2: Pobierz liczbę insights
SELECT 
  id,
  jsonb_array_length(data->'insights') as insights_count
FROM ai_insights;

-- Query 3: Filtruj po months_analyzed w JSONB
SELECT *
FROM ai_insights
WHERE (data->'analysis_period'->>'months_analyzed')::int = 3;
```

**Akcje:**
1. ✅ Uruchom wszystkie testy SQL
2. ✅ Zweryfikuj wyniki
3. ✅ Napraw ewentualne błędy
4. ✅ Powtórz testy po poprawkach

---

### KROK 5: Przygotowanie do wdrożenia na produkcję

#### 7.1 Checklist przed wdrożeniem

- [ ] Migracja przetestowana lokalnie
- [ ] Wszystkie testy SQL przeszły pomyślnie
- [ ] Typy TypeScript wygenerowane i zweryfikowane
- [ ] Dokumentacja API zaktualizowana
- [ ] Backup bazy danych produkcyjnej wykonany
- [ ] Plan rollback przygotowany

#### 7.2 Komenda wdrożenia

```bash
# Wdrożenie na linked project (produkcja)
npx supabase db push --linked

# Wygeneruj typy dla produkcji
npx supabase gen types typescript --linked > src/db/database.types.ts
```

#### 7.3 Weryfikacja po wdrożeniu

```bash
# Sprawdź status migracji
npx supabase migration list --linked

# Sprawdź czy tabela istnieje w produkcji
# (poprzez Supabase Dashboard lub SQL Editor)
```

---

### KROK 6: Plan rollback (w przypadku problemów)

**Scenariusz:** Migracja spowodowała problemy i należy ją cofnąć.

**Plik:** `supabase/migrations/YYYYMMDDHHMMSS_rollback_ai_insights.sql`

```sql
-- rollback migration: remove ai_insights table
-- purpose: revert changes from create_ai_insights_table migration
-- affected tables: ai_insights (dropped)

-- drop policies first
drop policy if exists "Users can delete their own insights" on ai_insights;
drop policy if exists "Users can update their own insights" on ai_insights;
drop policy if exists "Users can insert their own insights" on ai_insights;
drop policy if exists "Users can view their own insights" on ai_insights;

-- drop indexes (GIN index will be dropped automatically with table)
-- but we list it here for documentation
-- drop index if exists idx_ai_insights_data;

-- drop table (cascades to indexes and constraints)
drop table if exists ai_insights;
```

**Akcje w przypadku rollback:**
1. ✅ Utwórz plik rollback migracji
2. ✅ Zastosuj: `npx supabase db push --linked`
3. ✅ Zweryfikuj że tabela została usunięta
4. ✅ Przywróć poprzednie typy TypeScript z backupu (`src/db/database.types.ts`)

---

## 4. Podsumowanie kroków - tylko baza danych

| # | Krok | Plik/Akcja | Priorytet | Status |
|---|------|------------|-----------|--------|
| 1 | Utwórz migrację SQL | `supabase/migrations/YYYYMMDD_create_ai_insights_table.sql` | MUST | ⏳ TODO |
| 2 | Wygeneruj typy TS z DB | `src/db/database.types.ts` | MUST | ⏳ TODO |
| 3 | Weryfikuj migracje | - | MUST | ⏳ TODO |
| 4 | Testuj lokalnie | SQL queries | MUST | ⏳ TODO |
| 5 | Wdróż na produkcję | `npx supabase db push` | MUST | ⏳ TODO |
| 6 | Przygotuj rollback | `supabase/migrations/YYYYMMDD_rollback_ai_insights.sql` | SHOULD | ⏳ TODO |

---

## 5. Uwagi końcowe - perspektywa bazy danych

### 5.1 Najważniejsze decyzje projektowe

1. **JSONB dla data**: Całość odpowiedzi AI przechowywana w jednej kolumnie JSONB dla prostoty i elastyczności
2. **UNIQUE na user_id**: Jeden użytkownik = jedna aktywna analiza (upsert pattern)
3. **Brak updated_at**: Cache jest zawsze nadpisywany całościowo, więc `generated_at` wystarcza
4. **Brak FK do categories**: Nazwy kategorii w JSONB to snapshot w czasie, nie wymuszamy integralności referencyjnej
5. **GIN index opcjonalny**: Dodany dla przyszłych potrzeb, może być usunięty jeśli nie jest używany

### 5.2 Potencjalne problemy i rozwiązania

| Problem | Rozwiązanie |
|---------|-------------|
| Migracja nie przechodzi | Sprawdź czy `profiles` istnieje, to dependency |
| RLS nie działa | Zweryfikuj czy `auth.uid()` zwraca prawidłowy UUID |
| JSONB queries wolne | Użyj GIN index lub dodaj dedykowane kolumny dla często używanych pól |
| Konflikt przy upsert | Upewnij się że używasz `ON CONFLICT (user_id)` w INSERT |

### 5.3 Następne kroki (poza bazą danych)

Po zakończeniu zmian w bazie danych, przejdź do:
1. **`api_ai_implementation_plan.md`** - implementacja backend services i API endpoints
2. **`views_ai_implementation_plan.md`** - implementacja frontend components i UI

---

**Dokument przygotowany:** 1.02.2026  
**Autor:** AI Assistant (Claude)  
**Zakres:** Tylko baza danych PostgreSQL/Supabase  
**Status:** Ready for implementation
