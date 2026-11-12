// src/services/profile/profileMapper.ts
import type {
    MerchantProfile,
    MerchantProfileApiResponse,
} from '@/types/profile';

// The server sends null for missing values. Turn those into
// empty text, and remove extra spaces.
function clean(value: string | null | undefined): string {
    return (value ?? '').trim();
}

// Converts the server's answer into the shape our screens use.
export function mapMerchantProfile(
    response: MerchantProfileApiResponse
): MerchantProfile {
    // "First Last", or the merchant name, or a safe default.
    const fullName =
        [clean(response.firstname), clean(response.lastname)]
            .filter(Boolean)
            .join(' ') ||
        clean(response.merchantname) ||
        'Merchant';

    return {
        merchantId: clean(response.merchantid),
        merchantCode: clean(response.merchantcode),
        fullName,
        businessName: clean(response.businessname),
        email: clean(response.emailaddress),
        mobileNumber: clean(response.mobilenumber),
        city: clean(response.city),
        country: clean(response.country),
    };
}