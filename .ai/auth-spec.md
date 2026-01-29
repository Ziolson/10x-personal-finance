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

Formularze będą implementowane jako komponenty React ("Islands") z dyrektywą `client:load`, aby obsłużyć stan, walidację i komunikację z Supabase Client SDK. Lokalizacja: `src/components/features/auth/`.

1.  **`LoginForm.tsx`**:
    - Pola: Email, Hasło.
    - Akcje: Zaloguj (`supabase.auth.signInWithPassword`), Link do rejestracji, Link "Zapomniałem hasła".
2.  **`RegisterForm.tsx`**:
    - Pola: Email, Hasło, Potwierdź hasło.
    - Akcje: Zarejestruj (`supabase.auth.signUp`), Link do logowania.
    - Walidacja: Zgodność haseł, siła hasła (opcjonalnie).
3.  **`ForgotPasswordForm.tsx`**:
    - Pola: Email.
    - Akcje: Wyślij link resetujący (`supabase.auth.resetPasswordForEmail`).
4.  **`ResetPasswordForm.tsx`**:
    - Pola: Nowe hasło, Potwierdź nowe hasło.
    - Akcje: Zapisz nowe hasło (`supabase.auth.updateUser`).

### Walidacja i Obsługa Błędów (Frontend)

- **Biblioteki**: `react-hook-form` do obsługi formularzy + `zod` do definicji schematów walidacji.
- **Scenariusze Walidacji**:
  - Wymagalność pól.
  - Format email.
  - Minimalna długość hasła (np. 6 znaków - wymóg Supabase).
  - Zgodność haseł (przy rejestracji i resecie).
- **Komunikaty Błędów**:
  - Błędy walidacji (np. "Niepoprawny format email") wyświetlane pod polami formularza (używając komponentów `FormMessage` z shadcn/ui).
  - Błędy API (np. "Nieprawidłowe dane logowania", "Użytkownik już istnieje") wyświetlane jako `Alert` (shadcn/ui) nad formularzem lub jako `Toast`.

## 2. Logika Backendowa

### Middleware (`src/middleware/index.ts`)

Jest to kluczowy element ochrony aplikacji w architekturze Astro SSR. Middleware zostanie zaktualizowany, aby:

1.  **Inicjalizacja Supabase**: Tworzenie klienta Supabase z wykorzystaniem `@supabase/ssr` (pakiet `createQueryParamsClient` dla middleware), co pozwala na bezpieczne zarządzanie ciasteczkami sesyjnymi (`sb-access-token`, `sb-refresh-token`).
2.  **Weryfikacja Sesji**: Sprawdzenie, czy użytkownik jest zalogowany (`supabase.auth.getUser()`).
3.  **Ochrona Tras (Route Guarding)**:
    - Jeśli użytkownik **nie jest zalogowany** i próbuje wejść na trasę chronioną (np. `/dashboard/*`, `/settings`), przekieruj na `/login`.
    - Jeśli użytkownik **jest zalogowany** i próbuje wejść na trasę autentykacji (`/login`, `/register`), przekieruj na `/dashboard`.
    - Trasy publiczne (np. landing page, `/api/public/*`) pozostają dostępne dla wszystkich.
4.  **Context**: Wstrzyknięcie obiektu `user` oraz instancji `supabase` do `context.locals`, aby były dostępne w stronach `.astro` i endpointach API.

### Endpointy API i Modele

- **Server-Side Logic**: Większość logiki autentykacji odbywa się bezpośrednio między klientem a Supabase Auth. Backend Astro pełni rolę pośrednika w zarządzaniu sesją (ciasteczka) oraz udostępnianiu danych użytkownika dla renderowania.
- **Modele Danych**:
  - Głównym modelem użytkownika jest tabela `auth.users` wewnątrz Supabase. Aplikacja identyfikuje użytkownika po `user_id` (UUID).
  - Należy zapewnić, że wszystkie zapytania do bazy danych (np. o transakcje, konta) filtrują dane po `user_id` aktualnie zalogowanego użytkownika (Row Level Security lub filtracja w serwisach).
- **Obsługa Wyjątków**:
  - Globalna obsługa błędów autentykacji w middleware.
  - Błędy 401/403 przekierowują na `/login`.

### Server-Side Rendering (SSR)

Zgodnie z `astro.config.mjs`, aplikacja działa w trybie `output: 'server'`.

- Strony Dashboardu będą pobierać dane (np. listę kont) w sekcji frontmatter (blok `---`) używając klienta Supabase z `locals`.
- Przykład:
  ```typescript
  const { supabase, user } = Astro.locals;
  const { data: accounts } = await supabase.from("accounts").select("*"); // RLS automatycznie filtruje po user
  ```

## 3. System Autentykacji (Supabase)

### Konfiguracja

1.  **Provider**: Email & Password włączony w panelu Supabase.
2.  **Email Confirmations**: **Wyłączone** (Disabled) dla MVP. Umożliwia to natychmiastowe zalogowanie po rejestracji (zgodnie z US-001).
    - _Uwaga_: Należy poinformować użytkownika o konieczności podania poprawnego emaila w celu odzyskania hasła.
3.  **Site URL**: Ustawiony na URL aplikacji (np. `http://localhost:3000` dla dev, odpowiedni URL dla prod).
4.  **Redirect URLs**: Dodanie `http://localhost:3000/auth/callback` (oraz wersji produkcyjnej) do dozwolonych adresów przekierowań.

### Procesy (Flow)

- **Rejestracja**:
  1.  User wysyła dane z `RegisterForm`.
  2.  `supabase.auth.signUp()` tworzy użytkownika.
  3.  Ze względu na wyłączone potwierdzanie emaila, sesja jest zwracana natychmiast.
  4.  Automatyczne logowanie i przekierowanie na Dashboard (realizacja US-001).
- **Logowanie**:
  1.  User wysyła dane z `LoginForm`.
  2.  `supabase.auth.signInWithPassword()` weryfikuje dane.
  3.  Klient otrzymuje sesję -> Biblioteka `@supabase/ssr` (lub helpery Astro) synchronizuje ciasteczka.
  4.  Przekierowanie na Dashboard.
- **Wylogowanie**:
  1.  Akcja `supabase.auth.signOut()`.
  2.  Usunięcie ciasteczek.
  3.  Przekierowanie na `/login`.
- **Reset Hasła**:
  1.  `supabase.auth.resetPasswordForEmail(email, { redirectTo: '.../auth/reset-password' })`.
  2.  User klika w link -> trafia na stronę z tokenem w URL (hash fragment lub query param).
  3.  Strona `ResetPasswordForm` wykrywa sesję odzyskiwania i pozwala wywołać `updateUser({ password: ... })`.
