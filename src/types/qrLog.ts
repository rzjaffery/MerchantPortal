// src/types/qrLog.ts
import type { ApiResponse } from '@/services/api/apiClient';

// One entry exactly as the server sends it.
export interface QrLogApiItem {
    id: number | null;
    requestTxn: number | string | null;
    merchantId: string | null;
    invoiceId: string | null;
    amount: string | null;
    transactionType: string | null;
    status: string | null;
    // Milliseconds since 1 January 1970, e.g. 1795161708000.
    createDate: number | null;
    paymentDate: number | null;
    customerMobileNumber: string | null;
    paymentTxn: number | string | null;
    reversedTxn: number | string | null;
    cancelTxn: number | string | null;
    qRData: string | null;
}

// The log answer from the server.
export interface QrLogApiResponse extends ApiResponse {
    merchantqrpaymentloglist: QrLogApiItem[] | null;
    // How many entries exist in total for this date range, e.g. "4".
    totalcount: string | null;
}

// One entry in the shape the screen uses.
export interface QrLogEntry {
    id: string;
    referenceNumber: string;
    merchantId: string;
    invoiceId: string;
    // The amount text as stored, e.g. "125.00".
    amount: string;
    transactionType: string;
    status: string;
    createDate: Date | null;
    paymentDate: Date | null;
    mobileNumber: string;
    paymentTxn: string;
    reversedTxn: string;
    cancelTxn: string;
    qrData: string;
}

export interface QrLogPage {
    entries: QrLogEntry[];
    totalCount: number;
}
