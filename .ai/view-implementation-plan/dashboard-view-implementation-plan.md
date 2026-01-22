# Plan implementacji widoku Dashboard (Pulpit)

## 1. Przegląd

Pulpit (`Dashboard`) jest głównym widokiem aplikacji dostępnym dla zalogowanego użytkownika. Jego celem jest prezentacja podsumowania finansowego dla wybranego miesiąca, w tym salda, struktury wydatków, ostatnich transakcji oraz postępów w budżetach. Widok musi obsługiwać stan "pusty" (Empty State) dla nowych użytkowników, którzy nie dodali jeszcze żadnego konta.

## 2. Routing widoku

- **Ścieżka**: `/`
- **Plik główny**: `src/pages/index.astro`
- **Komponent wiodący**: `src/features/dashboard/components/DashboardView.tsx` (Komponent React renderowany po stronie klienta: `<DashboardView client:load />`)

## 3. Struktura komponentów

- `DashboardView` (Container - zarządza stanem daty i pobieraniem danych)
  - `PageHeader` (Tytuł "Pulpit")
  - `MonthNavigator` (Wybór miesiąca/roku)
  - `DashboardContent` (Główny Grid)
    - `SummaryCards` (Sekcja podsumowania: Przychody, Wydatki, Saldo)
      - `SummaryCard` (Pojedyncza karta)
    - `ChartsSection`
      - `ExpensesPieChart` (Wykres kołowy wydatków - Recharts)
    - `RecentTransactionsSection`
      - `RecentTransactionsList`
        - `TransactionItem` (Pojedyncza transakcja na liście)
    - `BudgetsSection`
      - `BudgetsProgressList`
        - `BudgetProgressItem` (Pasek postępu budżetu)
  - `EmptyState` (Wyświetlany zamiast `DashboardContent` i `MonthNavigator`, gdy użytkownik nie ma kont)

## 4. Szczegóły komponentów

### `DashboardView`

- **Opis**: Główny kontener logiki biznesowej. Odpowiada za pobieranie danych z `/api/dashboard` oraz sprawdzanie, czy użytkownik posiada jakiekolwiek konta (aby wyświetlić Empty State).
- **Stan**: `currentDate` (Date), `dashboardData` (DashboardDTO), `isLoading` (boolean), `error` (string | null), `hasAccounts` (boolean | null).
- **Główne elementy**: Wrapper `div`, `PageHeader`, warunkowe renderowanie `EmptyState` lub `DashboardContent` z `MonthNavigator`.

### `MonthNavigator`

- **Lokalizacja**: `src/components/features/budgets/MonthNavigator.tsx` (istniejący)
- **Props**:
  - `currentDate: Date`
  - `onDateChange: (date: Date) => void`
- **Opis**: Pozwala zmieniać miesiąc. Zmiana miesiąca wyzwala ponowne pobranie danych w `DashboardView`.

### `SummaryCards`

- **Opis**: Wyświetla 3 karty: Przychody, Wydatki, Saldo.
- **Props**: `summary: DashboardSummary`
- **Szczegóły**: Wykorzystuje komponenty `Card` z `shadcn/ui`. Kolorowanie wartości (zielony dla dodatniego salda/przychodów, czerwony dla wydatków). Formatowanie waluty (PLN).

### `ExpensesPieChart`

- **Opis**: Wykres kołowy `Recharts` pokazujący udział kategorii w wydatkach.
- **Props**: `data: ExpenseByCategory[]`
- **Szczegóły**:
  - Obsługa legendy.
  - Tooltip z kwotą i procentem.
  - Jeśli brak wydatków (pusta tablica), wyświetla komunikat "Brak wydatków w tym miesiącu".

### `RecentTransactionsList`

- **Opis**: Lista ostatnich 5 transakcji.
- **Props**: `transactions: TransactionDTO[]`
- **Szczegóły**:
  - Każdy element (`TransactionItem`) pokazuje ikonę kategorii, nazwę, datę i kwotę.
  - Przycisk "Zobacz wszystkie" prowadzący do `/transactions`.

### `BudgetsProgressList`

- **Opis**: Lista pasków postępu dla budżetów.
- **Props**: `budgets: BudgetProgressItem[]`
- **Szczegóły**:
  - Wykorzystuje komponent `Progress` z `shadcn/ui`.
  - Logika kolorów: < 80% (zielony/neutralny), 80-100% (żółty/pomarańczowy), > 100% (czerwony).
  - Wyświetla kwotę wydaną vs. limit.

### `EmptyState`

- **Opis**: Ekran powitalny dla użytkownika bez kont.
- **Szczegóły**:
  - Grafika/Ikona.
  - Tekst: "Witaj w 10xPersonal Finance!".
  - Przycisk (CTA): "Dodaj swoje pierwsze konto" -> otwiera `AddAccountModal` (lub przekierowuje/triggeruje akcję).
  - _Uwaga_: Zgodnie z User Journey, kliknięcie otwiera `AddAccountModal`.

