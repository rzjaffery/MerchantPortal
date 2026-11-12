// src/services/dashboard/dashboardMapper.ts
import type {
    DashboardApiResponse,
    DashboardSummary,
} from '@/types/dashboard';

// The server sends amounts as text such as "0". Convert to a number,
// and use 0 when the value is missing or not a number.
function toNumber(value: string | null | undefined): number {
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
    };
}