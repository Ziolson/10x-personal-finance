# API Endpoint Implementation Plan: GET /api/accounts

## 1. Przegląd punktu końcowego

Ten punkt końcowy jest odpowiedzialny za pobieranie listy wszystkich kont finansowych należących do aktualnie uwierzytelnionego użytkownika. Każde konto w odpowiedzi będzie zawierało dynamicznie obliczone aktualne saldo (`current_balance`).

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/accounts`
- **Parametry**:
  - Wymagane: Brak
  - Opcjonalne: Brak
- **Request Body**: Brak

## 3. Wykorzystywane typy

- `AccountDTO`: Obiekt transferu danych reprezentujący pojedyncze konto w odpowiedzi.
  ```typescript
  export interface AccountDTO extends Omit<Account, "user_id"> {
    current_balance: number;
  }
  ```
- `GetAccountsResponse`: Typ odpowiedzi, będący tablicą obiektów `AccountDTO`.
  ```typescript
  export type GetAccountsResponse = AccountDTO[];
  ```
- `ApiErrorResponse`: Standardowy format odpowiedzi w przypadku błędu.

## 4. Szczegóły odpowiedzi

- **200 OK**: Pomyślne pobranie danych.
  - **Content-Type**: `application/json`
  - **Body**: `GetAccountsResponse` (tablica obiektów `AccountDTO`).
  ```json
  [
    {
      "id": "uuid-string-1",
      "name": "Main Bank Account",
      "initial_balance": 1000.0,
      "currency": "PLN",
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "current_balance": 1250.5
    },
    {
      "id": "uuid-string-2",
      "name": "Savings",
      "initial_balance": 5000.0,
      "currency": "PLN",
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "current_balance": 5100.0
    }
  ]
  ```
- **401 Unauthorized**: Użytkownik nie jest uwierzytelniony.
- **500 Internal Server Error**: Wystąpił błąd po stronie serwera.

## 5. Przepływ danych

1.  Żądanie `GET` trafia do endpointu Astro `/pages/api/accounts/index.ts`.
2.  Middleware Astro (`src/middleware/index.ts`) weryfikuje sesję użytkownika i umieszcza klienta Supabase oraz dane użytkownika w `context.locals`.
3.  Handler `GET` w endpoincie sprawdza, czy użytkownik jest zalogowany. Jeśli nie, zwraca `401`.
4.  Handler wywołuje funkcję `getAccountsForUser` z serwisu `AccountService`, przekazując instancję klienta Supabase i ID użytkownika.
5.  `AccountService` wykonuje zapytanie do widoku `account_balances` w bazie danych Supabase, filtrując wyniki po `user_id`.
6.  Baza danych, wykorzystując widok, oblicza `current_balance` dla każdego konta, sumując transakcje przychodzące i odejmując wychodzące od salda początkowego.
7.  `AccountService` otrzymuje dane i mapuje je na tablicę `AccountDTO[]`.
8.  Handler `GET` otrzymuje zmapowane dane z serwisu i zwraca je jako odpowiedź JSON z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do endpointu musi być chroniony. Każde żądanie musi być zweryfikowane pod kątem aktywnej sesji użytkownika. Należy wykorzystać mechanizmy Supabase Auth zarządzane przez middleware Astro.
- **Autoryzacja**: Zapytanie do bazy danych musi bezwzględnie zawierać warunek `WHERE user_id = :current_user_id`. Dodatkowo, polityki RLS (Row-Level Security) na tabeli `accounts` i widoku `account_balances` muszą być skonfigurowane w Supabase, aby uniemożliwić dostęp do danych innych użytkowników na poziomie bazy danych.
- **Walidacja danych**: Nie dotyczy (brak danych wejściowych).
- **Ochrona danych**: Odpowiedź API nie powinna zawierać wrażliwych danych, takich jak `user_id`. Typ `AccountDTO` już to zapewnia.

## 8. Etapy wdrożenia

1.  **Aktualizacja Serwisu (`AccountService`)**:
    - W pliku `src/lib/services/account.service.ts` utwórz nową, asynchroniczną funkcję `getAccountsForUser`.
    - Funkcja powinna przyjmować jako argumenty `supabase: SupabaseClient` i `userId: string`.
    - Wewnątrz funkcji wykonaj zapytanie `select()` do widoku `account_balances`, filtrując po `userId`.
    - Dodaj obsługę błędów dla zapytania do bazy danych. W przypadku błędu, zaloguj go i rzuć wyjątek.
    - Zmapuj wyniki zapytania na typ `AccountDTO[]` i zwróć je.

2.  **Implementacja Endpointu Astro**:
    - W pliku `src/pages/api/accounts/index.ts` utwórz handler `GET: APIRoute`.
    - Dodaj `export const prerender = false;` na początku pliku.
    - Pobierz `supabase` i `session` z `context.locals`.
    - Sprawdź, czy `session?.user` istnieje. Jeśli nie, zwróć odpowiedź z kodem `401`.
    - Zaimplementuj blok `try...catch`.
    - W bloku `try`, wywołaj `accountService.getAccountsForUser(supabase, session.user.id)`.
    - Zwróć pobrane dane jako odpowiedź JSON z kodem `200`.
    - W bloku `catch`, zaloguj błąd (`console.error`) i zwróć odpowiedź `ApiErrorResponse` z kodem `500`.
