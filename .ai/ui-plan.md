# Architektura UI dla 10xPersonal Finance

## 1. Przegląd struktury UI

Struktura opiera się na płaskiej nawigacji, która umożliwia użytkownikom szybki dostęp do pięciu kluczowych sekcji aplikacji: **Pulpit**, **Transakcje**, **Konta**, **Budżety** i **Kategorie**. Taki podział bezpośrednio odzwierciedla strukturę zasobów API, co upraszcza zarówno logikę aplikacji, jak i nawigację.

Kluczowe operacje, takie jak tworzenie, edycja i usuwanie danych (konta, transakcje, budżety, kategorie), są obsługiwane za pomocą **okien modalnych**. Takie podejście utrzymuje użytkownika w kontekście bieżącego widoku, eliminując potrzebę przeładowywania całej strony i zapewniając płynność interakcji.

Wszystkie widoki list (transakcji, kont itp.) zostały zaprojektowane tak, aby obsługiwać **"stany zerowe" (empty states)**, które w jasny sposób instruują nowych użytkowników, jakie kroki powinni podjąć, aby rozpocząć korzystanie z aplikacji (np. "Dodaj swoje pierwsze konto"). Aplikacja dynamicznie informuje użytkownika o stanie ładowania danych, wykorzystując **wskaźniki wizualne** takie jak "skeleton loaders" dla całych widoków i "spinnery" w przyciskach.

## 2. Lista widoków

### Widoki publiczne (przed zalogowaniem)

---

- **Nazwa widoku**: Logowanie
- **Ścieżka widoku**: `/login`
- **Główny cel**: Umożliwienie powrotu do aplikacji zarejestrowanym użytkownikom.
- **Kluczowe informacje do wyświetlenia**: Pola formularza do wprowadzenia danych uwierzytelniających.
- **Kluczowe komponenty widoku**: `LoginForm`, `Button`, `Input`, `Link` (do rejestracji i resetowania hasła).
- **UX, dostępność i względy bezpieczeństwa**: Komunikaty o błędach walidacji wyświetlane przy polach. Komunikaty o błędnym logowaniu wyświetlane jako globalny toast. Zapewniona pełna obsługa za pomocą klawiatury.

---

- **Nazwa widoku**: Rejestracja
- **Ścieżka widoku**: `/register`
- **Główny cel**: Umożliwienie nowym użytkownikom założenia konta.
- **Kluczowe informacje do wyświetlenia**: Pola formularza do utworzenia konta.
- **Kluczowe komponenty widoku**: `RegisterForm`, `Button`, `Input`, `Link` (do logowania).
- **UX, dostępność i względy bezpieczeństwa**: Walidacja "on blur" dla formatu e-maila i "on submit" dla reszty pól. Informacja o zajętym adresie e-mail jest obsługiwana jako błąd serwerowy (toast).

---

- **Nazwa widoku**: Resetowanie Hasła
- **Ścieżka widoku**: `/forgot-password`, `/update-password`
- **Główny cel**: Umożliwienie użytkownikom odzyskania dostępu do konta po utracie hasła.
- **Kluczowe informacje do wyświetlenia**: Formularz do podania adresu e-mail, a następnie formularz do ustawienia nowego hasła.
- **Kluczowe komponenty widoku**: `ForgotPasswordForm`, `UpdatePasswordForm`.
- **UX, dostępność i względy bezpieczeństwa**: Jasne instrukcje dla użytkownika na każdym etapie procesu. Komunikaty o wysłaniu linku i pomyślnej zmianie hasła.

### Widoki prywatne (po zalogowaniu)

---

- **Nazwa widoku**: Pulpit
- **Ścieżka widoku**: `/`
- **Główny cel**: Zapewnienie szybkiego przeglądu ogólnej sytuacji finansowej użytkownika w wybranym miesiącu.
- **Kluczowe informacje do wyświetlenia**: Podsumowanie (przychody, wydatki, saldo), wykres kołowy wydatków wg kategorii, lista ostatnich transakcji, postęp wykorzystania budżetów.
- **Kluczowe komponenty widoku**: `PageHeader`, `SummaryCards`, `ExpenseChart` (Recharts), `RecentTransactionsList`, `BudgetsProgressList`, `MonthNavigator` (przyciski do zmiany miesiąca), `EmptyState` (dla nowych użytkowników).
- **UX, dostępność i względy bezpieczeństwa**: Wyróżnienie wizualne budżetów bliskich przekroczenia limitu (np. zmiana koloru paska postępu). Wyraźne CTA w "stanie zerowym". Dane pobierane z dedykowanego endpointu `/api/dashboard`.

---

