// src/components/dashboard/MerchantQrModal.tsx
import { useEffect, useState } from 'react';

import {
    ActivityIndicator,
    Pressable,
    Share,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';

import * as Clipboard from 'expo-clipboard';
import { Modal, Portal } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import { SymbolView } from 'expo-symbols';

import AppButton from '@/components/common/AppButton';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAppTheme, useThemedStyles } from '@/context/ThemeContext';
import { getMerchantProfile } from '@/services/profile/profileService';
import { merchantTypeKey } from '@/utils/merchantType';

import type { MerchantProfile } from '@/types/profile';

import type { AppColors } from '@/theme/colors';
import { radius, spacing } from '@/theme/metrics';
import { fontFamilies } from '@/theme/typography';

// Icon names for each platform.
const icons = {
    copy: { ios: 'doc.on.doc', android: 'content_copy', web: 'content_copy' },
    check: { ios: 'checkmark', android: 'check', web: 'check' },
    share: { ios: 'square.and.arrow.up', android: 'share', web: 'share' },
} as const;

interface MerchantQrModalProps {
    visible: boolean;
    onDismiss: () => void;
    // The text stored inside the QR code.
    qrValue: string;
}

// Shows only the last 4 digits, e.g. "•••••• 4567". This screen is often
// shown to customers, so the full number is not displayed.
// To show the full number, return `mobile` here.
function maskMobile(mobile: string): string {
    return mobile.length > 4 ? `•••••• ${mobile.slice(-4)}` : mobile;
}

