# Plan implementacji widoku Kategorie

## 1. Przegląd
Widok "Kategorie" (`CategoriesView`) służy do zarządzania kategoriami finansowymi użytkownika. Umożliwia przeglądanie listy kategorii z podziałem na przychody i wydatki, dodawanie nowych kategorii, edycję nazw istniejących oraz ich usuwanie (z uwzględnieniem walidacji powiązań z transakcjami). Jest to kluczowy element słownika danych aplikacji.

## 2. Routing widoku
- **Ścieżka:** `/categories`
- **Plik Astro:** `src/pages/categories.astro`
- **Główny komponent React:** `src/components/views/CategoriesView.tsx`

## 3. Struktura komponentów
Drzewo komponentów dla tego widoku:

```text
src/pages/categories.astro
└── CategoriesView (Smart Component)
    ├── PageHeader (tytuł, przycisk "Dodaj kategorię")
    ├── Tabs (przełącznik: Wydatki | Przychody)
    │   ├── TabsContent (Wydatki)
    │   │   └── CategoriesList
    │   │       ├── CategoryListItem
    │   │       │   └── CategoryActionsMenu (Dropdown)
    │   │       └── EmptyState (gdy brak danych)
    │   └── TabsContent (Przychody)
    │       └── CategoriesList
    │           └── ... (jak wyżej)
    ├── AddCategoryModal (Dialog)
    │   └── CategoryForm
    ├── EditCategoryModal (Dialog)
    │   └── CategoryForm
    └── DeleteCategoryDialog (AlertDialog/Dialog)
```

## 4. Szczegóły komponentów

### 1. `CategoriesView`
- **Opis:** Główny kontener widoku. Zarządza pobieraniem danych (poprzez hook `useCategories`), stanem aktywnych modali (dodawanie, edycja, usuwanie) oraz renderuje układ strony.
- **Główne elementy:** `div` (layout), `PageHeader`, `Tabs` (Shadcn), Modale.
- **Obsługiwane zdarzenia:**
  - `onAddCategory`: otwiera modal dodawania.
  - `onEditCategory`: ustawia edytowaną kategorię i otwiera modal edycji.
  - `onDeleteCategory`: ustawia usuwaną kategorię i otwiera dialog potwierdzenia.
- **Typy:** Brak propsów (komponent top-level).

### 2. `CategoriesList`
- **Opis:** Komponent prezentacyjny wyświetlający listę kategorii.
- **Główne elementy:** `ul`/`div` (lista), mapowanie po tablicy kategorii.
- **Propsy:**
  - `categories: Category[]`
  - `isLoading: boolean`
  - `onEdit: (category: Category) => void`
  - `onDelete: (category: Category) => void`

### 3. `CategoryListItem`
- **Opis:** Pojedynczy wiersz/karta kategorii.
- **Główne elementy:** Nazwa kategorii, ikona (opcjonalnie), menu akcji (`DropdownMenu` z Shadcn).
- **Obsługiwane interakcje:** Kliknięcie "Edytuj" lub "Usuń" w menu.
- **Propsy:**
  - `category: Category`
  - `onEdit: (category: Category) => void`
  - `onDelete: (category: Category) => void`

### 4. `CategoryForm`
- **Opis:** Reużywalny formularz oparty na `react-hook-form` i `zodResolver`. Używany zarówno do dodawania, jak i edycji.
- **Główne elementy:**
  - Pole tekstowe: `name` (Nazwa kategorii).
  - Radio Group / Select: `type` (Typ: income/expense) - zablokowane lub ukryte w trybie edycji (zazwyczaj typ kategorii jest stały, edytujemy tylko nazwę, ale zgodnie z PRD edycja dotyczy nazwy).
  - Przyciski: "Anuluj", "Zapisz" (ze stanem ładowania).
- **Walidacja:**
  - `name`: wymagane, min. 3 znaki (wg `categories.validators.ts`).
  - `type`: wymagane (enum: 'income' | 'expense').
- **Propsy:**
  - `defaultValues?: CreateCategorySchema`
  - `onSubmit: (data: CreateCategorySchema) => Promise<void>`
  - `isSubmitting: boolean`
  - `mode: 'create' | 'edit'`

### 5. `AddCategoryModal` / `EditCategoryModal`
- **Opis:** Wrappery na `Dialog` z Shadcn zawierające `CategoryForm`.
- **Propsy:**
  - `open: boolean`
  - `onOpenChange: (open: boolean) => void`
  - `onSubmit`: funkcja wywołująca API.
  - `initialData?`: (dla edycji) obiekt kategorii.

### 6. `DeleteCategoryDialog`
- **Opis:** Modal potwierdzenia usunięcia. Wyświetla ostrzeżenie.
- **Specyfika:** Musi obsługiwać błąd API 409 (Conflict), jeśli kategoria jest używana, i wyświetlić odpowiedni komunikat (np. "Nie można usunąć kategorii powiązanej z transakcjami").
- **Propsy:**
  - `open: boolean`
  - `onOpenChange: (open: boolean) => void`
  - `onConfirm: () => Promise<void>`
  - `categoryName: string`
  - `isDeleting: boolean`

## 5. Typy

Należy wykorzystać typy zdefiniowane w `src/types.ts` oraz `src/db/database.types.ts`. Jeśli ich brakuje, należy je dodać.

