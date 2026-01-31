import { test, expect, Page } from "@playwright/test";
import { TransactionsPage } from "./pages/TransactionsPage";
import { setupE2EData } from "./utils/seed";

// Use serial mode to run tests in order and share the page/session
// This avoids repeated logins which can trigger rate limits or timeouts
test.describe.serial("Transactions View", () => {
  let page: Page;
  let transactionsPage: TransactionsPage;
  let testData: { accountName: string; categoryName: string };

  test.beforeAll(async ({ browser }) => {
    // 1. Seed Data
    testData = await setupE2EData();

    // 2. Create shared page/context
    page = await browser.newPage();
    transactionsPage = new TransactionsPage(page);

    // 3. Login once
    await page.goto("/login");
    await page.getByLabel("Email").fill(process.env.E2E_USERNAME || "");
    await page.getByLabel("Hasło").fill(process.env.E2E_PASSWORD || "");
    await page.getByRole("button", { name: "Zaloguj się" }).click();

    // Wait for either redirect OR error message
    const errorLocator = page.locator(".text-destructive");
    try {
      await Promise.race([expect(page).toHaveURL("/", { timeout: 10000 }), expect(errorLocator).toBeVisible({ timeout: 10000 })]);
    } catch (e) {
      if (await errorLocator.isVisible()) {
        const errorText = await errorLocator.textContent();
        throw new Error(`Login failed with UI error: ${errorText}`);
      }
      throw e;
    }

    await expect(page).toHaveURL("/", { timeout: 5000 }); // Confirm redirect if race passed without error
    await transactionsPage.goto();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("should display transactions list and filters", async () => {
    await expect(transactionsPage.transactionsView).toBeVisible();
    await expect(transactionsPage.filterType).toBeVisible();
    await expect(transactionsPage.addTransactionButton).toBeVisible();
  });

  test("should add a new expense transaction", async () => {
    const description = `Test Expense ${Date.now()}`;

    await transactionsPage.addTransactionButton.click();
    await expect(transactionsPage.transactionForm).toBeVisible();

    await transactionsPage.inputAmount.fill("123.45");
    await transactionsPage.inputDescription.fill(description);

    // Select the specific E2E account/category created in seeding
    await transactionsPage.inputFromAccount.click();
    await page.getByRole("option", { name: testData.accountName }).first().click();

    await transactionsPage.inputCategory.click();
    await page.getByRole("option", { name: testData.categoryName }).first().click();

    await transactionsPage.submitButton.click();
    await expect(transactionsPage.transactionForm).not.toBeVisible();

    // Verify it appears in the list
    // Verify it appears in the list (handle potential duplicates like toast notification)
    await expect(page.getByText(description).first()).toBeVisible();
    await expect(page.getByText("123,45 zł").first()).toBeVisible();
  });

  test("should filter transactions", async () => {
    // Requires the transaction added in previous step
    await transactionsPage.filterCategory.click();
    await page.getByRole("option", { name: testData.categoryName }).click();

    await expect(transactionsPage.clearFiltersButton).toBeVisible();

    // Clear filters for next test
    await transactionsPage.clearFiltersButton.click();
    await expect(transactionsPage.clearFiltersButton).not.toBeVisible();
  });

  test("should edit a transaction", async () => {
    // Edit the top transaction (likely the one we just added)
    const newAmount = "999.99";

    await transactionsPage.editTransaction(0, newAmount);

    await expect(page.getByText("999,99 zł").first()).toBeVisible();
  });

  test("should delete a transaction", async () => {
    const rows = page.getByTestId("transaction-row");
    const countBefore = await rows.count();

    if (countBefore > 0) {
      await transactionsPage.deleteTransaction(0);
      await expect(page.getByTestId("transaction-row")).toHaveCount(countBefore - 1);
    }
  });
});
