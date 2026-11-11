
import type {
    AuthSession,
    LoginCredentials,
} from '@/types/auth';

// Development-only demo credentials.
// These are NOT real merchant credentials.
export const DEMO_CREDENTIALS = {
    email: 'merchant.demo@example.com',
    password: 'Demo123!',
} as const;

export async function signInWithDemo(
    credentials: LoginCredentials
): Promise<AuthSession> {
    const email = credentials.email.trim().toLowerCase();

    const isValid =
        email === DEMO_CREDENTIALS.email &&
        credentials.password === DEMO_CREDENTIALS.password;

    if (!isValid) {
        throw new Error('Invalid email or password.');
    }

    return {
        // Simulated token. Never use this in production.
        accessToken: 'demo-access-token-not-for-production',

        user: {
            id: 'merchant-001',
            fullName: 'Demo Merchant',
            email: DEMO_CREDENTIALS.email,
            role: 'MERCHANT',
            status: 'ACTIVE',
        },
    };
}
