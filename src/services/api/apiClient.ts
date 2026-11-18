// src/services/api/apiClient.ts
import { API_BASE_URL } from '@/constants/api';

// Every answer from the server has these two fields.
// '00' or '1000' means success.
export interface ApiResponse {
    respcode: string;
    respcodedesc: string;
    rrn?: string | null;
}

// The server uses two codes for success:
// '00' on dashboard and profile, '1000' on login and logout.
const SUCCESS_CODES = ['00', '1000'];

// Codes meaning the server no longer accepts this session's token.
// '1006' (LogIn Denied) came back when the dashboard was called without
// a valid login. Add other codes here if the server turns out to use them.
const SESSION_EXPIRED_CODES = ['1006'];

// Stop waiting for the server after 20 seconds.
const REQUEST_TIMEOUT_MS = 20000;

// An error we raise ourselves, with a code and a message.
export class ApiError extends Error {
    code: string;

    constructor(message: string, code: string) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
    }
}

// AuthContext puts a function here. It runs when the session has expired.
let sessionExpiredHandler: (() => void) | null = null;

export function setSessionExpiredHandler(
    handler: (() => void) | null
): void {
    sessionExpiredHandler = handler;
}

// While developing, print each server answer in the Expo terminal.
// Only the endpoint and the code are printed, never the request body,
// so passwords, tokens and the key never appear in the logs.
function logResult(endpoint: string, code: string, description: string) {
    if (__DEV__) {
        console.log(`[API] ${endpoint} -> ${code} ${description}`);
    }
}

// Field names whose values are never printed.
const HIDDEN_FIELDS = ['password', 'token', 'encryptkey', 'pindata'];

// The request body as text, with secret values replaced by <hidden>.
function describeBody(body: Record<string, unknown>): string {
    const safeBody = Object.fromEntries(
        Object.entries(body).map(([key, value]) => [
            key,
            HIDDEN_FIELDS.includes(key.toLowerCase()) ? '<hidden>' : value,
        ])
    );

    return JSON.stringify(safeBody);
}

// Sends a POST request with a JSON body to one endpoint, for example 'login'.
export async function postToMerchantApi<T extends ApiResponse>(
    endpoint: string,
    body: Record<string, unknown>
): Promise<T> {

    if (__DEV__) {
        console.log(`[API] ${endpoint} sending ${describeBody(body)}`);
    }

    // Lets us cancel the request if the server takes too long.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;

    try {
        response = await fetch(`${API_BASE_URL}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
    } catch {
        // No answer at all: wrong address, no network, or timed out.
        logResult(endpoint, 'NETWORK', 'no answer from the server');

        throw new ApiError(
            'No connection to the server. Check your network and try again.',
            'NETWORK'
        );
    } finally {
        clearTimeout(timer);
    }

    if (!response.ok) {
        logResult(endpoint, `HTTP_${response.status}`, 'server error');

        throw new ApiError(
            'The server is not responding right now. Please try again.',
            `HTTP_${response.status}`
        );
    }

    let data: T;

    try {
        data = (await response.json()) as T;
    } catch {
        logResult(endpoint, 'INVALID_JSON', 'answer was not JSON');

        throw new ApiError(
            'The server sent an unexpected response.',
            'INVALID_JSON'
        );
    }

    const code = String(data.respcode ?? '');
    logResult(
        endpoint,
        code,
        `${data.respcodedesc ?? ''} (rrn ${data.rrn ?? '-'})`
    );

    // The server reports business errors inside a 200 response.
    if (!SUCCESS_CODES.includes(code)) {
        if (SESSION_EXPIRED_CODES.includes(code)) {
            sessionExpiredHandler?.();
        }

        throw new ApiError(data.respcodedesc || 'Request failed.', code);
    }

    return data;
}