export default function MerchantQrModal({
                                            visible,
                                            onDismiss,
                                            qrValue,
                                        }: MerchantQrModalProps) {
    const { colors } = useAppTheme();
    const styles = useThemedStyles(createStyles);

    const { user } = useAuth();
    const { t } = useLanguage();
    const { width: screenWidth } = useWindowDimensions();

    const username = user?.username ?? '';
    const merchantId = user?.merchantId ?? '';
    const qrSize = Math.min(Math.round(screenWidth * 0.62), 260);

    const [profile, setProfile] = useState<MerchantProfile | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Which row was just copied, so it can show a tick for 2 seconds.
    const [copiedKey, setCopiedKey] = useState('');

    // Load the merchant's details the first time the popup opens.
    useEffect(() => {
        if (!visible || profile !== null || !merchantId) {
            return;
        }

        let cancelled = false;
        setIsLoading(true);

        getMerchantProfile(merchantId)
            .then((data) => {
                if (!cancelled) {
                    setProfile(data);
                }
            })
            .catch(() => {
                // The QR still works without the details.
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [visible, profile, merchantId]);

    // "Merchant", "Branch", "Shop" or "Till" instead of the number.
    const typeCode = profile?.merchantType ?? '';
    const typeKey = merchantTypeKey(typeCode);
    const typeLabel = typeKey ? t(typeKey) : typeCode;

    const location = [profile?.city, profile?.country]
        .filter(Boolean)
        .join(', ');

    // Rows under the QR. A row with no value is left out.
    const rows = [
        {
            key: 'location',
            label: t('location'),
            value: location,
            copyValue: '',
        },
        {
            key: 'merchantId',
            label: t('merchantId'),
            value: profile?.merchantId || merchantId,
            copyValue: profile?.merchantId || merchantId,
        },
        {
            key: 'merchantCode',
            label: t('merchantCode'),
            value: profile?.merchantCode ?? '',
            copyValue: profile?.merchantCode ?? '',
        },
        // {
        //     key: 'mobile',
        //     label: t('mobileNumber'),
        //     value: maskMobile(profile?.mobileNumber ?? ''),
        //     copyValue: '',
        // },
    ].filter((row) => row.value !== '');

    async function handleCopy(key: string, value: string) {
        await Clipboard.setStringAsync(value);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(''), 2000);
    }

    async function handleShare() {
        try {
            await Share.share({
                message: `${username}\n${t('merchantId')}: ${
                    profile?.merchantId || merchantId
                }`,
            });
        } catch {
            // The person closed the share sheet. Nothing to do.
        }
    }

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={styles.modal}
            >
                {/* Username, type, and the share icon in the corner */}
                <View style={styles.header}>
                    <View style={styles.headerText}>
                        <Text style={styles.username} numberOfLines={1}>
                            {username}
                        </Text>

                        {typeLabel ? (
                            <Text style={styles.subheading}>{typeLabel}</Text>
                        ) : null}
                    </View>

                    {/*<Pressable*/}
                    {/*    onPress={() => void handleShare()}*/}
                    {/*    accessibilityRole="button"*/}
                    {/*    accessibilityLabel={t('share')}*/}
                    {/*    hitSlop={8}*/}
                    {/*    style={({ pressed }) => [*/}
                    {/*        styles.shareButton,*/}
                    {/*        pressed && styles.pressed,*/}
                    {/*    ]}*/}
                    {/*>*/}
                    {/*    <SymbolView*/}
                    {/*        name={icons.share}*/}
                    {/*        size={20}*/}
                    {/*        tintColor={colors.brand.primary}*/}
                    {/*    />*/}
                    {/*</Pressable>*/}
                </View>

                <Text style={styles.message}>{t('scanQrToPay')}</Text>

                {/* The QR code. Always on white, scanners need a light background. */}
                <View style={styles.qrBox}>
                    <QRCode value={qrValue} size={qrSize} />
                </View>

                {/* Account details */}
                <View style={styles.details}>
                    {isLoading ? (
                        <ActivityIndicator color={colors.brand.primary} />
                    ) : (
                        rows.map((row, index) => (
                            <Pressable
                                key={row.key}
                                disabled={!row.copyValue}
                                onPress={() =>
                                    void handleCopy(row.key, row.copyValue)
                                }
                                accessibilityRole={
                                    row.copyValue ? 'button' : undefined
                                }
                                style={({ pressed }) => [
                                    styles.detailRow,
                                    index > 0 && styles.detailDivider,
                                    pressed && styles.pressed,
                                ]}
                            >
                                <View style={styles.detailText}>
                                    <Text style={styles.detailLabel}>
                                        {row.label}
                                    </Text>

                                    <Text
                                        style={styles.detailValue}
                                        numberOfLines={1}
                                    >
                                        {row.value}
                                    </Text>
                                </View>

                                {row.copyValue ? (
                                    copiedKey === row.key ? (
                                        <View style={styles.copiedBox}>
                                            <SymbolView
                                                name={icons.check}
                                                size={14}
                                                tintColor={colors.status.success}
                                            />
                                            <Text style={styles.copiedText}>
                                                {t('copied')}
                                            </Text>
                                        </View>
                                    ) : (
                                        <SymbolView
                                            name={icons.copy}
                                            size={16}
                                            tintColor={colors.text.secondary}
                                        />
                                    )
                                ) : null}
                            </Pressable>
                        ))
                    )}
                </View>

                <AppButton
                    title={t('close')}
                    variant="outline"
                    onPress={onDismiss}
                />
            </Modal>
        </Portal>
    );
}

const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        modal: {
            backgroundColor: colors.surface,
            marginHorizontal: spacing.lg,
            padding: spacing.lg,
            borderRadius: radius.xl,
            gap: spacing.md,
        },

        header: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
        },

        headerText: {
            flex: 1,
            alignItems: 'center',
        },

        username: {
            fontFamily: fontFamilies.bold,
            fontSize: 30,
            color: colors.text.primary,
            fontWeight: 'bold',
        },

        subheading: {
            fontFamily: fontFamilies.medium,
            fontSize: 20,
            color: colors.brand.primary,
        },

        shareButton: {
            width: 40,
            height: 40,
            borderRadius: radius.md,
            backgroundColor: colors.brand.soft,
            alignItems: 'center',
            justifyContent: 'center',
        },

        message: {
            fontFamily: fontFamilies.regular,
            fontSize: 13,
            color: colors.text.secondary,
            textAlign: 'center',
        },

        qrBox: {
            alignSelf: 'center',
            padding: spacing.md,
            borderRadius: radius.lg,
            backgroundColor: '#FFFFFF',
        },

        details: {
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: spacing.md,
        },

        detailRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            paddingVertical: spacing.md,
        },

        detailDivider: {
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },

        detailText: {
            flex: 1,
        },

        detailLabel: {
            fontFamily: fontFamilies.regular,
            fontSize: 11,
            color: colors.text.secondary,
        },

        detailValue: {
            fontFamily: fontFamilies.semiBold,
            fontSize: 14,
            color: colors.text.primary,
        },

        copiedBox: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
        },

        copiedText: {
            fontFamily: fontFamilies.medium,
            fontSize: 12,
            color: colors.status.success,
        },

        pressed: {
            opacity: 0.6,
        },
    });