- **Nazwa widoku**: Historia Transakcji
- **Ścieżka widoku**: `/transactions`
- **Główny cel**: Umożliwienie przeglądania, analizowania i zarządzania wszystkimi transakcjami.
- **Kluczowe informacje do wyświetlenia**: Tabela/lista transakcji z kluczowymi danymi (data, typ, kwota, konto, kategoria, opis).
- **Kluczowe komponenty widoku**: `PageHeader`, `TransactionsList`, `TransactionListItem`, `FiltersPanel` (otwierany w modalu/panelu bocznym), `Pagination` (hybrydowa), `EmptyState`.
- **UX, dostępność i względy bezpieczeństwa**: Domyślne sortowanie od najnowszej transakcji. Filtry są łatwo dostępne, ale nie zajmują miejsca na ekranie głównym. Na mobile paginacja typu "Załaduj więcej", na desktopie - numeryczna.

---

- **Nazwa widoku**: Konta
- **Ścieżka widoku**: `/accounts`
- **Główny cel**: Zarządzanie kontami bankowymi użytkownika.
- **Kluczowe informacje do wyświetlenia**: Lista kont z ich nazwą i aktualnym saldem.
- **Kluczowe komponenty widoku**: `PageHeader`, `AccountsList`, `AccountListItem`, `AddAccountModal`, `EditAccountModal`, `DeleteConfirmationDialog`, `EmptyState`.
- **UX, dostępność i względy bezpieczeństwa**: Akcje (edycja, usunięcie) dostępne przy każdym koncie. Usunięcie konta wymaga dodatkowego potwierdzenia ze względu na nieodwracalność operacji.

---

- **Nazwa widoku**: Budżety
- **Ścieżka widoku**: `/budgets`
- **Główny cel**: Zarządzanie miesięcznymi budżetami.
- **Kluczowe informacje do wyświetlenia**: Lista budżetów z nazwą, kwotą, przypisanymi kategoriami.
- **Kluczowe komponenty widoku**: `PageHeader`, `BudgetsList`, `BudgetListItem`, `AddBudgetModal`, `EditBudgetModal`, `DeleteConfirmationDialog`, `EmptyState`.
- **UX, dostępność i względy bezpieczeństwa**: Formularz tworzenia/edycji budżetu uniemożliwia przypisanie kategorii już użytej w innym budżecie w tym samym miesiącu.

---

- **Nazwa widoku**: Kategorie
- **Ścieżka widoku**: `/categories`
- **Główny cel**: Zarządzanie kategoriami przychodów i wydatków.
- **Kluczowe informacje do wyświetlenia**: Lista kategorii z podziałem na typ (przychód/wydatek).
- **Kluczowe komponenty widoku**: `PageHeader`, `CategoriesList`, `CategoryListItem`, `AddCategoryModal`, `EditCategoryModal`, `DeleteConfirmationDialog`, `EmptyState`.
- **UX, dostępność i względy bezpieczeństwa**: Usunięcie kategorii jest możliwe tylko wtedy, gdy nie jest ona powiązana z żadną transakcją (logika walidowana przez API, UI powinno wyświetlić stosowny komunikat błędu).

## 3. Mapa podróży użytkownika

Przepływ użytkownika został zaprojektowany z myślą o prostocie i intuicyjności, minimalizując liczbę kroków potrzebnych do wykonania kluczowych zadań.

**Główny przypadek użycia: Dodanie pierwszej transakcji przez nowego użytkownika**

1.  **Rejestracja (`/register`)**: Użytkownik tworzy konto. Po sukcesie jest automatycznie logowany i przekierowywany na **Pulpit (`/`)**.
2.  **Pulpit (`/`) - Stan zerowy**: Użytkownik widzi pusty pulpit z wezwaniem do działania (CTA), np. "Dodaj swoje pierwsze konto".
3.  **Dodawanie konta**: Kliknięcie CTA otwiera **`AddAccountModal`**. Użytkownik wypełnia formularz (nazwa, saldo początkowe) i zapisuje. Modal się zamyka, a dane na pulpicie odświeżają.
4.  **Nawigacja do dodania transakcji**: Użytkownik klika globalny przycisk "Dodaj transakcję" (wyróżniony na górze menu), co otwiera **`AddTransactionModal`**.
5.  **Wypełnianie formularza transakcji**:
    - Użytkownik wybiera typ transakcji (np. "Wydatek").
    - Formularz dynamicznie dostosowuje pola: pojawiają się selektory dla konta i kategorii.
    - Użytkownik wypełnia kwotę, datę i wybiera wcześniej utworzone konto.
    - Ponieważ nie ma jeszcze żadnych kategorii, może użyć predefiniowanych lub przejść do widoku **Kategorie (`/categories`)**, aby dodać własne.
6.  **Zapis transakcji**: Po wypełnieniu formularza użytkownik klika "Zapisz". Modal się zamyka.
7.  **Powrót na Pulpit (`/`)**: Aplikacja odświeża dane. Na pulpicie widoczne jest zaktualizowane podsumowanie, a nowa transakcja pojawia się na liście ostatnich transakcji.

