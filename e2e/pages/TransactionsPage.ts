import { type Page, type Locator, expect } from "@playwright/test";

export class TransactionsPage {
  readonly page: Page;
  readonly transactionsView: Locator;
  readonly addTransactionButton: Locator;
  readonly filterType: Locator;
  readonly filterAccount: Locator;
  readonly filterCategory: Locator;
  readonly filterDateRange: Locator;
  readonly clearFiltersButton: Locator;

  // Form elements
  readonly transactionForm: Locator;
  readonly inputType: Locator;
  readonly inputAmount: Locator;
  readonly inputDate: Locator;
  readonly inputDescription: Locator;
  readonly inputFromAccount: Locator;
  readonly inputToAccount: Locator;
  readonly inputCategory: Locator;
  readonly submitButton: Locator;

  // Dialog elements
  readonly confirmDeleteButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.transactionsView = page.getByTestId("transactions-view");
    this.addTransactionButton = page.getByRole("button", { name: "Dodaj transakcję" });

    this.filterType = page.getByTestId("filter-type");
    this.filterAccount = page.getByTestId("filter-account");
    this.filterCategory = page.getByTestId("filter-category");
    this.filterDateRange = page.getByTestId("filter-date-range");
    this.clearFiltersButton = page.getByTestId("clear-filters-button");

    this.transactionForm = page.getByTestId("transaction-form");
    this.inputType = page.getByTestId("input-type");
    this.inputAmount = page.getByTestId("input-amount");
    this.inputDate = page.getByTestId("input-date");
    this.inputDescription = page.getByTestId("input-description");
    this.inputFromAccount = page.getByTestId("input-from-account");
    this.inputToAccount = page.getByTestId("input-to-account");
    this.inputCategory = page.getByTestId("input-category");
    this.submitButton = page.getByTestId("submit-transaction-button");

    this.confirmDeleteButton = page.getByTestId("confirm-delete-button");
  }

  async goto() {
    await this.page.goto("/transactions");
    // Wait for the view to be visible to ensure we are on the page
    await expect(this.transactionsView).toBeVisible();
  }

  async addTransaction(data: { type: "expense" | "income" | "transfer"; amount: string; description?: string; fromAccount?: string; toAccount?: string; category?: string }) {
    await this.addTransactionButton.click();
    await expect(this.transactionForm).toBeVisible();

    // Select Type if different from default (expense)
    if (data.type !== "expense") {
      await this.inputType.click();
      await this.page.getByRole("option", { name: data.type === "income" ? "Przychód" : "Transfer" }).click();
    }

    await this.inputAmount.fill(data.amount);

    if (data.description) {
      await this.inputDescription.fill(data.description);
    }

    if (data.fromAccount) {
      await this.inputFromAccount.click();
      await this.page.getByRole("option", { name: data.fromAccount }).click();
    }

    if (data.toAccount) {
      await this.inputToAccount.click();
      await this.page.getByRole("option", { name: data.toAccount }).click();
    }

    if (data.category && (data.type === "expense" || data.type === "income")) {
      await this.inputCategory.click();
      await this.page.getByRole("option", { name: data.category }).click();
    }

    await this.submitButton.click();
    await expect(this.transactionForm).not.toBeVisible();
  }

  async deleteTransaction(rowIndex = 0) {
    const row = this.page.getByTestId("transaction-row").nth(rowIndex);
    await row.getByTestId("action-menu-trigger").click();
    await this.page.getByTestId("action-delete").click();
    await this.confirmDeleteButton.click();
  }

  async editTransaction(rowIndex = 0, newAmount: string) {
    const row = this.page.getByTestId("transaction-row").nth(rowIndex);
    await row.getByTestId("action-menu-trigger").click();
    await this.page.getByTestId("action-edit").click();

    await expect(this.transactionForm).toBeVisible();
    await this.inputAmount.fill(newAmount);
    await this.submitButton.click();
    await expect(this.transactionForm).not.toBeVisible();
  }
}
