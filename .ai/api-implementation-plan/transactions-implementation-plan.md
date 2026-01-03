# API Endpoint Implementation Plan: Transactions

## 1. Przegląd punktu końcowego
Punkt końcowy `/api/transactions` służy do zarządzania operacjami finansowymi użytkownika. Umożliwia pobieranie historii transakcji z filtrowaniem i stronicowaniem, a także dodawanie, edycję i usuwanie transakcji trzech typów: wydatków, przychodów i transferów. Ze względu na różnice w strukturze danych dla każdego typu transakcji, endpoint musi obsługiwać warunkową walidację i logikę biznesową.

## 2. Szczegóły żądania

### GET `/api/transactions`
Pobiera listę transakcji.
- **Parametry zapytania (Query Params):**
  - `page` (opcjonalny, number): Numer strony (domyślnie 1).
  - `limit` (opcjonalny, number): Ilość elementów na stronę (domyślnie 20, max 100).
  - `type` (opcjonalny, string): Filtrowanie po typie (`expense`, `income`, `transfer`).
  - `accountId` (opcjonalny, uuid): Filtrowanie po koncie (jako źródłowe LUB docelowe).
  - `categoryId` (opcjonalny, uuid): Filtrowanie po kategorii.
  - `startDate` (opcjonalny, date string YYYY-MM-DD): Data początkowa zakresu.
  - `endDate` (opcjonalny, date string YYYY-MM-DD): Data końcowa zakresu.

### POST `/api/transactions`
Tworzy nową transakcję. Payload zależy od pola `type`.
- **Request Body (JSON):** Discriminated Union na polu `type`.
  - Wspólne pola: `amount` (number, >0), `date` (ISO date), `description` (opcjonalny string).
  - **Expense**: `{ type: "expense", from_account_id: uuid, category_id: uuid }`
  - **Income**: `{ type: "income", to_account_id: uuid, category_id: uuid }`
  - **Transfer**: `{ type: "transfer", from_account_id: uuid, to_account_id: uuid }`

### PUT `/api/transactions/[transactionId]`
Aktualizuje istniejącą transakcję.
- **Parametry URL:** `transactionId` (uuid).
- **Request Body (JSON):** `UpdateTransactionCommand` (wszystkie pola opcjonalne).

### DELETE `/api/transactions/[transactionId]`
Usuwa transakcję.
- **Parametry URL:** `transactionId` (uuid).

## 3. Wykorzystywane typy
Typy zdefiniowane w `src/types.ts`:
- **DTO**: `TransactionDTO`, `PaginatedResponse`
- **Commands**: 
  - `CreateTransactionCommand` (Union: `CreateExpenseCommand` | `CreateIncomeCommand` | `CreateTransferCommand`)
  - `UpdateTransactionCommand`
- **Query**: `GetTransactionsQuery`
- **Enums**: `TransactionType`

## 4. Przepływ danych
1. **Request**: Żądanie trafia do endpointu Astro (`src/pages/api/transactions/...`).
2. **Middleware**: `src/middleware/index.ts` weryfikuje sesję i udostępnia `context.locals.supabase`.
3. **Validation**: Dane wejściowe są parsowane i walidowane przez Zod schemas (`src/lib/validators/transaction.validators.ts`).
4. **Service**: Zwalidowane dane trafiają do `TransactionService` (`src/lib/services/transaction.service.ts`).
5. **Database**: Serwis wykonuje zapytania do Supabase (tabela `transactions`).
   - Dla GET: Budowanie query z filtrami i paginacją.
   - Dla POST/PUT: Wykonanie operacji zapisu.
6. **Response**: Dane są mapowane do `TransactionDTO` i zwracane jako JSON.

## 5. Względy bezpieczeństwa
- **Uwierzytelnianie**: Wymagane dla wszystkich metod (sprawdzane w middleware).
- **Autoryzacja (RLS)**: Baza danych Supabase automatycznie filtruje wiersze na podstawie `user_id` w sesji. API nie musi (i nie powinno) ręcznie dodawać `user_id` do klauzuli WHERE, ale musi używać klienta z `context.locals`.
- **Walidacja danych**:
  - Ścisła typizacja typów transakcji (np. transfer nie może mieć kategorii, wydatek nie może mieć konta docelowego).
  - Zabezpieczenie przed transferem na to samo konto.
  - Walidacja formatów UUID i dat.

## 6. Obsługa błędów
- **400 Bad Request**: 
  - Błędy walidacji Zod (niepoprawne typy, brakujące pola).
  - Naruszenie logiki biznesowej (np. transfer source == destination).
- **401 Unauthorized**: Brak ważnej sesji użytkownika.
- **404 Not Found**: Próba edycji/usunięcia nieistniejącej transakcji (lub należącej do innego użytkownika - RLS ukrywa zasób).
- **500 Internal Server Error**: Błędy połączenia z bazą, nieoczekiwane wyjątki.

## 7. Rozważania dotyczące wydajności
- **Paginacja**: Niezbędna, aby nie pobierać całej historii. Wykorzystanie `range()` w Supabase.
- **Filtrowanie**: Wykorzystanie indeksów bazodanowych na kolumnach `date`, `type`, `category_id`, `account_id` (zdefiniowane w planie DB).
- **Liczba zapytań**: Pobieranie całkowitej liczby rekordów (`count`) tylko przy zapytaniu GET (opcja `count: 'estimated'` lub `'exact'` w zależności od potrzeb, tutaj `exact` dla poprawnej paginacji).

## 8. Etapy wdrożenia

### Krok 1: Utworzenie Walidatorów
Utworzenie pliku `src/lib/validators/transaction.validators.ts`.
- Definicja schematów Zod dla `GetTransactionsQuery`.
- Definicja schematów dla tworzenia (z wykorzystaniem `z.discriminatedUnion` dla `type`).
- Definicja schematu dla aktualizacji (partial).

### Krok 2: Implementacja TransactionService
Utworzenie pliku `src/lib/services/transaction.service.ts`.
- Klasa `TransactionService` przyjmująca `SupabaseClient`.
- Metoda `getTransactions(query)`: obsługa filtrów i paginacji.
- Metoda `createTransaction(command)`: obsługa insertu.
- Metoda `updateTransaction(id, command)`: obsługa update.
- Metoda `deleteTransaction(id)`: obsługa delete.

### Krok 3: Implementacja Endpointów API
- **GET & POST**: `src/pages/api/transactions/index.ts`
  - Obsługa metody GET: parsowanie query, wywołanie serwisu, zwrot `PaginatedResponse`.
  - Obsługa metody POST: walidacja body, wywołanie serwisu, zwrot 201.
- **PUT & DELETE**: `src/pages/api/transactions/[transactionId].ts`
  - Obsługa PUT: walidacja body i ID, update, zwrot 200.
  - Obsługa DELETE: walidacja ID, delete, zwrot 204.

### Krok 4: Testy manualne
- Weryfikacja poprawności filtrowania.
- Próba utworzenia niepoprawnej transakcji (np. expense z `to_account_id`).
- Weryfikacja RLS (dostęp do cudzej transakcji).

