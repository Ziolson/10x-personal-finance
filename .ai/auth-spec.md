# Specyfikacja Techniczna Modułu Autentykacji

Niniejszy dokument przedstawia szczegółową architekturę modułu rejestracji, logowania i odzyskiwania hasła dla aplikacji 10xPersonal Finance, zgodnie z wymaganiami PRD i stosem technologicznym.

## 1. Architektura Interfejsu Użytkownika

### Struktura Stron (Astro)

Aplikacja zostanie rozbudowana o nowe strony obsługujące procesy autentykacji. Strony te będą renderowane po stronie serwera (SSR), co zapewni prawidłową obsługę przekierowań i SEO (tam gdzie to istotne).

- **`src/pages/login.astro`**: Strona logowania.
- **`src/pages/register.astro`**: Strona rejestracji.
- **`src/pages/forgot-password.astro`**: Strona z formularzem prośby o reset hasła.
- **`src/pages/auth/reset-password.astro`**: Strona, na którą użytkownik trafia z linku w emailu (zawiera token). Pozwala ustawić nowe hasło.
- **`src/pages/auth/callback.ts`**: Endpoint API (lub strona) do obsługi przekierowań z Supabase (np. po potwierdzeniu emaila), ustawiający sesję.

### Layouty

- **`src/layouts/AuthLayout.astro` (NOWY)**:
  - Minimalistyczny layout dedykowany dla stron autentykacji.
  - Wyśrodkowany kontener (Card) na tle (np. gradient lub solid color).
  - Brak paska bocznego i głównej nawigacji aplikacji.
  - Link powrotny do strony głównej (landing page) lub logo 10xPersonal Finance.
  - Obsługa motywu aplikacji (Jasny/Ciemny) zgodnie z ustawieniami użytkownika (spójność z US-017).
- **`src/layouts/AppLayout.astro` (ISTNIEJĄCY)**:
  - Pozostaje bez zmian w strukturze wizualnej, ale będzie chroniony przez middleware (dostępny tylko dla zalogowanych).

### Komponenty React (Interaktywne)

Formularze będą implementowane jako komponenty React ("Islands") z dyrektywą `client:load`.
**Kluczowa zmiana:** Komponenty te **NIE** będą komunikować się bezpośrednio z Supabase Auth. Zamiast tego będą wysyłać żądania `fetch` (POST) do naszych endpointów API (`/api/auth/*`), które bezpiecznie obsłużą logikę po stronie serwera.

1.  **`LoginForm.tsx`**:
    - Pola: Email, Hasło.
    - Akcje: Wyślij POST do `/api/auth/login`. W przypadku sukcesu: przekierowanie na Dashboard.
2.  **`RegisterForm.tsx`**:
    - Pola: Email, Hasło, Potwierdź hasło.
    - Akcje: Wyślij POST do `/api/auth/register`. W przypadku sukcesu: automatyczne logowanie i przekierowanie na Dashboard.
    - Walidacja: Zgodność haseł, siła hasła (opcjonalnie).
3.  **`ForgotPasswordForm.tsx`**:
    - Pola: Email.
    - Akcje: Wyślij POST do `/api/auth/forgot-password`.
4.  **`ResetPasswordForm.tsx`**:
    - Pola: Nowe hasło, Potwierdź nowe hasło.
    - Akcje: Wyślij POST do `/api/auth/reset-password`.

### Walidacja i Obsługa Błędów (Frontend)

- **Biblioteki**: `react-hook-form` do obsługi formularzy + `zod` do definicji schematów walidacji.
- **Scenariusze Walidacji**:
  - Wymagalność pól.
  - Format email.
  - Minimalna długość hasła (np. 6 znaków - wymóg Supabase).
  - Zgodność haseł (przy rejestracji i resecie).
- **Komunikaty Błędów**:
  - Błędy walidacji (np. "Niepoprawny format email") wyświetlane pod polami formularza.
  - Błędy API (np. "Nieprawidłowe dane logowania") - endpoint zwraca błędy w JSON, frontend wyświetla je jako `Alert` lub `Toast`.

