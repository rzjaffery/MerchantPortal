// src/services/transactions/transactionsService.ts
import { API_ENCRYPT_KEY } from '@/constants/api';
import { postToMerchantApi } from '@/services/api/apiClient';
import { parseServerDateTime } from '@/utils/dateTime';

import type {
    Transaction,
    TransactionApiItem,
    TransactionApiResponse,
    TransactionPage,
    TransactionStatusFilter,
} from '@/types/transactions';

// What the server expects in "typefilter" for each status choice.
const STATUS_FILTERS: Record<TransactionStatusFilter, string> = {
    ALL: 'ALL',
    APPROVED: 'APPROVED',
    DECLINED: 'FAILED',
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
    // "1" is a top-level merchant. Defaults to "1" when not given.
    merchantType?: string;
    status: TransactionStatusFilter;
    // Page number, starting at 1.
    page: number;
    pageSize: number;
}

// Loads one page of the merchant's transactions.
export async function getTransactions(
    request: TransactionsRequest
): Promise<TransactionPage> {
    // The website's "Live Transactions" page uses this same endpoint.
    // Key names must be exactly these, all lowercase: the server ignores
    // keys it does not know. This is the same body as the Postman call.
    const response = await postToMerchantApi<TransactionApiResponse>(
        'gettransactionlist',
        {
            username: request.username,
            token: request.token,
            typefilter: STATUS_FILTERS[request.status],
            pagecount: String(request.page),
            pagesize: String(request.pageSize),
            merchantid: request.merchantId,
            merchanttype: request.merchantType ?? '1',
            userid: request.userId,
            encryptkey: API_ENCRYPT_KEY,
        }
    );

    const items = response.transactionportallist ?? [];

    // While developing, print the field NAMES of the first row (never the
    // values) so we can check them against TransactionApiItem.
    if (__DEV__ && items.length > 0) {
        console.log(
            `[Transactions] first row fields: ${Object.keys(items[0]).join(', ')}`
        );``
    }

    const total = Number(response.totalcount);

    return {
        transactions: items.map(mapTransaction),
        totalCount: Number.isFinite(total) ? total : items.length,
    };
}