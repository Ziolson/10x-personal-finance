-- migration: create views and helper functions
-- purpose: create views for account balances and budget progress, plus helper functions
-- affected tables: accounts, transactions, budgets, categories
-- special considerations: views provide computed data based on current state

-- =============================================================================
-- view: account_balances
-- purpose: dynamically calculate the current balance of each account
-- =============================================================================

create or replace view account_balances as
select 
    a.id as account_id,
    a.user_id,
    a.name as account_name,
    a.initial_balance,
    a.currency,
    -- calculate current balance by:
    -- 1. starting with initial_balance
    -- 2. adding all incoming transactions (where this account is the destination)
    -- 3. subtracting all outgoing transactions (where this account is the source)
    coalesce(
        a.initial_balance 
        + coalesce(sum(case when t.to_account_id = a.id then t.amount else 0 end), 0)
        - coalesce(sum(case when t.from_account_id = a.id then t.amount else 0 end), 0),
        a.initial_balance
    ) as current_balance
from accounts a
left join transactions t on (t.to_account_id = a.id or t.from_account_id = a.id)
group by a.id, a.user_id, a.name, a.initial_balance, a.currency;

comment on view account_balances is 'Dynamically calculated current balance for each account';

-- =============================================================================
-- view: budget_progress
-- purpose: calculate the progress of each budget (spent vs. allocated amount)
-- =============================================================================

create or replace view budget_progress as
select 
    b.id as budget_id,
    b.user_id,
    b.name as budget_name,
    b.amount as budget_amount,
    b.month,
    b.year,
    -- sum of all expenses in categories linked to this budget for the specific month/year
    coalesce(sum(t.amount), 0) as spent_amount,
    -- remaining budget amount
    b.amount - coalesce(sum(t.amount), 0) as remaining_amount,
    -- percentage of budget used (0-100+)
    case 
        when b.amount > 0 then (coalesce(sum(t.amount), 0) / b.amount * 100)
        else 0 
    end as percentage_used
from budgets b
left join categories c on c.budget_id = b.id
left join transactions t on t.category_id = c.id 
    and t.type = 'expense'
    and extract(year from t.date) = b.year
    and extract(month from t.date) = b.month
group by b.id, b.user_id, b.name, b.amount, b.month, b.year;

comment on view budget_progress is 'Budget progress tracking: shows spent amount, remaining amount, and percentage used';

-- =============================================================================
-- function: get_account_balance
-- purpose: get the balance of an account as of a specific date
-- parameters:
--   - p_account_id: the account id
--   - p_as_of_date: the date to calculate balance for (defaults to current date)
-- returns: the account balance as of the specified date
-- =============================================================================

create or replace function get_account_balance(
    p_account_id uuid,
    p_as_of_date date default current_date
)
returns numeric(10, 2) as $$
declare
    v_balance numeric(10, 2);
begin
    -- calculate balance by:
    -- 1. starting with initial_balance
    -- 2. adding all incoming transactions up to p_as_of_date
    -- 3. subtracting all outgoing transactions up to p_as_of_date
    select 
        a.initial_balance 
        + coalesce(sum(case when t.to_account_id = a.id then t.amount else 0 end), 0)
        - coalesce(sum(case when t.from_account_id = a.id then t.amount else 0 end), 0)
    into v_balance
    from accounts a
    left join transactions t on (t.to_account_id = a.id or t.from_account_id = a.id)
        and t.date <= p_as_of_date
    where a.id = p_account_id
    group by a.id, a.initial_balance;
    
    -- return 0 if account not found or has no balance
    return coalesce(v_balance, 0);
end;
$$ language plpgsql stable security definer;

comment on function get_account_balance is 'Returns the balance of an account as of a specific date (defaults to current date)';

