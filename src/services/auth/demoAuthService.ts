// src/services/auth/demoAuthService.ts
import type {
    AuthSession,
    LoginCredentials,
} from '@/types/auth';

// Development-only demo credentials.
// These are NOT real merchant credentials.
export const DEMO_CREDENTIALS = {
    username: 'demo.merchant',
    password: 'Demo123!',
} as const;

export async function signInWithDemo(
    credentials: LoginCredentials
): Promise<AuthSession> {
    const username = credentials.username.trim().toLowerCase();

    const isValid =
        username === DEMO_CREDENTIALS.username &&
        credentials.password === DEMO_CREDENTIALS.password;

    if (!isValid) {
        throw new Error('Invalid username or password.');
    }

    return {
        // Simulated token. Never use this in production.
        accessToken: 'demo-access-token-not-for-production',

        user: {
            id: 'merchant-001',
            username: DEMO_CREDENTIALS.username,
            fullName: 'Demo Merchant',
            email: 'merchant.demo@example.com',
            role: 'MERCHANT',
            status: 'ACTIVE',
        },
    };
}