# Plan Testów Projektu 10x-personal-finance

## 1. Wprowadzenie i cele testowania

Celem niniejszego planu jest ustanowienie strategii zapewnienia jakości (QA) dla aplikacji _10x-personal-finance_. Głównym priorytetem jest zagwarantowanie bezpieczeństwa danych użytkowników, poprawności obliczeń finansowych oraz stabilności kluczowych procesów biznesowych (rejestracja, zarządzanie budżetem). Wdrożenie testów ma na celu zminimalizowanie ryzyka regresji podczas dalszego rozwoju aplikacji.

## 2. Zakres testów

Plan obejmuje testowanie następujących obszarów:

- **Backend / API**: Endpointy API w `src/pages/api/` (logika autentykacji, operacje na danych).
- **Frontend / UI**: Komponenty React (formularze, widżety analityczne) oraz strony Astro.
- **Logika Biznesowa**: Funkcje pomocnicze i serwisy w `src/lib`.
- **Bezpieczeństwo**: Weryfikacja działania Middleware i ochrony tras prywatnych.

**Wyłączenia z zakresu:**

- Testowanie wydajności i dostępności samej platformy Supabase (polegamy na SLA dostawcy).
- Testy obciążeniowe (na obecnym etapie MVP).
- Testy kompatybilności przeglądarkowej starszych wersji (wspieramy nowoczesne przeglądarki: Chrome, Firefox, Safari, Edge).

## 3. Typy testów do przeprowadzenia

### A. Testy Jednostkowe (Unit Tests)

- **Cel**: Weryfikacja izolowanych fragmentów kodu w oderwaniu od zewnętrznych zależności.
- **Zakres**:
  - **Funkcje pomocnicze (`src/lib`)**: Formatowanie walut, dat, walidatory (np. `schema` Zod).
  - **Komponenty UI**: Weryfikacja renderowania stanów (loading, error, success) dla komponentów takich jak `LoginForm`, `BudgetProgress`.
  - **Serwisy**: Testowanie logiki serwisów (np. `DashboardService`) przy zamockowanym kliencie Supabase.

### B. Testy Integracyjne (Integration Tests)

- **Cel**: Sprawdzenie współpracy między modułami, w szczególności komunikacji Frontend-API oraz API-Baza Danych (z użyciem mocków lub bazy testowej).
- **Zakres**:
  - **Endpointy API Astro**: Weryfikacja odpowiedzi HTTP (200, 400, 401) dla endpointów `/api/auth/*` oraz `/api/budgets`.
  - **Integracja Formularzy**: Sprawdzenie czy formularze poprawnie wysyłają dane do API i obsługują odpowiedzi błędów.
  - **Middleware**: Weryfikacja przekierowań i ochrony tras (tzw. Route Guards).

### C. Testy End-to-End (E2E)

- **Cel**: Symulacja pełnych ścieżek użytkownika na uruchomionej aplikacji w środowisku zbliżonym do produkcyjnego.
- **Zakres**:
  - Krytyczne ścieżki (tzw. Happy Path): Pełen proces od rejestracji, przez logowanie, do dodania pierwszej transakcji.

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### Obszar 1: Autentykacja (Priorytet Krytyczny)

1.  **Rejestracja - Sukces**: Użytkownik wprowadza unikalny email i poprawne hasło -> Konto utworzone, użytkownik zalogowany i przekierowany na Dashboard.
2.  **Rejestracja - Walidacja**: Próba rejestracji z istniejącym emailem -> Oczekiwany komunikat błędu "Użytkownik już istnieje".
3.  **Logowanie - Sukces**: Logowanie poprawnymi poświadczeniami -> Utworzenie sesji, dostęp do zasobów chronionych.
4.  **Logowanie - Błąd**: Logowanie błędnym hasłem -> Komunikat "Nieprawidłowe dane logowania".
5.  **Ochrona Tras (Middleware)**: Próba wejścia na `/dashboard` bez aktywnej sesji -> Automatyczne przekierowanie do `/login`.
6.  **Wylogowanie**: Użycie przycisku "Wyloguj" w sidebarze -> Usunięcie sesji, przekierowanie na stronę logowania, brak dostępu do `/dashboard` po cofnięciu w przeglądarce.

