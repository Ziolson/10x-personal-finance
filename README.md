# 10xPersonal Finance

[![Project Status: In Development](https://img.shields.io/badge/status-in%20development-yellowgreen)](https://github.com/mziolek-dev/10x-personal-finance)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A web application for conscious personal finance management, focusing on manual tracking of expenses, income, transfers, and a simple budgeting mechanism. The application uses artificial intelligence to analyze spending patterns and generate personalized savings recommendations. This tool helps centralize your financial information for better planning and saving.

---

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
  - [Installation](#installation)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [Testing](#testing)
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
| **AI**       | ![OpenRouter](https://img.shields.io/badge/OpenRouter-GPT--4o--mini-5A67D8)                                                                                                                                                                                                                                                                                                       |
| **Testing**  | ![Vitest](https://img.shields.io/badge/Vitest-latest-729B1B?logo=vitest) ![Playwright](https://img.shields.io/badge/Playwright-latest-45BA4B?logo=playwright) ![RTL](https://img.shields.io/badge/Testing%20Library-latest-E33332?logo=testing-library)                                                                                                                           |
| **CI/CD**    | ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-latest-2088FF?logo=github-actions) ![Cloudflare Pages](https://img.shields.io/badge/Cloudflare_Pages-latest-F38020?logo=cloudflare)                                                                                                                                                                                 |

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

    You will need to configure the following environment variables:

    **Supabase Configuration:**
    - `SUPABASE_URL` - Your Supabase project URL (found in Supabase dashboard under `Settings` > `API`)
    - `SUPABASE_ANON_KEY` - Your Supabase anonymous key (found in Supabase dashboard under `Settings` > `API`)

    **OpenRouter Configuration (for AI Insights):**
    - `OPENROUTER_API_KEY` - Your OpenRouter API key (sign up at https://openrouter.ai/)
    - `OPENROUTER_BASE_URL` - OpenRouter API base URL (default: `https://openrouter.ai/api/v1`)
    - `AI_MODEL` - AI model identifier (default: `openai/gpt-4o-mini`)
    - `AI_MAX_TOKENS` - Maximum tokens for AI responses (default: `2000`)
    - `AI_TEMPERATURE` - AI temperature setting (default: `0.7`)
    
    **Application Configuration:**
    - `APP_URL` - Your application URL (default: `http://localhost:3000`)
    - `APP_NAME` - Application name (default: `10xPersonal Finance`)

    Example `.env` file:

    ```env
    # Supabase Configuration
    SUPABASE_URL="https://your-project-id.supabase.co"
    SUPABASE_ANON_KEY="your-anon-key"

    # OpenRouter Configuration
    OPENROUTER_API_KEY="sk-or-v1-your-api-key-here"
    OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"
    AI_MODEL="openai/gpt-4o-mini"
    AI_MAX_TOKENS="2000"
    AI_TEMPERATURE="0.7"
    
    # Application Configuration
    APP_URL="http://localhost:3000"
    APP_NAME="10xPersonal Finance"
    ```

5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

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

## Deployment

This project is configured to deploy to **Cloudflare Pages** via GitHub Actions.

### Prerequisites

1. A Cloudflare account
2. A Cloudflare Pages project created
3. Cloudflare API Token with Pages permissions

### Required GitHub Secrets

Configure the following secrets in your GitHub repository under `Settings` > `Secrets and variables` > `Actions`:

**Production Environment:**

| Secret Name             | Description                        |
| ----------------------- | ---------------------------------- |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare Account ID         |
| `CLOUDFLARE_API_TOKEN`  | API Token with Pages permissions   |
| `SUPABASE_URL`          | Your Supabase project URL          |
| `SUPABASE_ANON_KEY`     | Your Supabase anonymous key        |
| `OPENROUTER_API_KEY`    | OpenRouter API key for AI features |
| `OPENROUTER_BASE_URL`   | OpenRouter base URL                |
| `AI_MODEL`              | AI model identifier                |
| `AI_MAX_TOKENS`         | Maximum tokens for AI responses    |
| `AI_TEMPERATURE`        | AI temperature setting             |
| `APP_URL`               | Your production app URL            |
| `APP_NAME`              | Application name                   |

**Integration Environment (for E2E tests):**

| Secret Name         | Description                 |
| ------------------- | --------------------------- |
| `SUPABASE_URL`      | Your Supabase project URL   |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous key |
| `E2E_USERNAME_ID`   | Test user ID for E2E tests  |
| `E2E_USERNAME`      | Test username for E2E tests |
| `E2E_PASSWORD`      | Test password for E2E tests |

### Deployment Process

The deployment happens automatically when code is pushed to the `master` branch:

1. **Build & Test**: The CI pipeline runs linting, type checking, unit tests, and E2E tests
2. **Deploy**: If all tests pass, the application is automatically deployed to Cloudflare Pages

You can monitor the deployment progress in the **Actions** tab of your GitHub repository.

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

- User authentication and profile management.
- Management of accounts (add, edit, delete).
- Management of expense/income categories.
- Adding transactions (expense, income, transfer).
- Creation and management of monthly budgets.
- AI-powered spending analysis and savings recommendations.
- Dashboard with financial insights and budget tracking.
- Transaction history with filtering capabilities.
- Light/Dark theme support.

## Project Status

This project is currently **in development**. The primary focus is on implementing the features defined in the MVP scope.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
