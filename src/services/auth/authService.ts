// src/services/auth/authService.ts
import { API_ENCRYPT_KEY } from '@/constants/api';

import {
    ApiError,
    postToMerchantApi,
    type ApiResponse,
} from '@/services/api/apiClient';

import type {
    AuthSession,
    LoginCredentials,
} from '@/types/auth';

// The login answer as the server sends it (only the fields we read).
interface LoginApiResponse extends ApiResponse {
    token: string | number | null;
    userid: string | null;
    merchantid: string | null;
    firstname: string | null;
    lastname: string | null;
    merchantname: string | null;
    emailaddress: string | null;
    customerpicture: string | null;
}

function clean(value: string | null | undefined): string {
    return (value ?? '').trim();
}

// Turns the server's picture data into an address an image can display.
function toPictureUri(value: string | null | undefined): string | undefined {
    const data = clean(value);

    if (!data) {
        return undefined;
    }

    if (data.startsWith('data:')) {
        return data;
    }

    // PNG data starts with "iVBOR". Otherwise treat it as JPEG.
    const type = data.startsWith('iVBOR') ? 'png' : 'jpeg';

    return `data:image/${type};base64,${data}`;
}

// Signs in against the real server and builds the app's session.
export async function signInWithApi(
    credentials: LoginCredentials
): Promise<AuthSession> {
    const username = credentials.username.trim();

    const response = await postToMerchantApi<LoginApiResponse>('login', {
        username,
        password: credentials.password,
        encryptkey: API_ENCRYPT_KEY,
    });

    const token =
        response.token === null || response.token === undefined
            ? ''
            : String(response.token);

    if (!token) {
        throw new ApiError(
            'Sign in did not return a session. Please try again.',
            'NO_TOKEN'
        );
    }

    const fullName =
        [clean(response.firstname), clean(response.lastname)]
            .filter(Boolean)
            .join(' ') ||
        clean(response.merchantname) ||
        username;

    return {
        accessToken: token,
        loginTime: new Date().toISOString(),
        picture: toPictureUri(response.customerpicture),
        user: {
            id:
                clean(response.userid) ||
                clean(response.merchantid) ||
                username,
            merchantId: clean(response.merchantid),
            username,
            fullName,
            email: clean(response.emailaddress),
            role: 'MERCHANT',
            status: 'ACTIVE',
        },
    };
}


// Ends the session on the server.
export async function signOutWithApi(
    username: string,
    token: string
): Promise<void> {
    await postToMerchantApi<ApiResponse>('logout', {
        username,
        token,
        encryptkey: API_ENCRYPT_KEY,
    });
}