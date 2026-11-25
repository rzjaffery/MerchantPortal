// src/app/update-pin.tsx
import { useState } from 'react';

import {
    KeyboardAvoidingView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Dialog, Portal } from 'react-native-paper';

import AppButton from '@/components/common/AppButton';
import AppCard from '@/components/common/AppCard';
import AppHeader from '@/components/common/AppHeader';
import AppInput from '@/components/common/AppInput';

import { DUMMY_OTP, USE_DUMMY_OTP } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAppTheme, useThemedStyles } from '@/context/ThemeContext';
import { resetPin } from '@/services/credentials/credentialsService';

import type { AppColors } from '@/theme/colors';
import { radius, spacing } from '@/theme/metrics';
import { fontFamilies } from '@/theme/typography';

export default function UpdatePinScreen() {
    const { colors } = useAppTheme();
    const styles = useThemedStyles(createStyles);

    const router = useRouter();
    const { mobile = '' } = useLocalSearchParams<{ mobile?: string }>();
    const { user, accessToken } = useAuth();
    const { t } = useLanguage();

    const [otp, setOtp] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');

    const [otpError, setOtpError] = useState('');
    const [pinError, setPinError] = useState('');
    const [confirmError, setConfirmError] = useState('');
    const [submitError, setSubmitError] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successVisible, setSuccessVisible] = useState(false);

    // Returns true when every field is valid. Shows a message under each bad field.
    function validate(): boolean {
        const otpMessage = /^\d{4,8}$/.test(otp.trim()) ? '' : t('otpRequired');
        const pinMessage = /^\d{4}$/.test(newPin) ? '' : t('pinInvalid');
        const confirmMessage =
            newPin === confirmPin ? '' : t('pinsDoNotMatch');

        setOtpError(otpMessage);
        setPinError(pinMessage);
        setConfirmError(pinMessage ? '' : confirmMessage);

        return !otpMessage && !pinMessage && !confirmMessage;
    }

    async function handleSubmit() {
        setSubmitError('');

        if (!validate()) {
            return;
        }

        setIsSubmitting(true);

        try {
            await resetPin({
                username: user?.username ?? '',
                userId: user?.id ?? '',
                token: accessToken ?? '',
                mobileNumber: mobile,
                otp: otp.trim(),
                newPin,
            });

            setSuccessVisible(true);
        } catch (error) {
            setSubmitError(
                error instanceof Error && error.message
                    ? error.message
                    : t('pinResetFailed')
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <View style={styles.screen}>
            <AppHeader
                title={t('updatePin')}
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
                            label={t('newPin')}
                            value={newPin}
                            onChangeText={setNewPin}
                            keyboardType="number-pad"
                            secureTextEntry
                            error={pinError}
                        />

                        <AppInput
                            label={t('confirmNewPin')}
                            value={confirmPin}
                            onChangeText={setConfirmPin}
                            keyboardType="number-pad"
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
                                title={t('updatePin')}
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
                        {t('pinChanged')}
                    </Dialog.Title>

                    <Dialog.Content>
                        <Text style={styles.dialogText}>
                            {t('pinChangedBody')}
                        </Text>
                    </Dialog.Content>

                    <Dialog.Actions>
                        <Button
                            textColor={colors.brand.primary}
                            onPress={() => router.dismissTo('/profile')}
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
