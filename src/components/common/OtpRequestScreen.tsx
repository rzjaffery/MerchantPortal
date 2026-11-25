// src/components/common/OtpRequestScreen.tsx
import { useEffect, useState } from 'react';

import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useRouter } from 'expo-router';

import AppButton from '@/components/common/AppButton';
import AppCard from '@/components/common/AppCard';
import AppHeader from '@/components/common/AppHeader';

import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme, useThemedStyles } from '@/context/ThemeContext';

import { getMerchantProfile } from '@/services/profile/profileService';

import type { AppColors } from '@/theme/colors';
import { radius, spacing } from '@/theme/metrics';
import { fontFamilies } from '@/theme/typography';

interface OtpRequestScreenProps {
    // Screen title, e.g. "Reset PIN".
    title: string;
    // Sends the OTP to the given mobile number.
    send: (mobileNumber: string) => Promise<void>;
    // Runs after the OTP was sent. Opens the next screen.
    onSent: (mobileNumber: string) => void;
}

// Shows only the last 4 digits, e.g. "•••••• 4567".
function maskMobile(mobile: string): string {
    return mobile.length > 4 ? `•••••• ${mobile.slice(-4)}` : mobile;
}

export default function OtpRequestScreen({
                                             title,
                                             send,
                                             onSent,
                                         }: OtpRequestScreenProps) {
    const { colors } = useAppTheme();
    const styles = useThemedStyles(createStyles);

    const router = useRouter();
    const { user } = useAuth();
    const { t } = useLanguage();

    const merchantId = user?.merchantId ?? '';

    const [mobile, setMobile] = useState('');
    const [isLoadingMobile, setIsLoadingMobile] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');

    // The OTP goes to the mobile number saved in the merchant's profile.
    useEffect(() => {
        if (!merchantId) {
            return;
        }

        let cancelled = false;

        getMerchantProfile(merchantId)
            .then((profile) => {
                if (!cancelled) {
                    setMobile(profile.mobileNumber);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError(t('otpSendFailed'));
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoadingMobile(false);
                }
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [merchantId]);

    async function handleSend() {
        setError('');
        setIsSending(true);

        try {
            await send(mobile);
            onSent(mobile);
        } catch (sendError) {
            setError(
                sendError instanceof Error && sendError.message
                    ? sendError.message
                    : t('otpSendFailed')
            );
        } finally {
            setIsSending(false);
        }
    }

    return (
        <View style={styles.screen}>
            <AppHeader
                title={title}
                leftIcon="back"
                onLeftPress={() => router.back()}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <AppCard style={styles.card}>
                    <Text style={styles.intro}>{t('otpSendIntro')}</Text>

                    <Text style={styles.label}>{t('registeredMobile')}</Text>

                    {isLoadingMobile ? (
                        <ActivityIndicator color={colors.brand.primary} />
                    ) : mobile ? (
                        <View style={styles.mobileBox}>
                            <Text style={styles.mobileText}>
                                {maskMobile(mobile)}
                            </Text>
                        </View>
                    ) : (
                        <Text style={styles.errorText}>
                            {t('mobileNotFound')}
                        </Text>
                    )}

                    {error ? (
                        <Text style={styles.errorText}>{error}</Text>
                    ) : null}

                    <View style={styles.button}>
                        <AppButton
                            title={t('sendOtp')}
                            onPress={() => void handleSend()}
                            loading={isSending}
                            disabled={isLoadingMobile || !mobile}
                        />
                    </View>
                </AppCard>
            </ScrollView>
        </View>
    );
}

const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        screen: {
            flex: 1,
            backgroundColor: colors.background,
        },

        scrollContent: {
            padding: spacing.lg,
            paddingBottom: spacing.xxxl,
        },

        card: {
            gap: spacing.md,
        },

        intro: {
            fontFamily: fontFamilies.regular,
            fontSize: 13,
            lineHeight: 20,
            color: colors.text.secondary,
        },

        label: {
            fontFamily: fontFamilies.medium,
            fontSize: 13,
            color: colors.text.primary,
        },

        mobileBox: {
            minHeight: 52,
            justifyContent: 'center',
            paddingHorizontal: spacing.lg,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.background,
        },

        mobileText: {
            fontFamily: fontFamilies.semiBold,
            fontSize: 15,
            color: colors.text.primary,
        },

        errorText: {
            fontFamily: fontFamilies.medium,
            fontSize: 13,
            color: colors.status.error,
        },

        button: {
            marginTop: spacing.sm,
        },
    });
