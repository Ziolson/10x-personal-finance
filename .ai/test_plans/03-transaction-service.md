# Plan Testów: Transaction Service

Ten dokument opisuje plan testów dla `src/lib/services/transaction.service.ts`.

## Cel

Weryfikacja złożonej logiki biznesowej związanej z zarządzaniem transakcjami (wydatki, przychody, przelewy).

## Zakres

- `createTransaction`, `updateTransaction`, `getTransactions`.

## Scenariusze Testowe

### 1. Tworzenie Transakcji (`createTransaction`)

- [ ] **Scenariusz: Wydatek**:
  - Walidacja z Zod.
  - Budowanie payloadu: `from_account_id` i `category_id` muszą być ustawione, `to_account_id` musi być `null`.
- [ ] **Scenariusz: Przychód**:
  - Budowanie payloadu: `to_account_id` i `category_id` ustawione, `from_account_id` musi być `null`.
- [ ] **Scenariusz: Przelew**:
  - Budowanie payloadu: `from_account_id` i `to_account_id` ustawione, `category_id` musi być `null`.

### 2. Pobieranie listy (`getTransactions`)

- [ ] **Scenariusz: Filtrowanie**:
  - Weryfikacja czy zapytania do Supabase zawierają poprawne filtry `eq`, `or`, `gte`, `lte`.
- [ ] **Scenariusz: Paginacja**:
  - Obliczanie `offset` na podstawie strony i limitu.
  - Formułowanie odpowiedzi `PaginatedResponse`.

### 3. Aktualizacja (`updateTransaction`)

- [ ] **Scenariusz: Partial Update**:
  - Wysłanie tylko niektórych pól.
  - Weryfikacja czy payload wysyłany do Supabase zawiera tylko zmienione pola.

## Wyzwania

- Mockowanie Supabase Query Builder (łańcuchowanie metod `.select().eq().order()`).
