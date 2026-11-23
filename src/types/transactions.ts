// src/types/transactions.ts
import type { ApiResponse } from '@/services/api/apiClient';

// One transaction exactly as the server sends it.
// Every field can be missing, so every field is optional.
export interface TransactionApiItem {
    txnRefNumber?: string | null;
    // 14 digits: 20261023160413 (year, month, day, hour, minute, second).
    tranDateTime?: string | null;
    // In cents: "1085444" means 10,854.44.
    amountTran?: string | null;
    tranCurrency?: string | null;
    // "00" means approved. Anything else means the payment did not go through.
    respCode?: string | null;
    respCodeDesc?: string | null;
    paymentMethod?: string | null;
    trantype?: string | null;
    invoiceid?: string | null;
    mobilenumber?: string | null;
    destmobilenumber?: string | null;
    businessname?: string | null;
    reason?: string | null;
}

// The answer of the transaction search.
export interface TransactionApiResponse extends ApiResponse {
    transactionportallist: TransactionApiItem[] | null;
    // How many transactions exist in total for this search, e.g. "42".
    totalcount: string | null;
}

// One transaction in the shape the screen uses.
export interface Transaction {
    // The reference number. It is also used as the list key.
    id: string;
    dateTime: Date | null;
    // The real amount, already divided by 100.
    amount: number;
    currency: string;
    isApproved: boolean;
    responseCode: string;
    responseDescription: string;
    paymentMethod: string;
    transactionType: string;
    invoiceId: string;
    mobileNumber: string;
    destinationMobileNumber: string;
    businessName: string;
    reason: string;
}

export interface TransactionPage {
    transactions: Transaction[];
    totalCount: number;
}

// The status choices: All, Successful (code 00) or Failed (code D).
export type TransactionStatusFilter = 'ALL' | 'APPROVED' | 'DECLINED';

// The currency choices.
export type TransactionCurrencyFilter = 'ALL' | 'USD' | 'CDF';