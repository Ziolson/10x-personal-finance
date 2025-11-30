# Plan Implementacji Punktu Końcowego API: GET, PUT, DELETE /api/accounts/{accountId}

## 1. Przegląd Punktu Końcowego

Ten dokument przedstawia plan implementacji dla punktów końcowych API odpowiedzialnych za zarządzanie indywidualnymi kontami użytkowników. Obejmuje on pobieranie, aktualizowanie i usuwanie zasobu konta. Wszystkie trzy operacje (GET, PUT, DELETE) będą obsługiwane przez jeden dynamiczny plik trasy Astro.

## 2. Szczegóły Żądania

-   **Metoda HTTP**: `GET`, `PUT`, `DELETE`
-   **Struktura URL**: `/api/accounts/[accountId]`
-   **Parametry Ścieżki**:
    -   `accountId` (Wymagane, `string` - UUID): Unikalny identyfikator konta.

### Ciało Żądania PUT

-   **Content-Type**: `application/json`
-   **Struktura**:
    ```json
    {
      "name": "Zaktualizowana Nazwa Konta Oszczędnościowego",
      "initial_balance": 550.00
    }
    ```
-   **Walidacja Pól**:
    -   `name`: `string`, opcjonalne, min 1 znak, max 100 znaków.
    -   `initial_balance`: `number`, opcjonalne, musi być >= 0.
    -   Przynajmniej jedno z powyższych pól jest wymagane.

## 3. Wykorzystywane Typy

### DTO i Modele Poleceń

-   **`AccountDTO` (DTO Odpowiedzi)**: Istniejący typ reprezentujący pojedyncze konto wraz z jego dynamicznie obliczonym bieżącym saldem. Zdefiniowany w `src/types.ts`. Będzie używany jako odpowiedź dla zapytań `GET` i `PUT`.
    ```typescript
    // src/types.ts
    export interface AccountDTO extends Omit<Account, "user_id"> {
      current_balance: number;
    }
    ```
-   **`UpdateAccountCommand` (Model Polecenia)**: Istniejący typ reprezentujący dane wymagane do aktualizacji konta. Zdefiniowany w `src/types.ts`.
    ```typescript
    // src/types.ts
    export interface UpdateAccountCommand {
      name?: string;
      initial_balance?: number;
    }
    ```
-   **`UpdateAccountSchema` (Schemat Zod)**: Istniejący schemat w `src/lib/validators/account.validators.ts` do walidacji ciała żądania `PUT`. Należy go uzupełnić o walidację, która wymusi obecność co najmniej jednego pola.
    ```typescript
    // src/lib/validators/account.validators.ts
    import { z } from 'zod';

    export const UpdateAccountSchema = z.object({
        name: z.string().min(1, ...).max(100, ...).trim().optional(),
        initial_balance: z.number().min(0, ...).finite(...).optional(),
    }).refine(data => !!data.name || data.initial_balance !== undefined, {
        message: "At least one field (name or initial_balance) must be provided.",
    });
    ```

## 4. Szczegóły Odpowiedzi

### GET `/api/accounts/{accountId}`

-   **200 OK**: Sukces
    -   **Ciało**: `GetAccountResponse` (alias dla `AccountDTO`).
-   **404 Not Found**: Konto nie istnieje lub nie należy do użytkownika.

### PUT `/api/accounts/{accountId}`

-   **200 OK**: Sukces
    -   **Ciało**: `UpdateAccountResponse` (alias dla `AccountDTO`).
-   **400 Bad Request**: Nieprawidłowe ciało żądania (np. puste) lub format `accountId`.
-   **404 Not Found**: Konto nie istnieje lub nie należy do użytkownika.
-   **409 Conflict**: Konto o nowej nazwie już istnieje dla tego użytkownika.

### DELETE `/api/accounts/{accountId}`

-   **204 No Content**: Sukces. Odpowiedź nie będzie miała ciała.
-   **404 Not Found**: Konto nie istnieje lub nie należy do użytkownika.

## 5. Przepływ Danych

1.  Żądanie dociera do punktu końcowego `src/pages/api/accounts/[accountId].ts`.
2.  Middleware Astro weryfikuje status uwierzytelnienia użytkownika za pomocą sesji Supabase. Jeśli użytkownik nie jest uwierzytelniony, zwraca błąd 401 Unauthorized.
3.  Handler trasy wyodrębnia `accountId` z parametrów URL oraz uwierzytelniony `userId` z `context.locals.user`.
4.  `accountId` jest walidowany pod kątem formatu UUID. Jeśli nie, zwracany jest błąd 400 Bad Request.
5.  **Dla żądań `PUT`**: Ciało żądania jest parsowane i walidowane względem schematu Zod `UpdateAccountSchema`. Jeśli walidacja się nie powiedzie, zwracany jest błąd 400 Bad Request ze szczegółami błędu.
6.  Odpowiednia metoda w `AccountService` jest wywoływana z `accountId`, `userId` oraz (dla `PUT`) zwalidowanym `UpdateAccountCommand`.
    -   `getAccountById(accountId, userId)`
    -   `updateAccount(accountId, userId, updateCommand)`
    -   `deleteAccount(accountId, userId)`
