import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import logger from "@/lib/logger";

dotenv.config({ path: ".env.test" });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env.test");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function setupE2EData() {
  const email = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error("Missing E2E_USERNAME or E2E_PASSWORD in .env.test");
  }

  // 1. Authenticate to get the user session
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !session) {
    throw new Error(`Failed to login in seed script: ${authError?.message}`);
  }

  const userId = session.user.id;

  // 2. Ensure Account exists
  const { data: existingAccounts, error: accountsError } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", userId)
    .ilike("name", "Konto E2E") // Case-insensitive check
    .limit(1);

  if (accountsError) throw new Error(`Error fetching accounts: ${accountsError.message}`);

  let accountId;
  if (existingAccounts.length === 0) {
    const { data: newAccount, error: createAccountError } = await supabase
      .from("accounts")
      .insert({
        user_id: userId,
        name: "Konto E2E",
        currency: "PLN",
        initial_balance: 1000,
      })
      .select()
      .single();

    if (createAccountError) throw new Error(`Error creating account: ${createAccountError.message}`);
    accountId = newAccount.id;
    logger.info("Created E2E Account");
  } else {
    accountId = existingAccounts[0].id;
    // console.log("E2E Account already exists");
  }

  // 3. Ensure Category exists
  const { data: existingCategories, error: categoriesError } = await supabase.from("categories").select("*").eq("user_id", userId).ilike("name", "Kategoria E2E").limit(1);

  if (categoriesError) throw new Error(`Error fetching categories: ${categoriesError.message}`);

  let categoryId;
  if (existingCategories.length === 0) {
    const { data: newCategory, error: createCategoryError } = await supabase
      .from("categories")
      .insert({
        user_id: userId,
        name: "Kategoria E2E",
        type: "expense",
      })
      .select()
      .single();

    if (createCategoryError) throw new Error(`Error creating category: ${createCategoryError.message}`);
    categoryId = newCategory.id;
    logger.info("Created E2E Category");
  } else {
    categoryId = existingCategories[0].id;
    // console.log("E2E Category already exists");
  }

  return { accountId, categoryId, accountName: "Konto E2E", categoryName: "Kategoria E2E" };
}
