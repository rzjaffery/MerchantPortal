// src/services/transactions/transactionsService.ts
import { API_ENCRYPT_KEY } from '@/constants/api';
import { postToMerchantApi } from '@/services/api/apiClient';
import { parseServerDateTime, toServerDateTime } from '@/utils/dateTime';

import type {
    Transaction,
    TransactionApiItem,
    TransactionApiResponse,
    TransactionCurrencyFilter,
    TransactionPage,
    TransactionStatusFilter,
} from '@/types/transactions';

// What the server expects in "respfilter" for each status choice.
// 'ALL' sends nothing, so the server returns every status.
const STATUS_CODES: Record<TransactionStatusFilter, string | undefined> = {
    ALL: undefined,
    APPROVED: '00',
    DECLINED: 'D',
};

// Text from a value that may be text, a number or missing.
function readText(value: string | number | null | undefined): string {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value).trim();
}

// The server sends money in cents (1085444 means 10,854.44),
// so divide by 100 to get the real amount.
function readAmount(value: string | number | null | undefined): number {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed / 100 : 0;
}

function mapTransaction(item: TransactionApiItem): Transaction {
    const responseCode = readText(item.respCode);

    return {
        id: readText(item.txnRefNumber),
        dateTime: parseServerDateTime(readText(item.tranDateTime)),
        amount: readAmount(item.amountTran),
        currency: readText(item.tranCurrency),
        isApproved: responseCode === '00',
        responseCode,
        responseDescription: readText(item.respCodeDesc),
        paymentMethod: readText(item.paymentMethod),
        transactionType: readText(item.trantype),
        invoiceId: readText(item.invoiceid),
        mobileNumber: readText(item.mobilenumber),
        destinationMobileNumber: readText(item.destmobilenumber),
        businessName: readText(item.businessname),
        reason: readText(item.reason),
    };
}

interface TransactionsRequest {
    username: string;
    token: string;
    userId: string;
    merchantId: string;
    // Start and end of the period, both included.
    from: Date;
    to: Date;
    status: TransactionStatusFilter;
    currency: TransactionCurrencyFilter;
    // Page number, starting at 1.
    page: number;
    pageSize: number;
}

// Loads one page of the merchant's transactions.
export async function getTransactions(
    request: TransactionsRequest
): Promise<TransactionPage> {
    // The website's "illicocash Reporting" page uses this same endpoint.
    // Like the QR log, the server needs a date range and page fields.
    const response = await postToMerchantApi<TransactionApiResponse>(
        'searchtransactionlist',
        {
            username: request.username,
            userid: request.userId,
            token: request.token,
            encryptkey: API_ENCRYPT_KEY,
            merchantid: request.merchantId,
            startdate: toServerDateTime(request.from),
            enddate: toServerDateTime(request.to),
            // A value of undefined is left out of the request.
            respfilter: STATUS_CODES[request.status],
            trancurrency:
                request.currency === 'ALL' ? undefined : request.currency,
            pagecount: String(request.page),
            pagesize: String(request.pageSize),
        }
    );

    const items = response.transactionportallist ?? [];

    // While developing, print the field NAMES of the first row (never the
    // values) so we can check them against TransactionApiItem.
    if (__DEV__ && items.length > 0) {
        console.log(
            `[Transactions] first row fields: ${Object.keys(items[0]).join(', ')}`
        );
    }

    const total = Number(response.totalcount);

    return {
        transactions: items.map(mapTransaction),
        totalCount: Number.isFinite(total) ? total : items.length,
    };
}