
import * as SecureStore from 'expo-secure-store';

import type { AuthSession } from '@/types/auth';

const SESSION_STORAGE_KEY = 'merchant_portal_auth_session';

/**
 * Checks whether the saved data has the expected session structure.
 */
function isValidSession(value: unknown): value is AuthSession {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const session = value as Record<string, unknown>;

    if (
        typeof session.accessToken !== 'string' ||
        session.accessToken.length === 0 ||
        typeof session.user !== 'object' ||
        session.user === null
    ) {
        return false;
    }

    const user = session.user as Record<string, unknown>;

    return (
        typeof user.id === 'string' &&
        typeof user.username === 'string' &&
        typeof user.fullName === 'string' &&
        typeof user.email === 'string' &&
        user.role === 'MERCHANT' &&
        (user.status === 'ACTIVE' || user.status === 'SUSPENDED')
    );
}

/**
 * Saves the complete authentication session securely.
 */
export async function saveSession(
    session: AuthSession
): Promise<void> {

    const {picture: _picture, ...sessionToSave} = session;

    await SecureStore.setItemAsync(
        SESSION_STORAGE_KEY,
        JSON.stringify(session)
    );
}

/**
 * Retrieves the previous authentication session.
 * Returns null when no valid session exists.
 */
export async function getSession(): Promise<AuthSession | null> {
    const storedSession = await SecureStore.getItemAsync(
        SESSION_STORAGE_KEY
    );

    if (!storedSession) {
        return null;
    }

    try {
        const parsedSession: unknown = JSON.parse(storedSession);

        if (isValidSession(parsedSession)) {
            return parsedSession;
        }

        await clearSession();
        return null;
    } catch {
        await clearSession();
        return null;
    }
}

/**
 * Removes the authentication session.
 */
export async function clearSession(): Promise<void> {
    await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
}
