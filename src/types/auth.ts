// src/types/auth.ts

export type MerchantRole = 'MERCHANT';

export type MerchantStatus = 'ACTIVE' | 'SUSPENDED';

export interface MerchantUser {
    id: string;
    // The login name. The server needs it on every request.
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
}