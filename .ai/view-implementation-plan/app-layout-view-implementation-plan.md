# Plan implementacji widoku: Układ Globalny (Global Layout)

## 1. Przegląd
Układ Globalny (`AppLayout`) to główny kontener dla wszystkich prywatnych (dostępnych po zalogowaniu) widoków aplikacji. Jego celem jest zapewnienie spójnej nawigacji, dostępu do kluczowych akcji (dodawanie transakcji, wylogowanie) oraz responsywności. Layout działa jako "szkielet", wewnątrz którego renderowana jest właściwa treść podstron. Dodatkowo plan uwzględnia standaryzację nagłówków podstron za pomocą komponentu `PageHeader` oraz ułatwienia UX takie jak tryb ciemny i intuicyjne rozmieszczenie elementów.

## 2. Routing widoku
Układ ten nie posiada jednej dedykowanej ścieżki, lecz jest wrapperem dla wszystkich poniższych tras:
- `/` (Pulpit)
- `/transactions` (Historia Transakcji)
- `/accounts` (Konta)
- `/budgets` (Budżety)
- `/categories` (Kategorie)

## 3. Struktura komponentów
Głównym plikiem jest komponent Astro (`AppLayout.astro`), który wykorzystuje istniejący `Layout.astro` jako bazę. Wewnątrz treści (slotu) wykorzystywany będzie komponent `PageHeader`.

**Hierarchia:**
- `Layout.astro` (Base Layout - HTML, Head, Global Styles - **istniejący plik**)
  - `AppLayout.astro` (Wrapper dla aplikacji prywatnej)
    - `Sidebar.tsx` (Nawigacja desktopowa - lewa strona)
      - **Przycisk "Dodaj transakcję"** (Góra)
      - **Sekcja Profilu** (Dół - stale widoczna: Awatar, Nazwa, Przycisk Motywu, Przycisk Wyloguj)
    - `MobileHeader.tsx` (Nagłówek mobilny - góra)
      - `UserMenu.tsx` (Dropdown ukrywający akcje profilowe na mobile)
    - `MainContent` (Slot Astro - dynamiczna treść strony)
      - **`PageHeader.tsx`** (Używany wewnątrz poszczególnych widoków)
    - `MobileBottomNav.tsx` (Nawigacja mobilna - dół)
    - `GlobalModalsWrapper.tsx` (Kontener na modale)
      - `AddTransactionModal.tsx` (Logika widoczności)
    - `Toaster.tsx` (System powiadomień)

## 4. Szczegóły komponentów

### `AppLayout.astro`
- **Opis:** Główny plik layoutu dla zalogowanych użytkowników. Importuje `Layout.astro` i używa go jako kontenera.
- **Główne elementy:** `<Layout>`, kontenery `div` z klasami responsywnymi (np. `hidden md:flex`).
- **Propsy:** `title`: string.
- **Logika:** Pobiera `Astro.url.pathname` i przekazuje jako prop `currentPath` do komponentów nawigacyjnych.

### `Sidebar.tsx` (Client Component)
- **Opis:** Pionowy pasek nawigacyjny widoczny tylko na desktopie.
- **Główne elementy:**
    - **Góra:** Logo aplikacji (kliklane, prowadzi do `/`), Przycisk "Dodaj transakcję" (wyróżniony, Primary).
    - **Środek:** Lista linków nawigacyjnych.
    - **Dół (Stopka):**
        - Kontener z informacjami o użytkowniku (Awatar + Imię/Email).
        - Obok niego: Małe przyciski (Icon Buttons) do zmiany motywu i wylogowania. Dostępne bezpośrednio, bez dropdowna.
- **Propsy:** `currentPath`: string.
- **Szczegóły:** Przycisk "Dodaj transakcję" znajduje się na samej górze paska bocznego.

### `MobileBottomNav.tsx` (Client Component)
- **Opis:** Poziomy pasek nawigacyjny przyklejony do dołu ekranu (mobile).
- **Główne elementy:** Ikony nawigacyjne, FAB/Ikona "Dodaj".

### `MobileHeader.tsx` (Client Component)
- **Opis:** Prosty nagłówek mobilny zawierający logo i menu użytkownika.
- **Główne elementy:** Logo (klikalne link do `/`), `UserMenu` (Avatar/Menu).

