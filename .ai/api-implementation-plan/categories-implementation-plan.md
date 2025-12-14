# API Endpoint Implementation Plan: /api/categories

## 1. Przegląd punktu końcowego

Ten dokument opisuje plan wdrożenia dla punktu końcowego `/api/categories`, który zarządza zasobami kategorii. Punkt końcowy umożliwia operacje tworzenia, odczytu, aktualizacji i usuwania (CRUD) kategorii dochodów i wydatków dla uwierzytelnionych użytkowników.

## 2. Szczegóły żądania

Punkt końcowy będzie zaimplementowany w dwóch plikach zgodnie z routingiem Astro:

- `src/pages/api/categories/index.ts` dla metod `GET` i `POST`.
- `src/pages/api/categories/[categoryId].ts` dla metod `PUT` i `DELETE`.

### GET `/api/categories`

- **Metoda HTTP**: `GET`
- **Opis**: Pobiera listę wszystkich kategorii dla zalogowanego użytkownika.
- **Parametry URL**: Brak.
- **Parametry Query**:
  - Opcjonalne: `type` (string) - filtruje kategorie po typie. Dozwolone wartości: 'income', 'expense'.
- **Request Body**: Brak.

### POST `/api/categories`

- **Metoda HTTP**: `POST`
- **Opis**: Tworzy nową kategorię.
- **Parametry URL**: Brak.
- **Request Body**: `application/json`
  ```json
  {
    "name": "string",
    "type": "'income' | 'expense'",
    "budget_id": "string (uuid) | null"
  }
  ```

### PUT `/api/categories/{categoryId}`

- **Metoda HTTP**: `PUT`
- **Opis**: Aktualizuje istniejącą kategorię.
- **Parametry URL**:
  - Wymagane: `categoryId` (string, uuid).
- **Request Body**: `application/json` (przynajmniej jedno pole jest wymagane)
  ```json
  {
    "name": "string",
    "budget_id": "string (uuid) | null"
  }
  ```

### DELETE `/api/categories/{categoryId}`

- **Metoda HTTP**: `DELETE`
- **Opis**: Usuwa istniejącą kategorię.
- **Parametry URL**:
  - Wymagane: `categoryId` (string, uuid).
- **Request Body**: Brak.

## 3. Wykorzystywane typy (DTOs & Schemas)

Dla zapewnienia bezpieczeństwa typów i walidacji, zostaną użyte następujące schematy Zod.

- **Entity `Category`** (w `src/types.ts`):

  ```typescript
  export type Category = {
    id: string; // uuid
    user_id: string; // uuid
    name: string;
    type: "income" | "expense";
    budget_id: string | null; // uuid
    created_at: string; // timestamptz
    updated_at: string; // timestamptz
  };
  ```

- **Schematy walidacji Zod** (w `src/lib/validators/categories.validators.ts`):

  ```typescript
  import { z } from "zod";

  export const GetCategoriesQuerySchema = z.object({
    type: z.enum(["income", "expense"]).optional(),
  });

  export const CreateCategoryDtoSchema = z.object({
    name: z.string().trim().min(1, { message: "Category name is required" }),
    type: z.enum(["income", "expense"]),
    budget_id: z.string().uuid().nullable().optional(),
  });

  export const UpdateCategoryDtoSchema = z
    .object({
      name: z.string().trim().min(1, { message: "Category name is required" }).optional(),
      budget_id: z.string().uuid().nullable().optional(),
    })
    .refine((data) => data.name !== undefined || data.budget_id !== undefined, {
      message: "At least one field (name or budget_id) must be provided for update.",
    });

  export const CategoryIdParamSchema = z.object({
    categoryId: z.string().uuid(),
  });
  ```

## 4. Szczegóły odpowiedzi

### Sukces

- `GET /api/categories`:
  - **Kod stanu**: `200 OK`
  - **Ciało odpowiedzi**: `application/json`
    ```json
    {
      "data": [
        {
          "id": "uuid",
          "name": "Groceries",
          "type": "expense",
          "budget_id": "uuid_or_null",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
      ]
    }
    ```
- `POST /api/categories`:
  - **Kod stanu**: `201 Created`
  - **Ciało odpowiedzi**: Obiekt nowo utworzonej kategorii.
- `PUT /api/categories/{categoryId}`:
  - **Kod stanu**: `200 OK`
  - **Ciało odpowiedzi**: Obiekt zaktualizowanej kategorii.
- `DELETE /api/categories/{categoryId}`:
  - **Kod stanu**: `204 No Content`
  - **Ciało odpowiedzi**: Brak.

### Błąd

