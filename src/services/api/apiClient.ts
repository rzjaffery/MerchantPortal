// src/services/api/apiClient.ts
import { API_BASE_URL } from '@/constants/api';

// Every answer from the server has these two fields (you can see them
// in the responses you pasted). '00' means success.
export interface ApiResponse {
    respcode: string;
    respcodedesc: string;
}

// An error we raise ourselves, with a code and a message.
export class ApiError extends Error {
    code: string;

    constructor(message: string, code: string) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
    }
}

// Sends a POST request with a JSON body to one endpoint, for example 'login'.
export async function postToMerchantApi<T extends ApiResponse>(
    endpoint: string,
    body: Record<string, unknown>
): Promise<T> {
    let response: Response;

    try {
        response = await fetch(`${API_BASE_URL}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    } catch {
        // fetch throws when the phone can't reach the server at all.
        throw new ApiError(
            'No connection to the server. Check your network and try again.',
            'NETWORK'
        );
    }

    if (!response.ok) {
        throw new ApiError(
            'The server is not responding right now. Please try again.',
            `HTTP_${response.status}`
        );
    }

    let data: T;

    try {
        data = (await response.json()) as T;
    } catch {
        throw new ApiError('The server sent an unexpected response.', 'INVALID_JSON');
    }

    // The server reports business errors inside a 200 response,
    // using respcode. Anything other than '00' is a failure.
    if (data.respcode !== '00') {
        throw new ApiError(data.respcodedesc || 'Request failed.', data.respcode);
    }

    return data;
}