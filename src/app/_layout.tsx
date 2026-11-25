// src/app/_layout.tsx
import { useEffect, useMemo, type PropsWithChildren } from 'react';

import {
    ActivityIndicator,
    StyleSheet,
    View,
} from 'react-native';

import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';

import { PaperProvider } from 'react-native-paper';
import { createPaperTheme } from '@/theme/paperTheme';
import { LanguageProvider } from '@/context/LanguageContext';
import { DrawerProvider } from '@/context/DrawerContext';
import {
    ThemeProvider,
    useAppTheme,
    useThemedStyles,
} from '@/context/ThemeContext';

import { Montserrat_400Regular } from '@expo-google-fonts/montserrat/400Regular';
import { Montserrat_500Medium } from '@expo-google-fonts/montserrat/500Medium';
import { Montserrat_600SemiBold } from '@expo-google-fonts/montserrat/600SemiBold';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat/700Bold';

import BottomNavBar, { BOTTOM_BAR_ROUTES } from '@/components/common/BottomNavBar';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import type { AppColors } from '@/theme/colors';

void SplashScreen.preventAutoHideAsync();

function AppNavigator() {
    const { isAuthenticated, isLoading } = useAuth();
    const { colors, isDark } = useAppTheme();
    const styles = useThemedStyles(createStyles);
    const pathname = usePathname();

    // The bottom bar shows only for logged-in users, on its own screens.
    const showBottomBar =
        isAuthenticated && BOTTOM_BAR_ROUTES.includes(pathname);

    useEffect(() => {
        if (!isLoading) {
            void SplashScreen.hideAsync();
        }
    }, [isLoading]);

    // Color of the window behind every screen. It shows for a moment
    // during screen animations, so it must match the current theme.
    useEffect(() => {
        SystemUI.setBackgroundColorAsync(colors.background).catch(() => {
            // Not critical: only affects the brief gap during animations.
        });
    }, [colors.background]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    size="large"
                    color={colors.brand.primary}
                />
            </View>
        );
    }

    return (
        <>
            {/* Light status bar text on dark screens, dark text on light ones. */}
            <StatusBar style={isDark ? 'light' : 'dark'} />

            <View style={styles.root}>
                <Stack
                    screenOptions={{
                        headerShown: false,
                        contentStyle: {
                            backgroundColor: colors.background,
                        },
                        animation: 'slide_from_right',
                    }}
                >
                    <Stack.Screen name="index" />

                    <Stack.Protected
                        guard={!isAuthenticated}
                        redirectTo="/dashboard"
                    >
                        <Stack.Screen name="login" />
                    </Stack.Protected>

                    <Stack.Protected
                        guard={isAuthenticated}
                        redirectTo="/login"
                    >
                        <Stack.Screen name="dashboard" options={tabScreenOptions} />
                        <Stack.Screen name="profile" options={tabScreenOptions} />
                        <Stack.Screen name="merchant" options={tabScreenOptions} />
                        <Stack.Screen name="dynamic-qr" options={tabScreenOptions} />
                        <Stack.Screen name="qr-payment-log" options={tabScreenOptions} />
                        <Stack.Screen name="transactions" options={tabScreenOptions} />
                        <Stack.Screen name="reset-pin" />
                        <Stack.Screen name="update-pin" />
                        <Stack.Screen name="reset-password" />
                        <Stack.Screen name="update-password" />
                    </Stack.Protected>
                </Stack>

                {showBottomBar ? <BottomNavBar /> : null}
            </View>
        </>
    );
}

// Switching between bottom-bar screens fades, instead of sliding.
const tabScreenOptions = { animation: 'fade' } as const;

// Gives React Native Paper (buttons, inputs, dialogs) the current mode.
function ThemedPaperProvider({ children }: PropsWithChildren) {
    const { colors, isDark } = useAppTheme();

    const paperTheme = useMemo(
        () => createPaperTheme(colors, isDark),
        [colors, isDark]
    );

    return (
        <PaperProvider theme={paperTheme}>
            {children}
        </PaperProvider>
    );
}

// Waits for the saved light / dark choice before showing anything,
// so the app doesn't flash the wrong mode on start.
function ThemeGate({ children }: PropsWithChildren) {
    const { isReady } = useAppTheme();

    if (!isReady) {
        return null;
    }

    return children;
}

export default function RootLayout() {
    const [fontsLoaded, fontError] = useFonts({
        Montserrat_400Regular,
        Montserrat_500Medium,
        Montserrat_600SemiBold,
        Montserrat_700Bold,
    });

    if (!fontsLoaded && !fontError) {
        return null;
    }

    return (
        <ThemeProvider>
            <ThemeGate>
                <LanguageProvider>
                    <AuthProvider>
                        <DrawerProvider>
                            {/* Paper is inside the other providers, so popups
                                (Modal, Dialog) can use useAuth, useLanguage... */}
                            <ThemedPaperProvider>
                                <AppNavigator />
                            </ThemedPaperProvider>
                        </DrawerProvider>
                    </AuthProvider>
                </LanguageProvider>
            </ThemeGate>
        </ThemeProvider>
    );
}

// Styles are built from the current colours, so they follow light or dark mode.
const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        root: {
            flex: 1,
        },

        loadingContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.background,
        },
    });