- **Kody stanu**: `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `409 Conflict`, `500 Internal Server Error`.
- **Ciało odpowiedzi**: `application/json`
  ```json
  {
    "error": {
      "message": "A descriptive error message"
    }
  }
  ```

## 5. Przepływ danych

1. Żądanie HTTP trafia do odpowiedniego endpointu Astro (`/api/categories/index.ts` lub `/api/categories/[categoryId].ts`).
2. Middleware Astro weryfikuje sesję użytkownika. Jeśli użytkownik nie jest zalogowany, zwraca `401 Unauthorized`.
3. Handler endpointu odczytuje dane z żądania (query, body, params).
4. Dane wejściowe są walidowane przy użyciu odpowiedniego schematu Zod. W przypadku błędu walidacji, zwracany jest `400 Bad Request`.
5. Handler wywołuje odpowiednią metodę z `CategoryService`, przekazując ID użytkownika z sesji oraz zwalidowane dane.
6. `CategoryService` wykonuje operacje na bazie danych Supabase. Zapytania do bazy danych automatycznie podlegają politykom RLS, zapewniając, że użytkownik operuje tylko na własnych danych.
7. `CategoryService` obsługuje potencjalne błędy z bazy danych (np. naruszenie unikalności nazwy, naruszenie klucza obcego przy usuwaniu) i rzuca odpowiednie, specyficzne dla aplikacji wyjątki.
8. Handler endpointu przechwytuje wyjątki z serwisu i mapuje je na odpowiednie kody statusu HTTP (`404`, `409`, `500`).
9. W przypadku powodzenia, handler formatuje dane zwrócone przez serwis i wysyła odpowiedź HTTP z kodem `200`, `201` lub `204`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do wszystkich metod tego endpointu jest ograniczony do uwierzytelnionych użytkowników. Będzie to realizowane przez middleware Astro, który sprawdza obecność i ważność sesji Supabase.
- **Autoryzacja**: Polityki Row-Level Security (RLS) w bazie danych Supabase zapewniają, że użytkownicy mogą wykonywać operacje CRUD wyłącznie na własnych kategoriach. To fundamentalny mechanizm zabezpieczający przed nieautoryzowanym dostępem do danych.
- **Walidacja danych wejściowych**: Rygorystyczna walidacja wszystkich danych przychodzących za pomocą Zod chroni przed niepoprawnymi danymi i potencjalnymi atakami (np. XSS, chociaż w kontekście API jest to mniej prawdopodobne).
- **Ochrona przed SQL Injection**: Użycie klienta Supabase (opartego na `postgrest-js`) parametryzuje zapytania, co eliminuje ryzyko ataków SQL Injection.

## 7. Obsługa błędów

- `400 Bad Request`: Zwracany, gdy dane wejściowe nie przejdą walidacji Zod. Odpowiedź będzie zawierać szczegóły błędu walidacji.
- `401 Unauthorized`: Zwracany, gdy żądanie nie zawiera prawidłowych danych uwierzytelniających.
- `404 Not Found`: Zwracany przy próbie odczytu, aktualizacji lub usunięcia kategorii, która nie istnieje lub nie należy do zalogowanego użytkownika.
- `409 Conflict`:
  - Przy `POST` lub `PUT`: Próba utworzenia/zmiany nazwy kategorii na taką, która już istnieje w zakresie danego użytkownika.
  - Przy `DELETE`: Próba usunięcia kategorii, do której przypisane są transakcje (zgodnie z `ON DELETE: RESTRICT`).
- `500 Internal Server Error`: Zwracany w przypadku nieoczekiwanych błędów serwera, np. problemów z połączeniem z bazą danych. Błędy te będą logowane po stronie serwera w celu dalszej analizy.

## 8. Rozważania dotyczące wydajności

- **Indeksy bazy danych**: Zgodnie z planem bazy danych, na kluczowych kolumnach (`user_id`, `budget_id`, `(user_id, type)`) istnieją indeksy, co zapewni wysoką wydajność zapytań `SELECT`.
- **Paginacja**: W początkowej wersji `GET /api/categories` nie będzie wspierać paginacji, ponieważ zakłada się, że liczba kategorii na użytkownika będzie stosunkowo niewielka. Jeśli w przyszłości pojawią się przypadki użycia z dużą liczbą kategorii, należy dodać paginację (np. opartą na kursorze lub offsecie).

## 9. Etapy wdrożenia

1.  **Utworzenie plików**:
    - Stworzenie nowego pliku dla serwisu: `src/lib/services/category.service.ts`.
    - Stworzenie nowego pliku dla walidatorów: `src/lib/validators/categories.validators.ts`.
    - Stworzenie plików dla endpointów Astro: `src/pages/api/categories/index.ts` i `src/pages/api/categories/[categoryId].ts`.

2.  **Definicja typów i walidatorów**:
    - Upewnienie się, że typ `Category` jest zdefiniowany w `src/types.ts`.
    - Zaimplementowanie schematów Zod w `src/lib/validators/categories.validators.ts`.

3.  **Implementacja serwisu (`CategoryService`)**:
    - Zaimplementowanie metody `getCategories` z obsługą filtrowania po typie.
    - Zaimplementowanie metody `createCategory` z obsługą błędów unikalności.
    - Zaimplementowanie metody `updateCategory`.
    - Zaimplementowanie metody `deleteCategory` z obsługą błędu `ON DELETE: RESTRICT`.
    - Dodanie pomocniczej, prywatnej metody `getCategoryById` do weryfikacji istnienia i własności zasobu.

4.  **Implementacja endpointów Astro**:
    - W `src/pages/api/categories/index.ts` zaimplementować handlery dla `GET` i `POST`.
    - W `src/pages/api/categories/[categoryId].ts` zaimplementować handlery dla `PUT` i `DELETE`.
    - W każdym handlerze dodać: walidację Zod, wywołanie odpowiedniej metody serwisu i obsługę błędów (mapowanie wyjątków na odpowiedzi HTTP).

5.  **Testowanie**:
    - Przeprowadzenie manualnych testów każdego endpointu za pomocą narzędzia do testowania API (np. Postman, Insomnia) w celu weryfikacji poprawności działania, obsługi błędów i zabezpieczeń.
