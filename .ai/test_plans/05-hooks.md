# Plan Testów: React Hooks

Ten dokument opisuje plan testów dla niestandardowych hooków Reactowych.

## Cel

Weryfikacja logiki stanów, efektów i komunikacji z API wewnątrz hooków.

## Zakres

- `src/components/hooks/useAccounts.ts` (już posiada testy, do przeglądu/rozszerzenia).
- `src/components/features/transactions/hooks/useTransactions.ts`.

## Scenariusze Testowe

### 1. `useTransactions`

- [ ] **Inicjalizacja**:
  - Ładowanie pierwszej strony transakcji przy montowaniu komponentu.
- [ ] **Zmiana filtrów**:
  - Wywołanie `refresh` przy zmianie parametrów filtrowania.
- [ ] **Paginacja**:
  - Zmiana stanu przy przechodzeniu między stronami.
- [ ] **Obsługa błędów**:
  - Ustawienie stanu `error`, gdy API zwróci błąd.

### 2. `useAccounts`

- [ ] Weryfikacja poprawności pobierania listy kont i ich aktualizacji w cache'u (jeśli dotyczy).

## Narzędzia

- `@testing-library/react-hooks` (lub wbudowane w `@testing-library/react` dla nowszych wersji).
- Mockowanie modułów (np. `src/lib/api.ts`).
