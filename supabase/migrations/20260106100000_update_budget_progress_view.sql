-- Update budget_progress view to include created_at and category_ids
-- This avoids the need for joins in the API which were causing relationship errors

DROP VIEW IF EXISTS budget_progress;

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
