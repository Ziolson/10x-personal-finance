# Plan Testów: Walidatory Zod

Ten dokument opisuje szczegółowy plan testów jednostkowych dla walidatorów Zod znajdujących się w `src/lib/validators/`.

## Cel

Zapewnienie, że wszystkie dane wejściowe do API są poprawnie walidowane przed przetworzeniem przez warstwę serwisową.

## Zakres

- `account.validators.ts`
- `budgets.validators.ts`
- `categories.validators.ts`
- `transaction.validators.ts`

## Scenariusze Testowe

### 1. Transakcje (`transaction.validators.ts`) - Kluczowy obszar

- **CreateTransactionSchema**:
  - [ ] **Expense**: Poprawne dane (amount > 0, valid UUIDs dla account i category).
  - [ ] **Income**: Poprawne dane (amount > 0, valid UUIDs dla account i category).
  - [ ] **Transfer**: Poprawne dane (dwie różne kopalnie kont, brak kategorii).
  - [ ] **Błąd**: Przelew na to samo konto (refine logic).
  - [ ] **Błąd**: Ujemna kwota transakcji.
  - [ ] **Błąd**: Niepoprawny format daty (nie YYYY-MM-DD).
- **UpdateTransactionSchema**:
  - [ ] **Sukces**: Przynajmniej jedno pole przekazane.
  - [ ] **Błąd**: Pusty obiekt (refine logic).
- **GetTransactionsQuerySchema**:
  - [ ] **Sukces**: Poprawne filtrowanie dat i paginacja.
  - [ ] **Sukces**: Coerce dla stringów (np. page="1" -> number 1).

### 2. Budżety (`budgets.validators.ts`)

- [ ] Poprawne tworzenie budżetu (amount > 0, month 1-12).
- [ ] Błędy walidacji dla niepoprawnych miesięcy.

### 3. Konta (`account.validators.ts`)

- [ ] Poprawne tworzenie konta.
- [ ] Minimalna i maksymalna długość nazwy.

## Narzędzia

- Vitest
- Zod (`safeParse`)
