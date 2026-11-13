// src/services/profile/profileService.ts
import { API_ENCRYPT_KEY } from '@/constants/api';
import { postToMerchantApi } from '@/services/api/apiClient';
import { mapMerchantProfile } from '@/services/profile/profileMapper';

import type {
    MerchantProfile,
    MerchantProfileApiResponse,
} from '@/types/profile';

// Retrieves the merchant's profile from the server.
export async function getMerchantProfile(
    merchantId: string
): Promise<MerchantProfile> {
    const response = await postToMerchantApi<MerchantProfileApiResponse>(
        'getmerchantprofile',
        {
            merchantid: merchantId,
            reason: 'MerchantAccountNumberUpdate',
            encryptkey: API_ENCRYPT_KEY,
        }
    );

    return mapMerchantProfile(response);
}