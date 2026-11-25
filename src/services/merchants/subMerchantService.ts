// src/services/merchants/subMerchantService.ts
import { API_ENCRYPT_KEY } from '@/constants/api';

import { ApiError, postToMerchantApi } from '@/services/api/apiClient';

import type {
    SubMerchant,
    SubMerchantApiItem,
    SubMerchantListApiResponse,
} from '@/types/subMerchant';

// The server answers with this code when the merchant has no branches,
// shops or tills. That is not an error for us.
const NO_RECORDS_CODE = '71';

// Text from a value that may be missing.
function readText(value: string | null | undefined): string {
    return value?.trim() ?? '';
}

function mapItem(item: SubMerchantApiItem): SubMerchant {
    return {
        merchantId: readText(item.merchantid),
        businessName: readText(item.businessname),
        parentId: readText(item.parentid),
        merchantType: readText(item.merchanttype),
        cnic: readText(item.cnic),
        identificationType: readText(item.identificationtype),
        address: readText(item.address),
        mobileNumber: readText(item.mobilenumber),
        userId: readText(item.userid),
    };
}

// Loads the branches, shops and tills under a merchant.
// The server sends two levels: the children, and each child's own children.
// We join both levels into one list.
export async function getSubMerchants(
    username: string,
    token: string,
    userId: string,
    merchantId: string
): Promise<SubMerchant[]> {
    let response: SubMerchantListApiResponse;

    try {
        response = await postToMerchantApi<SubMerchantListApiResponse>(
            'getmerchantlist',
            {
                username,
                token,
                userid: userId,
                // The server only accepts the logged-in merchant's own ID here.
                parentid: merchantId,
                encryptkey: API_ENCRYPT_KEY,
            }
        );
    } catch (error) {
        if (error instanceof ApiError && error.code === NO_RECORDS_CODE) {
            return [];
        }

        throw error;
    }

    const result: SubMerchant[] = [];
    const seen = new Set<string>();

    function add(item: SubMerchantApiItem) {
        const mapped = mapItem(item);

        if (mapped.merchantId && !seen.has(mapped.merchantId)) {
            seen.add(mapped.merchantId);
            result.push(mapped);
        }
    }

    for (const child of response.merchantlist ?? []) {
        add(child);

        for (const grandChild of child.submerchants ?? []) {
            add(grandChild);
        }
    }

    return result;
}
