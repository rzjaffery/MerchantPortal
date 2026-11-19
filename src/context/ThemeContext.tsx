// src/context/ThemeContext.tsx
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type PropsWithChildren,
} from 'react';

import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import {
    darkColors,
    lightColors,
    type AppColors,
} from '@/theme/colors';

// 'system' follows the phone. 'light' and 'dark' ignore the phone.
export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'merchant_portal_theme_preference';

function isThemePreference(value: unknown): value is ThemePreference {
    return value === 'system' || value === 'light' || value === 'dark';
}

interface ThemeContextValue {
    // What the user chose.
    preference: ThemePreference;
    setPreference: (preference: ThemePreference) => void;
    // Whether the app is dark right now, after applying the choice.
    isDark: boolean;
    // The palette for the current mode.
    colors: AppColors;
    // False until the saved choice has been read from the phone.
    isReady: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren) {
    // The phone's own setting. It updates by itself when the user changes it.
    const systemScheme = useColorScheme();

    const [preference, setPreferenceState] =
        useState<ThemePreference>('system');
    const [isReady, setIsReady] = useState(false);

    // Read the saved choice once, when the app starts.
    useEffect(() => {
        let active = true;

        SecureStore.getItemAsync(STORAGE_KEY)
            .then((saved) => {
                if (active && isThemePreference(saved)) {
                    setPreferenceState(saved);
                }
            })
            .catch(() => {
                // Nothing saved or unreadable: keep 'system'.
            })
            .finally(() => {
                if (active) {
                    setIsReady(true);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    // Change the mode and remember it for next time.
    const setPreference = useCallback((next: ThemePreference) => {
        setPreferenceState(next);

        SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => {
            // If saving fails, the choice still applies until the app closes.
        });
    }, []);

    const isDark =
        preference === 'system'
            ? systemScheme === 'dark'
            : preference === 'dark';

    const value = useMemo<ThemeContextValue>(
        () => ({
            preference,
            setPreference,
            isDark,
            colors: isDark ? darkColors : lightColors,
            isReady,
        }),
        [preference, setPreference, isDark, isReady]
    );

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useAppTheme(): ThemeContextValue {
    const context = useContext(ThemeContext);

    if (context === undefined) {
        throw new Error('useAppTheme must be used inside ThemeProvider.');
    }

    return context;
}

// Builds a component's styles from the current colours.
// The styles are only rebuilt when the mode changes.
export function useThemedStyles<T>(
    createStyles: (colors: AppColors) => T
): T {
    const { colors } = useAppTheme();

    return useMemo(() => createStyles(colors), [colors, createStyles]);
}