## 5. Typy

Wykorzystujemy typy zdefiniowane w `src/types.ts`.

- `DashboardDTO`: Główny typ odpowiedzi.
- `DashboardSummary`: Pola `total_income`, `total_expense`, `balance`.
- `ExpenseByCategory`: Pola `category_name`, `amount`, `percentage`.
- `TransactionDTO`: Do listy transakcji.
- `BudgetProgressItem`: Do listy budżetów.

Dodatkowe typy dla komponentów widoku:

- `DashboardViewProps`: (brak, komponent "stronowy").

## 6. Zarządzanie stanem

Stan jest zarządzany lokalnie w komponencie `DashboardView` (Client-side).

- `currentDate`: Domyślnie `new Date()`. Zmiana przez `MonthNavigator` aktualizuje ten stan.
- `data`: Dane z API.
- Wykorzystanie hooka `useEffect` do pobierania danych przy zmianie `currentDate`.
- _Opcjonalnie_: Można stworzyć custom hook `useDashboardData(month, year)` dla czystości kodu.

## 7. Integracja API

**Endpoint**: `GET /api/dashboard`

- **Parametry**: `?month=X&year=YYYY`
- **Odpowiedź**: `DashboardDTO`
- **Obsługa błędów**: Wyświetlenie `Toast` z błędem w przypadku 4xx/5xx.

Oraz (dla Empty State):
**Endpoint**: `GET /api/accounts` (lub sprawdzenie długości listy kont w inny sposób, np. jeśli Dashboard zwracałby taką informację, ale obecnie nie zwraca - sugerowane szybkie, lekkie zapytanie sprawdzające czy użytkownik ma konta, jeśli `summary` jest puste).
_Alternatywa_: Zakładamy, że jeśli `summary` ma same zera i puste listy, to jest to stan pusty (choć może być mylące).
_Rekomendacja_: Pobranie listy kont (`GET /api/accounts`) raz przy montowaniu komponentu, aby precyzyjnie określić `EmptyState` ("Brak kont") vs "Brak danych w tym miesiącu".

## 8. Interakcje użytkownika

1.  **Zmiana miesiąca**: Kliknięcie strzałek w `MonthNavigator` -> Aktualizacja `currentDate` -> Pobranie nowych danych.
2.  **Dodanie konta (Empty State)**: Kliknięcie "Dodaj konto" -> Otwarcie modala `AddAccountModal`.
3.  **Kliknięcie "Zobacz wszystkie"**: Przekierowanie do `/transactions`.
4.  **Hover na wykresie**: Wyświetlenie szczegółów kategorii.

## 9. Warunki i walidacja

- **Walidacja daty**: Miesiąc 1-12, Rok poprawny (API waliduje, frontend ogranicza nawigację jeśli potrzebne, ale zazwyczaj standardowy zakres jest ok).
- **Ostrzeżenia budżetowe**: W `BudgetProgressItem`, jeśli `percentage_used > 100`, pasek i tekst zmieniają kolor na czerwony (`text-red-500`, `bg-red-500`).
- **Pusty miesiąc**: Jeśli API zwróci puste listy i zera, wyświetlamy standardowy dashboard z zerami i komunikatem "Brak danych w tym okresie", a NIE `EmptyState` dla nowego użytkownika (to zależy od sprawdzenia posiadania kont).

## 10. Obsługa błędów

- **Błąd pobierania**: Wyświetlenie komunikatu błędu w miejscu treści dashboardu ("Nie udało się załadować danych.") oraz Toast.
- **Błąd sieci**: Retry button.
- **Loading**: Wyświetlenie `Skeleton` (szkieletu) całego dashboardu podczas ładowania danych.

## 11. Kroki implementacji

1.  **Przygotowanie API Clienta**: Upewnienie się, że istnieje funkcja do pobierania `getDashboard(month, year)` oraz `getAccounts()` (do sprawdzenia empty state).
2.  **Stworzenie komponentów "atomowych"**:
    - `SummaryCard`
    - `BudgetProgressItem`
    - `TransactionItem` (jeśli nie istnieje)
3.  **Implementacja sekcji**:
    - `SummaryCards`
    - `RecentTransactionsList`
    - `BudgetsProgressList`
    - `ExpensesPieChart` (konfiguracja Recharts)
4.  **Implementacja `DashboardView`**:
    - Logika stanu `currentDate`.
    - Pobieranie danych (fetch).
    - Logika przełączania `isLoading` / `isError` / `Content` / `EmptyState`.
5.  **Integracja z `index.astro`**: Podmiana zawartości na `<DashboardView client:load />`.
6.  **Stylowanie i dopracowanie**: Upewnienie się, że wykresy wyglądają dobrze na mobile, a grid jest responsywny (1 kolumna mobile, 2/3 kolumny desktop).
