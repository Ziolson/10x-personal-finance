-- migration: create ai_insights table
-- purpose: add support for AI-powered savings recommendations
-- affected tables: ai_insights (new)
-- special considerations: 
--   - uses JSONB for storing full AI response
--   - one active insight per user (UNIQUE constraint)
--   - no updated_at column (cache is always fully replaced via upsert)

-- =============================================================================
-- table: ai_insights
-- purpose: cache AI-generated savings recommendations
-- =============================================================================
create table ai_insights (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id) on delete cascade,
    data jsonb not null,
    generated_at timestamptz not null default now(),
    months_analyzed integer not null check (months_analyzed in (1, 2, 3)),
    
    -- ensure one active insight per user
    constraint ai_insights_user_id_unique unique (user_id)
);

-- enable row level security
-- policies will be defined below
alter table ai_insights enable row level security;

-- add comments
comment on table ai_insights is 'AI-generated savings recommendations (cached responses from OpenAI API)';
comment on column ai_insights.data is 'Full AIInsightsSummary structure as JSONB';
comment on column ai_insights.generated_at is 'Timestamp when the AI analysis was generated';
comment on column ai_insights.months_analyzed is 'Number of months analyzed (1, 2, or 3)';

-- =============================================================================
-- indexes
-- =============================================================================

-- index on user_id (for fast lookups) - automatically created by UNIQUE constraint
-- note: unique constraint on user_id creates implicit index

-- gin index for jsonb queries (optional, for future use)
create index idx_ai_insights_data on ai_insights using gin(data);

comment on index idx_ai_insights_data is 'GIN index for JSONB queries on AI insights data';

-- =============================================================================
-- row level security policies
-- =============================================================================

-- policy: users can view their own insights
create policy "Users can view their own insights"
    on ai_insights for select
    to authenticated
    using (auth.uid() = user_id);

-- policy: users can insert their own insights
create policy "Users can insert their own insights"
    on ai_insights for insert
    to authenticated
    with check (auth.uid() = user_id);

-- policy: users can update their own insights
create policy "Users can update their own insights"
    on ai_insights for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- policy: users can delete their own insights
create policy "Users can delete their own insights"
    on ai_insights for delete
    to authenticated
    using (auth.uid() = user_id);
