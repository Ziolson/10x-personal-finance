# REST API Plan

This document outlines the REST API for the 10xPersonal Finance application. The API is designed based on the database schema, product requirements, and the specified tech stack.

## 1. Resources

The API is structured around the following core resources:

- **Accounts**: Represents user's bank accounts. Corresponds to the `accounts` table.
- **Categories**: Represents income and expense categories. Corresponds to the `categories` table.
- **Budgets**: Represents monthly user budgets. Corresponds to the `budgets` table.
- **Transactions**: Represents all financial operations (income, expense, transfer). Corresponds to the `transactions` table.
- **Dashboard**: A virtual resource for aggregated data views, leveraging the `account_balances` and `budget_progress` database views.
- **Auth**: A virtual resource for handling user authentication via Supabase.

## 2. Endpoints

All endpoints are protected and require a valid JWT from an authenticated user. Authorization is handled by Supabase's Row Level Security (RLS) policies, ensuring users can only access their own data.

### 2.2. Accounts

Resource Path: `/api/accounts`

---

- **`GET /api/accounts`**
  - **Description**: Retrieves a list of all accounts for the authenticated user, including their current balance.
  - **Response Payload (200 OK)**:
    ```json
    [
      {
        "id": "uuid",
        "name": "Main Bank Account",
        "initial_balance": 1000.0,
        "currency": "PLN",
        "current_balance": 1250.5,
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ]
    ```

- **`POST /api/accounts`**
  - **Description**: Creates a new account.
  - **Request Payload**:
    ```json
    {
      "name": "Savings Account",
      "initial_balance": 500.0,
      "currency": "PLN"
    }
    ```
  - **Response Payload (201 Created)**: The newly created account object.
  - **Error Codes**: `400 Bad Request` (validation error), `409 Conflict` (account with that name already exists).

- **`GET /api/accounts/{accountId}`**
  - **Description**: Retrieves a single account by its ID.
  - **Response Payload (200 OK)**: A single account object.
  - **Error Codes**: `404 Not Found`.

- **`PUT /api/accounts/{accountId}`**
  - **Description**: Updates an existing account.
  - **Request Payload**:
    ```json
    {
      "name": "Updated Savings Account Name",
      "initial_balance": 550.0
    }
    ```
  - **Response Payload (200 OK)**: The updated account object.
  - **Error Codes**: `400 Bad Request`, `404 Not Found`, `409 Conflict`.

- **`DELETE /api/accounts/{accountId}`**
  - **Description**: Deletes an account.
  - **Response (204 No Content)**.
  - **Error Codes**: `404 Not Found`.

### 2.3. Categories

Resource Path: `/api/categories`

---

- **`GET /api/categories`**
  - **Description**: Retrieves all categories for the user.
  - **Query Parameters**: `type` ('income' or 'expense').
  - **Response Payload (200 OK)**:
    ```json
    [
      {
        "id": "uuid",
        "name": "Groceries",
        "type": "expense",
        "budget_id": "uuid_or_null",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ]
    ```

- **`POST /api/categories`**
  - **Description**: Creates a new category.
  - **Request Payload**:
    ```json
    {
      "name": "Salary",
      "type": "income",
      "budget_id": null
    }
    ```
  - **Response Payload (201 Created)**: The new category object.
  - **Error Codes**: `400 Bad Request`, `409 Conflict`.

- **`PUT /api/categories/{categoryId}`**
  - **Description**: Updates a category.
  - **Request Payload**:
    ```json
    {
      "name": "Salary - Primary Job",
      "budget_id": "uuid_or_null"
    }
    ```
  - **Response Payload (200 OK)**: The updated category object.
  - **Error Codes**: `400 Bad Request`, `404 Not Found`, `409 Conflict`.

- **`DELETE /api/categories/{categoryId}`**
  - **Description**: Deletes a category.
  - **Response (204 No Content)**.
  - **Error Codes**: `404 Not Found`, `409 Conflict` (if category is in use by a transaction).

### 2.4. Transactions

Resource Path: `/api/transactions`

---

- **`GET /api/transactions`**
  - **Description**: Retrieves a paginated list of transactions, with filtering.
  - **Query Parameters**:
    - `page` (number, default: 1)
    - `limit` (number, default: 20)
    - `type` ('income', 'expense', 'transfer')
    - `accountId` (uuid)
    - `categoryId` (uuid)
    - `startDate` (YYYY-MM-DD)
    - `endDate` (YYYY-MM-DD)
  - **Response Payload (200 OK)**:
    ```json
    {
      "data": [
        {
          "id": "uuid",
          "type": "expense",
          "amount": 75.5,
          "date": "YYYY-MM-DD",
          "description": "Weekly shopping",
          "from_account_id": "uuid",
          "to_account_id": null,
          "category_id": "uuid",
          "created_at": "timestamp"
        }
      ],
      "pagination": {
        "currentPage": 1,
        "totalPages": 5,
        "totalItems": 100
      }
    }
    ```

- **`POST /api/transactions`**
  - **Description**: Creates a new transaction (income, expense, or transfer).
  - **Request Payload**:
    ```json
    // Expense
    {
      "type": "expense",
      "amount": 120.00,
      "date": "YYYY-MM-DD",
      "from_account_id": "uuid",
      "category_id": "uuid",
      "description": "New shoes"
    }
    // Income
    {
      "type": "income",
      "amount": 2500.00,
      "date": "YYYY-MM-DD",
      "to_account_id": "uuid",
      "category_id": "uuid",
      "description": "Monthly salary"
    }
    // Transfer
    {
      "type": "transfer",
      "amount": 200.00,
      "date": "YYYY-MM-DD",
      "from_account_id": "uuid",
      "to_account_id": "uuid",
      "description": "Saving"
    }
    ```
  - **Response Payload (201 Created)**: The new transaction object.
  - **Error Codes**: `400 Bad Request`.

