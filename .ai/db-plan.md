# Schemat Bazy Danych - 10xPersonal Finance

## 1. Typy ENUM

### transaction_type

```sql
CREATE TYPE transaction_type AS ENUM ('expense', 'income', 'transfer');
```

### category_type

```sql
CREATE TYPE category_type AS ENUM ('expense', 'income');
```

## 2. Tabele

### profiles

Główna tabela użytkowników aplikacji, połączona relacją 1-do-1 z `auth.users`.

| Kolumna    | Typ         | Ograniczenia                                             | Opis                        |
| ---------- | ----------- | -------------------------------------------------------- | --------------------------- |
| id         | UUID        | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE | Identyfikator użytkownika   |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now()                                  | Data utworzenia profilu     |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now()                                  | Data ostatniej aktualizacji |

**Ograniczenia:**

- PRIMARY KEY: `id`
- FOREIGN KEY: `id` REFERENCES `auth.users(id)` ON DELETE CASCADE

**Indeksy:**

- PRIMARY KEY na `id` (automatyczny)

---

### accounts

Konta bankowe użytkownika.

| Kolumna         | Typ            | Ograniczenia                                        | Opis                                       |
| --------------- | -------------- | --------------------------------------------------- | ------------------------------------------ |
| id              | UUID           | PRIMARY KEY, DEFAULT gen_random_uuid()              | Identyfikator konta                        |
| user_id         | UUID           | NOT NULL, REFERENCES profiles(id) ON DELETE CASCADE | Właściciel konta                           |
| name            | VARCHAR(255)   | NOT NULL                                            | Nazwa konta                                |
| initial_balance | NUMERIC(10, 2) | NOT NULL, CHECK (initial_balance >= 0)              | Saldo początkowe                           |
| currency        | VARCHAR(3)     | NOT NULL, DEFAULT 'PLN'                             | Waluta konta (przygotowanie na przyszłość) |
| created_at      | TIMESTAMPTZ    | NOT NULL, DEFAULT now()                             | Data utworzenia konta                      |
| updated_at      | TIMESTAMPTZ    | NOT NULL, DEFAULT now()                             | Data ostatniej aktualizacji                |

**Ograniczenia:**

- PRIMARY KEY: `id`
- FOREIGN KEY: `user_id` REFERENCES `profiles(id)` ON DELETE CASCADE
- UNIQUE: `(user_id, name)` - nazwy kont muszą być unikalne dla danego użytkownika
- CHECK: `initial_balance >= 0`

**Indeksy:**

- PRIMARY KEY na `id` (automatyczny)
- INDEX na `user_id`
- UNIQUE INDEX na `(user_id, name)` (automatyczny)

---

### budgets

Miesięczne budżety użytkownika.

| Kolumna    | Typ            | Ograniczenia                                        | Opis                        |
| ---------- | -------------- | --------------------------------------------------- | --------------------------- |
| id         | UUID           | PRIMARY KEY, DEFAULT gen_random_uuid()              | Identyfikator budżetu       |
| user_id    | UUID           | NOT NULL, REFERENCES profiles(id) ON DELETE CASCADE | Właściciel budżetu          |
| name       | VARCHAR(255)   | NOT NULL                                            | Nazwa budżetu               |
| amount     | NUMERIC(10, 2) | NOT NULL, CHECK (amount > 0)                        | Kwota budżetu               |
| month      | INTEGER        | NOT NULL, CHECK (month >= 1 AND month <= 12)        | Miesiąc budżetu (1-12)      |
| year       | INTEGER        | NOT NULL, CHECK (year >= 2000 AND year <= 2100)     | Rok budżetu                 |
| created_at | TIMESTAMPTZ    | NOT NULL, DEFAULT now()                             | Data utworzenia budżetu     |
| updated_at | TIMESTAMPTZ    | NOT NULL, DEFAULT now()                             | Data ostatniej aktualizacji |

**Ograniczenia:**

- PRIMARY KEY: `id`
- FOREIGN KEY: `user_id` REFERENCES `profiles(id)` ON DELETE CASCADE
- UNIQUE: `(user_id, name, month, year)` - budżet o danej nazwie w danym miesiącu i roku dla użytkownika musi być unikalny
- CHECK: `amount > 0`
- CHECK: `month >= 1 AND month <= 12`
- CHECK: `year >= 2000 AND year <= 2100`

