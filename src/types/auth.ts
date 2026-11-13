// src/types/auth.ts

export type MerchantRole = 'MERCHANT';

export type MerchantStatus = 'ACTIVE' | 'SUSPENDED';

export interface MerchantUser {
    id: string;
    merchantId: string;
    username: string;
    fullName: string;
    email: string;
    role: MerchantRole;
    status: MerchantStatus;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface AuthSession {
    accessToken: string;
    user: MerchantUser;
    loginTime?: string;
    picture?: string;
}