- **`PUT /api/transactions/{transactionId}`**
  - **Description**: Updates a transaction.
  - **Response Payload (200 OK)**: The updated transaction object.
  - **Error Codes**: `400 Bad Request`, `404 Not Found`.

- **`DELETE /api/transactions/{transactionId}`**
  - **Description**: Deletes a transaction.
  - **Response (204 No Content)**.
  - **Error Codes**: `404 Not Found`.

### 2.5. Budgets

Resource Path: `/api/budgets`

---

- **`GET /api/budgets`**
  - **Description**: Retrieves all budgets for a given month and year.
  - **Query Parameters**:
    - `month` (number, 1-12)
    - `year` (number, YYYY)
  - **Response Payload (200 OK)**:
    ```json
    [
      {
        "id": "uuid",
        "name": "Household",
        "amount": 1500.0,
        "month": 11,
        "year": 2025,
        "created_at": "timestamp",
        "categories": ["uuid1", "uuid2"]
      }
    ]
    ```

- **`POST /api/budgets`**
  - **Description**: Creates a new budget.
  - **Request Payload**:
    ```json
    {
      "name": "Entertainment",
      "amount": 300.0,
      "month": 11,
      "year": 2025,
      "category_ids": ["uuid_of_category"]
    }
    ```
  - **Response Payload (201 Created)**: The new budget object.
  - **Error Codes**: `400 Bad Request`, `409 Conflict` (budget with same name for month/year exists).

- **`PUT /api/budgets/{budgetId}`**
  - **Description**: Updates a budget.
  - **Request Payload**:
    ```json
    {
      "name": "Entertainment & Hobbies",
      "amount": 350.0,
      "category_ids": ["uuid1", "uuid2"]
    }
    ```
  - **Response Payload (200 OK)**: The updated budget object.
  - **Error Codes**: `400 Bad Request`, `404 Not Found`.

- **`DELETE /api/budgets/{budgetId}`**
  - **Description**: Deletes a budget.
  - **Response (204 No Content)**.
  - **Error Codes**: `404 Not Found`.

### 2.6. Dashboard

Resource Path: `/api/dashboard`

---

- **`GET /api/dashboard`**
  - **Description**: Retrieves aggregated data for the dashboard view for a specific month and year.
  - **Query Parameters**:
    - `month` (number, 1-12, defaults to current month)
    - `year` (number, YYYY, defaults to current year)
  - **Response Payload (200 OK)**:
    ```json
    {
      "summary": {
        "total_income": 5000.0,
        "total_expense": 3500.0,
        "balance": 1500.0
      },
      "expense_by_category": [
        { "category_name": "Groceries", "amount": 800.0, "percentage": 22.8 },
        { "category_name": "Rent", "amount": 2000.0, "percentage": 57.1 },
        { "category_name": "Transport", "amount": 700.0, "percentage": 20.1 }
      ],
      "recent_transactions": [
        /* Array of last 5 transaction objects */
      ],
      "budget_progress": [
        {
          "budget_id": "uuid",
          "budget_name": "Household",
          "budget_amount": 1500.0,
          "spent_amount": 800.0,
          "remaining_amount": 700.0,
          "percentage_used": 53.3
        }
      ]
    }
    ```
  - **Error Codes**: `400 Bad Request` (invalid month/year).

## 3. Authentication and Authorization

- **Authentication**: The API uses JSON Web Tokens (JWT) provided by Supabase Auth. The client is responsible for obtaining the JWT upon login/signup and including it in the `Authorization: Bearer <token>` header for all subsequent requests to protected endpoints.
- **Authorization**: All data access is governed by PostgreSQL Row Level Security (RLS) policies defined in the database. These policies ensure that `auth.uid()` from the user's JWT matches the `user_id` on the requested resource. This provides a robust security layer, preventing users from accessing data that does not belong to them.

## 4. Validation and Business Logic

### 4.1. Validation

Input validation will be performed at the API level before data is passed to the database. This includes:

- **Accounts**:
  - `name` must be a non-empty string and unique per user.
  - `initial_balance` must be a non-negative number.
- **Categories**:
  - `name` must be a non-empty string and unique per user.
  - `type` must be either 'income' or 'expense'.
- **Budgets**:
  - `name` must be a non-empty string and unique per user for a given month/year.
  - `amount` must be a positive number.
  - `month` must be between 1 and 12.
  - `year` must be a valid year (e.g., 2000-2100).
- **Transactions**:
  - `amount` must be a positive number.
  - `date` must be a valid date.
  - Logic based on `type`:
    - `expense`: `from_account_id` and `category_id` are required.
    - `income`: `to_account_id` and `category_id` are required.
    - `transfer`: `from_account_id` and `to_account_id` are required and must be different.

### 4.2. Business Logic Implementation

- **Account Balance Calculation**: The API will primarily query the `account_balances` view to get the `current_balance` for accounts, offloading the complex calculation to the database.
- **Budget Progress**: The `budget_progress` view will be queried by the `/api/dashboard` endpoint to efficiently retrieve budget utilization data.
- **Category Deletion**: The API will enforce the `ON DELETE RESTRICT` constraint by checking if a category is associated with any transactions before allowing deletion. If it is, a `409 Conflict` error will be returned.
- **Account Deletion**: The API will leverage the `ON DELETE CASCADE` behavior defined in the database. Deleting an account via the API will automatically trigger the deletion of all its associated transactions.
