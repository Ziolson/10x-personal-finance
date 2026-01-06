# API Endpoint Implementation Plan: /api/budgets

## 1. Przegląd punktu końcowego

Wdrożenie zestawu endpointów REST API do zarządzania budżetami użytkownika. Umożliwi to pobieranie listy budżetów dla konkretnego miesiąca, tworzenie nowych budżetów, a także ich edycję i usuwanie. Endpointy te są kluczowe dla funkcjonalności planowania finansowego w aplikacji 10xPersonal Finance.

## 2. Szczegóły żądania

### GET /api/budgets

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/budgets`
- **Parametry zapytania (Query Parameters)**:
  - **Wymagane**:
    - `month` (number): Miesiąc (1-12)
    - `year` (number): Rok (YYYY)
  - **Opcjonalne**: Brak
- **Request Body**: Brak

### POST /api/budgets

- **Metoda HTTP**: POST
- **Struktura URL**: `/api/budgets`
- **Parametry**: Brak
- **Request Body**: `CreateBudgetCommand`
  ```json
  {
    "name": "Entertainment",
    "amount": 300.0,
    "month": 11,
    "year": 2025,
    "category_ids": ["uuid..."]
  }
  ```

### PUT /api/budgets/[id]

- **Metoda HTTP**: PUT
- **Struktura URL**: `/api/budgets/[id]` (gdzie `id` to UUID budżetu)
- **Parametry**:
  - **Wymagane**: `id` (ścieżka)
- **Request Body**: `UpdateBudgetCommand`
  ```json
  {
    "name": "Entertainment & Hobbies",
    "amount": 350.0,
    "category_ids": ["uuid1", "uuid2"]
  }
  ```

### DELETE /api/budgets/[id]

- **Metoda HTTP**: DELETE
- **Struktura URL**: `/api/budgets/[id]`
- **Parametry**:
  - **Wymagane**: `id` (ścieżka)
- **Request Body**: Brak

## 3. Wykorzystywane typy i walidacja

Wykorzystamy definicje z plików `src/types.ts` oraz `src/db/database.types.ts`.
Nowe walidatory trafią do `src/lib/validators/budgets.validators.ts`.

- **DTO (Data Transfer Objects)**:
  - `BudgetDTO` (Response)
- **Command Modele**:
  - `CreateBudgetCommand` (Zod schema: `CreateBudgetSchema`)
  - `UpdateBudgetCommand` (Zod schema: `UpdateBudgetSchema`)
- **Query Modele**:
  - `GetBudgetsQuery` (Zod schema: `GetBudgetsQuerySchema`)
- **Błędy**:
  - `ApiErrorResponse`
  - `ValidationErrorResponse`

## 4. Szczegóły odpowiedzi

### GET /api/budgets

- **Status 200 OK**:
  - Body: `BudgetDTO[]`
  ```json
  [
    {
      "id": "uuid",
      "name": "Household",
      "amount": 1500.0,
      "month": 11,
      "year": 2025,
      "created_at": "2025-11-01T10:00:00Z",
      "categories": ["uuid1", "uuid2"]
    }
  ]
  ```

### POST /api/budgets

- **Status 201 Created**:
  - Body: `BudgetDTO` (nowo utworzony obiekt)
- **Status 400 Bad Request**: Błąd walidacji danych wejściowych.
- **Status 409 Conflict**: Budżet o podanej nazwie w danym miesiącu/roku już istnieje.

### PUT /api/budgets/[id]

- **Status 200 OK**:
  - Body: `BudgetDTO` (zaktualizowany obiekt)
- **Status 400 Bad Request**: Błąd walidacji.
- **Status 404 Not Found**: Budżet o podanym ID nie istnieje lub należy do innego użytkownika.

### DELETE /api/budgets/[id]

- **Status 204 No Content**: Puste ciało odpowiedzi.
- **Status 404 Not Found**: Budżet nie znaleziony.

## 5. Przepływ danych

1.  **Request**: Klient (Frontend) wysyła żądanie HTTP do endpointu Astro (`src/pages/api/budgets/index.ts` lub `[id].ts`).
2.  **Middleware**: Astro Middleware weryfikuje sesję użytkownika (Supabase Auth) i udostępnia klienta `supabase` w `locals`.
3.  **API Route (Handler)**:
    - Odbiera żądanie.
    - Parsuje i waliduje dane wejściowe (params/body) używając Zod z `src/lib/validators/budgets.validators.ts`.
    - W przypadku błędu walidacji zwraca 400.
4.  **Service (`src/lib/services/budget.service.ts`)**:
    - Handler wywołuje odpowiednią funkcję z serwisu (np. `getBudgets`, `createBudget`), przekazując `user_id`, `supabase` client oraz dane.
    - Serwis wykonuje operacje na bazie danych Supabase.
    - W przypadku tworzenia/edycji budżetu, serwis obsługuje również powiązanie z tabelą `categories` (relacja).
5.  **Database**: Supabase realizuje zapytanie (INSERT/SELECT/UPDATE/DELETE), uwzględniając RLS (Row Level Security) lub filtry `user_id`.
6.  **Response**: Serwis zwraca dane domenowe (DTO) do handlera, który formuje odpowiedź HTTP (200/201/204) i zwraca JSON.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Wszystkie endpointy są zabezpieczone i wymagają aktywnej sesji (sprawdzane w middleware/endpoint). `user_id` pobierane jest z bezpiecznej sesji po stronie serwera (`locals.user`).
- **Autoryzacja (RLS)**: Baza danych powinna mieć skonfigurowane RLS, aby użytkownik widział/edytował tylko swoje rekordy. Dodatkowo w zapytaniach explicite używamy `eq('user_id', user.id)` dla pewności.
- **Walidacja danych**: Wszystkie dane wejściowe (body, query params) są rygorystycznie walidowane biblioteką **Zod** przed przekazaniem do bazy danych. Zapobiega to wstrzykiwaniu nieprawidłowych danych.
- **Ograniczenia bazy**: Constraints w bazie (`amount > 0`, `month 1-12`) stanowią ostatnią linię obrony spójności danych.

## 7. Obsługa błędów

Błędy będą przechwytywane w bloku `try-catch` w handlerze endpointu:

- **ZodError**: Mapowany na 400 Bad Request z detalami pól (`ValidationErrorResponse`).
- **Błąd bazy danych (Supabase)**:
  - Kod `23505` (Unique Violation): Mapowany na 409 Conflict (np. duplikat nazwy budżetu w miesiącu).
  - Kod `23503` (Foreign Key Violation): Mapowany na 400 Bad Request (np. nieistniejąca kategoria).
- **Nie znaleziono rekordu**: Mapowany na 404 Not Found (dla PUT/DELETE).
- **Inne błędy**: 500 Internal Server Error (logowane po stronie serwera).

## 8. Rozważania dotyczące wydajności

- **Indeksy**: Tabela `budgets` posiada indeksy na `user_id`, `(user_id, year, month)`, co zapewni szybkie filtrowanie.
- **Relacje**: Pobieranie kategorii dla budżetu może wymagać `join` lub oddzielnego zapytania. Należy użyć efektywnego `select('*, categories(id)')` w Supabase, aby uniknąć problemu N+1.
- **Prerender**: Endpointy muszą być dynamiczne (`export const prerender = false`), ponieważ operują na danych użytkownika.

## 9. Etapy wdrożenia

1.  **Walidatory (`src/lib/validators/budgets.validators.ts`)**:
    - Stworzenie schematów Zod: `CreateBudgetSchema`, `UpdateBudgetSchema`, `GetBudgetsQuerySchema`.

2.  **Serwis (`src/lib/services/budget.service.ts`)**:
    - Implementacja funkcji (podejście funkcyjne, wzorem `category.service.ts`):
      - `getBudgets(userId, supabase, query)`
      - `createBudget(command, userId, supabase)`
      - `getBudgetById(budgetId, userId, supabase)` (helper)
      - `updateBudget(budgetId, userId, data, supabase)`
      - `deleteBudget(budgetId, userId, supabase)`
    - Obsługa relacji z kategoriami (tablica UUID).
    - Rzucanie błędów domenowych (np. `BUDGET_ALREADY_EXISTS`).

3.  **Endpoint listy i tworzenia (`src/pages/api/budgets/index.ts`)**:
    - Implementacja `GET`: Parsowanie query params walidatorem, wywołanie `getBudgets`, zwrot listy.
    - Implementacja `POST`: Parsowanie body walidatorem, wywołanie `createBudget`, obsługa 409, zwrot 201.

4.  **Endpoint operacji na ID (`src/pages/api/budgets/[id].ts`)**:
    - Parsowanie ID z parametrów ścieżki (walidacja UUID).
    - Implementacja `PUT`: Walidacja body, wywołanie `updateBudget`, obsługa 404, zwrot obiektu.
    - Implementacja `DELETE`: Wywołanie `deleteBudget`, obsługa 404, zwrot 204.

5.  **Weryfikacja**:
    - Sprawdzenie poprawności kodów błędów i walidacji.
    - Weryfikacja unikalności nazwy budżetu w ramach miesiąca/roku.
    - Weryfikacja kaskadowego usuwania lub odpinania kategorii (zgodnie z definicją DB).