**Indeksy:**

- PRIMARY KEY na `id` (automatyczny)
- INDEX na `user_id`
- INDEX na `(user_id, year, month)`
- UNIQUE INDEX na `(user_id, name, month, year)` (automatyczny)

---

### categories

Kategorie wydatków i przychodów.

| Kolumna    | Typ           | Ograniczenia                                        | Opis                           |
| ---------- | ------------- | --------------------------------------------------- | ------------------------------ |
| id         | UUID          | PRIMARY KEY, DEFAULT gen_random_uuid()              | Identyfikator kategorii        |
| user_id    | UUID          | NOT NULL, REFERENCES profiles(id) ON DELETE CASCADE | Właściciel kategorii           |
| name       | VARCHAR(255)  | NOT NULL                                            | Nazwa kategorii                |
| type       | category_type | NOT NULL                                            | Typ kategorii (expense/income) |
| budget_id  | UUID          | NULL, REFERENCES budgets(id) ON DELETE SET NULL     | Powiązany budżet (opcjonalnie) |
| created_at | TIMESTAMPTZ   | NOT NULL, DEFAULT now()                             | Data utworzenia kategorii      |
| updated_at | TIMESTAMPTZ   | NOT NULL, DEFAULT now()                             | Data ostatniej aktualizacji    |

**Ograniczenia:**

- PRIMARY KEY: `id`
- FOREIGN KEY: `user_id` REFERENCES `profiles(id)` ON DELETE CASCADE
- FOREIGN KEY: `budget_id` REFERENCES `budgets(id)` ON DELETE SET NULL
- UNIQUE: `(user_id, name)` - nazwy kategorii muszą być unikalne dla danego użytkownika
- CHECK: Kategoria może być przypisana tylko do jednego budżetu (wymuszane przez aplikację i RLS)

**Indeksy:**

- PRIMARY KEY na `id` (automatyczny)
- INDEX na `user_id`
- INDEX na `budget_id`
- INDEX na `(user_id, type)`
- UNIQUE INDEX na `(user_id, name)` (automatyczny)

---

### transactions

Centralna tabela dla wszystkich operacji finansowych (wydatki, przychody, transfery).

| Kolumna         | Typ              | Ograniczenia                                        | Opis                                     |
| --------------- | ---------------- | --------------------------------------------------- | ---------------------------------------- |
| id              | UUID             | PRIMARY KEY, DEFAULT gen_random_uuid()              | Identyfikator transakcji                 |
| user_id         | UUID             | NOT NULL, REFERENCES profiles(id) ON DELETE CASCADE | Właściciel transakcji                    |
| type            | transaction_type | NOT NULL                                            | Typ transakcji (expense/income/transfer) |
| amount          | NUMERIC(10, 2)   | NOT NULL, CHECK (amount > 0)                        | Kwota transakcji                         |
| date            | DATE             | NOT NULL                                            | Data transakcji                          |
| description     | TEXT             | NULL                                                | Opis transakcji (opcjonalny)             |
| from_account_id | UUID             | NULL, REFERENCES accounts(id) ON DELETE CASCADE     | Konto źródłowe (wydatek/transfer)        |
| to_account_id   | UUID             | NULL, REFERENCES accounts(id) ON DELETE CASCADE     | Konto docelowe (przychód/transfer)       |
| category_id     | UUID             | NULL, REFERENCES categories(id) ON DELETE RESTRICT  | Kategoria (wydatek/przychód)             |
| created_at      | TIMESTAMPTZ      | NOT NULL, DEFAULT now()                             | Data utworzenia transakcji               |
| updated_at      | TIMESTAMPTZ      | NOT NULL, DEFAULT now()                             | Data ostatniej aktualizacji              |

**Ograniczenia:**