## 2. Logika Backendowa

### Middleware (`src/middleware/index.ts`)

Middleware pełni kluczową rolę w architekturze `@supabase/ssr`.

1.  **Inicjalizacja Supabase Server Client**: Tworzenie klienta w oparciu o obiekt `cookies` i `headers` żądania. Wykorzystanie funkcji `createServerClient` z pakietu `@supabase/ssr`.
2.  **Zarządzanie Ciasteczkami**: Middleware obsługuje metody `getAll` i `setAll` do czytania i ustawiania ciasteczek sesyjnych (refresh token, access token) w odpowiedzi.
3.  **Weryfikacja Sesji**: Wywołanie `supabase.auth.getUser()`, które waliduje token JWT.
4.  **Ochrona Tras (Route Guarding)**:
    - Przekierowanie niezalogowanych użytkowników z tras prywatnych (np. `/dashboard`) na `/login`.
    - Przekierowanie zalogowanych użytkowników ze stron autentykacji (`/login`, `/register`) na `/dashboard`.
5.  **Context**: Wstrzyknięcie obiektu `user` oraz instancji `supabase` do `context.locals`.

### Endpointy API (Server Proxies)

Logika autentykacji zostanie przeniesiona do endpointów API Astro (`src/pages/api/auth/*.ts`).

- **`/api/auth/register`**:
  - Tworzy konto użytkownika (`supabase.auth.signUp`).
  - Dzięki wyłączonemu potwierdzeniu email, od razu zwraca sesję.
  - Ustawia ciasteczka sesyjne w odpowiedzi (Autologin).
- **`/api/auth/login`**:
  - Weryfikuje dane (`supabase.auth.signInWithPassword`).
  - Ustawia ciasteczka sesyjne.
  - Zwraca status 200 lub błąd 400/401.
- **`/api/auth/logout`**:
  - Wylogowuje (`supabase.auth.signOut`).
  - Usuwa ciasteczka.
  - Klient po otrzymaniu sukcesu przekierowuje na `/login`.
- **Modele i Baza**:
  - Wszystkie operacje na danych użytkownika muszą odbywać się w kontekście zweryfikowanego `user_id` (RLS w bazie lub filtracja w serwisach).
- **Zmienne Środowiskowe**:
  - Użycie bezpiecznych zmiennych środowiskowych (bez prefiksu `PUBLIC_`) dla kluczy po stronie serwera.

### Server-Side Rendering (SSR)

Aplikacja działa w trybie `output: 'server'`.

- Dane na stronach są pobierane przy użyciu klienta Supabase z `Astro.locals` (który ma już weryfikację sesji z middleware).

## 3. System Autentykacji (Supabase)

### Konfiguracja

1.  **Provider**: Email & Password włączony.
2.  **Email Confirmations**: **Wyłączone** (Disabled) dla MVP. Umożliwia natychmiastowe zalogowanie po rejestracji.
3.  **Site URL**: Ustawiony na URL aplikacji.
4.  **Redirect URLs**: Skonfigurowane dla środowiska deweloperskiego i produkcyjnego.

### Procesy (Flow)

- **Rejestracja**: Formularz -> POST `/api/auth/register` -> Supabase `signUp` -> Set-Cookie -> Redirect Dashboard.
- **Logowanie**: Formularz -> POST `/api/auth/login` -> Supabase `signInWithPassword` -> Set-Cookie -> Redirect Dashboard.
- **Wylogowanie**: Przycisk "Wyloguj" -> POST `/api/auth/logout` -> Supabase `signOut` -> Clear-Cookie -> Redirect Login.
- **Reset Hasła**:
  1.  `supabase.auth.resetPasswordForEmail(email, { redirectTo: '.../auth/reset-password' })`.
  2.  User klika w link -> trafia na stronę z tokenem w URL (hash fragment lub query param).
  3.  Strona `ResetPasswordForm` wykrywa sesję odzyskiwania i pozwala wywołać `updateUser({ password: ... })`.
