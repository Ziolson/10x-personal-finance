# API Endpoint Implementation Plan: POST /api/accounts

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia uwierzytelnionym użytkownikom tworzenie nowego konta finansowego. Po pomyślnym utworzeniu, zwraca szczegóły nowo utworzonego konta.

## 2. Szczegóły żądania
- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/accounts`
- **Request Body**:
  ```json
  {
    "name": "Savings Account",
    "initial_balance": 500.00,
    "currency": "PLN"
  }
  ```
- **Parametry**:
  - **Wymagane**:
    - `name` (string): Nazwa konta. Musi być unikalna dla użytkownika.
    - `initial_balance` (number): Saldo początkowe. Musi być >= 0.
  - **Opcjonalne**:
    - `currency` (string, 3 znaki): Waluta konta. Domyślnie "PLN".

## 3. Wykorzystywane typy
- **Request Command Model**: `CreateAccountCommand`
- **Response DTO**: `AccountDTO`
- **Validation Schema**: `CreateAccountSchema` (oparty na Zod)

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (201 Created)**:
  ```json
  {
    "id": "uuid-goes-here",
    "name": "Savings Account",
    "initial_balance": 500.00,
    "currency": "PLN",
    "created_at": "iso-date-string",
    "updated_at": "iso-date-string",
    "current_balance": 500.00
  }
  ```
- **Odpowiedzi błędu**:
  - `400 Bad Request`: Błędy walidacji danych wejściowych.
  - `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
  - `409 Conflict`: Konto o tej nazwie już istnieje.
  - `500 Internal Server Error`: Wewnętrzny błąd serwera.

## 5. Przepływ danych
1.  Klient wysyła żądanie `POST` na `/api/accounts` z danymi konta.
2.  Middleware Astro (`src/middleware/index.ts`) przechwytuje żądanie i weryfikuje sesję użytkownika Supabase. Jeśli sesja jest nieprawidłowa, zwraca `401 Unauthorized`. `user_id` jest dołączane do `context.locals`.
3.  Handler `POST` w `src/pages/api/accounts/index.ts` jest wywoływany.
4.  Dane wejściowe z body żądania są walidowane przy użyciu schematu Zod (`CreateAccountSchema`). W przypadku błędu walidacji, zwracany jest `400 Bad Request` ze szczegółami.
5.  Handler wywołuje metodę `createAccount` z `AccountService` (`src/lib/services/account.service.ts`), przekazując zwalidowane dane oraz `user_id` z `context.locals`.
6.  `AccountService` łączy się z bazą danych Supabase.
7.  Sprawdza, czy konto o podanej nazwie (`name`) już istnieje dla danego `user_id`, aby uniknąć duplikatów. Jeśli tak, zwraca błąd, który handler mapuje na `409 Conflict`.
8.  Wstawia nowy rekord do tabeli `accounts` z `user_id`, `name`, `initial_balance` i `currency`.
9.  Serwis zwraca nowo utworzony obiekt konta do handlera.
10. Handler mapuje zwrócony obiekt na `AccountDTO` i wysyła go do klienta z kodem statusu `201 Created`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp do endpointu jest ograniczony do uwierzytelnionych użytkowników. Middleware Astro będzie odpowiedzialne za weryfikację tokenu JWT Supabase.
- **Autoryzacja**: Identyfikator `user_id` jest pobierany bezpośrednio z sesji po stronie serwera (`context.locals.user.id`), a nie z danych wejściowych, co zapobiega tworzeniu kont dla innych użytkowników.
- **Walidacja danych**: Użycie Zod do ścisłej walidacji danych wejściowych chroni przed niepoprawnymi danymi i potencjalnymi atakami (np. NoSQL injection, chociaż używamy PostgreSQLa).
- **RLS (Row-Level Security)**: Polityki RLS w Supabase zapewniają, że użytkownik może modyfikować i odczytywać tylko własne dane, co stanowi dodatkową warstwę ochrony na poziomie bazy danych.

## 8. Etapy wdrożenia
1.  **Stworzenie schematu walidacji Zod**:
    - W nowym pliku `src/lib/validators/account.validators.ts` zdefiniować `CreateAccountSchema` dla `CreateAccountCommand`.
2.  **Implementacja `AccountService`**:
    - Utworzyć plik `src/lib/services/account.service.ts`.
    - Dodać funkcję `createAccount(command: CreateAccountCommand, userId: string, supabase: SupabaseClient)`.
    - Wewnątrz funkcji zaimplementować logikę:
        - Sprawdzenie istniejącego konta po `name` i `userId`.
        - Wstawienie nowego rekordu do tabeli `accounts`.
        - Zwrócenie wyniku operacji.
3.  **Stworzenie endpointu API w Astro**:
    - Utworzyć plik `src/pages/api/accounts/index.ts`.
    - Zaimplementować handler `POST`.
    - W handlerze:
        - Upewnić się, że użytkownik jest zalogowany (sprawdzając `Astro.locals.user`).
        - Zwalidować `Astro.request.body` przy użyciu `CreateAccountSchema`.
        - Wywołać `AccountService.createAccount`.
        - Obsłużyć pomyślną odpowiedź (status `201`) i błędy (`400`, `409`, `500`).
4.  **Aktualizacja Middleware (jeśli konieczne)**:
    - Zweryfikować, czy `src/middleware/index.ts` poprawnie obsługuje sesję Supabase i udostępnia dane użytkownika w `Astro.locals`.