- PRIMARY KEY: `id`
- FOREIGN KEY: `user_id` REFERENCES `profiles(id)` ON DELETE CASCADE
- FOREIGN KEY: `from_account_id` REFERENCES `accounts(id)` ON DELETE CASCADE
- FOREIGN KEY: `to_account_id` REFERENCES `accounts(id)` ON DELETE CASCADE
- FOREIGN KEY: `category_id` REFERENCES `categories(id)` ON DELETE RESTRICT
- CHECK: `amount > 0`
- CHECK: Dla typu 'expense': `from_account_id IS NOT NULL AND to_account_id IS NULL AND category_id IS NOT NULL`
- CHECK: Dla typu 'income': `from_account_id IS NULL AND to_account_id IS NOT NULL AND category_id IS NOT NULL`
- CHECK: Dla typu 'transfer': `from_account_id IS NOT NULL AND to_account_id IS NOT NULL AND category_id IS NULL AND from_account_id != to_account_id`

**Indeksy:**

- PRIMARY KEY na `id` (automatyczny)
- INDEX na `user_id`
- INDEX na `from_account_id`
- INDEX na `to_account_id`
- INDEX na `category_id`
- INDEX na `(user_id, date DESC)` - dla szybkiego pobierania historii transakcji
- INDEX na `(user_id, type, date DESC)` - dla filtrowania po typie

---

## 3. Relacje między tabelami

### profiles ↔ auth.users

- **Typ**: Jeden-do-jednego
- **Opis**: Każdy profil aplikacji odpowiada jednemu użytkownikowi w systemie autentykacji Supabase
- **Implementacja**: `profiles.id` jest jednocześnie PRIMARY KEY i FOREIGN KEY do `auth.users(id)`
- **ON DELETE**: CASCADE - usunięcie użytkownika z auth.users usuwa profil i wszystkie powiązane dane

### profiles → accounts

- **Typ**: Jeden-do-wielu
- **Opis**: Użytkownik może mieć wiele kont bankowych
- **Implementacja**: `accounts.user_id` REFERENCES `profiles(id)`
- **ON DELETE**: CASCADE - usunięcie profilu usuwa wszystkie jego konta

### profiles → categories

- **Typ**: Jeden-do-wielu
- **Opis**: Użytkownik może mieć wiele kategorii
- **Implementacja**: `categories.user_id` REFERENCES `profiles(id)`
- **ON DELETE**: CASCADE - usunięcie profilu usuwa wszystkie jego kategorie

### profiles → budgets

- **Typ**: Jeden-do-wielu
- **Opis**: Użytkownik może mieć wiele budżetów
- **Implementacja**: `budgets.user_id` REFERENCES `profiles(id)`
- **ON DELETE**: CASCADE - usunięcie profilu usuwa wszystkie jego budżety

### profiles → transactions

- **Typ**: Jeden-do-wielu
- **Opis**: Użytkownik może mieć wiele transakcji
- **Implementacja**: `transactions.user_id` REFERENCES `profiles(id)`
- **ON DELETE**: CASCADE - usunięcie profilu usuwa wszystkie jego transakcje

### budgets → categories

- **Typ**: Jeden-do-wielu
- **Opis**: Budżet może mieć przypisane wiele kategorii, ale każda kategoria może należeć tylko do jednego budżetu
- **Implementacja**: `categories.budget_id` REFERENCES `budgets(id)`
- **ON DELETE**: SET NULL - usunięcie budżetu nie usuwa kategorii, tylko usuwa powiązanie

### accounts → transactions (from_account_id)

- **Typ**: Jeden-do-wielu
- **Opis**: Konto może być źródłem wielu transakcji (wydatki, transfery wychodzące)
- **Implementacja**: `transactions.from_account_id` REFERENCES `accounts(id)`
- **ON DELETE**: CASCADE - usunięcie konta usuwa wszystkie transakcje z niego wychodzące

### accounts → transactions (to_account_id)

- **Typ**: Jeden-do-wielu
- **Opis**: Konto może być celem wielu transakcji (przychody, transfery przychodzące)
- **Implementacja**: `transactions.to_account_id` REFERENCES `accounts(id)`
- **ON DELETE**: CASCADE - usunięcie konta usuwa wszystkie transakcje do niego przychodzące

### categories → transactions

- **Typ**: Jeden-do-wielu
- **Opis**: Kategoria może być przypisana do wielu transakcji
- **Implementacja**: `transactions.category_id` REFERENCES `categories(id)`
- **ON DELETE**: RESTRICT - kategorii nie można usunąć, jeśli istnieją powiązane z nią transakcje

---

## 4. Triggery i Funkcje

