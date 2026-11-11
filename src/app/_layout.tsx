
import { useEffect } from 'react';

import {
    ActivityIndicator,
    StyleSheet,
    View,
} from 'react-native';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { Montserrat_400Regular } from '@expo-google-fonts/montserrat/400Regular';
import { Montserrat_500Medium } from '@expo-google-fonts/montserrat/500Medium';
import { Montserrat_600SemiBold } from '@expo-google-fonts/montserrat/600SemiBold';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat/700Bold';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';

void SplashScreen.preventAutoHideAsync();

function AppNavigator() {
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading) {
            void SplashScreen.hideAsync();
        }
    }, [isLoading]);

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
            <StatusBar style="dark" />

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
                    <Stack.Screen name="dashboard" />
                    <Stack.Screen name="profile" />
                </Stack.Protected>
            </Stack>
        </>
    );
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
        <AuthProvider>
            <AppNavigator />
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
    },
});
