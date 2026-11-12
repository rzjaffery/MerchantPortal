// src/services/dashboard/dashboardMapper.ts
import type {
    DashboardApiResponse,
    DashboardSummary,
} from '@/types/dashboard';

// Convert text or number to a number, and use 0 when missing.
function toNumber(value: string | number | null | undefined): number {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
}

// Converts the server's answer into the shape the Dashboard screen uses.
export function mapDashboardResponse(
    response: DashboardApiResponse
): DashboardSummary {
    const graph = response.combineddashboardgraph;

    return {
        successfulAmountCDF: toNumber(graph?.successfulAmountCDF),
        successfulAmountUSD: toNumber(graph?.successfulAmountUSD),
        failedAmountCDF: toNumber(graph?.failedAmountCDF),
        failedAmountUSD: toNumber(graph?.failedAmountUSD),
        successfulSeries: toNumber(graph?.successfulSeries),
        failedSeries: toNumber(graph?.failedSeries),
    };
}