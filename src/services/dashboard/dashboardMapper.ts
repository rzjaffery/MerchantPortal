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

// The server sends money in cents (1085444 means 10,854.44),
// so divide by 100 to get the real amount.
function toAmount(value: string | number | null | undefined): number {
    return toNumber(value) / 100;
}

// Converts the server's answer into the shape the Dashboard screen uses.
export function mapDashboardResponse(
    response: DashboardApiResponse
): DashboardSummary {
    const graph = response.combineddashboardgraph;

    return {
        successfulAmountCDF: toAmount(graph?.successfulAmountCDF),
        successfulAmountUSD: toAmount(graph?.successfulAmountUSD),
        failedAmountCDF: toAmount(graph?.failedAmountCDF),
        failedAmountUSD: toAmount(graph?.failedAmountUSD),
        successfulSeries: toNumber(graph?.successfulSeries),
        failedSeries: toNumber(graph?.failedSeries),
    };
}