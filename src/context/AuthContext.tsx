
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

import { signInWithDemo } from '@/services/auth/demoAuthService';
import { signInWithApi, signOutWithApi } from '@/services/auth/authService';
import { USE_DEMO_API } from '@/constants/api';

import {
    clearSession,
    getSession,
    saveSession,
} from '@/services/auth/sessionStorage';

import type {
    AuthSession,
    LoginCredentials,
    MerchantUser,
} from '@/types/auth';

interface AuthContextValue {
    user: MerchantUser | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    signIn: (credentials: LoginCredentials) => Promise<void>;
    signOut: () => Promise<void>;
    updateUser: (changes: Partial<MerchantUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [session, setSession] = useState<AuthSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Restore the previous session when the application starts.
    useEffect(() => {
        let isActive = true;

        async function restoreSession() {
            try {
                const savedSession = await getSession();

                if (isActive) {
                    setSession(savedSession);
                }
            } catch (error) {
                console.warn('Unable to restore merchant session:', error);

                if (isActive) {
                    setSession(null);
                }
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        }

        void restoreSession();

        return () => {
            isActive = false;
        };
    }, []);

    // Authenticate and persist the returned session.
    const signIn = useCallback(
        async (credentials: LoginCredentials) => {
            const newSession = USE_DEMO_API
                ? await signInWithDemo(credentials)
                : await signInWithApi(credentials);

            await saveSession(newSession);

            setSession(newSession);
        },
        []
    );

    // Remove the session and reset authentication state.
    const signOut = useCallback(async () => {
        // Tell the server first, so the account isn't left logged in.
        if (session !== null && !USE_DEMO_API) {
            try {
                await signOutWithApi(
                    session.user.username,
                    session.accessToken
                );
            } catch (error) {
                // Log the reason only. Never log the token.
                console.warn(
                    'Server logout failed:',
                    error instanceof Error ? error.message : 'Unknown error'
                );
            }
        }

        // Always clear the phone, even if the server call failed.
        await clearSession();

        setSession(null);
    }, [session]);

    // Update some of the merchant's details, on screen and in storage.
    const updateUser = useCallback(
        async (changes: Partial<MerchantUser>) => {
            if (session === null) {
                return;
            }

            const updatedSession: AuthSession = {
                ...session,
                user: { ...session.user, ...changes },
            };

            await saveSession(updatedSession);

            setSession(updatedSession);
        },
        [session]
    );

    const value = useMemo<AuthContextValue>(
        () => ({
            user: session?.user ?? null,
            accessToken: session?.accessToken ?? null,
            isAuthenticated: session !== null,
            isLoading,
            signIn,
            signOut,
            updateUser,
        }),
        [session, isLoading, signIn, signOut, updateUser]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook for accessing authentication state.
export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);

    if (context === null) {
        throw new Error(
            'useAuth must be used inside an AuthProvider.'
        );
    }

    return context;
}
