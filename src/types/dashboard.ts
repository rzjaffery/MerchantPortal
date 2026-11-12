// src/types/dashboard.ts
import type { ApiResponse } from '@/services/api/apiClient';

// The time periods the server accepts (confirmed so far).
export type DashboardPeriod = 'TODAY' | 'THISYEAR';

// The figures shown on the Dashboard.
export interface DashboardSummary {
    successfulAmountCDF: number;
    successfulAmountUSD: number;
    failedAmountCDF: number;
    failedAmountUSD: number;
    successfulSeries: number;
    failedSeries: number;
}

// The dashboard answer exactly as the server sends it.
export interface DashboardApiResponse extends ApiResponse {
    combineddashboardgraph: {
        successfulAmountCDF: string | null;
        successfulAmountUSD: string | null;
        failedAmountCDF: string | null;
        failedAmountUSD: string | null;
        successfulSeries: number | string | null;
        failedSeries: number | string | null;
        timePeriod: string | null;
    } | null;
}