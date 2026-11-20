// src/types/profile.ts
import type { ApiResponse } from '@/services/api/apiClient';

// The profile answer exactly as the server sends it.
// Only the fields we use are listed. The server sends many more.
export interface MerchantProfileApiResponse extends ApiResponse {
    merchantid: string | null;
    merchantcode: string | null;
    merchantname: string | null;
    merchanttype: string | null;
    businessname: string | null;
    firstname: string | null;
    lastname: string | null;
    emailaddress: string | null;
    mobilenumber: string | null;
    city: string | null;
    country: string | null;
    address: string | null;
    walletsAndLinkedAccounts: {
        walletUSDBalance: string | null;
        walletCDFBalance: string | null;
    } | null;
}

// The profile in the shape our screens use.
export interface MerchantProfile {
    merchantId: string;
    merchantCode: string;
    merchantType: string;
    fullName: string;
    merchantName: string;
    businessName: string;
    email: string;
    mobileNumber: string;
    city: string;
    country: string;
    address: string;
    usdBalance: number;
    cdfBalance: number;
}