```typescript
// Istniejące typy (przybliżenie na podstawie kontekstu)
import type { Database } from '@/db/database.types';

export type Category = {
  id: string;
  name: string;
  type: 'income' | 'expense';
  budget_id: string | null;
  created_at: string;
  updated_at: string;
};

// DTO dla formularzy (zgodne z Zod schema)
export type CreateCategoryInput = {
  name: string;
  type: 'income' | 'expense';
  budget_id?: string | null;
};

export type UpdateCategoryInput = {
  name: string;
  budget_id?: string | null;
  // Typ zazwyczaj nie jest edytowalny dla spójności danych
};
```

## 6. Zarządzanie stanem

Zalecane utworzenie custom hooka `useCategories` w `src/components/features/hooks/useCategories.ts` (lub podobnie), który będzie zarządzał:

1.  **Pobieraniem danych:** `fetch` do `/api/categories`.
2.  **Stanem ładowania:** `isLoading`, `isError`.
3.  **Mutacjami:** Funkcje `addCategory`, `updateCategory`, `deleteCategory`.
4.  **Odświeżaniem:** Funkcja `refreshCategories` (ponowne pobranie po mutacji).

W samym komponencie `CategoriesView` stan UI:
- `isAddModalOpen` (boolean)
- `editingCategory` (Category | null) -> obecność obiektu otwiera modal edycji.
- `deletingCategory` (Category | null) -> obecność obiektu otwiera dialog usuwania.

## 7. Integracja API

Należy wykorzystać `src/lib/services/category.service.ts` lub wywoływać endpointy API Next.js/Astro bezpośrednio.

-   **GET** `/api/categories`: Pobiera wszystkie kategorie. Front-end filtruje je na "income" i "expense" do odpowiednich zakładek (lub API przyjmuje parametr `?type=`, ale pobranie wszystkich naraz jest wydajniejsze przy małej skali).
-   **POST** `/api/categories`: Payload `{ name, type }`. Odpowiedź 201 + utworzony obiekt.
-   **PUT** `/api/categories/[categoryId]`: Payload `{ name }`. Odpowiedź 200 + zaktualizowany obiekt.
-   **DELETE** `/api/categories/[categoryId]`: Brak payloadu. Odpowiedź 204 (sukces) lub 409 (błąd - kategoria w użyciu).

## 8. Interakcje użytkownika

1.  **Przeglądanie:** Użytkownik wchodzi na `/categories`, widzi listę (domyślnie np. Wydatki). Klika w zakładki, aby zmienić typ.
2.  **Dodawanie:**
    - Kliknięcie przycisku "Dodaj kategorię".
    - Wybór typu (Domyślnie taki, jak aktywna zakładka).
    - Wpisanie nazwy.
    - Submit -> Spinner -> Zamknięcie modala -> Toast sukcesu -> Odświeżenie listy.
3.  **Edycja:**
    - Kliknięcie "..." przy kategorii -> "Edytuj".
    - Zmiana nazwy w modalu.
    - Submit -> Spinner -> Zamknięcie -> Toast sukcesu -> Odświeżenie listy.
4.  **Usuwanie:**
    - Kliknięcie "..." -> "Usuń".
    - Potwierdzenie w dialogu.
    - Submit -> Spinner -> Toast sukcesu -> Usunięcie z listy.
    - **Błąd (Kategoria w użyciu):** Submit -> Spinner -> Błąd API 409 -> Toast błędu / Komunikat w modalu "Nie można usunąć kategorii, ponieważ są do niej przypisane transakcje".

## 9. Warunki i walidacja

-   **Frontend (Formularz):**
    -   `name`: wymagane, min. 3 znaki.
    -   `type`: wymagane, enum ['income', 'expense'].
-   **Backend (API - do obsłużenia błędów na froncie):**
    -   Unikalność nazwy (opcjonalnie, jeśli backend to sprawdza -> obsługa błędu 409 lub 400).
    -   Constraint przy usuwaniu (Foreign Key check).

## 10. Obsługa błędów

-   **Błąd pobierania listy:** Wyświetlenie komunikatu o błędzie w miejscu listy (np. w komponencie `EmptyState` lub dedykowanym `ErrorState`). Przycisk "Spróbuj ponownie".
-   **Błąd walidacji formularza:** Inline pod polami input (obsługiwane przez `react-hook-form` + Shadcn `FormMessage`).
-   **Błąd serwera (500) przy mutacji:** Toast z informacją "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później".
-   **Konflikt (409) przy usuwaniu:** Specjalny Toast lub Alert w modalu informujący o przyczynie (powiązane transakcje).

## 11. Kroki implementacji

1.  **Przygotowanie typów:** Sprawdzenie i ewentualne uzupełnienie `src/types.ts` o interfejsy kategorii zgodne z API.
2.  **Hook logiczny:** Implementacja `useCategories` w `src/components/features/hooks/useCategories.ts` (fetchowanie, funkcje CRUD).
3.  **Komponenty UI - Lista:** Stworzenie `CategoryListItem` i `CategoriesList`.
4.  **Komponenty UI - Formularz:** Stworzenie schematu Zod (lub import z `validators`) i komponentu `CategoryForm`.
5.  **Komponenty UI - Modale:** Implementacja `AddCategoryModal` i `EditCategoryModal` z wykorzystaniem formularza.
6.  **Komponent UI - Usuwanie:** Implementacja `DeleteCategoryDialog` z obsługą błędów.
7.  **Złożenie widoku:** Implementacja `CategoriesView` łączącego wszystkie elementy, obsługa stanu zakładek (Tabs).
8.  **Strona Astro:** Utworzenie `src/pages/categories.astro` i osadzenie `CategoriesView`.
9.  **Weryfikacja:** Testy manualne scenariuszy (dodawanie, edycja, usuwanie zajętej/wolnej kategorii).
