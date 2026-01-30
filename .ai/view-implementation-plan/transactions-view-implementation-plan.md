# Plan implementacji widoku Transakcje

## 1. Przegląd

Widok "Historia Transakcji" jest centralnym miejscem do przeglądania i zarządzania wszystkimi operacjami finansowymi użytkownika. Umożliwia wyświetlanie listy transakcji w formie tabeli (desktop) lub kart (mobile), filtrowanie danych, oraz wykonywanie operacji CRUD (tworzenie, edycja, usuwanie) na transakcjach typu: Wydatek, Przychód, Transfer.

## 2. Routing widoku

- **Ścieżka:** `/transactions`
- **Plik Astro:** `src/pages/transactions.astro`
- **Główny komponent React:** `src/components/features/transactions/TransactionsView.tsx`

## 3. Struktura komponentów

```
src/pages/transactions.astro (Layout aplikacji)
└── TransactionsView (React Component - client:load)
    ├── PageHeader (Nagłówek z przyciskiem "Dodaj transakcję")
    ├── TransactionsFilters (Pasek filtrów: Typ, Konto, Kategoria, Data)
    ├── TransactionsList (Komponent prezentacyjny)
    │   ├── TransactionsTable (Widok Desktop - shadcn Table)
    │   ├── TransactionsMobileList (Widok Mobile - lista kart)
    │   ├── Pagination (Kontrolki paginacji)
    │   ├── SkeletonLoader (Stan ładowania)
    │   └── EmptyState (Stan braku danych)
    ├── AddTransactionDialog (Modal dodawania)
    │   └── TransactionForm (Współdzielony formularz)
    ├── EditTransactionDialog (Modal edycji)
    │   └── TransactionForm
    └── DeleteTransactionDialog (Alert potwierdzenia usunięcia)
```

## 4. Szczegóły komponentów

### TransactionsView

- **Opis:** Główny kontener zarządzający stanem widoku, pobieraniem danych i koordynacją modali.
- **Główne elementy:** Wrapper `div`, wywołania hooków logicznych.
- **Odpowiedzialność:**
  - Inicjalizacja hooka `useTransactions`.
  - Przechowywanie stanu otwarcia modali (Add/Edit/Delete).
  - Przekazywanie danych do komponentów podrzędnych.

### TransactionForm

- **Opis:** Złożony formularz obsługujący trzy typy transakcji. Pola zmieniają się dynamicznie w zależności od wybranego typu.
- **Główne elementy:**
  - `Form` (shadcn/react-hook-form).
  - `Select` (Typ transakcji).
  - `Input` (Kwota, Opis).
  - `DatePicker` (Data).
  - Warunkowe `Select` dla Kont i Kategorii.
- **Logika dynamiczna:**
  - Typ **Wydatek**: Pokazuje "Z konta" (`from_account_id`) i "Kategoria" (`category_id`). Ukrywa "Na konto".
  - Typ **Przychód**: Pokazuje "Na konto" (`to_account_id`) i "Kategoria" (`category_id`). Ukrywa "Z konta".
  - Typ **Transfer**: Pokazuje "Z konta" (`from_account_id`) i "Na konto" (`to_account_id`). Ukrywa "Kategoria".
- **Walidacja:** Schemat Zod zgodny z backendem. Dodatkowo walidacja `from_account_id !== to_account_id` dla transferów.
- **Propsy:**
  - `defaultValues?: TransactionFormValues`
  - `onSubmit: (values: TransactionFormValues) => Promise<void>`
  - `isLoading: boolean`
  - `accounts: AccountDTO[]`
  - `categories: CategoryDTO[]`

### TransactionsFilters

- **Opis:** Pasek narzędziowy nad listą transakcji.
- **Elementy:**
  - `Select` dla filtrowania po Koncie.
  - `Select` dla filtrowania po Kategorii.
  - `Select` dla filtrowania po Typie (expense, income, transfer).
  - `DatePickerWithRange` dla zakresu dat.
  - Przycisk "Wyczyść filtry".
- **Propsy:**
  - `filters: TransactionFiltersState`
  - `onFilterChange: (filters: TransactionFiltersState) => void`

### TransactionsList

- **Opis:** Komponent prezentacyjny, który decyduje, czy wyświetlić tabelę, listę mobilną, stan ładowania czy pusty stan.
- **Propsy:**
  - `transactions: TransactionDTO[]`
  - `isLoading: boolean`
  - `pagination: PaginationInfo`
  - `onPageChange: (page: number) => void`
  - `onEdit: (transaction: TransactionDTO) => void`
  - `onDelete: (transaction: TransactionDTO) => void`

## 5. Typy

Wymagane zdefiniowanie typów w `src/types.ts` lub lokalnie w komponencie, jeśli są specyficzne dla widoku (ale zalecane reużywanie z `types.ts`).

### TransactionFiltersState

Stan filtrów w aplikacji frontendowej.

```typescript
interface TransactionFiltersState {
  type?: "expense" | "income" | "transfer";
  accountId?: string;
  categoryId?: string;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
}
```

### TransactionFormValues

Typ dla formularza (rozszerza logikę DTO o typy formularzowe, np. Date).

```typescript
interface TransactionFormValues {
  type: "expense" | "income" | "transfer";
  amount: number; // lub string w trakcie edycji, parsowany przy submit
  date: Date;
  description?: string;
  from_account_id?: string;
  to_account_id?: string;
  category_id?: string;
}
```