### Trigger: updated_at_timestamp

**Cel**: Automatyczna aktualizacja kolumny `updated_at` przy każdej modyfikacji rekordu.

**Funkcja**:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Triggery** (dla każdej tabeli):

```sql
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Trigger: create_default_categories

**Cel**: Automatyczne tworzenie domyślnego zestawu kategorii dla nowego użytkownika przy rejestracji.

**Funkcja**:

```sql
CREATE OR REPLACE FUNCTION create_default_categories_for_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Kategorie wydatków
    INSERT INTO categories (user_id, name, type) VALUES
        (NEW.id, 'Żywność', 'expense'),
        (NEW.id, 'Transport', 'expense'),
        (NEW.id, 'Mieszkanie', 'expense'),
        (NEW.id, 'Rozrywka', 'expense'),
        (NEW.id, 'Zdrowie', 'expense'),
        (NEW.id, 'Ubrania', 'expense'),
        (NEW.id, 'Edukacja', 'expense'),
        (NEW.id, 'Inne wydatki', 'expense'),

    -- Kategorie przychodów
        (NEW.id, 'Wynagrodzenie', 'income'),
        (NEW.id, 'Freelance', 'income'),
        (NEW.id, 'Inwestycje', 'income'),
        (NEW.id, 'Inne przychody', 'income');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Trigger**:

```sql
CREATE TRIGGER create_default_categories_trigger
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_default_categories_for_user();
```

### Trigger: create_profile_for_user

**Cel**: Automatyczne tworzenie profilu w tabeli `profiles` po utworzeniu użytkownika w `auth.users`.

**Funkcja**:

```sql
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Trigger**:

```sql
CREATE TRIGGER create_profile_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_profile_for_new_user();
```

---

## 5. Row Level Security (RLS) Policies

### Włączenie RLS dla wszystkich tabel

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
```

### Polityki dla tabeli `profiles`

**SELECT**:

```sql
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);
```

**INSERT**:

```sql
CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);
```

**UPDATE**:

```sql
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
```

**DELETE**:

```sql
CREATE POLICY "Users can delete their own profile"
    ON profiles FOR DELETE
    USING (auth.uid() = id);
```

### Polityki dla tabeli `accounts`

**SELECT**:

```sql
CREATE POLICY "Users can view their own accounts"
    ON accounts FOR SELECT
    USING (auth.uid() = user_id);
```

**INSERT**:

```sql
CREATE POLICY "Users can insert their own accounts"
    ON accounts FOR INSERT
    WITH CHECK (auth.uid() = user_id);
```

**UPDATE**:

```sql
CREATE POLICY "Users can update their own accounts"
    ON accounts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

**DELETE**:

```sql
CREATE POLICY "Users can delete their own accounts"
    ON accounts FOR DELETE
    USING (auth.uid() = user_id);
```

### Polityki dla tabeli `categories`

**SELECT**:

```sql
CREATE POLICY "Users can view their own categories"
    ON categories FOR SELECT
    USING (auth.uid() = user_id);
```

**INSERT**:

```sql
CREATE POLICY "Users can insert their own categories"
    ON categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);
```

**UPDATE**:

```sql
CREATE POLICY "Users can update their own categories"
    ON categories FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

**DELETE**:

```sql
CREATE POLICY "Users can delete their own categories"
    ON categories FOR DELETE
    USING (auth.uid() = user_id);
```

### Polityki dla tabeli `budgets`

**SELECT**:

```sql
CREATE POLICY "Users can view their own budgets"
    ON budgets FOR SELECT
    USING (auth.uid() = user_id);
```

**INSERT**:

```sql
CREATE POLICY "Users can insert their own budgets"
    ON budgets FOR INSERT
    WITH CHECK (auth.uid() = user_id);
```

**UPDATE**:

```sql
CREATE POLICY "Users can update their own budgets"
    ON budgets FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

**DELETE**:

```sql
CREATE POLICY "Users can delete their own budgets"
    ON budgets FOR DELETE
    USING (auth.uid() = user_id);
```

### Polityki dla tabeli `transactions`

**SELECT**:

```sql
CREATE POLICY "Users can view their own transactions"
    ON transactions FOR SELECT
    USING (auth.uid() = user_id);
