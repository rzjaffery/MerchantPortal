// src/services/dynamicQr/dynamicQrService.ts
import { API_ENCRYPT_KEY } from '@/constants/api';
import { ApiError, postToMerchantApi } from '@/services/api/apiClient';

import type {
    DynamicQrRequest,
    GenerateDynamicQrApiResponse,
    Terminal,
    TerminalListApiResponse,
} from '@/types/dynamicQr';

// ---------------------------------------------------------------------------
// TO CONFIRM against the website's own request (F12 > Network > Payload).
// Each setting below is a guess from the Postman sample. Change it here only.
// ---------------------------------------------------------------------------

// true = put the customer's mobile number inside qrData as "mobilenumber",
// so only that customer can pay. The web form has this field, but the
// Postman sample for this request does not include it.
const SEND_MOBILE_NUMBER = true;

// ---------------------------------------------------------------------------

// Fields in which a list of terminals might arrive.
const TERMINAL_LIST_FIELDS = ['terminallist', 'terminalList', 'resplist'];

// Reads text from a value that may be text, a number or missing.
function readText(value: unknown): string {
    if (typeof value === 'string') {
        return value.trim();
    }

    if (typeof value === 'number') {
        return String(value);
    }

    return '';
}

// Turns one item from the server's list into a Terminal.
function toTerminal(item: unknown): Terminal | null {
    if (item === null || typeof item !== 'object') {
        return null;
    }

    const record = item as Record<string, unknown>;

    const id = readText(record.terminalid ?? record.terminalId ?? record.id);

    if (!id) {
        return null;
    }

    return {
        id,
        description: readText(
            record.description ?? record.terminalname ?? record.name
        ),
    };
}

// Loads the merchant's terminals for the Terminal ID list.
export async function getTerminalList(
    username: string,
    token: string,
    userId: string,
    merchantId: string
): Promise<Terminal[]> {
    const response = await postToMerchantApi<TerminalListApiResponse>(
        'getterminallist',
        {
            username,
            userid: userId,
            token,
            encryptkey: API_ENCRYPT_KEY,
            merchantid: merchantId,
        }
    );

    // Use the first field that holds a list.
    const field = TERMINAL_LIST_FIELDS.find((name) =>
        Array.isArray(response[name])
    );

    if (!field) {
        if (__DEV__) {
            // Helps find the right field name while developing.
            console.log(
                '[DynamicQR] terminal list fields:',
                Object.keys(response).filter(
                    (key) => response[key] !== null
                )
            );
        }

        return [];
    }

    return (response[field] as unknown[])
        .map(toTerminal)
        .filter((terminal): terminal is Terminal => terminal !== null);
}

// Finds the encrypted QR text in the server's answer.
// The documentation says it starts with "DQR" (e.g. "DQR4:...").
function findQrContent(response: GenerateDynamicQrApiResponse): string {
    for (const value of Object.values(response)) {
        if (typeof value === 'string' && value.startsWith('DQR')) {
            return value;
        }
    }

    return '';
}

// Asks the server to create a one-time QR code for this payment.
export async function generateDynamicQr(
    username: string,
    token: string,
    request: DynamicQrRequest
): Promise<string> {
    // Sent like the web portal does: as text with two decimals,
    // exactly as typed. 200 becomes "200.00" and 150.5 becomes "150.50".
    const amount = request.amount.toFixed(2);

    const qrData: Record<string, unknown> = {
        merchantid: request.merchantId,
        merchantname: request.merchantName,
        terminalid: request.terminalId,
        invoiceid: request.invoiceId,
        address: request.address,
        amounttransaction: amount,
        currency: request.currency,
        paymentdatetime: request.paymentDateTime,
    };

    if (SEND_MOBILE_NUMBER) {
        qrData.mobilenumber = request.customerMobileNumber;
    }

    const response = await postToMerchantApi<GenerateDynamicQrApiResponse>(
        'generatedynamicqr',
        {
            username,
            token,
            encryptkey: API_ENCRYPT_KEY,
            merchantid: request.merchantId,
            terminalid: request.terminalId,
            qrData,
            qrversion: '4',
        }
    );

    const content = findQrContent(response);

    if (!content) {
        if (__DEV__) {
            console.log(
                '[DynamicQR] generate response fields:',
                Object.keys(response).filter(
                    (key) => response[key] !== null
                )
            );
        }

        throw new ApiError(
            'The server did not return a QR code. Please try again.',
            'NO_QR'
        );
    }

    return content;
}
