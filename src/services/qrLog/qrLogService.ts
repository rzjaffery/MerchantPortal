// src/services/qrLog/qrLogService.ts
import { API_ENCRYPT_KEY } from '@/constants/api';
import { postToMerchantApi } from '@/services/api/apiClient';

import type {
    QrLogApiItem,
    QrLogApiResponse,
    QrLogEntry,
    QrLogPage,
} from '@/types/qrLog';

// Adds a leading zero: 7 becomes "07".
function pad(value: number): string {
    return String(value).padStart(2, '0');
}

// The date format the server expects: 20261120000000
// (year, month, day, hour, minute, second).
function toServerDateTime(date: Date): string {
    return (
        `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
        `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
    );
}

// Text from a value that may be text, a number or missing.
function readText(value: string | number | null | undefined): string {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value).trim();
}

// The server sends dates as milliseconds, e.g. 1795161708000.
function readDate(value: number | null | undefined): Date | null {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
        return null;
    }

    return new Date(value);
}

function mapEntry(item: QrLogApiItem): QrLogEntry {
    return {
        id: readText(item.id) || readText(item.requestTxn),
        referenceNumber: readText(item.requestTxn),
        merchantId: readText(item.merchantId),
        invoiceId: readText(item.invoiceId),
        amount: readText(item.amount),
        transactionType: readText(item.transactionType),
        status: readText(item.status).toUpperCase(),
        createDate: readDate(item.createDate),
        paymentDate: readDate(item.paymentDate),
        mobileNumber: readText(item.customerMobileNumber),
        paymentTxn: readText(item.paymentTxn),
        reversedTxn: readText(item.reversedTxn),
        cancelTxn: readText(item.cancelTxn),
        qrData: readText(item.qRData),
    };
}

interface QrLogRequest {
    username: string;
    token: string;
    merchantId: string;
    // Start and end of the period, both included.
    from: Date;
    to: Date;
    // Page number, starting at 1.
    page: number;
    pageSize: number;
}

// Loads one page of the merchant's QR payment log.
export async function getQrPaymentLog(
    request: QrLogRequest
): Promise<QrLogPage> {
    // The server needs a date range and page fields. Without them it
    // answers 46 ("Oops something went wrong").
    const response = await postToMerchantApi<QrLogApiResponse>(
        'getqrpaymentloglist',
        {
            username: request.username,
            token: request.token,
            encryptkey: API_ENCRYPT_KEY,
            merchantid: request.merchantId,
            startdate: toServerDateTime(request.from),
            enddate: toServerDateTime(request.to),
            pagecount: String(request.page),
            pagesize: String(request.pageSize),
        }
    );

    const entries = (response.merchantqrpaymentloglist ?? []).map(mapEntry);
    const total = Number(response.totalcount);

    return {
        entries,
        totalCount: Number.isFinite(total) ? total : entries.length,
    };
}
