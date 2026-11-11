
import type { DashboardSummary } from '@/types/dashboard';

/**
 * Development-only dashboard data.
 *
 * Replace this implementation with the merchant
 * dashboard API when its documentation is available.
 */
const demoDashboardSummary: DashboardSummary = {
    totalOrders: 1284,
    revenueAmount: 248000,
    pendingOrders: 18,
    currency: 'PKR',
};

/**
 * Retrieves the dashboard summary.
 *
 * The screen calls this function without needing to
 * know whether its data comes from a demo or an API.
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
    return { ...demoDashboardSummary };
}