## 6. Zarządzanie stanem

### Custom Hook: `useTransactions`

Hook odpowiedzialny za komunikację z API transakcji.

**Stan:**

- `transactions`: Tablica `TransactionDTO`.
- `pagination`: Obiekt `PaginationInfo` (currentPage, totalPages, totalItems).
- `filters`: Obiekt `TransactionFiltersState`.
- `status`: 'idle' | 'loading' | 'success' | 'error'.

**Akcje:**

- `fetchTransactions(params)`: Pobiera dane z `GET /api/transactions`. Konwertuje `TransactionFiltersState` na parametry URL (np. `dateRange` na `startDate` i `endDate`).
- `addTransaction(command)`: Wywołuje `POST`.
- `updateTransaction(id, command)`: Wywołuje `PUT`.
- `deleteTransaction(id)`: Wywołuje `DELETE`.
- `setFilters(newFilters)`: Aktualizuje filtry i resetuje stronę do 1.
- `setPage(page)`: Zmienia stronę.

### Hooki pomocnicze

- `useAccounts`: Do pobrania listy kont (dla formularza i filtrów).
- `useCategories`: Do pobrania listy kategorii (dla formularza i filtrów).

## 7. Integracja API

### GET /api/transactions

- **Query params:**
  - `page`, `limit`
  - `type`
  - `accountId`, `categoryId`
  - `startDate`, `endDate` (format YYYY-MM-DD)
- **Response:** `PaginatedResponse<TransactionDTO>`

### POST /api/transactions

- **Body:** `CreateTransactionCommand` (Unia dyskryminowana).
- **Wymagania:** Odpowiednie pola dla danego `type`.

### PUT /api/transactions/[id]

- **Body:** `UpdateTransactionCommand` (Partial).

### DELETE /api/transactions/[id]

- **Body:** brak.

## 8. Interakcje użytkownika

1. **Przeglądanie listy:**
   - Wejście na stronę inicjuje pobranie danych dla bieżącego miesiąca (lub domyślnych ustawień).
   - Scrollowanie/Paginacja ładuje kolejne strony.

2. **Filtrowanie:**
   - Wybór wartości w filtrach automatycznie odświeża listę.
   - Debounce nie jest konieczny dla Selectów, ale przyda się, jeśli dodamy wyszukiwanie tekstowe.

3. **Dodawanie Transakcji:**
   - Kliknięcie "Dodaj transakcję" otwiera modal.
   - Wybór typu "Transfer" ukrywa pole kategorii i pokazuje pole konta docelowego.
   - Walidacja blokuje wysłanie formularza, jeśli konto źródłowe == docelowe (dla transferu).
   - Sukces zamyka modal, wyświetla toast i odświeża listę.

4. **Edycja:**
   - Kliknięcie ikony ołówka na liście otwiera modal edycji wypełniony danymi.
   - Zmiana typu transakcji podczas edycji jest dozwolona, ale może wymagać wyczyszczenia niepasujących pól.

5. **Usuwanie:**
   - Kliknięcie ikony kosza otwiera dialog potwierdzenia.
   - Potwierdzenie usuwa transakcję i odświeża listę.

## 9. Warunki i walidacja

- **Formularz:**
  - `amount`: Musi być liczbą dodatnią.
  - `date`: Wymagana.
  - `from_account_id`: Wymagane dla Expense i Transfer.
  - `to_account_id`: Wymagane dla Income i Transfer. Musi być różne od `from_account_id` (tylko Transfer).
  - `category_id`: Wymagane dla Expense i Income.

- **Filtry:**
  - Data "od" nie może być późniejsza niż data "do".

## 10. Obsługa błędów

- **Błędy API:** Wyświetlanie globalnych Toastów (np. "Nie udało się pobrać transakcji", "Wystąpił błąd podczas zapisywania").
- **Błędy Walidacji:** Wyświetlanie inline w formularzu (pod polami input).
- **Empty State:** Wyświetlanie przyjaznego komunikatu i przycisku "Dodaj pierwszą transakcję", gdy lista jest pusta (i brak aktywnych filtrów).

## 11. Kroki implementacji

1. **Przygotowanie środowiska:**
   - Utworzenie folderu `src/components/features/transactions`.
   - Zdefiniowanie brakujących typów w `src/types.ts`.

2. **Implementacja Hooka `useTransactions`:**
   - Obsługa pobierania danych z parametrami.
   - Obsługa mutacji (add, update, delete).

3. **Implementacja komponentów UI (prezentacyjnych):**
   - `TransactionListItem` (dla widoku mobile i desktop row).
   - `TransactionsTable` (wrapper na tabelę).
   - `TransactionsFilters`.

4. **Implementacja Formularza `TransactionForm`:**
   - Konfiguracja `react-hook-form` i schematu Zod.
   - Obsługa warunkowego renderowania pól na podstawie `type`.
   - Integracja z `useAccounts` i `useCategories`.

5. **Integracja w `TransactionsView`:**
   - Złożenie komponentów.
   - Podpięcie stanów modali (Add/Edit/Delete).
   - Obsługa zdarzeń (onEdit, onDelete, onFilterChange).

6. **Stworzenie strony Astro:**
   - `src/pages/transactions.astro`.
   - Import i osadzenie `TransactionsView` z dyrektywą `client:load`.
