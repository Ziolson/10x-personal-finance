# Plan implementacji widoku Konta

## 1. Przegląd

Widok "Konta" jest centralnym miejscem do zarządzania finansami osobistymi użytkownika. Umożliwia on przeglądanie wszystkich dodanych kont bankowych wraz z ich aktualnym saldem. Użytkownik może z tego poziomu dodawać nowe konta, edytować istniejące oraz je usuwać. Widok ten stanowi podstawę do dalszego śledzenia transakcji.

## 2. Routing widoku

Widok będzie dostępny pod następującą ścieżką:

- `/accounts`

Plik strony zostanie utworzony w lokalizacji `src/pages/accounts.astro`.

## 3. Struktura komponentów

Główna strona `accounts.astro` będzie renderować komponent React `AccountsView`, który zarządza całą logiką widoku.

```
- pages/accounts.astro
  - components/views/AccountsView.tsx (komponent kliencki)
    - Button (do otwierania modala dodawania)
    - SkeletonLoader (podczas ładowania danych)
    - EmptyState (gdy brak kont)
    - AccountsList
      - AccountListItem[] (dla każdego konta)
        - Button ("Edytuj")
        - Button ("Usuń")
    - AddAccountModal
      - AccountForm
    - EditAccountModal
      - AccountForm
    - DeleteConfirmationDialog
```

## 4. Szczegóły komponentów

### `AccountsView.tsx`

- **Opis komponentu**: Główny komponent-kontener dla widoku kont. Odpowiedzialny za pobieranie danych, zarządzanie stanem (modale, lista kont) oraz obsługę logiki biznesowej.
- **Główne elementy**: Nagłówek (`h1`), przycisk do dodawania konta, oraz warunkowo renderowane komponenty: `SkeletonLoader`, `EmptyState` lub `AccountsList`. Renderuje również wszystkie modale (`AddAccountModal`, `EditAccountModal`, `DeleteConfirmationDialog`).
- **Obsługiwane interakcje**:
  - Kliknięcie "Dodaj konto" otwiera `AddAccountModal`.
  - Przekazuje funkcje do otwierania modali edycji i usuwania do `AccountsList`.
  - Obsługuje logikę ponownego pobierania danych po operacjach CRUD.
- **Typy**: `AccountDTO[]`.
- **Propsy**: Brak.

### `AccountsList.tsx`

- **Opis komponentu**: Wyświetla listę kont użytkownika.
- **Główne elementy**: Lista (`ul` lub `div`) iterująca po tablicy kont i renderująca dla każdego z nich komponent `AccountListItem`.
- **Obsługiwane interakcje**: Brak bezpośrednich interakcji. Przekazuje zdarzenia z `AccountListItem` do `AccountsView`.
- **Typy**: `AccountDTO`.
- **Propsy**:
  ```typescript
  interface AccountsListProps {
    accounts: AccountDTO[];
    onEdit: (account: AccountDTO) => void;
    onDelete: (account: AccountDTO) => void;
  }
  ```

### `AccountListItem.tsx`

- **Opis komponentu**: Reprezentuje pojedynczy wiersz na liście kont. Wyświetla nazwę, aktualne saldo oraz przyciski akcji.
- **Główne elementy**: Elementy tekstowe dla nazwy i salda. Komponenty `Button` z `shadcn/ui` dla akcji "Edytuj" i "Usuń".
- **Obsługiwane interakcje**:
  - `onClick` na przycisku "Edytuj" wywołuje `props.onEdit`.
  - `onClick` na przycisku "Usuń" wywołuje `props.onDelete`.
- **Typy**: `AccountDTO`.
- **Propsy**:
  ```typescript
  interface AccountListItemProps {
    account: AccountDTO;
    onEdit: (account: AccountDTO) => void;
    onDelete: (account: AccountDTO) => void;
  }
  ```

### `AccountForm.tsx`

- **Opis komponentu**: Reużywalny formularz do tworzenia i edycji konta. Będzie wykorzystywał `zod` do walidacji po stronie klienta.
- **Główne elementy**: Komponenty `Form`, `Input`, `Label`, `Button` z `shadcn/ui`.
- **Obsługiwane interakcje**: Przesłanie formularza (`onSubmit`).
- **Warunki walidacji**:
  - `name`: Wymagane, `string`, min. 1 znak, max. 100 znaków.
  - `initial_balance`: Wymagane, `number`, wartość nieujemna (`>= 0`).
- **Typy**: `AccountFormViewModel`.
- **Propsy**:
  ```typescript
  interface AccountFormProps {
    onSubmit: (data: AccountFormViewModel) => void;
    initialData?: AccountFormViewModel;
    isSubmitting: boolean;
  }
  ```

### `AddAccountModal.tsx`

