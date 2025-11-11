-- migration: create indexes
-- purpose: create indexes for better query performance
-- affected tables: accounts, categories, budgets, transactions
-- special considerations: indexes are created for foreign keys and frequently queried columns

-- =============================================================================
-- indexes for accounts table
-- =============================================================================

-- index for querying accounts by user
create index accounts_user_id_idx on accounts(user_id);

comment on index accounts_user_id_idx is 'Index for querying accounts by user_id';

-- =============================================================================
-- indexes for budgets table
-- =============================================================================

-- index for querying budgets by user
create index budgets_user_id_idx on budgets(user_id);

-- index for querying budgets by user, year, and month
create index budgets_user_year_month_idx on budgets(user_id, year, month);

comment on index budgets_user_id_idx is 'Index for querying budgets by user_id';
comment on index budgets_user_year_month_idx is 'Index for querying budgets by user_id, year, and month';

-- =============================================================================
-- indexes for categories table
-- =============================================================================

-- index for querying categories by user
create index categories_user_id_idx on categories(user_id);

-- index for querying categories by budget
create index categories_budget_id_idx on categories(budget_id);

-- index for querying categories by user and type
create index categories_user_type_idx on categories(user_id, type);

comment on index categories_user_id_idx is 'Index for querying categories by user_id';
comment on index categories_budget_id_idx is 'Index for querying categories by budget_id';
comment on index categories_user_type_idx is 'Index for querying categories by user_id and type';

-- =============================================================================
-- indexes for transactions table
-- =============================================================================

-- index for querying transactions by user
create index transactions_user_id_idx on transactions(user_id);

-- index for querying transactions by source account
create index transactions_from_account_id_idx on transactions(from_account_id);

-- index for querying transactions by destination account
create index transactions_to_account_id_idx on transactions(to_account_id);

-- index for querying transactions by category
create index transactions_category_id_idx on transactions(category_id);

-- composite index for querying transaction history by user and date (descending order for recent transactions first)
create index transactions_user_date_desc_idx on transactions(user_id, date desc);

-- composite index for querying transactions by user, type, and date (descending)
create index transactions_user_type_date_desc_idx on transactions(user_id, type, date desc);

comment on index transactions_user_id_idx is 'Index for querying transactions by user_id';
comment on index transactions_from_account_id_idx is 'Index for querying transactions by from_account_id';
comment on index transactions_to_account_id_idx is 'Index for querying transactions by to_account_id';
comment on index transactions_category_id_idx is 'Index for querying transactions by category_id';
comment on index transactions_user_date_desc_idx is 'Index for querying transaction history by user_id and date (recent first)';
comment on index transactions_user_type_date_desc_idx is 'Index for filtering transactions by user_id, type, and date (recent first)';