```

**INSERT**:

```sql
CREATE POLICY "Users can insert their own transactions"
    ON transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);
```

**UPDATE**:

```sql
CREATE POLICY "Users can update their own transactions"
    ON transactions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

**DELETE**:

```sql
CREATE POLICY "Users can delete their own transactions"
    ON transactions FOR DELETE
    USING (auth.uid() = user_id);
```

---

## 6. Widoki (Views)

### account_balances

**Cel**: Dynamiczne obliczanie aktualnego salda każdego konta.

```sql
CREATE OR REPLACE VIEW account_balances AS
SELECT
    a.id AS account_id,
    a.user_id,
    a.name AS account_name,
    a.initial_balance,
    a.currency,
    COALESCE(
        a.initial_balance
        + COALESCE(SUM(CASE WHEN t.to_account_id = a.id THEN t.amount ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN t.from_account_id = a.id THEN t.amount ELSE 0 END), 0),
        a.initial_balance
    ) AS current_balance
FROM accounts a
LEFT JOIN transactions t ON (t.to_account_id = a.id OR t.from_account_id = a.id)
GROUP BY a.id, a.user_id, a.name, a.initial_balance, a.currency;
```

### budget_progress

**Cel**: Obliczanie postępu realizacji budżetów (suma wydatków vs kwota budżetu).

```sql
CREATE OR REPLACE VIEW budget_progress AS
SELECT
    b.id AS budget_id,
    b.user_id,
    b.name AS budget_name,
    b.amount AS budget_amount,
    b.month,
    b.year,
    b.created_at,
    COALESCE(SUM(t.amount), 0) AS spent_amount,
    b.amount - COALESCE(SUM(t.amount), 0) AS remaining_amount,
    CASE
        WHEN b.amount > 0 THEN (COALESCE(SUM(t.amount), 0) / b.amount * 100)
        ELSE 0
    END AS percentage_used,
    COALESCE(
        (SELECT array_agg(c.id)
         FROM categories c
         WHERE c.budget_id = b.id),
        '{}'::uuid[]
    ) AS category_ids
FROM budgets b
LEFT JOIN categories c ON c.budget_id = b.id
LEFT JOIN transactions t ON t.category_id = c.id
    AND t.type = 'expense'
    AND EXTRACT(YEAR FROM t.date) = b.year
    AND EXTRACT(MONTH FROM t.date) = b.month
GROUP BY b.id, b.user_id, b.name, b.amount, b.month, b.year, b.created_at;
```

---

## 7. Funkcje pomocnicze

### get_account_balance(account_id UUID, as_of_date DATE)

**Cel**: Pobranie salda konta na określony dzień.

