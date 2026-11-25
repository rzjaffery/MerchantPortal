// src/types/subMerchant.ts
import type { ApiResponse } from '@/services/api/apiClient';

// One branch, shop or till exactly as the server sends it.
export interface SubMerchantApiItem {
    merchantid: string | null;
    businessname: string | null;
    parentid: string | null;
    merchanttype: string | null;
    cnic: string | null;
    identificationtype: string | null;
    address: string | null;
    mobilenumber: string | null;
    userid: string | null;
    // Only the children of a branch / shop. One level deeper.
    submerchants?: SubMerchantApiItem[] | null;
}

// The answer of "getmerchantlist".
export interface SubMerchantListApiResponse extends ApiResponse {
    merchantlist: SubMerchantApiItem[] | null;
}

// A branch, shop or till in the shape our screens use.
export interface SubMerchant {
    merchantId: string;
    businessName: string;
    parentId: string;
    // "2" branch, "3" shop, "4" till.
    merchantType: string;
    cnic: string;
    identificationType: string;
    address: string;
    mobileNumber: string;
    userId: string;
}
