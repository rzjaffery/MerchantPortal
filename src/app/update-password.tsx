// src/app/update-password.tsx
import { useState } from 'react';

import {
    KeyboardAvoidingView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useRouter } from 'expo-router';
import { Button, Dialog, Portal } from 'react-native-paper';

import AppButton from '@/components/common/AppButton';
import AppCard from '@/components/common/AppCard';
import AppHeader from '@/components/common/AppHeader';
import AppInput from '@/components/common/AppInput';

import { DUMMY_OTP, USE_DUMMY_OTP } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAppTheme, useThemedStyles } from '@/context/ThemeContext';
import { changePassword } from '@/services/credentials/credentialsService';

import type { AppColors } from '@/theme/colors';
import { radius, spacing } from '@/theme/metrics';
import { fontFamilies } from '@/theme/typography';

export default function UpdatePasswordScreen() {
    const { colors } = useAppTheme();
    const styles = useThemedStyles(createStyles);

    const router = useRouter();
    const { user, accessToken, signOut } = useAuth();
    const { t } = useLanguage();

    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [otpError, setOtpError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmError, setConfirmError] = useState('');
    const [submitError, setSubmitError] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successVisible, setSuccessVisible] = useState(false);

    // Returns true when every field is valid. Shows a message under each bad field.
    function validate(): boolean {
        const otpMessage = /^\d{4,8}$/.test(otp.trim()) ? '' : t('otpRequired');
        const passwordMessage = newPassword.length >= 6 && newPassword.length <= 16 ? '' : t('passwordLength');
        const confirmMessage =
            newPassword === confirmPassword ? '' : t('passwordsDoNotMatch');

        setOtpError(otpMessage);
        setPasswordError(passwordMessage);
        setConfirmError(passwordMessage ? '' : confirmMessage);

        return !otpMessage && !passwordMessage && !confirmMessage;
    }

    async function handleSubmit() {
        setSubmitError('');

        if (!validate()) {
            return;
        }

        setIsSubmitting(true);

        try {
            await changePassword({
                username: user?.username ?? '',
                token: accessToken ?? '',
                otp: otp.trim(),
                newPassword,
            });

            setSuccessVisible(true);
        } catch (error) {
            setSubmitError(
                error instanceof Error && error.message
                    ? error.message
                    : t('passwordChangeFailed')
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    // The server ends every session after a password change.
    // Sign out on the phone too, and go to Login.
    async function handleFinished() {
        setSuccessVisible(false);
        await signOut();
        router.replace('/login');
    }

    return (
        <View style={styles.screen}>
            <AppHeader
                title={t('updatePassword')}
                leftIcon="back"
                onLeftPress={() => router.back()}
            />

            <KeyboardAvoidingView style={styles.flex} behavior="padding">
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <AppCard style={styles.card}>
                        {USE_DUMMY_OTP ? (
                            <Text style={styles.hint}>
                                {t('dummyOtpHint')} {DUMMY_OTP}
                            </Text>
                        ) : null}

                        <AppInput
                            label={t('otp')}
                            value={otp}
                            onChangeText={setOtp}
                            keyboardType="number-pad"
                            error={otpError}
                        />

                        <AppInput
                            label={t('newPassword')}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            autoCapitalize="none"
                            secureTextEntry
                            error={passwordError}
                        />

                        <AppInput
                            label={t('confirmNewPassword')}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            autoCapitalize="none"
                            secureTextEntry
                            returnKeyType="done"
                            onSubmitEditing={() => void handleSubmit()}
                            error={confirmError}
                        />

                        {submitError ? (
                            <Text style={styles.errorText}>{submitError}</Text>
                        ) : null}

                        <View style={styles.button}>
                            <AppButton
                                title={t('updatePassword')}
                                onPress={() => void handleSubmit()}
                                loading={isSubmitting}
                            />
                        </View>
                    </AppCard>
                </ScrollView>
            </KeyboardAvoidingView>

            <Portal>
                <Dialog
                    visible={successVisible}
                    dismissable={false}
                    style={styles.dialog}
                >
                    <Dialog.Title style={styles.dialogTitle}>
                        {t('passwordChanged')}
                    </Dialog.Title>

                    <Dialog.Content>
                        <Text style={styles.dialogText}>
                            {t('passwordChangedBody')}
                        </Text>
                    </Dialog.Content>

                    <Dialog.Actions>
                        <Button
                            textColor={colors.brand.primary}
                            onPress={() => void handleFinished()}
                        >
                            {t('ok')}
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        screen: {
            flex: 1,
            backgroundColor: colors.background,
        },

        flex: {
            flex: 1,
        },

        scrollContent: {
            padding: spacing.lg,
            paddingBottom: spacing.xxxl,
        },

        card: {
            gap: spacing.md,
        },

        hint: {
            fontFamily: fontFamilies.medium,
            fontSize: 12,
            color: colors.text.secondary,
        },

        errorText: {
            fontFamily: fontFamilies.medium,
            fontSize: 13,
            color: colors.status.error,
        },

        button: {
            marginTop: spacing.sm,
        },

        dialog: {
            backgroundColor: colors.surface,
            borderRadius: radius.xl,
        },

        dialogTitle: {
            fontFamily: fontFamilies.semiBold,
            fontSize: 18,
            color: colors.text.primary,
        },

        dialogText: {
            fontFamily: fontFamilies.regular,
            fontSize: 13,
            lineHeight: 20,
            color: colors.text.secondary,
        },
    });