### `PageHeader.tsx` (Shared Component)
- **Opis:** Reużywalny komponent nagłówka używany na początku każdego widoku (np. w `AccountsView`, `TransactionsView`). Zapewnia spójny wygląd tytułów i rozmieszczenie przycisków akcji.
- **Główne elementy:**
  - Lewa strona: `Title` (H1), `Description` (np. breadcrumb lub subtitle).
  - Prawa strona: `Children` (Slot na przyciski akcji, np. "Dodaj konto").
- **Propsy:**
  - `title`: string (wymagane)
  - `description`: string (opcjonalne)
  - `children`: ReactNode (opcjonalne - przyciski akcji)
- **Przykład użycia:**
  ```tsx
  <PageHeader title="Twoje Konta" description="Finanse">
    <Button onClick={...}>Dodaj konto</Button>
  </PageHeader>
  ```

### `UserMenu.tsx` (Client Component)
- **Opis:** Dropdown z opcjami użytkownika używany **tylko w wersji mobilnej** (w `MobileHeader`).
- **Elementy Menu:**
    - Profil (Info).
    - Przełącznik Motywu (Jasny/Ciemny/System).
    - Wyloguj.
- **Główne elementy:** Shadcn `DropdownMenu`, `Avatar`.

### `GlobalModalsWrapper.tsx`
- **Opis:** Kontener nasłuchujący na stan Nano Store, by wyświetlić modale globalne (np. `AddTransactionModal`).

## 5. Wykorzystanie istniejących komponentów
- **UI:** `button.tsx`, `toast.tsx`, `Layout.astro`.
- **Utils:** `cn` z `utils.ts`.

## 6. Typy i Zarządzanie Stanem
- **Nano Store:** `layoutStore.ts` z `isAddTransactionModalOpen`.
- **Typy:** `NavigationItem`.

## 7. Integracja API
Layout obsługuje **Wylogowanie** (`supabase.auth.signOut()`).

## 8. Interakcje użytkownika
- **Nawigacja:** Przełączanie stron, kliknięcie w logo resetuje widok do Pulpitu.
- **Globalne Akcje:** Otwieranie modalu transakcji z paska bocznego (przycisk na górze).
- **Ustawienia (Desktop):** Bezpośrednia zmiana motywu i wylogowanie z paska bocznego.
- **Ustawienia (Mobile):** Zmiana motywu i wylogowanie dostępne po rozwinięciu menu użytkownika.
- **Akcje Lokalne:** Przyciski w `PageHeader` (np. dodawanie konta) działają w kontekście konkretnego widoku.

## 9. Warunki i walidacja
- **Responsywność:** `Sidebar` (Desktop) vs `MobileBottomNav` + `MobileHeader` (Mobile).

## 10. Obsługa błędów
- Wyświetlanie toasta w przypadku błędu wylogowania.

## 11. Kroki implementacji

1.  **Przygotowanie Store:** Utwórz `src/lib/stores/layoutStore.ts`.
2.  **Brakujące komponenty UI:** Zainstaluj `dropdown-menu`, `avatar`. Skonfiguruj motywy.
3.  **Komponent PageHeader:** Stwórz `src/components/ui/PageHeader.tsx` (lub `shared`). Zadbaj o elastyczny układ (flexbox, wrap) dla tytułu i przycisków akcji.
4.  **Komponent UserMenu (Mobile):** Zaimplementuj `UserMenu.tsx` jako dropdown dla wersji mobilnej.
5.  **Komponent Sidebar (Desktop):** Zaimplementuj `Sidebar.tsx`. Zamiast `UserMenu`, stwórz w nim dedykowaną sekcję stopki ("UserProfileSection") z bezpośrednimi przyciskami (IconButton) do wylogowania i zmiany motywu.
6.  **Komponenty Layoutu:** Zaimplementuj `MobileHeader.tsx` (Logo jako Link), `MobileBottomNav.tsx`.
7.  **Wrapper Modali:** Stwórz `GlobalModalsWrapper.tsx`.
8.  **Złożenie Layoutu:** Stwórz `src/layouts/AppLayout.astro` wykorzystując `Layout.astro` jako bazę.
9.  **Refaktoryzacja Widoków:** Zaktualizuj istniejące strony (np. `accounts.astro` / `AccountsView.tsx`):
    - Użyj `AppLayout` zamiast `Layout`.
    - Wewnątrz komponentów React (np. `AccountsView`) zastąp ręcznie pisane nagłówki nowym komponentem `<PageHeader />`.
