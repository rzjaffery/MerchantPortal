// src/services/credentials/credentialsService.ts
import {
    API_ENCRYPT_KEY,
    DUMMY_OTP,
    PIN_ENCRYPT_KEY,
    USE_DUMMY_OTP,
} from '@/constants/api';

import {
    ApiError,
    postToMerchantApi,
    type ApiResponse,
} from '@/services/api/apiClient';

import { encryptPinBlock } from '@/utils/pinBlock';

// Waits a moment, so the dummy "sending" looks like a real request.
function pause(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

// Step 1 of Reset PIN: ask the server to text an OTP to the merchant.
// With USE_DUMMY_OTP nothing is sent.
export async function sendPinOtp(
    username: string,
    token: string,
    mobileNumber: string
): Promise<void> {
    if (USE_DUMMY_OTP) {
        await pause(600);
        return;
    }

    await postToMerchantApi<ApiResponse>('createotp', {
        username,
        token,
        mobilenumber: mobileNumber,
        encryptkey: API_ENCRYPT_KEY,
    });
}

// Step 1 of Reset Password.
// The server has no OTP step for passwords yet, so this is always a dummy.
// TODO: replace when the backend adds one.
export async function sendPasswordOtp(): Promise<void> {
    await pause(600);
}

interface ResetPinRequest {
    username: string;
    userId: string;
    token: string;
    mobileNumber: string;
    otp: string;
    newPin: string;
}

// Step 2 of Reset PIN: check the OTP and set the new PIN.
export async function resetPin(request: ResetPinRequest): Promise<void> {
    // The PIN is encrypted here, exactly like the website does it.
    const newPinData = encryptPinBlock(
        request.mobileNumber,
        request.newPin,
        PIN_ENCRYPT_KEY
    );

    const body: Record<string, unknown> = {
        username: request.username,
        userid: request.userId,
        token: request.token,
        mobilenumber: request.mobileNumber,
        encryptkey: API_ENCRYPT_KEY,
        newpindata: newPinData,
        advanceflag: 'true',
    };

    if (USE_DUMMY_OTP) {
        // The server did not send an OTP, so we check the dummy code here
        // and ask the server only to change the PIN.
        if (request.otp !== DUMMY_OTP) {
            throw new ApiError('The OTP is not correct.', 'INVALID_OTP');
        }

        await postToMerchantApi<ApiResponse>('changepin', body);
        return;
    }

    // The server checks the OTP and changes the PIN in one call.
    await postToMerchantApi<ApiResponse>('confirmotp', {
        ...body,
        otp: request.otp,
    });
}

interface ChangePasswordRequest {
    username: string;
    token: string;
    otp: string;
    newPassword: string;
}

// Step 2 of Reset Password: check the dummy OTP and set the new password.
// The server ends every session after this, so the user must log in again.
export async function changePassword(
    request: ChangePasswordRequest
): Promise<void> {
    // TODO: the server cannot check an OTP for passwords yet.
    if (request.otp !== DUMMY_OTP) {
        throw new ApiError('The OTP is not correct.', 'INVALID_OTP');
    }

    await postToMerchantApi<ApiResponse>('changepassword', {
        username: request.username,
        token: request.token,
        newpassword: request.newPassword,
        encryptkey: API_ENCRYPT_KEY,
    });
}
