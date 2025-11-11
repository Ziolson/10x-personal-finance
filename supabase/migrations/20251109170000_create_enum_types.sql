-- migration: create enum types
-- purpose: create custom enum types for transaction_type and category_type
-- affected tables: transactions, categories
-- special considerations: these enums must be created before the tables that use them

-- create enum type for transaction types
-- this enum defines the three types of financial operations supported by the application:
-- - expense: money going out from an account
-- - income: money coming into an account
-- - transfer: money moving between two accounts
create type transaction_type as enum ('expense', 'income', 'transfer');

-- create enum type for category types
-- this enum defines the two types of categories:
-- - expense: category for expenses
-- - income: category for income
-- note: transfers do not have categories
create type category_type as enum ('expense', 'income');

