# Plan implementacji widoku Budżety

## 1. Przegląd

Widok "Budżety" umożliwia użytkownikom zarządzanie miesięcznymi planami finansowymi. Pozwala na tworzenie budżetów, przypisywanie do nich kategorii, śledzenie postępów w wydatkach oraz edycję i usuwanie istniejących budżetów. Widok jest kluczowy dla funkcji kontroli finansowej aplikacji.

## 2. Routing widoku

Widok będzie dostępny pod ścieżką: `/budgets`

## 3. Struktura komponentów

- `Layout` (globalny layout aplikacji, zawiera `Sidebar` i `UserMenu`)
  - `BudgetsView` (główny kontener strony)
    - `PageHeader` (Tytuł i przycisk "Dodaj budżet")
    - `MonthNavigator` (Nawigacja pomiędzy miesiącami)
    - `BudgetSummary` (Opcjonalnie: Podsumowanie całkowitego budżetowania vs wydatki)
    - `BudgetsList` (Lista kart budżetowych)
      - `BudgetListItem` (Pojedynczy budżet z paskiem postępu)
        - `BudgetProgress` (Wizualizacja postępu)
        - `Badge` (Lista przypisanych kategorii)
        - `ActionsMenu` (Edytuj, Usuń)
    - `AddBudgetModal` (Formularz tworzenia)
    - `EditBudgetModal` (Formularz edycji)
    - `DeleteConfirmationDialog` (Potwierdzenie usunięcia)
    - `EmptyState` (Widok braku budżetów)

## 4. Szczegóły komponentów

### `BudgetsView`

- **Opis**: Główny komponent strony, zarządza stanem wybranego miesiąca i roku, oraz pobiera dane budżetów.
- **Główne elementy**: `div` (kontener), `PageHeader`, `MonthNavigator`, `BudgetsList`.
- **Obsługiwane interakcje**: Zmiana miesiąca/roku, otwarcie modala dodawania.
- **Typy**: Brak bezpośrednich propsów (strona).
- **Zarządzanie stanem**: `currentDate` (Date), `isAddModalOpen` (boolean).

### `MonthNavigator`

- **Opis**: Komponent do zmiany aktualnie wyświetlanego miesiąca.
- **Główne elementy**: Przycisk "Poprzedni", "Następny", Etykieta miesiąca (np. "Styczeń 2026").
- **Propsy**:
  - `currentDate: Date`
  - `onDateChange: (date: Date) => void`

### `BudgetsList`

- **Opis**: Wyświetla listę budżetów lub `EmptyState` jeśli lista jest pusta.
- **Główne elementy**: Grid lub lista komponentów `BudgetListItem`.
- **Propsy**:
  - `budgets: BudgetDTO[]`
  - `isLoading: boolean`
  - `onEdit: (budget: BudgetDTO) => void`
  - `onDelete: (budget: BudgetDTO) => void`

### `BudgetListItem`

- **Opis**: Karta pojedynczego budżetu. Wyświetla nazwę, kwotę, pasek postępu oraz przypisane kategorie.
- **Główne elementy**: `Card`, `Progress`, `Badge` (dla kategorii), menu akcji.
- **Propsy**:
  - `budget: BudgetDTO` (zawiera `categories` jako listę ID)
  - `categoriesMap: Record<string, CategoryDTO>` (do wyświetlania nazw kategorii)
  - `onEdit: () => void`
  - `onDelete: () => void`

### `AddBudgetModal` / `EditBudgetModal`

- **Opis**: Modale z formularzem zarządzania budżetem.
- **Formularz**:
  - `Nazwa`: Input tekstowy.
  - `Kwota`: Input liczbowy (PLN).
  - `Kategorie`: Multi-select.
- **Walidacja**:
  - Wymagane nazwa i kwota > 0.
  - **Kluczowa walidacja**: Lista dostępnych kategorii do wyboru powinna wykluczać kategorie, które są już przypisane do _innych_ budżetów w tym samym miesiącu (na podstawie danych pobranych z API).
- **Propsy**:
  - `isOpen: boolean`
  - `onClose: () => void`
  - `onSubmit: (data: CreateBudgetCommand | UpdateBudgetCommand) => Promise<void>`
  - `initialData?: BudgetDTO` (tylko dla edycji)
  - `availableCategories: CategoryDTO[]` (wszystkie kategorie)
  - `usedCategoryIds: string[]` (kategorie zajęte przez inne budżety w tym miesiącu)

## 5. Typy

Wykorzystamy istniejące typy z `src/types.ts`:

- `BudgetDTO`: `{ id, name, amount, month, year, created_at, categories: string[] }`
- `CreateBudgetCommand`: `{ name, amount, month, year, category_ids? }`
- `UpdateBudgetCommand`: `{ name?, amount?, category_ids? }`
- `CategoryDTO`: `{ id, name, type, budget_id, ... }`

