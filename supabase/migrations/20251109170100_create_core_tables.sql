-- migration: create core tables
-- purpose: create the main tables for the application (profiles, accounts, categories, budgets, transactions)
-- affected tables: profiles, accounts, categories, budgets, transactions
-- special considerations: RLS will be enabled in a separate migration

-- =============================================================================
-- table: profiles
-- purpose: main user profile table, 1-to-1 relationship with auth.users
-- =============================================================================
create table profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- enable row level security for profiles table
-- policies will be defined in a separate migration
alter table profiles enable row level security;

-- add comment to the table
comment on table profiles is 'User profiles, 1-to-1 relationship with auth.users';

-- =============================================================================
-- table: accounts
-- purpose: user bank accounts
-- =============================================================================
create table accounts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id) on delete cascade,
    name varchar(255) not null,
    initial_balance numeric(10, 2) not null check (initial_balance >= 0),
    currency varchar(3) not null default 'PLN',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    -- ensure account names are unique per user
    constraint accounts_user_name_unique unique (user_id, name)
);

-- enable row level security for accounts table
-- policies will be defined in a separate migration
alter table accounts enable row level security;

-- add comments
comment on table accounts is 'User bank accounts with initial balance';
comment on column accounts.initial_balance is 'Starting balance of the account (must be >= 0)';
comment on column accounts.currency is 'Account currency (currently only PLN supported, prepared for future multi-currency support)';

-- =============================================================================
-- table: budgets
-- purpose: monthly budgets for users
-- =============================================================================
create table budgets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id) on delete cascade,
    name varchar(255) not null,
    amount numeric(10, 2) not null check (amount > 0),
    month integer not null check (month >= 1 and month <= 12),
    year integer not null check (year >= 2000 and year <= 2100),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    -- ensure budget names are unique per user per month/year
    constraint budgets_user_name_month_year_unique unique (user_id, name, month, year)
);

-- enable row level security for budgets table
-- policies will be defined in a separate migration
alter table budgets enable row level security;

-- add comments
comment on table budgets is 'Monthly budgets for expense tracking';
comment on column budgets.month is 'Budget month (1-12)';
comment on column budgets.year is 'Budget year (2000-2100)';
comment on column budgets.amount is 'Budget amount (must be > 0)';

-- =============================================================================
-- table: categories
-- purpose: expense and income categories
-- =============================================================================
create table categories (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id) on delete cascade,
    name varchar(255) not null,
    type category_type not null,
    budget_id uuid null references budgets(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    -- ensure category names are unique per user
    constraint categories_user_name_unique unique (user_id, name)
);

-- enable row level security for categories table
-- policies will be defined in a separate migration
alter table categories enable row level security;

-- add comments
comment on table categories is 'Expense and income categories, optionally linked to budgets';
comment on column categories.type is 'Category type: expense or income';
comment on column categories.budget_id is 'Optional link to budget (null means not assigned to any budget)';

-- =============================================================================
-- table: transactions
-- purpose: all financial operations (expenses, income, transfers)
-- =============================================================================
create table transactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id) on delete cascade,
    type transaction_type not null,
    amount numeric(10, 2) not null check (amount > 0),
    date date not null,
    description text null,
    from_account_id uuid null references accounts(id) on delete cascade,
    to_account_id uuid null references accounts(id) on delete cascade,
    category_id uuid null references categories(id) on delete restrict,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    -- constraint: for expense type, from_account_id must be set, to_account_id must be null, category_id must be set
    constraint expense_transaction_check check (
        type != 'expense' or (
            from_account_id is not null and 
            to_account_id is null and 
            category_id is not null
        )
    ),
    
    -- constraint: for income type, from_account_id must be null, to_account_id must be set, category_id must be set
    constraint income_transaction_check check (
        type != 'income' or (
            from_account_id is null and 
            to_account_id is not null and 
            category_id is not null
        )
    ),
    
    -- constraint: for transfer type, both accounts must be set, category_id must be null, and accounts must be different
    constraint transfer_transaction_check check (
        type != 'transfer' or (
            from_account_id is not null and 
            to_account_id is not null and 
            category_id is null and 
            from_account_id != to_account_id
        )
    )
);

-- enable row level security for transactions table
-- policies will be defined in a separate migration
alter table transactions enable row level security;

-- add comments
comment on table transactions is 'All financial transactions: expenses, income, and transfers';
comment on column transactions.type is 'Transaction type: expense, income, or transfer';
comment on column transactions.amount is 'Transaction amount (must be > 0)';
comment on column transactions.date is 'Transaction date (date only, no time zone)';
comment on column transactions.from_account_id is 'Source account (for expenses and transfers)';
comment on column transactions.to_account_id is 'Destination account (for income and transfers)';
comment on column transactions.category_id is 'Category (for expenses and income only, null for transfers)';

