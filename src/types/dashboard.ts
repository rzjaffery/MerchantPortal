// src/types/dashboard.ts

import {ApiResponse} from "@/services/api/apiClient";

export interface DashboardSummary {
    successfulAmountCDF: number;
    successfulAmountUSD: number;
    failedAmountCDF: number;
    failedAmountUSD: number;
}

// The dashboard answer exactly as the server sends it.
// Field names match the response you pasted, and amounts arrive as text.
export interface DashboardApiResponse extends ApiResponse {
    combineddashboardgraph: {
        successfulAmountCDF: string | null;
        successfulAmountUSD: string | null;
        failedAmountCDF: string | null;
        failedAmountUSD: string | null;
        timePeriod: string | null;
    } | null;
}