```sql
CREATE OR REPLACE FUNCTION get_account_balance(
    p_account_id UUID,
    p_as_of_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC(10, 2) AS $$
DECLARE
    v_balance NUMERIC(10, 2);
BEGIN
    SELECT
        a.initial_balance
        + COALESCE(SUM(CASE WHEN t.to_account_id = a.id THEN t.amount ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN t.from_account_id = a.id THEN t.amount ELSE 0 END), 0)
    INTO v_balance
    FROM accounts a
    LEFT JOIN transactions t ON (t.to_account_id = a.id OR t.from_account_id = a.id)
        AND t.date <= p_as_of_date
    WHERE a.id = p_account_id
    GROUP BY a.id, a.initial_balance;

    RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

---

## 8. Dodatkowe uwagi i wyjaśnienia

### Decyzje projektowe

1. **Typy ENUM vs CHECK constraints**: Wybrano typy ENUM dla `transaction_type` i `category_type`, ponieważ zapewniają lepszą czytelność kodu, wydajność i integralność danych na poziomie bazy danych.

2. **Jedna tabela dla wszystkich transakcji**: Zamiast oddzielnych tabel dla wydatków, przychodów i transferów, zastosowano pojedynczą tabelę `transactions` z kolumną `type`. To rozwiązanie upraszcza schemat i ułatwia zapytania o historię wszystkich operacji finansowych.

3. **Opcjonalne klucze obce w transactions**: Pola `from_account_id`, `to_account_id` i `category_id` są opcjonalne (NULL), a ich wymagalność jest egzekwowana przez CHECK constraints w zależności od typu transakcji. To zapewnia elastyczność przy zachowaniu integralności danych.

4. **ON DELETE CASCADE vs RESTRICT**:
   - CASCADE dla relacji user → dane: Usunięcie użytkownika usuwa wszystkie jego dane
   - CASCADE dla relacji account → transactions: Usunięcie konta usuwa powiązane transakcje (zgodnie z PRD)
   - RESTRICT dla relacji category → transactions: Kategorii nie można usunąć, jeśli są z nią powiązane transakcje (ochrona danych historycznych)
   - SET NULL dla relacji budget → categories: Usunięcie budżetu nie usuwa kategorii, tylko usuwa powiązanie

5. **Budżety jako osobne wpisy**: Każdy budżet jest traktowany jako osobny, jednorazowy wpis dla konkretnego miesiąca i roku. Funkcja kopiowania budżetu z miesiąca na miesiąc będzie zaimplementowana po stronie aplikacji. Użycie dwóch osobnych kolumn `month` i `year` zamiast jednej kolumny `DATE` zapewnia lepszą czytelność, wydajność zapytań i intuicyjność dla użytkownika.

6. **Dynamiczne obliczanie salda**: Saldo konta jest obliczane dynamicznie na podstawie `initial_balance` i historii transakcji. To zapewnia 100% spójności danych, co jest kluczowe dla MVP. Dla lepszej wydajności utworzono widok `account_balances`.

7. **Kolumna currency**: Mimo że MVP obsługuje tylko PLN, kolumna `currency` została dodana do tabeli `accounts`, aby przygotować schemat na przyszły rozwój (obsługa wielu walut).

8. **Timestamptz dla dat**: Wszystkie znaczniki czasu używają typu `TIMESTAMPTZ` (timestamp with time zone) do poprawnej obsługi stref czasowych. Kolumna `date` w transakcjach używa typu `DATE`, ponieważ strefa czasowa nie jest tu istotna.

9. **Row Level Security**: RLS jest głównym mechanizmem izolacji danych użytkowników. Wszystkie polityki opierają się na porównaniu `auth.uid()` z kolumną `user_id`, co zapewnia, że użytkownik ma dostęp tylko do swoich danych.

10. **Automatyczne kategorie**: Funkcja `create_default_categories_for_user()` tworzy predefiniowany zestaw kategorii dla każdego nowego użytkownika. Lista kategorii jest zdefiniowana "na sztywno" w ciele funkcji, co ułatwia zarządzanie i aktualizację.

11. **Unikalne nazwy**: Nazwy kont i kategorii muszą być unikalne w ramach jednego użytkownika (UNIQUE constraint na `(user_id, name)`). To zapobiega pomyłkom i poprawia UX.

### Normalizacja

Schemat jest znormalizowany do 3NF (Third Normal Form):

- Każda tabela ma jasno zdefiniowany klucz główny
- Nie ma powtarzających się grup danych
- Wszystkie atrybuty niebędące kluczami są w pełni zależne od klucza głównego
- Nie ma zależności przechodnich między atrybutami

### Wydajność

Podstawowe indeksy zostały zaimplementowane od początku:

- Indeksy na kluczach obcych (`user_id`, `account_id`, `category_id`, `budget_id`)
- Indeksy na kolumnach używanych często w klauzuli WHERE i ORDER BY (np. `date`)
- Złożone indeksy dla typowych zapytań (np. `(user_id, date DESC)`)

### Skalowalność

Schemat jest przygotowany na przyszły rozwój:

- Kolumna `currency` w tabeli `accounts` (obsługa wielu walut)
- Typ `NUMERIC(10, 2)` dla kwot pieniężnych (precyzja do 10 cyfr, 2 miejsca po przecinku)
- Typ `TIMESTAMPTZ` dla znaczników czasu (obsługa stref czasowych)
- Widoki i funkcje pomocnicze ułatwiające rozszerzanie funkcjonalności

### Bezpieczeństwo

- Row Level Security (RLS) na wszystkich tabelach z danymi użytkowników
- Polityki RLS oparte na `auth.uid()` zapewniają pełną izolację danych
- Funkcja `SECURITY DEFINER` dla triggerów systemowych (np. tworzenie profilu)
- Kaskadowe usuwanie danych po usunięciu użytkownika (zgodność z RODO)
