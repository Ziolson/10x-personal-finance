/**
 * Account Service
 *
 * Handles business logic for account operations including:
 * - Creating new accounts
 * - Checking for duplicate account names
 * - Fetching account data with current balance
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateAccountCommand, AccountDTO, UpdateAccountCommand } from "../../types";

/**
 * Creates a new account for a user
 *
 * @param command - The account creation data
 * @param userId - The authenticated user's ID
 * @param supabase - Supabase client instance
 * @returns The newly created account with current balance
 * @throws Error if account name already exists or database operation fails
 */
export async function createAccount(command: CreateAccountCommand, userId: string, supabase: SupabaseClient): Promise<AccountDTO> {
  // Step 1: Check if account with this name already exists for the user
  const { data: existingAccount, error: checkError } = await supabase.from("accounts").select("id").eq("user_id", userId).eq("name", command.name).maybeSingle();

  if (checkError) {
    throw new Error(`Database error while checking for existing account: ${checkError.message}`);
  }

  if (existingAccount) {
    throw new Error("ACCOUNT_NAME_EXISTS");
  }

  // Step 2: Insert new account
  const { data: newAccount, error: insertError } = await supabase
    .from("accounts")
    .insert({
      user_id: userId,
      name: command.name,
      initial_balance: command.initial_balance,
      currency: command.currency || "PLN",
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Database error while creating account: ${insertError.message}`);
  }

  if (!newAccount) {
    throw new Error("Failed to create account: no data returned");
  }

  // Step 3: Fetch current balance from account_balances view
  const { data: balanceData, error: balanceError } = await supabase.from("account_balances").select("current_balance").eq("account_id", newAccount.id).maybeSingle();

  if (balanceError) {
    // Log error but don't fail - use initial_balance as fallback
    // eslint-disable-next-line no-console
    console.error("Error fetching current balance:", balanceError);
  }

  const currentBalance = balanceData?.current_balance ?? newAccount.initial_balance;

  // Step 4: Transform to AccountDTO (omit user_id, add current_balance)
  const accountDTO: AccountDTO = {
    id: newAccount.id,
    name: newAccount.name,
    initial_balance: newAccount.initial_balance,
    currency: newAccount.currency,
    created_at: newAccount.created_at,
    updated_at: newAccount.updated_at,
    current_balance: currentBalance,
  };

  return accountDTO;
}

/**
 * Fetches all accounts for a user with current balance calculations
 *
 * This function retrieves all accounts belonging to the authenticated user
 * and enriches them with current balance data from the account_balances view.
 * The current balance is calculated by summing all incoming and outgoing
 * transactions for each account.
 *
 * @param userId - The authenticated user's ID (from Supabase Auth)
 * @param supabase - Supabase client instance for database access
 * @returns Promise<AccountDTO[]> Array of accounts sorted by creation date (newest first),
 *          each containing id, name, initial_balance, currency, timestamps, and current_balance
 * @throws Error if database query fails or returns invalid data
 * @example
 * const accounts = await getAccounts(userId, supabaseClient);
 * // Returns: [
 * //   { id: "...", name: "Main", initial_balance: 1000, current_balance: 1250.50, ... },
 * //   { id: "...", name: "Savings", initial_balance: 5000, current_balance: 5100, ... }
 * // ]
 */
export async function getAccounts(userId: string, supabase: SupabaseClient): Promise<AccountDTO[]> {
  // Step 1: Fetch user's accounts from the accounts table and balances from view in parallel
  const [accountsResult, balancesResult] = await Promise.all([
    supabase.from("accounts").select("id, name, initial_balance, currency, created_at, updated_at").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("account_balances").select("account_id, current_balance").eq("user_id", userId),
  ]);

  const { data: accounts, error: accountsError } = accountsResult;
  const { data: balances, error: balancesError } = balancesResult;

  if (accountsError) {
    throw new Error(`Database error while fetching accounts: ${accountsError.message}`);
  }

  if (!accounts || accounts.length === 0) {
    return [];
  }

  if (balancesError) {
    // If balance view is unavailable, use initial_balance as fallback
    // This is acceptable as balances will be recalculated on next request
    // eslint-disable-next-line no-console
    console.error("Error fetching account balances:", balancesError);
  }

  // Create a map of account_id -> current_balance for quick lookup
  // Filter out entries with null account_id or current_balance to prevent null keys/values
  const balanceMap = new Map((balances || []).filter((b) => b.account_id != null && b.current_balance != null).map((b) => [b.account_id, b.current_balance] as const));

  // Transform to AccountDTO format by:
  // 1. Mapping account data fields
  // 2. Looking up current_balance from the balances view
  // 3. Falling back to initial_balance if balance data is unavailable
  return accounts.map((account) => ({
    id: account.id,
    name: account.name,
    initial_balance: account.initial_balance,
    currency: account.currency,
    created_at: account.created_at,
    updated_at: account.updated_at,
    // Extract current_balance from the balance map
    // The view calculates balance as: initial_balance + sum(incoming) - sum(outgoing)
    current_balance: balanceMap.get(account.id) ?? account.initial_balance,
  }));
}

/**
 * Fetches a single account by ID with current balance
 *
 * This function retrieves a specific account belonging to the authenticated user
 * and enriches it with current balance data from the account_balances view.
 *
 * @param accountId - The account ID to fetch (UUID)
 * @param userId - The authenticated user's ID (ensures authorization)
 * @param supabase - Supabase client instance for database access
 * @returns Promise<AccountDTO | null> The account with current balance, or null if not found
 * @throws Error if database query fails
 */
export async function getAccountById(accountId: string, userId: string, supabase: SupabaseClient): Promise<AccountDTO | null> {
  // Step 1: Fetch the account by ID and user_id (authorization check)
  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .select("id, name, initial_balance, currency, created_at, updated_at")
    .eq("id", accountId)
    .eq("user_id", userId)
    .maybeSingle();

  if (accountError) {
    throw new Error(`Database error while fetching account: ${accountError.message}`);
  }

  // Account not found or doesn't belong to user
  if (!account) {
    return null;
  }

  // Step 2: Fetch current balance from account_balances view
  const { data: balanceData, error: balanceError } = await supabase.from("account_balances").select("current_balance").eq("account_id", accountId).maybeSingle();

  if (balanceError) {
    // Log error but don't fail - use initial_balance as fallback
    // eslint-disable-next-line no-console
    console.error("Error fetching current balance:", balanceError);
  }

  const currentBalance = balanceData?.current_balance ?? account.initial_balance;

  // Step 3: Transform to AccountDTO
  const accountDTO: AccountDTO = {
    id: account.id,
    name: account.name,
    initial_balance: account.initial_balance,
    currency: account.currency,
    created_at: account.created_at,
    updated_at: account.updated_at,
    current_balance: currentBalance,
  };

  return accountDTO;
}

/**
 * Updates an existing account
 *
 * This function updates specific fields of an account (name and/or initial_balance)
 * for the authenticated user. It ensures the account belongs to the user before updating.
 *
 * @param accountId - The account ID to update (UUID)
 * @param userId - The authenticated user's ID (ensures authorization)
 * @param data - The update command with optional name and initial_balance
 * @param supabase - Supabase client instance for database access
 * @returns Promise<AccountDTO> The updated account with current balance
 * @throws Error if account not found, or if a duplicate name is detected
 */
export async function updateAccount(accountId: string, userId: string, data: UpdateAccountCommand, supabase: SupabaseClient): Promise<AccountDTO> {
  // Step 1: Check if account exists and belongs to user
  const { data: existingAccount, error: checkError } = await supabase.from("accounts").select("id").eq("id", accountId).eq("user_id", userId).maybeSingle();

  if (checkError) {
    throw new Error(`Database error while checking account: ${checkError.message}`);
  }

  if (!existingAccount) {
    throw new Error("NOT_FOUND");
  }

  // Step 2: If updating name, check for duplicates
  if (data.name !== undefined) {
    const { data: duplicateAccount, error: dupError } = await supabase.from("accounts").select("id").eq("user_id", userId).eq("name", data.name).neq("id", accountId).maybeSingle();

    if (dupError) {
      throw new Error(`Database error while checking for duplicate name: ${dupError.message}`);
    }

    if (duplicateAccount) {
      throw new Error("ACCOUNT_NAME_EXISTS");
    }
  }

  // Step 3: Update the account with only provided fields
  const updatePayload: Record<string, unknown> = {};
  if (data.name !== undefined) updatePayload.name = data.name;
  if (data.initial_balance !== undefined) updatePayload.initial_balance = data.initial_balance;

  const { data: updatedAccount, error: updateError } = await supabase.from("accounts").update(updatePayload).eq("id", accountId).eq("user_id", userId).select().single();

  if (updateError) {
    throw new Error(`Database error while updating account: ${updateError.message}`);
  }

  if (!updatedAccount) {
    throw new Error("Failed to update account: no data returned");
  }

  // Step 4: Fetch current balance from account_balances view
  const { data: balanceData, error: balanceError } = await supabase.from("account_balances").select("current_balance").eq("account_id", accountId).maybeSingle();

  if (balanceError) {
    // eslint-disable-next-line no-console
    console.error("Error fetching current balance:", balanceError);
  }

  const currentBalance = balanceData?.current_balance ?? updatedAccount.initial_balance;

  // Step 5: Transform to AccountDTO
  const accountDTO: AccountDTO = {
    id: updatedAccount.id,
    name: updatedAccount.name,
    initial_balance: updatedAccount.initial_balance,
    currency: updatedAccount.currency,
    created_at: updatedAccount.created_at,
    updated_at: updatedAccount.updated_at,
    current_balance: currentBalance,
  };

  return accountDTO;
}

/**
 * Deletes an account
 *
 * This function deletes an account belonging to the authenticated user.
 * It ensures the account belongs to the user before deletion.
 *
 * @param accountId - The account ID to delete (UUID)
 * @param userId - The authenticated user's ID (ensures authorization)
 * @param supabase - Supabase client instance for database access
 * @throws Error if account not found
 */
export async function deleteAccount(accountId: string, userId: string, supabase: SupabaseClient): Promise<void> {
  // Step 1: Delete the account (DELETE query with authorization check)
  const { error: deleteError } = await supabase.from("accounts").delete().eq("id", accountId).eq("user_id", userId);

  if (deleteError) {
    throw new Error(`Database error while deleting account: ${deleteError.message}`);
  }

  // Note: Supabase doesn't return count of affected rows in delete by default,
  // but the authorization (eq("user_id", userId)) ensures we only delete
  // accounts belonging to the current user. If account doesn't exist or doesn't
  // belong to user, it silently succeeds (no error). We can't distinguish between
  // "account doesn't exist" and "success". This is handled at the API level.
}