### Obszar 2: Zarządzanie Finansami (Priorytet Wysoki)

1.  **Dashboard - Ładowanie Danych**: Weryfikacja czy sekcje (Saldo, Wydatki, Budżety) wyświetlają dane przypisane tylko do zalogowanego użytkownika (izolacja RLS).
2.  **Dodawanie Transakcji**: Dodanie nowej transakcji wydatku -> Weryfikacja odjęcia kwoty od salda konta i aktualizacji wykresu.
3.  **Zarządzanie Budżetem**: Utworzenie budżetu dla kategorii -> Poprawne wyświetlanie paska postępu w oparciu o wydatki w tej kategorii.

## 5. Środowisko testowe

- **Środowisko Lokalne (Localhost)**:
  - Uruchamianie testów jednostkowych i integracyjnych (Vitest).
  - Baza danych: Lokalna instancja Supabase (Docker) lub projekt deweloperski w chmurze Supabase.
- **Środowisko CI (GitHub Actions)**:
  - Automatyczne uruchamianie testów przy każdym Pull Requeście (PR) i pushu do `main`.
  - Izolowane środowisko bez dostępu do produkcyjnych danych.

## 6. Narzędzia do testowania

Ze względu na obecny stos technologiczny (Vite + React), rekomendowany zestaw narzędzi to:

- **Vitest**: Szybki framework testowy, natywnie wspierający Vite. Do testów jednostkowych i integracyjnych API.
- **React Testing Library**: Standard do testowania komponentów React (renderowanie, interakcje użytkownika).
- **Playwright**: Do testów E2E. Pozwala na niezawodne testowanie w wielu przeglądarkach (Chrome, Safari, Firefox).
- **Mock Service Worker (MSW)** lub **vi.mock**: Do mockowania odpowiedzi z API Supabase, aby uniezależnić testy jednostkowe od sieci.

## 7. Harmonogram testów

Testy będą wdrażane etapami:

1.  **Faza 0 (Setup)**: Instalacja `vitest`, konfiguracja środowiska testowego, dodanie skryptów `test` do `package.json`.
2.  **Faza 1 (Unit)**: Pokrycie testami funkcji w `src/lib` oraz kluczowych walidatorów Zod.
3.  **Faza 2 (Integration - Auth)**: Implementacja testów dla endpointów `/api/auth/*` oraz Middleware. Jest to krytyczne dla bezpieczeństwa.
4.  **Faza 3 (E2E)**: Stworzenie "Smoke Test" w Playwright sprawdzającego czy aplikacja się uruchamia i można się zalogować.

## 8. Kryteria akceptacji testów

- Wszystkie zdefiniowane testy automatyczne muszą przechodzić (status PASS) przed scaleniem zmian do gałęzi głównej.
- Pokrycie kodu (Code Coverage): Docelowo min. 70% dla folderu `src/lib` i endpointów API.
- Brak błędów krytycznych (Blocker/Critical) zgłoszonych w testach manualnych nowej funkcjonalności.

## 9. Role i odpowiedzialności

- **Deweloper**: Odpowiedzialny za tworzenie testów jednostkowych dla swojego kodu oraz testów integracyjnych dla tworzonych API. Zobowiązany do uruchomienia testów lokalnie przed wysłaniem kodu.
- **Tech Lead / Reviewer**: Weryfikuje pokrycie testami podczas Code Review. Dba o konfigurację CI/CD.

## 10. Procedury raportowania błędów

W przypadku wykrycia błędu:

1.  Zgłoszenie Issue w systemie kontroli wersji (GitHub Issues).
2.  Zgłoszenie powinno zawierać: opis błędu, kroki do reprodukcji, oczekiwany rezultat vs rzeczywisty, zrzut ekranu/logi (jeśli dotyczy).
3.  Błędy znalezione przez testy CI automatycznie blokują możliwość merge'owania PR do czasu ich naprawienia.
