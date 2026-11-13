// src/services/dashboard/dashboardService.ts
import { API_ENCRYPT_KEY, USE_DEMO_API } from '@/constants/api';
import { postToMerchantApi } from '@/services/api/apiClient';
import { mapDashboardResponse } from '@/services/dashboard/dashboardMapper';

import type {
    DashboardApiResponse,
    DashboardPeriod,
    DashboardSummary,
} from '@/types/dashboard';

// Used only when USE_DEMO_API is true.
const demoDashboardSummary: DashboardSummary = {
    successfulAmountCDF: 248000,
    successfulAmountUSD: 1250,
    failedAmountCDF: 4000,
    failedAmountUSD: 35,
    successfulSeries: 92,
    failedSeries: 8,
};

// Retrieves the dashboard figures for one time period.
export async function getDashboardSummary(
    username: string,
    token: string,
    userId: string,
    period: DashboardPeriod
): Promise<DashboardSummary> {
    if (USE_DEMO_API) {
        return { ...demoDashboardSummary };
    }

    const response = await postToMerchantApi<DashboardApiResponse>(
        'getbulkpaymentdashboardinformation',
        {
            username,
            token,
            userid: userId,
            // Spelled exactly as the web portal sends it.
            searchtext: 'BullkPaymentToMobile',
            encryptkey: API_ENCRYPT_KEY,
            combineddashboardgraph: { timePeriod: period },
        }
    );

    return mapDashboardResponse(response);
}