- **Opis komponentu**: Modal zawierający `AccountForm` do tworzenia nowego konta.
- **Główne elementy**: Komponent `Dialog` z `shadcn/ui` opakowujący `AccountForm`.
- **Obsługiwane interakcje**: Otwieranie/zamykanie modala. Przesłanie formularza.
- **Typy**: `CreateAccountCommand`, `AccountFormViewModel`.
- **Propsy**:
  ```typescript
  interface AddAccountModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSuccess: () => void; // Wywoływane po pomyślnym utworzeniu konta
  }
  ```

### `EditAccountModal.tsx`

- **Opis komponentu**: Modal zawierający `AccountForm` do edycji istniejącego konta, wypełniony jego danymi.
- **Główne elementy**: Komponent `Dialog` z `shadcn/ui` opakowujący `AccountForm`.
- **Obsługiwane interakcje**: Otwieranie/zamykanie modala. Przesłanie formularza.
- **Typy**: `UpdateAccountCommand`, `AccountDTO`, `AccountFormViewModel`.
- **Propsy**:
  ```typescript
  interface EditAccountModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    account: AccountDTO | null; // Dane konta do edycji
    onSuccess: () => void; // Wywoływane po pomyślnej edycji
  }
  ```

### `DeleteConfirmationDialog.tsx`

- **Opis komponentu**: Dialog proszący o potwierdzenie usunięcia konta.
- **Główne elementy**: Komponent `AlertDialog` z `shadcn/ui`.
- **Obsługiwane interakcje**: Potwierdzenie (`onConfirm`) lub anulowanie (`onCancel`) usunięcia.
- **Typy**: `AccountDTO`.
- **Propsy**:
  ```typescript
  interface DeleteConfirmationDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onConfirm: () => void;
    account: AccountDTO | null;
    isDeleting: boolean;
  }
  ```

## 5. Typy

Większość typów jest już zdefiniowana w `src/types.ts`. Dodatkowo, wprowadzony zostanie jeden typ ViewModel dla formularza.

- **`AccountDTO`**: Główny obiekt transferu danych dla konta, używany do wyświetlania.
  ```typescript
  export interface AccountDTO {
    id: string;
    name: string;
    initial_balance: number;
    currency: string;
    created_at: string;
    updated_at: string;
    current_balance: number;
  }
  ```
- **`AccountFormViewModel`**: Typ używany do zarządzania stanem formularza dodawania/edycji.
  ```typescript
  export interface AccountFormViewModel {
    name: string;
    initial_balance: number;
  }
  ```

## 6. Zarządzanie stanem

Logika zarządzania stanem zostanie scentralizowana w customowym hooku `useAccounts`, co pozwoli na utrzymanie czystości w komponencie `AccountsView`.

- **Custom Hook `useAccounts`**:
  - **Cel**: Abstrakcja logiki pobierania, tworzenia, aktualizacji i usuwania kont. Zarządza stanami ładowania i błędów.
  - **Zarządzany stan**:
    - `accounts: AccountDTO[] | undefined`: Lista kont.
    - `isLoading: boolean`: Status ładowania danych.
    - `error: Error | null`: Obiekt błędu.
  - **Udostępniane funkcje**:
    - `createAccount(command: CreateAccountCommand)`
    - `updateAccount(accountId: string, command: UpdateAccountCommand)`
    - `deleteAccount(accountId: string)`
    - `refetch()`: Ręczne odświeżenie listy kont.

- **Stan lokalny w `AccountsView.tsx`**:
  - `isAddModalOpen: boolean`: Kontroluje widoczność modala dodawania.
  - `editingAccount: AccountDTO | null`: Przechowuje obiekt konta do edycji; kontroluje widoczność modala edycji.
  - `deletingAccount: AccountDTO | null`: Przechowuje obiekt konta do usunięcia; kontroluje widoczność dialogu potwierdzenia.

## 7. Integracja API

Komponenty będą komunikować się z API poprzez funkcje udostępnione przez hook `useAccounts`.

- **Pobieranie kont**:
  - **Endpoint**: `GET /api/accounts`
  - **Akcja**: Wywoływane przy pierwszym renderowaniu `AccountsView`.
  - **Typ odpowiedzi**: `GetAccountsResponse` (`AccountDTO[]`)

- **Tworzenie konta**:
  - **Endpoint**: `POST /api/accounts`
  - **Akcja**: Wywoływane po przesłaniu formularza w `AddAccountModal`.
  - **Typ żądania**: `CreateAccountCommand` (`{ name, initial_balance }`)
  - **Typ odpowiedzi**: `CreateAccountResponse` (`AccountDTO`)

