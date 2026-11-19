// src/app/login.tsx
import { useState } from 'react';

import {
    KeyboardAvoidingView,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';

import AppButton from '@/components/common/AppButton';
import AppInput from '@/components/common/AppInput';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

import type { AppColors } from '@/theme/colors';
import { useAppTheme, useThemedStyles } from '@/context/ThemeContext';
import { radius, spacing } from '@/theme/metrics';
import { fontFamilies } from '@/theme/typography';

export default function LoginScreen() {
    const { colors } = useAppTheme();
    const styles = useThemedStyles(createStyles);

    const router = useRouter();
    const { signIn, sessionExpired } = useAuth();
    const { language, toggleLanguage, t } = useLanguage();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [usernameError, setUsernameError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [authError, setAuthError] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleLogin() {
        const cleanUsername = username.trim();

        setUsernameError(
            !cleanUsername ? t('usernameRequired') : ''
        );

        setPasswordError(
            !password ? t('passwordRequired') : ''
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
                    : t('signInFailed')
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Language switch */}
            <Pressable
                style={styles.languageButton}
                onPress={toggleLanguage}
                accessibilityRole="button"
                accessibilityLabel="Change language"
            >
                <Text style={styles.languageText}>
                    {language === 'en' ? 'English' : 'Français'}
                </Text>
            </Pressable>

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior="padding"
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.content}>

                        {/* Logo and app name */}
                        <View style={styles.brandSection}>
                            <Image
                                source={require('@/assets/images/illico_cash.png')}
                                style={styles.logo}
                                contentFit="contain"
                                accessibilityLabel="Merchant Portal logo"
                            />

                            <Text style={styles.brandName}>
                                Merchant Portal
                            </Text>
                        </View>

                        {/* Heading */}
                        <View style={styles.headingSection}>
                            <Text style={styles.heading}>
                                {t('welcomeBack')}
                            </Text>

                            <Text style={styles.subtitle}>
                                {t('signInSubtitle')}
                            </Text>
                        </View>

                        {/* Login form */}
                        <View style={styles.formCard}>
                            <AppInput
                                label={t('username')}
                                value={username}
                                onChangeText={(value) => {
                                    setUsername(value);
                                    setUsernameError('');
                                    setAuthError('');
                                }}
                                placeholder={t('usernamePlaceholder')}
                                autoCapitalize="none"
                                error={usernameError}
                            />

                            <AppInput
                                label={t('password')}
                                value={password}
                                onChangeText={(value) => {
                                    setPassword(value);
                                    setPasswordError('');
                                    setAuthError('');
                                }}
                                placeholder={t('passwordPlaceholder')}
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
                            ) : sessionExpired ? (
                                <Text style={styles.errorMessage}>
                                    {t('sessionExpired')}
                                </Text>
                            ) : null}

                            <AppButton
                                title={t('signIn')}
                                onPress={handleLogin}
                                loading={isSubmitting}
                                disabled={isSubmitting}
                            />
                        </View>

                        {/* Caption */}
                        <View style={styles.secureRow}>
                            <SymbolView
                                name={{
                                    ios: 'lock',
                                    android: 'lock',
                                    web: 'lock',
                                }}
                                size={14}
                                tintColor={colors.text.secondary}
                            />

                            <Text style={styles.secureText}>
                                {t('secureAccess')}
                            </Text>
                        </View>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// Styles are built from the current colours, so they follow light or dark mode.
const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        safeArea: {
            flex: 1,
            backgroundColor: colors.background,
        },

        languageButton: {
            alignSelf: 'flex-end',
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.md,
        },

        languageText: {
            fontFamily: fontFamilies.medium,
            fontSize: 13,
            color: colors.text.primary,
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

        logo: {
            width: 72,
            height: 72,
            marginBottom: spacing.md,
        },

        brandName: {
            fontFamily: fontFamilies.semiBold,
            fontSize: 16,
            color: colors.text.primary,
        },

        headingSection: {
            alignItems: 'center',
            marginBottom: spacing.xl,
        },

        heading: {
            fontFamily: fontFamilies.semiBold,
            fontSize: 24,
            color: colors.text.primary,
            marginBottom: spacing.sm,
        },

        subtitle: {
            fontFamily: fontFamilies.regular,
            fontSize: 14,
            color: colors.text.secondary,
            textAlign: 'center',
        },

        formCard: {
            backgroundColor: colors.surface,
            padding: spacing.xl,
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: colors.border,
        },

        errorMessage: {
            fontFamily: fontFamilies.regular,
            fontSize: 13,
            color: colors.status.error,
            marginBottom: spacing.md,
        },

        secureRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.xs,
            marginTop: spacing.xl,
        },

        secureText: {
            fontFamily: fontFamilies.regular,
            fontSize: 12,
            color: colors.text.secondary,
        },
    });