Dodatkowe typy pomocnicze:

- `BudgetsState`: Stan lokalny widoku (data, modale).

## 6. Zarządzanie stanem

Stan widoku będzie zarządzany głównie przez:

1.  **React State (`useState`)**:
    - `currentDate`: Data określająca wybrany miesiąc (domyślnie `new Date()`).
    - `isAddModalOpen`, `editingBudget` (przechowuje `BudgetDTO` lub `null`), `deletingBudget`.
2.  **React Query / Custom Hooks (np. `useBudgets`, `useCategories`)**:
    - Pobieranie listy budżetów dla `currentDate`.
    - Pobieranie listy wszystkich kategorii (potrzebne do mapowania ID na nazwy oraz do formularza).
    - Mutacje (`createBudget`, `updateBudget`, `deleteBudget`) z inwalidacją "queries".

## 7. Integracja API

Integracja z endpointami:

- **Pobieranie budżetów**: `GET /api/budgets?month={M}&year={Y}`.
  - Zwraca: `BudgetDTO[]`.
- **Pobieranie kategorii**: `GET /api/categories?type=expense` (budżety dotyczą głównie wydatków, ale PRD nie ogranicza typu kategorii, założymy filtrowanie po wydatkach dla UX, lub wszystkie).
  - Zwraca: `CategoryDTO[]`.
- **Tworzenie**: `POST /api/budgets`.
  - Payload: `CreateBudgetCommand`.
- **Aktualizacja**: `PUT /api/budgets/{id}`.
  - Payload: `UpdateBudgetCommand`.
- **Usuwanie**: `DELETE /api/budgets/{id}`.

## 8. Interakcje użytkownika

1.  **Wejście na stronę**: Ładowanie budżetów dla bieżącego miesiąca.
2.  **Zmiana miesiąca**: Kliknięcie w nawigatorze -> przeładowanie listy budżetów via API.
3.  **Dodawanie budżetu**:
    - Kliknij "Dodaj budżet" -> Otwiera Modal.
    - Wypełnij nazwę, kwotę.
    - Wybierz kategorie (na liście wyszarzone/ukryte te, które są już w innych budżetach tego miesiąca).
    - Zapisz -> API POST -> Zamknięcie modala -> Toast sukcesu -> Odświeżenie listy.
4.  **Edycja budżetu**:
    - Kliknij "Edytuj" na karcie -> Otwiera Modal z danymi.
    - Można zmienić/dodać kategorie (z uwzględnieniem tych zwolnionych przez bieżący budżet).
    - Zapisz -> API PUT -> Toast -> Odświeżenie.
5.  **Usuwanie**:
    - Kliknij "Usuń" -> Dialog potwierdzenia.
    - Potwierdź -> API DELETE -> Toast -> Odświeżenie.

## 9. Warunki i walidacja

- **Unikalność kategorii w miesiącu**:
  - Frontend: Podczas renderowania selektora kategorii w formularzu, należy filtrować listę `allCategories`.
  - Logika: `isAvailable = !usedCategoryIds.includes(category.id) || currentBudget.categories.includes(category.id)`.
  - `usedCategoryIds` to zbiór wszystkich `category_ids` ze wszystkich budżetów w _aktualnie wyświetlanym miesiącu_ (z wyjątkiem edytowanego budżetu).
- **Walidacja formularza**:
  - Nazwa: Wymagana.
  - Kwota: Liczba dodatnia.
  - Data (miesiąc/rok): Automatycznie ustawiane na podstawie widoku (dla tworzenia).

## 10. Obsługa błędów

- **Błędy API (4xx, 5xx)**: Wyświetlanie powiadomień "Toast" z komunikatem błędu (np. "Budget with this name already exists").
- **Błąd ładowania**: Wyświetlenie komunikatu błąd w miejscu listy budżetów z przyciskiem "Spróbuj ponownie".
- **Konflikt (409)**: Specyficzna obsługa dla duplikatu nazwy przy tworzeniu/edycji – wyświetlenie błędu pod polem nazwy w formularzu.

## 11. Kroki implementacji

1.  **Hooks**: Stworzenie hooków `useBudgets(month, year)` oraz `useBudgetMutations`. Zapewnienie, że `useCategories` jest dostępne.
2.  **UI Components - Podstawy**: Implementacja `BudgetListItem` (karta) oraz `BudgetsList`.
3.  **UI Components - Modale**: Implementacja formularza budżetu (wspólny komponent dla Add/Edit) z logiką filtrowania kategorii.
4.  **Integration**: Złożenie komponentów w `BudgetsView` (`/budgets`), podpięcie stanu i API.
5.  **Validation Logic**: Implementacja logiki wykluczania zajętych kategorii w formularzach.
6.  **Verification**: Manualne testy przepływu (CRUD) oraz sprawdzenie blokady przypisania tej samej kategorii do dwóch budżetów w jednym miesiącu.
