// src/types/dynamicQr.ts
import type { ApiResponse } from '@/services/api/apiClient';

export type QrCurrency = 'USD' | 'CDF';

// One terminal in the shape the screen uses.
export interface Terminal {
    id: string;
    description: string;
}

// The terminal list answer from the server.
// The field holding the list has not been confirmed yet, so the
// service checks the likely names (see dynamicQrService.ts).
export interface TerminalListApiResponse extends ApiResponse {
    [field: string]: unknown;
}

// What the merchant fills in, plus the read-only values.
export interface DynamicQrRequest {
    terminalId: string;
    merchantId: string;
    merchantName: string;
    address: string;
    customerMobileNumber: string;
    invoiceId: string;
    // The amount as the merchant typed it, e.g. 200.5 for 200.50.
    amount: number;
    currency: QrCurrency;
    // The time shown on screen, e.g. 20261120105130.
    paymentDateTime: string;
}

// The generate answer from the server.
export interface GenerateDynamicQrApiResponse extends ApiResponse {
    [field: string]: unknown;
}
