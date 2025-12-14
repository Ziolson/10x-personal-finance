import { atom, computed } from "nanostores";

/**
 * Layout Store - Centralized state management for UI and theme
 *
 * Manages all layout-related state including:
 * - Modal visibility (Add Transaction, etc.)
 * - Theme (light/dark/system)
 * - Sidebar state (future)
 * - Other UI state
 *
 */

// ============================================================================
// MODALS STATE
// ============================================================================

/**
 * Controls visibility of the "Add Transaction" modal.
 * Used by the global layout to toggle the modal from various components.
 */
export const isAddTransactionModalOpen = atom<boolean>(false);

/**
 * Opens the Add Transaction modal
 */
export function openAddTransactionModal() {
  isAddTransactionModalOpen.set(true);
}

/**
 * Closes the Add Transaction modal
 */
export function closeAddTransactionModal() {
  isAddTransactionModalOpen.set(false);
}

/**
 * Toggles the Add Transaction modal visibility
 */
export function toggleAddTransactionModal() {
  isAddTransactionModalOpen.set(!isAddTransactionModalOpen.get());
}

// ============================================================================
// THEME STATE
// ============================================================================

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const THEME_STORAGE_KEY = "theme";

/**
 * Private atom for internal theme state
 * Stores user's theme preference: "light", "dark", or "system"
 */
const $themeValue = atom<Theme>("system");

/**
 * Public computed atom for resolved theme
 * Automatically resolves "system" to actual "light" or "dark" based on OS preferences
 *
 * @example
 * ```tsx
 * const theme = useStore($resolvedTheme);
 * // Returns: "light" or "dark" (never "system")
 * ```
 */
export const $resolvedTheme = computed($themeValue, (theme) => {
  if (globalThis.window === undefined) return "light";

  if (theme === "system") {
    return globalThis.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  return theme;
});

/**
 * Initialize theme from localStorage
 * Call this once on app mount in Layout.astro
 *
 * Features:
 * - Loads saved theme from localStorage
 * - Applies theme to DOM (adds/removes .dark class)
 * - Listens for system preference changes
 *
 * @example
 * ```astro
 * <script>
 *   import { initTheme } from '@/lib/stores/layoutStore';
 *   initTheme();
 * </script>
 * ```
 */
export function initTheme(): void {
  if (globalThis.window === undefined) return;

  const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  const theme = stored || "system";

  $themeValue.set(theme);
  applyTheme(theme);

  // Listen for system preference changes
  const mediaQuery = globalThis.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", () => {
    if ($themeValue.get() === "system") {
      applyTheme("system");
    }
  });
}

/**
 * Get current theme setting
 * @returns Current theme: "light", "dark", or "system"
 */
export function getTheme(): Theme {
  return $themeValue.get();
}

/**
 * Set theme and persist to localStorage
 * Automatically applies the theme to DOM
 *
 * @param theme - Theme to set: "light", "dark", or "system"
 *
 * @example
 * ```tsx
 * setTheme("dark");  // Switch to dark mode
 * setTheme("system");  // Follow system preferences
 * ```
 */
export function setTheme(theme: Theme): void {
  $themeValue.set(theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
}

/**
 * Toggle between light and dark themes
 * If currently on "system", switches to the opposite of current resolved theme
 *
 * @example
 * ```tsx
 * <button onClick={toggleTheme}>Toggle Theme</button>
 * ```
 */
export function toggleTheme(): void {
  const current = $resolvedTheme.get();
  const newTheme = current === "dark" ? "light" : "dark";
  setTheme(newTheme);
}

/**
 * Apply theme to DOM by adding/removing .dark class
 * Works with Tailwind CSS dark mode
 *
 * @param theme - Theme to apply
 * @private
 */
function applyTheme(theme: Theme): void {
  if (globalThis.window === undefined) return;

  let resolved: ResolvedTheme;
  if (theme === "system") {
    resolved = globalThis.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } else {
    resolved = theme;
  }

  if (resolved === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}