- **Aktualizacja konta**:
  - **Endpoint**: `PUT /api/accounts/{accountId}`
  - **Akcja**: Wywoływane po przesłaniu formularza w `EditAccountModal`.
  - **Typ żądania**: `UpdateAccountCommand` (`{ name?, initial_balance? }`)
  - **Typ odpowiedzi**: `UpdateAccountResponse` (`AccountDTO`)

- **Usuwanie konta**:
  - **Endpoint**: `DELETE /api/accounts/{accountId}`
  - **Akcja**: Wywoływane po potwierdzeniu w `DeleteConfirmationDialog`.
  - **Typ odpowiedzi**: `204 No Content`

## 8. Interakcje użytkownika

- **Dodawanie konta**: Użytkownik klika "Dodaj konto", wypełnia formularz w modalu i klika "Zapisz". Po sukcesie modal się zamyka, lista odświeża, a użytkownik widzi powiadomienie (toast).
- **Edycja konta**: Użytkownik klika "Edytuj" przy wybranym koncie. Modal otwiera się z wypełnionymi danymi. Po zmianie i zapisaniu, modal się zamyka, lista odświeża, a użytkownik widzi powiadomienie.
- **Usuwanie konta**: Użytkownik klika "Usuń". Otwiera się dialog z prośbą o potwierdzenie. Po potwierdzeniu, konto jest usuwane z listy, a użytkownik widzi powiadomienie.

## 9. Warunki i walidacja

Walidacja będzie realizowana po stronie klienta za pomocą biblioteki `zod` w komponencie `AccountForm`, aby zapewnić natychmiastową informację zwrotną dla użytkownika.

- **Formularz `AccountForm`**:
  - **Nazwa (`name`)**: Nie może być pusta. Maksymalna długość to 100 znaków. Komunikat błędu pojawi się pod polem input.
  - **Saldo początkowe (`initial_balance`)**: Musi być liczbą. Nie może być wartością ujemną. Komunikat błędu pojawi się pod polem input.
- **Stan interfejsu**:
  - Przycisk "Zapisz" w formularzach będzie zablokowany na czas trwania żądania API, a w jego miejscu pojawi się spinner.
  - Przycisk "Usuń" w dialogu potwierdzającym będzie zablokowany na czas trwania żądania API.

## 10. Obsługa błędów

- **Błąd wczytywania listy**: Jeśli `GET /api/accounts` zwróci błąd, zamiast listy zostanie wyświetlony komunikat o błędzie z opcją ponowienia próby.
- **Błędy walidacji API (400)**: Jeśli API zwróci błąd walidacji, jego szczegóły zostaną zmapowane na odpowiednie pola formularza i wyświetlone użytkownikowi.
- **Konflikt nazwy (409)**: Jeśli użytkownik poda nazwę konta, która już istnieje, formularz wyświetli błąd "Konto o tej nazwie już istnieje" przy polu `name`.
- **Zasób nieznaleziony (404)**: W przypadku próby edycji/usunięcia nieistniejącego konta, użytkownik zobaczy powiadomienie (toast) z informacją o błędzie i lista zostanie odświeżona.
- **Błędy serwera (500)**: W przypadku nieoczekiwanych błędów serwera, użytkownik zobaczy ogólne powiadomienie (toast) informujące o problemie.

## 11. Kroki implementacji

1.  Utworzenie struktury plików: `src/pages/accounts.astro`, `src/components/views/AccountsView.tsx` oraz pozostałych komponentów w `src/components/features/accounts/`.
2.  Implementacja customowego hooka `useAccounts` z logiką do komunikacji z API (`GET`, `POST`, `PUT`, `DELETE`).
3.  Implementacja komponentu `AccountsView`, który używa hooka `useAccounts` do pobrania danych i zarządzania stanem modali.
4.  Stworzenie komponentów `AccountsList` i `AccountListItem` do wyświetlania danych. Implementacja logiki warunkowej dla `SkeletonLoader` i `EmptyState`.
5.  Implementacja reużywalnego komponentu `AccountForm` wraz z walidacją po stronie klienta przy użyciu `zod` i `react-hook-form`.
6.  Implementacja modali: `AddAccountModal` i `EditAccountModal`, które będą wykorzystywać `AccountForm`.
7.  Implementacja dialogu `DeleteConfirmationDialog`.
8.  Połączenie wszystkich komponentów w `AccountsView`, przekazanie propsów i obsługa zdarzeń (otwieranie modali, przekazywanie ID do operacji).
9.  Implementacja systemu powiadomień (toastów) dla operacji zakończonych sukcesem oraz dla błędów.
10. Stylowanie wszystkich komponentów za pomocą Tailwind CSS i komponentów `shadcn/ui` zgodnie z UI planem.
11. Testowanie manualne wszystkich ścieżek użytkownika: dodawanie, edycja, usuwanie, obsługa błędów i przypadków brzegowych.
