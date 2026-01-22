# Plan Wdrożenia Endpointu API: Dashboard

## 1. Przegląd punktu końcowego

Punkt końcowy `GET /api/dashboard` służy do pobierania zagregowanych danych finansowych dla kokpitu użytkownika. Zwraca podsumowanie finansowe (przychody, wydatki, bilans), strukturę wydatków według kategorii, ostatnie transakcje oraz postęp realizacji budżetów dla określonego miesiąca i roku.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/dashboard`
- **Parametry zapytania (Query Parameters)**:
  - **Opcjonalne**:
    - `month` (number): Miesiąc (1-12). Domyślnie: bieżący miesiąc.
    - `year` (number): Rok (YYYY). Domyślnie: bieżący rok.
- **Nagłówki**:
  - `Content-Type`: `application/json` (dla odpowiedzi)
  - `Cookie`: Sesja autoryzacyjna (obsługiwana przez Astro/Supabase)

## 3. Wykorzystywane typy

Typy zdefiniowane w `src/types.ts`:

- **DTOs**:
  - `DashboardDTO`: Główny obiekt odpowiedzi.
  - `DashboardSummary`: Podsumowanie (total_income, total_expense, balance).
  - `ExpenseByCategory`: Dane do wykresu kołowego.
  - `TransactionDTO`: Obiekt transakcji.
  - `BudgetProgressItem`: Dane o postępie budżetu.
- **Views**:
  - `budget_progress`: Widok bazodanowy do pobierania postępu budżetów.

## 4. Szczegóły odpowiedzi

- **Kod sukcesu**: `200 OK`
- **Struktura ciała odpowiedzi (JSON)**:
  Zgodna z interfejsem `DashboardDTO`:
  ```json
  {
    "summary": {
      "total_income": number,
      "total_expense": number,
      "balance": number
    },
    "expense_by_category": [
      { "category_name": "string", "amount": number, "percentage": number }
    ],
    "recent_transactions": [ /* Array of TransactionDTO */ ],
    "budget_progress": [
      {
        "budget_id": "uuid",
        "budget_name": "string",
        "budget_amount": number,
        "spent_amount": number,
        "remaining_amount": number,
        "percentage_used": number
      }
    ]
  }
  ```
- **Kody błędów**:
  - `400 Bad Request`: Nieprawidłowy format `month` lub `year`.
  - `401 Unauthorized`: Brak sesji użytkownika.
  - `500 Internal Server Error`: Błąd serwera lub bazy danych.

## 5. Przepływ danych

1. **Odebranie żądania**: Handler w `src/pages/api/dashboard/index.ts` odbiera żądanie GET.
2. **Walidacja**: Walidacja parametrów `month` i `year` za pomocą `zod`.
3. **Przygotowanie zakresu dat**: Na podstawie `month` i `year` serwis oblicza `startDate` (pierwszy dzień miesiąca) i `endDate` (ostatni dzień miesiąca). Jest to kluczowe dla optymalizacji zapytań (SARGable queries).
4. **Kontekst użytkownika**: Pobranie ID użytkownika z `context.locals.user` (lub poprzez `supabase.auth.getUser()`).
5. **Warstwa serwisu**: Wywołanie metody `DashboardService.getDashboardData(userId, month, year)`.
6. **Pobieranie danych (Parallel)**:
   Serwis wykonuje równolegle następujące zapytania do Supabase z wykorzystaniem zakresów dat (`date >= startDate AND date <= endDate`), aby wykorzystać indeks `(user_id, date DESC)`:
   - **Summary**: Agregacja z tabeli `transactions`.
     - Logika: `balance` = odfiltrowane przychody - odfiltrowane wydatki (miesięczny Cash Flow).
     - Użycie `COALESCE`, aby zwrócić 0 zamiast null przy braku transakcji.
   - **Expense By Category**: Pobranie z `transactions` złączenia z `categories`, grupowanie po nazwie kategorii.
   - **Recent Transactions**: Pobranie z `transactions` (limit 5, sortowanie `date DESC`).
   - **Budget Progress**: Pobranie z widoku `budget_progress` dla zadanego `month` i `year`.
7. **Złożenie odpowiedzi**: Mapowanie wyników zapytań na obiekt `DashboardDTO`.
8. **Zwrot odpowiedzi**: Zwrócenie JSON z kodem 200.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Endpoint dostępny tylko dla zalogowanych użytkowników. Weryfikacja sesji przez middleware/Supabase.
- **Autoryzacja (RLS)**: Wszystkie zapytania do bazy danych wykorzystują klienta Supabase z kontekstem użytkownika, co automatycznie aplikuje polityki Row Level Security (RLS).
- **Walidacja danych**: Rygorystyczna walidacja typów danych wejściowych zapobiega błędom logicznym i injection.

## 7. Obsługa błędów

- Błędy walidacji zwracają `400` z czytelnym komunikatem (np. "Month must be between 1 and 12").
- Błędy bazy danych są przechwytywane, logowane w konsoli serwera (`console.error`), a do klienta zwracany jest ogólny błąd `500`.

## 8. Rozważania dotyczące wydajności

- **Równoległość**: Wykorzystanie `Promise.all` do jednoczesnego wyzwalania zapytań do Supabase.
- **Indeksy**: Używanie filtrów zakresowych na kolumnie `date` zamiast funkcji SQL `extract` zapewnia wydajność przy dużej skali danych.
- **Widoki**: Wykorzystanie zoptymalizowanego widoku `budget_progress`.

## 9. Etapy wdrożenia

### Krok 1: Utworzenie Serwisu (DashboardService)

Stwórz plik `src/lib/services/dashboard.service.ts`.

- Zaimplementuj logikę obliczania `startDate` / `endDate`.
- Zaimplementuj asynchroniczne pobieranie danych za pomocą `supabase-js`.
- Użyj `COALESCE` w SQL lub zapewnij domyślne 0 w kodzie TypeScript.

### Krok 2: Implementacja Endpointu API

Stwórz plik `src/pages/api/dashboard/index.ts`.

- Wykorzystaj `zod` do walidacji query params.
- Wywołaj serwis i obsłuż błędy.

### Krok 3: Weryfikacja

- Sprawdź poprawność agregacji dla miesięcy bez transakcji.
- Sprawdź sortowanie ostatnich transakcji.
- Zweryfikuj postęp budżetów względem wydatków w danym miesiącu.