7.  Metoda serwisu konstruuje i wykonuje zapytanie do bazy danych Supabase. Wszystkie zapytania MUSZĄ zawierać klauzulę `WHERE` zarówno dla `id` (ID konta), jak i `user_id`, aby wymusić autoryzację.
    -   `GET` odpytuje widok `account_balances` i zwraca `AccountDTO`.
    -   `PUT` aktualizuje tabelę `accounts`.
    -   `DELETE` usuwa wiersz z tabeli `accounts`.
8.  Metoda serwisu obsługuje odpowiedź bazy danych. Jeśli żaden rekord nie zostanie znaleziony/zmieniony (dla `get`, `update`, `delete`), powinna rzucić specyficzny błąd "Not Found". Jeśli wystąpi naruszenie unikalnego ograniczenia podczas aktualizacji, powinna rzucić błąd "Conflict".
9.  Handler trasy API przechwytuje błędy z serwisu i mapuje je na odpowiednie kody statusu HTTP (404, 409, 500).
10. W przypadku sukcesu, handler formatuje odpowiedź i odsyła ją do klienta z poprawnym kodem statusu (200, 204).

## 6. Względy Bezpieczeństwa

-   **Uwierzytelnianie**: Wszystkie żądania muszą być uwierzytelnione. Jest to obsługiwane przez middleware Astro, który sprawdza ważność tokenu JWT Supabase.
-   **Autoryzacja**: Kluczowe jest uniemożliwienie użytkownikom dostępu do kont, których nie są właścicielami, oraz ich modyfikacji. Jest to egzekwowane przez:
    1.  **Logika API**: Każde zapytanie do bazy danych w `AccountService` musi być ograniczone do `user_id` aktualnie uwierzytelnionego użytkownika.
    2.  **Polityki RLS**: Upewnij się, że polityki Row-Level Security są aktywne na tabeli `accounts` w Supabase, ograniczając dostęp na podstawie `user_id`.
-   **Walidacja Danych Wejściowych**: Parametr ścieżki `accountId` musi być zwalidowany jako UUID. Ciało żądania `PUT` musi być rygorystycznie zwalidowane przy użyciu `UpdateAccountSchema`, aby zapobiec przetwarzaniu nieprawidłowych danych.

## 7. Względy Wydajności

-   Użycie widoku `account_balances` wiąże się z joinami i agregacjami, co może stać się powolne przy bardzo dużej liczbie transakcji.
-   Indeksy bazy danych na `accounts(user_id)` oraz na kluczu głównym są kluczowe dla wydajności i powinny już być na swoim miejscu.
-   Zapytania są proste i celują w dane pojedynczego użytkownika, więc wydajność powinna być odpowiednia dla początkowej implementacji. Monitoruj wydajność zapytań w miarę skalowania aplikacji.

## 8. Kroki Implementacji

1.  **Aktualizacja Walidatora**: Zmodyfikuj istniejący `UpdateAccountSchema` w `src/lib/validators/account.validators.ts`, dodając metodę `.refine()`, aby upewnić się, że przynajmniej jedno pole jest dostarczone.
2.  **Rozszerzenie `AccountService`**: Zaimplementuj następujące metody w `src/lib/services/account.service.ts`:
    -   `getAccountById(accountId: string, userId: string): Promise<AccountDTO | null>`
    -   `updateAccount(accountId: string, userId: string, data: UpdateAccountCommand): Promise<AccountDTO>`
    -   `deleteAccount(accountId: string, userId: string): Promise<void>`
    -   Upewnij się, że metody poprawnie obsługują przypadki "nie znaleziono" oraz potencjalne błędy bazy danych (np. naruszenia unikalnych ograniczeń).
3.  **Utworzenie Trasy API**: Utwórz plik `src/pages/api/accounts/[accountId].ts`.
4.  **Implementacja Handlerów Trasy**:
    -   Wewnątrz nowego pliku, wyeksportuj asynchroniczne funkcje `GET`, `PUT` i `DELETE`, które akceptują `APIContext`.
    -   Dodaj `export const prerender = false;`
    -   Zaimplementuj przepływ danych dla każdej metody: uwierzytelnianie, walidacja parametrów, wywołanie odpowiedniej metody serwisu oraz obsługa odpowiedzi sukcesu i błędu.
    -   Użyj bloku try-catch do obsługi błędów rzucanych z warstwy serwisu i zwracania odpowiednich odpowiedzi HTTP.
