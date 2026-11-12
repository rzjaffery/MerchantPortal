// src/services/dashboard/dashboardService.ts
import type { DashboardSummary } from '@/types/dashboard';

/**
 * Development-only dashboard data.
 * We'll replace this with the real API call later.
 */
const demoDashboardSummary: DashboardSummary = {
    successfulAmountCDF: 248000,
    successfulAmountUSD: 1250,
    failedAmountCDF: 4000,
    failedAmountUSD: 35,
};

/**
 * Retrieves the dashboard summary.
 * The screen doesn't need to know whether this data is demo or real.
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
    return { ...demoDashboardSummary };
}