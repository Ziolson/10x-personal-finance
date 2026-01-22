import type { DashboardDTO } from "../types";

/**
 * Fetches dashboard data for the given month and year.
 * @param month - Month number (1-12)
 * @param year - Year (YYYY)
 * @returns Promise<DashboardDTO>
 */
export async function getDashboard(month?: number, year?: number): Promise<DashboardDTO> {
  const params = new URLSearchParams();
  if (month !== undefined) params.append("month", month.toString());
  if (year !== undefined) params.append("year", year.toString());

  const response = await fetch(`/api/dashboard?${params.toString()}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || "Failed to fetch dashboard data");
  }

  return response.json();
}