**Inne kluczowe interakcje:**

- **Przeglądanie historii**: Z dowolnego miejsca w aplikacji użytkownik może przejść do widoku **Historia Transakcji (`/transactions`)**, aby zobaczyć pełną listę i skorzystać z filtrowania.
- **Edycja zasobu**: Użytkownik na liście (np. kont) klika ikonę "Edytuj", co otwiera odpowiedni modal (`EditAccountModal`) z wypełnionymi danymi, gotowymi do modyfikacji.
- **Usuwanie zasobu**: Użytkownik klika ikonę "Usuń", co otwiera okno dialogowe (`DeleteConfirmationDialog`) z prośbą o potwierdzenie akcji.

## 4. Układ i struktura nawigacji

**Układ globalny:**

- Aplikacja wykorzystuje stały, globalny układ dla zalogowanych użytkowników.
- **Na desktopie**: Pionowy pasek nawigacyjny po lewej stronie ekranu.
  - **Góra**: Klikalne Logo (powrót do `/`) oraz główny przycisk **"Dodaj transakcję"** (Primary Action) zgodny ze wzorcem "Compose".
  - **Środek**: Linki nawigacyjne.
  - **Dół**: Sekcja użytkownika. Zawiera Awatar, Imię/Email oraz **bezpośrednie przyciski akcji** (Zmiana motywu, Wyloguj), dostępne bez konieczności otwierania dodatkowego menu.
- **Na mobile**:
  - **Góra**: Prosty nagłówek z klikalnym logo i menu użytkownika (ukrywającym wylogowanie i zmianę motywu).
  - **Dół**: Pasek nawigacyjny (tab bar) z ikonami dla kluczowych widoków i przyciskiem FAB "Dodaj".
- W centralnym miejscu interfejsu (na górze paska bocznego na desktopie, jako FAB na mobile) znajduje się przycisk **"Dodaj transakcję"**, który jest stale widoczny i dostępny z każdego widoku.

**Struktura nawigacji (płaska):**

- `/` - **Pulpit**
- `/transactions` - **Historia Transakcji**
- `/accounts` - **Konta**
- `/budgets` - **Budżety**
- `/categories` - **Kategorie**

Wszystkie linki nawigacyjne prowadzą bezpośrednio do odpowiednich widoków. Nie ma zagnieżdżonych ścieżek, co upraszcza orientację użytkownika w aplikacji.

## 5. Kluczowe komponenty

Poniżej znajduje się lista kluczowych, reużywalnych komponentów, które stanowią fundament interfejsu użytkownika aplikacji.

- **`PageHeader`**: Standaryzowany nagłówek dla każdego widoku, zawierający tytuł, opis i przyciski akcji specyficzne dla danego ekranu (np. "Dodaj konto").
- **`AddTransactionModal`**: Centralny komponent aplikacji. Modal zawierający dynamiczny formularz, który zmienia swoje pola w zależności od wybranego typu transakcji (wydatek, przychód, transfer). Będzie wykorzystywał logikę warunkowego renderowania pól.
- **`DeleteConfirmationDialog`**: Standardowy modal dialogowy używany przed każdą akcją destrukcyjną (usunięcie konta, kategorii, itp.), aby zapobiec przypadkowej utracie danych.
- **`EmptyState`**: Komponent wyświetlany w widokach list, gdy nie ma jeszcze żadnych danych. Zawiera grafikę, krótki tekst wyjaśniający oraz przycisk z wyraźnym wezwaniem do działania (CTA).
- **`FiltersPanel`**: Komponent (modal lub boczny panel) zawierający opcje filtrowania dla listy transakcji (zakres dat, konta, kategorie, typ).
- **`MonthNavigator`**: Prosty komponent składający się z nazwy bieżącego miesiąca i przycisków "wstecz"/"dalej", używany na pulpicie do zmiany okresu wyświetlanych danych.
- **`DataList` / `DataListItem`**: Generyczne komponenty do wyświetlania list zasobów (kont, budżetów, kategorii), zapewniające spójny wygląd i obsługę akcji (edycja, usuwanie).
- **`Toast` / `NotificationProvider`**: Globalny system do wyświetlania powiadomień (toastów) o sukcesie operacji lub wystąpieniu błędów serwerowych.
- **`SkeletonLoader`**: Komponent używany do wyświetlania "szkieletu" interfejsu podczas ładowania danych, co poprawia postrzeganą wydajność aplikacji.
- **`SpinnerButton`**: Wariant standardowego przycisku, który wyświetla wskaźnik ładowania (spinner) po kliknięciu i w trakcie oczekiwania na odpowiedź API, blokując jednocześnie kolejne kliknięcia.
- **`CurrencyFormatter` / `DateFormatter`**: Zestaw globalnych funkcji pomocniczych do spójnego formatowania kwot pieniężnych (zawsze z symbolem PLN) i dat w całej aplikacji.
