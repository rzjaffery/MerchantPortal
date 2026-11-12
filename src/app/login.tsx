
import { useState } from 'react';

import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import AppButton from '@/components/common/AppButton';
import AppInput from '@/components/common/AppInput';

import { useAuth } from '@/context/AuthContext';

import { colors } from '@/theme/colors';
import { elevation, radius, spacing } from '@/theme/metrics';
import { fontFamilies } from '@/theme/typography';

export default function LoginScreen() {
    const router = useRouter();
    const { signIn } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [usernameError, setUsernameError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [authError, setAuthError] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleLogin() {
        const cleanUsername = username.trim();

        setUsernameError(
            !cleanUsername ? 'Please enter your username.' : ''
        );

        setPasswordError(
            !password ? 'Please enter your password.' : ''
        );

        setAuthError('');

        if (!cleanUsername || !password) {
            return;
        }

        setIsSubmitting(true);

        try {
            await signIn({
                username: cleanUsername,
                password,
            });

            // Navigate to Dashboard without keeping Login
            // in the previous navigation history.
            router.replace('/dashboard');

        } catch (error) {
            setAuthError(
                error instanceof Error
                    ? error.message
                    : 'Unable to sign in. Please try again.'
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.content}>

                        {/* Brand identity */}
                        <View style={styles.brandSection}>
                            <View style={styles.brandIcon}>
                                <Text style={styles.brandIconText}>M</Text>
                            </View>

                            <Text style={styles.brandName}>
                                MERCHANT PORTAL
                            </Text>
                        </View>

                        {/* Welcome heading */}
                        <View style={styles.headingSection}>
                            <Text style={styles.heading}>
                                Welcome back
                            </Text>

                            <Text style={styles.subtitle}>
                                Sign in to manage your business and
                                keep everything running smoothly.
                            </Text>
                        </View>

                        {/* Login form */}
                        <View style={styles.formCard}>
                            <Text style={styles.formTitle}>
                                Sign in to your account
                            </Text>

                            <AppInput
                                label="Username"
                                value={username}
                                onChangeText={(value) => {
                                    setUsername(value);
                                    setUsernameError('');
                                    setAuthError('');
                                }}
                                placeholder="Enter your username"
                                autoCapitalize="none"
                                error={usernameError}
                            />

                            <AppInput
                                label="Password"
                                value={password}
                                onChangeText={(value) => {
                                    setPassword(value);
                                    setPasswordError('');
                                    setAuthError('');
                                }}
                                placeholder="Enter your password"
                                secureTextEntry
                                autoCapitalize="none"
                                error={passwordError}
                                returnKeyType="done"
                                onSubmitEditing={handleLogin}
                            />

                            {authError ? (
                                <Text style={styles.errorMessage}>
                                    {authError}
                                </Text>
                            ) : null}

                            <View style={styles.buttonContainer}>
                                <AppButton
                                    title="Sign In"
                                    onPress={handleLogin}
                                    loading={isSubmitting}
                                    disabled={isSubmitting}
                                />
                            </View>

                            <Text style={styles.footerText}>
                                Secure merchant access
                            </Text>
                        </View>

                        {/* Development-only demo account information */}
                        <View style={styles.demoCard}>
                            <Text style={styles.demoTitle}>
                                Development Demo Account
                            </Text>

                            <Text style={styles.demoText}>
                                Email: merchant.demo@example.com
                            </Text>

                            <Text style={styles.demoText}>
                                Password: Demo123!
                            </Text>
                        </View>

                        <Text style={styles.bottomText}>
                            Merchant Portal V0.1
                        </Text>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },

    keyboardView: {
        flex: 1,
    },

    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: spacing.xl,
    },

    content: {
        width: '100%',
        maxWidth: 460,
        alignSelf: 'center',
    },

    brandSection: {
        alignItems: 'center',
        marginBottom: spacing.xxxl,
    },

    brandIcon: {
        width: 64,
        height: 64,
        backgroundColor: colors.brand.primary,
        borderRadius: radius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },

    brandIconText: {
        fontFamily: fontFamilies.bold,
        fontSize: 34,
        color: colors.brand.onPrimary,
    },

    brandName: {
        fontFamily: fontFamilies.bold,
        fontSize: 13,
        letterSpacing: 2,
        color: colors.text.primary,
    },

    headingSection: {
        marginBottom: spacing.xxl,
        alignItems: 'center',
    },

    heading: {
        fontFamily: fontFamilies.bold,
        fontSize: 28,
        color: colors.text.primary,
        marginBottom: spacing.sm,
    },

    subtitle: {
        fontFamily: fontFamilies.regular,
        fontSize: 14,
        lineHeight: 22,
        color: colors.text.secondary,
        textAlign: 'center',
        maxWidth: 320,
    },

    formCard: {
        backgroundColor: colors.surface,
        padding: spacing.xl,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.border,
        ...elevation.card,
    },

    formTitle: {
        fontFamily: fontFamilies.semiBold,
        fontSize: 18,
        color: colors.text.primary,
        marginBottom: spacing.xl,
    },

    buttonContainer: {
        marginTop: spacing.md,
    },

    errorMessage: {
        fontFamily: fontFamilies.regular,
        fontSize: 13,
        color: colors.status.error,
        marginBottom: spacing.md,
    },

    footerText: {
        fontFamily: fontFamilies.medium,
        fontSize: 12,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: spacing.lg,
    },

    demoCard: {
        marginTop: spacing.xl,
        padding: spacing.lg,
        backgroundColor: colors.brand.soft,
        borderRadius: radius.lg,
    },

    demoTitle: {
        fontFamily: fontFamilies.semiBold,
        fontSize: 12,
        color: colors.text.primary,
        marginBottom: spacing.sm,
    },

    demoText: {
        fontFamily: fontFamilies.regular,
        fontSize: 12,
        color: colors.text.primary,
        lineHeight: 20,
    },

    bottomText: {
        fontFamily: fontFamilies.regular,
        fontSize: 11,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: spacing.xxl,
    },
});
