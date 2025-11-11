-- migration: create row level security policies
-- purpose: implement RLS policies to ensure users can only access their own data
-- affected tables: profiles, accounts, categories, budgets, transactions
-- special considerations: all policies use auth.uid() to verify user identity

-- note: RLS is already enabled on all tables in the create_core_tables migration
-- this migration only creates the policies

-- =============================================================================
-- rls policies for profiles table
-- =============================================================================

-- policy: users can view their own profile
create policy "Users can view their own profile"
    on profiles for select
    to authenticated
    using (auth.uid() = id);

-- policy: users can insert their own profile
create policy "Users can insert their own profile"
    on profiles for insert
    to authenticated
    with check (auth.uid() = id);

-- policy: users can update their own profile
create policy "Users can update their own profile"
    on profiles for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- policy: users can delete their own profile
create policy "Users can delete their own profile"
    on profiles for delete
    to authenticated
    using (auth.uid() = id);

-- =============================================================================
-- rls policies for accounts table
-- =============================================================================

-- policy: users can view their own accounts
create policy "Users can view their own accounts"
    on accounts for select
    to authenticated
    using (auth.uid() = user_id);

-- policy: users can insert their own accounts
create policy "Users can insert their own accounts"
    on accounts for insert
    to authenticated
    with check (auth.uid() = user_id);

-- policy: users can update their own accounts
create policy "Users can update their own accounts"
    on accounts for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- policy: users can delete their own accounts
create policy "Users can delete their own accounts"
    on accounts for delete
    to authenticated
    using (auth.uid() = user_id);

-- =============================================================================
-- rls policies for categories table
-- =============================================================================

-- policy: users can view their own categories
create policy "Users can view their own categories"
    on categories for select
    to authenticated
    using (auth.uid() = user_id);

-- policy: users can insert their own categories
create policy "Users can insert their own categories"
    on categories for insert
    to authenticated
    with check (auth.uid() = user_id);

-- policy: users can update their own categories
create policy "Users can update their own categories"
    on categories for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- policy: users can delete their own categories
create policy "Users can delete their own categories"
    on categories for delete
    to authenticated
    using (auth.uid() = user_id);

-- =============================================================================
-- rls policies for budgets table
-- =============================================================================

-- policy: users can view their own budgets
create policy "Users can view their own budgets"
    on budgets for select
    to authenticated
    using (auth.uid() = user_id);

-- policy: users can insert their own budgets
create policy "Users can insert their own budgets"
    on budgets for insert
    to authenticated
    with check (auth.uid() = user_id);

-- policy: users can update their own budgets
create policy "Users can update their own budgets"
    on budgets for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- policy: users can delete their own budgets
create policy "Users can delete their own budgets"
    on budgets for delete
    to authenticated
    using (auth.uid() = user_id);

-- =============================================================================
-- rls policies for transactions table
-- =============================================================================

-- policy: users can view their own transactions
create policy "Users can view their own transactions"
    on transactions for select
    to authenticated
    using (auth.uid() = user_id);

-- policy: users can insert their own transactions
create policy "Users can insert their own transactions"
    on transactions for insert
    to authenticated
    with check (auth.uid() = user_id);

-- policy: users can update their own transactions
create policy "Users can update their own transactions"
    on transactions for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- policy: users can delete their own transactions
create policy "Users can delete their own transactions"
    on transactions for delete
    to authenticated
    using (auth.uid() = user_id);

