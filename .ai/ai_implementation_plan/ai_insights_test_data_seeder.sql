-- AI Insights Test Data Seeder
-- Run this in Supabase SQL Editor after creating a test user

-- STEP 1: Get your test user ID
-- Replace 'YOUR_EMAIL_HERE' with your test user email
DO $$
DECLARE
  test_user_id uuid;
  test_account_id uuid;
  cat_groceries_id uuid;
  cat_transport_id uuid;
  cat_entertainment_id uuid;
  cat_utilities_id uuid;
BEGIN
  -- Get user ID from auth.users by email
  SELECT id INTO test_user_id 
  FROM auth.users 
  WHERE email = 'example@test.com'
  LIMIT 1;

  IF test_user_id IS NULL THEN
    RAISE NOTICE 'No test user found with email: example@test.com';
    RETURN;
  END IF;

  RAISE NOTICE 'Found test user: %', test_user_id;

  -- STEP 2: Create test account (if not exists)
  INSERT INTO accounts (user_id, name, initial_balance, currency)
  VALUES (test_user_id, 'Konto testowe oszczędnościowe', 15000, 'PLN')
  ON CONFLICT (user_id, name) DO NOTHING
  RETURNING id INTO test_account_id;

  IF test_account_id IS NULL THEN
    SELECT id INTO test_account_id 
    FROM accounts 
    WHERE user_id = test_user_id 
    LIMIT 1;
  END IF;

  RAISE NOTICE 'Using account: %', test_account_id;

  -- STEP 3: Create expense categories (if not exist)
  INSERT INTO categories (user_id, name, type)
  VALUES (test_user_id, 'Żywność', 'expense')
  ON CONFLICT (user_id, name) DO NOTHING
  RETURNING id INTO cat_groceries_id;

  INSERT INTO categories (user_id, name, type)
  VALUES (test_user_id, 'Transport', 'expense')
  ON CONFLICT (user_id, name) DO NOTHING
  RETURNING id INTO cat_transport_id;

  INSERT INTO categories (user_id, name, type)
  VALUES (test_user_id, 'Rozrywka', 'expense')
  ON CONFLICT (user_id, name) DO NOTHING
  RETURNING id INTO cat_entertainment_id;

  INSERT INTO categories (user_id, name, type)
  VALUES (test_user_id, 'Mieszkanie', 'expense')
  ON CONFLICT (user_id, name) DO NOTHING
  RETURNING id INTO cat_utilities_id;

  -- Get category IDs if they already existed
  IF cat_groceries_id IS NULL THEN
    SELECT id INTO cat_groceries_id FROM categories WHERE user_id = test_user_id AND name = 'Żywność';
  END IF;
  IF cat_transport_id IS NULL THEN
    SELECT id INTO cat_transport_id FROM categories WHERE user_id = test_user_id AND name = 'Transport';
  END IF;
  IF cat_entertainment_id IS NULL THEN
    SELECT id INTO cat_entertainment_id FROM categories WHERE user_id = test_user_id AND name = 'Rozrywka';
  END IF;
  IF cat_utilities_id IS NULL THEN
    SELECT id INTO cat_utilities_id FROM categories WHERE user_id = test_user_id AND name = 'Mieszkanie';
  END IF;

  RAISE NOTICE 'Categories created/found';

  -- STEP 4: Create test transactions (60 days of data)
  -- Delete old test transactions first
  DELETE FROM transactions 
  WHERE user_id = test_user_id 
  AND description LIKE 'Transakcja testowa%';

  -- Generate varied spending patterns
  -- Żywność: 8-12 transactions/month, 80-150 PLN each
  INSERT INTO transactions (user_id, type, amount, date, from_account_id, category_id, description)
  SELECT 
    test_user_id,
    'expense',
    (80 + random() * 70)::numeric(10,2),
    current_date - (random() * 60)::int,
    test_account_id,
    cat_groceries_id,
    'Transakcja testowa - Zakupy spożywcze #' || generate_series
  FROM generate_series(1, 20);

  -- Transport: 15-20 transactions/month, 10-50 PLN each
  INSERT INTO transactions (user_id, type, amount, date, from_account_id, category_id, description)
  SELECT 
    test_user_id,
    'expense',
    (10 + random() * 40)::numeric(10,2),
    current_date - (random() * 60)::int,
    test_account_id,
    cat_transport_id,
    'Transakcja testowa - Autobus/Metro #' || generate_series
  FROM generate_series(1, 30);

  -- Rozrywka: 4-6 transactions/month, 50-200 PLN each
  INSERT INTO transactions (user_id, type, amount, date, from_account_id, category_id, description)
  SELECT 
    test_user_id,
    'expense',
    (50 + random() * 150)::numeric(10,2),
    current_date - (random() * 60)::int,
    test_account_id,
    cat_entertainment_id,
    'Transakcja testowa - Kino/Restauracja #' || generate_series
  FROM generate_series(1, 10);

  -- Mieszkanie: 2-3 transactions/month, 150-300 PLN each
  INSERT INTO transactions (user_id, type, amount, date, from_account_id, category_id, description)
  SELECT 
    test_user_id,
    'expense',
    (150 + random() * 150)::numeric(10,2),
    current_date - (random() * 30 + 30)::int, -- Spread over last 2 months
    test_account_id,
    cat_utilities_id,
    'Transakcja testowa - Opłata za rachunki #' || generate_series
  FROM generate_series(1, 4);

  RAISE NOTICE '✅ Pomyślnie utworzono 64 transakcje testowe!';
  RAISE NOTICE '📊 Podsumowanie:';
  RAISE NOTICE '   - Żywność: ~20 transakcji (~1600-2400 PLN/miesiąc)';
  RAISE NOTICE '   - Transport: ~30 transakcji (~450-750 PLN/miesiąc)';
  RAISE NOTICE '   - Rozrywka: ~10 transakcji (~250-500 PLN/miesiąc)';
  RAISE NOTICE '   - Mieszkanie: ~4 transakcje (~300-600 PLN/miesiąc)';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Teraz możesz przetestować API AI Insights!';
  RAISE NOTICE '   curl -X POST http://localhost:4321/api/insights/analyze \';
  RAISE NOTICE '     -H "Content-Type: application/json" \';
  RAISE NOTICE '     -d ''{"months": 2}'' -b ai-test-cookies.txt';

END $$;
