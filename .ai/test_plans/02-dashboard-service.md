# Plan Testów: Dashboard Service

Ten dokument opisuje plan testów dla `src/lib/services/dashboard.service.ts`.

## Cel

Weryfikacja poprawności agregacji danych finansowych prezentowanych na głównym pulpicie użytkownika.

## Zakres

- Funkcja `getDashboardData` i jej wewnętrzne funkcje pomocnicze (`getSummary`, `getExpensesByCategory`).

## Scenariusze Testowe

### 1. Podsumowanie Finansowe (`getSummary`)

- [ ] **Scenariusz: Mix transakcji**: Użytkownik ma przychody, wydatki i przelewy.
  - **Oczekiwany wynik**: Przychody i wydatki sumują się poprawnie, przelewy są ignorowane w bilansie okresu.
- [ ] **Scenariusz: Brak transakcji**: Pusty zestaw danych.
  - **Oczekiwany wynik**: Sumy wynoszą 0.

### 2. Wydatki wg Kategorii (`getExpensesByCategory`)

- [ ] **Scenariusz: Grupowanie**: Wiele transakcji w tych samych kategoriach.
  - **Oczekiwany wynik**: Kwoty są poprawnie zsumowane dla każdej kategorii.
- [ ] **Scenariusz: Procenty**: Obliczanie udziału procentowego.
  - **Oczekiwany wynik**: Zaokrąglenia do 1 miejsca po przecinku, suma (w miarę możliwości) zbliżona do 100%.
- [ ] **Scenariusz: Sortowanie**: Kategorie o różnych kwotach.
  - **Oczekiwany wynik**: Sortowanie malejące po kwocie.

### 3. Integracja Dashboardu (`getDashboardData`)

- [ ] **Scenariusz: Zakres dat**: Pobieranie danych dla konkretnego miesiąca.
  - **Oczekiwany wynik**: Poprawne wygenerowanie daty początkowej i końcowej (obsługa lat przestępnych, np. luty).

## Wyzwania / Mockowanie

- Supabase Client: Mockowanie odpowiedzi z tabel `transactions` i widoku `budget_progress`.
