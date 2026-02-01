-- rollback migration: remove ai_insights table
-- purpose: revert changes from create_ai_insights_table migration
-- affected tables: ai_insights (dropped)

-- drop policies first
drop policy if exists "Users can delete their own insights" on ai_insights;
drop policy if exists "Users can update their own insights" on ai_insights;
drop policy if exists "Users can insert their own insights" on ai_insights;
drop policy if exists "Users can view their own insights" on ai_insights;

-- drop indexes (GIN index will be dropped automatically with table)
-- but we list it here for documentation
-- drop index if exists idx_ai_insights_data;

-- drop table (cascades to indexes and constraints)
drop table if exists ai_insights;
