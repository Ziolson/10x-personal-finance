<architecture_analysis>

1. **Komponenty z plików referencyjnych:**
   - **Strony (Astro SSR):**
     - `src/pages/login.astro`
     - `src/pages/register.astro`
     - `src/pages/forgot-password.astro`
     - `src/pages/auth/reset-password.astro`
     - `src/pages/auth/callback.ts` (API Endpoint)
   - **Layouty:**
     - `src/layouts/AuthLayout.astro` (Nowy, minimalistyczny)
     - `src/layouts/AppLayout.astro` (Istniejący, chroniony)
   - **Komponenty React (Islands):**
     - `src/components/features/auth/LoginForm.tsx`
     - `src/components/features/auth/RegisterForm.tsx`
     - `src/components/features/auth/ForgotPasswordForm.tsx`
     - `src/components/features/auth/ResetPasswordForm.tsx`
   - **Backend / Middleware:**
     - `src/middleware/index.ts` (Ochrona tras, inicjalizacja Supabase SSR)
   - **Zewnętrzne:**
     - Supabase Auth (Baza danych, obsługa sesji)

2. **Główne strony i komponenty:**
   - Strona **Logowania** (`/login`) używa `AuthLayout` i zawiera `LoginForm`.
   - Strona **Rejestracji** (`/register`) używa `AuthLayout` i zawiera `RegisterForm`.
   - Strona **Odzyskiwania Hasła** (`/forgot-password`) używa `AuthLayout` i zawiera `ForgotPasswordForm`.
   - Strona **Resetu Hasła** (`/auth/reset-password`) używa `AuthLayout` i zawiera `ResetPasswordForm`.
   - **Dashboard** (`/dashboard`) używa `AppLayout` i jest dostępny tylko dla zalogowanych.

3. **Przepływ danych:**
   - Użytkownik wchodzi w interakcję z formularzami (React).
   - Formularze komunikują się bezpośrednio z **Supabase Auth** (Client-side) używając `supabase-js`.
   - Po sukcesie, Supabase ustawia ciasteczka sesyjne.
   - Następuje przekierowanie lub odświeżenie.
   - **Middleware** po stronie serwera przechwytuje żądanie, weryfikuje ciasteczka sesyjne przez `@supabase/ssr` i udostępnia obiekt `user` w `Astro.locals`.
   - Strony Astro renderują się warunkowo w zależności od stanu autentykacji (np. przekierowanie w Middleware).

4. **Opis funkcjonalności:**
   - **LoginForm**: Logowanie emailem i hasłem.
   - **RegisterForm**: Rejestracja nowego użytkownika i auto-logowanie.
   - **Middleware**: Strażnik tras (Route Guard) - blokuje dostęp do dashboardu dla niezalogowanych i dostęp do logowania dla zalogowanych.
   - **AuthLayout**: Zapewnia spójny wygląd stron autentykacji (wyśrodkowana karta, brak nawigacji aplikacji).

</architecture_analysis>

<mermaid_diagram>

```mermaid
flowchart TD
    %% Sekcja: Użytkownik i Przeglądarka
    User((Użytkownik))

    subgraph "Frontend (Przeglądarka)"
        direction TB

        subgraph "Strony Autentykacji (AuthLayout)"
            LoginPage[Strona Logowania\n/login]
            RegisterPage[Strona Rejestracji\n/register]
            ForgotPage[Strona Zapomniałem Hasła\n/forgot-password]
            ResetPage[Strona Resetu Hasła\n/auth/reset-password]
        end

        subgraph "Komponenty React (Islands)"
            LoginForm[LoginForm.tsx\nclient:load]
            RegisterForm[RegisterForm.tsx\nclient:load]
            ForgotForm[ForgotPasswordForm.tsx\nclient:load]
            ResetForm[ResetPasswordForm.tsx\nclient:load]
        end

        subgraph "Strony Chronione (AppLayout)"
            DashboardPage[Panel Główny\n/dashboard]
        end
    end

    %% Połączenia Użytkownika z UI
    User --> LoginPage
    User --> RegisterPage

    %% Relacje Strona -> Komponent
    LoginPage --- LoginForm
    RegisterPage --- RegisterForm
    ForgotPage --- ForgotForm
    ResetPage --- ResetForm

    %% Sekcja: Backend (Astro Server)
    subgraph "Backend (Astro Server)"
        direction TB

        Middleware[Middleware\nsrc/middleware/index.ts]
        CallbackAPI[Auth Callback\nsrc/pages/auth/callback.ts]

        subgraph "Zarządzanie Stanem"
            Locals[Astro.locals\nuser, supabase]
        end
    end

    %% Sekcja: Zewnętrzne Usługi
    subgraph "Zewnętrzne Usługi"
        SupabaseAuth["Supabase Auth\n(Database & Sessions)"]
    end

    %% Przepływ Autentykacji (Client Side)
    LoginForm -- "1. signInWithPassword" --> SupabaseAuth
    RegisterForm -- "1. signUp" --> SupabaseAuth
    ForgotForm -- "1. resetPasswordForEmail" --> SupabaseAuth
    ResetForm -- "1. updateUser (hasło)" --> SupabaseAuth

    %% Przepływ Po Zalogowaniu i Sesja
    SupabaseAuth -- "2. Set Session Cookies" --> Middleware
    Middleware -- "3. Weryfikacja i User Object" --> Locals

    %% Route Guarding (Middleware)
    Middleware -- "Brak Sesji" --> LoginPage
    Middleware -- "Jest Sesja" --> DashboardPage

    %% Callback Flow
    SupabaseAuth -.->|"Redirect (Email Link)"| CallbackAPI
    CallbackAPI -- "Exchange Code for Session" --> Middleware

    %% Stylizacja
    classDef page fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef component fill:#fff3e0,stroke:#ff6f00,stroke-width:2px;
    classDef backend fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef external fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;
    classDef actor fill:#eceff1,stroke:#455a64,stroke-width:2px;

    class LoginPage,RegisterPage,ForgotPage,ResetPage,DashboardPage page;
    class LoginForm,RegisterForm,ForgotForm,ResetForm component;
    class Middleware,CallbackAPI,Locals backend;
    class SupabaseAuth external;
    class User actor;
```

</mermaid_diagram>
