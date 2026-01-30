# 10xPersonal Finance

[![Project Status: In Development](https://img.shields.io/badge/status-in%20development-yellowgreen)](https://github.com/mziolek-dev/10x-personal-finance)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A web application for conscious personal finance management, focusing on manual tracking of expenses, income, transfers, and a simple budgeting mechanism. This tool helps centralize your financial information for better planning and saving.

---

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
  - [Installation](#installation)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
  - [In Scope (MVP)](#in-scope-mvp)
- [Project Status](#project-status)
- [License](#license)

---

## Project Description

**10xPersonal Finance** is designed to address the common problem of lacking financial control. Many users struggle with a fragmented view of their finances due to multiple bank accounts and the abstract nature of digital payments. This application provides a single, centralized platform to manually track transactions, analyze spending habits, and manage a household budget effectively.

The core goal is to empower users with a clear understanding of their financial standing, helping them to "feel" the flow of money and make more informed decisions.

## Tech Stack

The project is built with a modern, robust, and scalable tech stack:

| Category     | Technology                                                                                                                                                                                                                                                                                                                                                                        |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend** | ![Astro](https://img.shields.io/badge/Astro-5-FF5D01?logo=astro) ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css) ![Shadcn/UI](https://img.shields.io/badge/shadcn/ui-latest-black?logo=v) |
| **Backend**  | ![Supabase](https://img.shields.io/badge/Supabase-latest-3ECF8E?logo=supabase)                                                                                                                                                                                                                                                                                                    |
| **Testing**  | ![Vitest](https://img.shields.io/badge/Vitest-latest-729B1B?logo=vitest) ![Playwright](https://img.shields.io/badge/Playwright-latest-45BA4B?logo=playwright) ![RTL](https://img.shields.io/badge/Testing%20Library-latest-E33332?logo=testing-library)                                                                                                                           |
| **CI/CD**    | ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-latest-2088FF?logo=github-actions)                                                                                                                                                                                                                                                                                  |

## Getting Started Locally

Follow these instructions to set up and run the project on your local machine.

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Ziolson/10x-personal-finance.git
    cd 10x-personal-finance
    ```

2.  **Set the correct Node.js version:**
    If you are using `nvm`, run the following command in the project root:

    ```bash
    nvm use
    ```

3.  **Install dependencies:**

    ```bash
    npm install
    ```

4.  **Set up environment variables:**
    Create a `.env` file in the root of the project by copying the example file:

    ```bash
    cp .env.example .env
    ```

    You will need to add your Supabase Project URL and Anon Key to this file. You can find these in your Supabase project dashboard under `Settings` > `API`.

    ```env
    # .env
    PUBLIC_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
    PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
    ```

5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:4321`.

## Available Scripts

The following scripts are available in the `package.json`:

| Script             | Description                                         |
| ------------------ | --------------------------------------------------- |
| `npm run dev`      | Starts the development server with hot-reloading.   |
| `npm run build`    | Builds the application for production.              |
| `npm run preview`  | Serves the production build locally for previewing. |
| `npm run astro`    | Runs Astro CLI commands directly.                   |
| `npm run lint`     | Lints the codebase for potential errors.            |
| `npm run lint:fix` | Lints and automatically fixes fixable issues.       |
| `npm run lint:fix` | Lints and automatically fixes fixable issues.       |
| `npm run format`   | Formats the code using Prettier.                    |
| `npm run test`     | Runs unit and integration tests using Vitest.       |
| `npm run test:e2e` | Runs end-to-end tests using Playwright.             |

## Testing

The project uses a comprehensive testing strategy involving Unit, Integration, and End-to-End (E2E) tests.

### Unit & Integration Tests (Vitest)

Unit tests are located alongside the source files (e.g., `src/lib/example.test.ts`). They focus on verifying individual functions, components, and API endpoints.

```bash
# Run all unit tests
npm run test

# Run tests in UI mode
npm run test:ui

# Check code coverage
npm run test:coverage
```

### End-to-End Tests (Playwright)

E2E tests simulate real user scenarios in the browser. They are located in the `e2e/` directory.

```bash
# Run E2E tests (headless)
npm run test:e2e

# Run E2E tests with UI runner
npm run test:e2e:ui
```

## Project Scope

### In Scope (MVP)

- Management of accounts (add, edit, delete).
- Management of expense/income categories.
- Adding transactions (expense, income, transfer).
- Creation and management of monthly budgets.

## Project Status

This project is currently **in development**. The primary focus is on implementing the features defined in the MVP scope.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
