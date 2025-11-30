-- migration: create triggers and functions
-- purpose: create helper functions and triggers for automatic data management
-- affected tables: profiles, accounts, categories, budgets, transactions, auth.users
-- special considerations: includes security definer functions for system operations

-- =============================================================================
-- function: update_updated_at_column
-- purpose: automatically update the updated_at timestamp when a row is modified
-- =============================================================================

create or replace function update_updated_at_column()
returns trigger as $$
begin
    -- set the updated_at column to the current timestamp
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

comment on function update_updated_at_column is 'Automatically updates the updated_at column to now() when a row is modified';

-- =============================================================================
-- triggers: apply update_updated_at_column to all tables with updated_at column
-- =============================================================================

-- trigger for profiles table
create trigger update_profiles_updated_at 
    before update on profiles
    for each row 
    execute function update_updated_at_column();

-- trigger for accounts table
create trigger update_accounts_updated_at 
    before update on accounts
    for each row 
    execute function update_updated_at_column();

-- trigger for categories table
create trigger update_categories_updated_at 
    before update on categories
    for each row 
    execute function update_updated_at_column();

-- trigger for budgets table
create trigger update_budgets_updated_at 
    before update on budgets
    for each row 
    execute function update_updated_at_column();

-- trigger for transactions table
create trigger update_transactions_updated_at 
    before update on transactions
    for each row 
    execute function update_updated_at_column();

-- =============================================================================
-- function: create_profile_for_new_user
-- purpose: automatically create a profile when a new user signs up
-- security: security definer allows the function to insert into profiles table
-- =============================================================================

create or replace function create_profile_for_new_user()
returns trigger as $$
begin
    -- create a profile for the new user
    -- the profile id matches the auth.users id (1-to-1 relationship)
    insert into public.profiles (id)
    values (new.id);
    return new;
end;
$$ language plpgsql security definer;

comment on function create_profile_for_new_user is 'Automatically creates a profile in the profiles table when a new user signs up';

-- trigger: create profile when a new user is inserted into auth.users
create trigger create_profile_on_signup
    after insert on auth.users
    for each row
    execute function public.create_profile_for_new_user();

-- =============================================================================
-- function: create_default_categories_for_user
-- purpose: automatically create a default set of categories for new users
-- =============================================================================

create or replace function create_default_categories_for_user()
returns trigger as $$
begin
    -- insert default expense categories
    insert into public.categories (user_id, name, type) values
        (new.id, 'Żywność', 'expense'),
        (new.id, 'Transport', 'expense'),
        (new.id, 'Mieszkanie', 'expense'),
        (new.id, 'Rozrywka', 'expense'),
        (new.id, 'Zdrowie', 'expense'),
        (new.id, 'Ubrania', 'expense'),
        (new.id, 'Edukacja', 'expense'),
        (new.id, 'Inne wydatki', 'expense'),
        
    -- insert default income categories
        (new.id, 'Wynagrodzenie', 'income'),
        (new.id, 'Freelance', 'income'),
        (new.id, 'Inwestycje', 'income'),
        (new.id, 'Inne przychody', 'income');
    
    return new;
end;
$$ language plpgsql;

comment on function create_default_categories_for_user is 'Automatically creates a default set of expense and income categories when a new profile is created';

-- trigger: create default categories when a new profile is inserted
create trigger create_default_categories_trigger
    after insert on public.profiles
    for each row
    execute function public.create_default_categories_for_user();

