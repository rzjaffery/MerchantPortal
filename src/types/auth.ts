
export type MerchantRole = 'MERCHANT';

export type MerchantStatus = 'ACTIVE' | 'SUSPENDED';

export interface MerchantUser {
    id: string;
    fullName: string;
    email: string;
    role: MerchantRole;
    status: MerchantStatus;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface AuthSession {
    accessToken: string;
    user: MerchantUser;
}
