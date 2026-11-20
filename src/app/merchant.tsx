// src/app/merchant.tsx
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { SymbolView } from 'expo-symbols';

import AppButton from '@/components/common/AppButton';
import AppCard from '@/components/common/AppCard';
import AppHeader from '@/components/common/AppHeader';
import ProfileAvatar from '@/components/common/ProfileAvatar';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useDrawer } from '@/context/DrawerContext';
import { getMerchantProfile } from '@/services/profile/profileService';

import type { MerchantProfile } from '@/types/profile';

import type { AppColors } from '@/theme/colors';
import { useAppTheme, useThemedStyles } from '@/context/ThemeContext';
import { radius, spacing } from '@/theme/metrics';
import { fontFamilies } from '@/theme/typography';

// Icon names for each platform.
const icons = {
    store: { ios: 'storefront', android: 'storefront', web: 'storefront' },
    badge: { ios: 'person.text.rectangle', android: 'badge', web: 'badge' },
    mail: { ios: 'envelope', android: 'mail', web: 'mail' },
    call: { ios: 'phone', android: 'call', web: 'call' },
} as const;

// Formats money with two decimals, e.g. 10,854.44
function formatAmount(amount: number): string {
    return amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function MerchantScreen() {
    const { colors } = useAppTheme();
    const styles = useThemedStyles(createStyles);

    const router = useRouter();
    const { user } = useAuth();
    const { t } = useLanguage();
    const { openDrawer } = useDrawer();

    const [profile, setProfile] = useState<MerchantProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const merchantId = user?.merchantId ?? '';

    const loadProfile = useCallback(async () => {
        if (!merchantId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setHasError(false);

        try {
            const data = await getMerchantProfile(merchantId);

            setProfile(data);
        } catch {
            setHasError(true);
        } finally {
            setIsLoading(false);
        }
    }, [merchantId]);

    useEffect(() => {
        void loadProfile();
    }, [loadProfile]);

    // The website shows type 1 as "Merchant". Other codes are shown as sent.
    const merchantTypeLabel =
        profile?.merchantType === '1'
            ? t('merchant')
            : profile?.merchantType ?? '';

    // Rows with no value are left out.
    const infoRows = profile
        ? [
            {
                key: 'type',
                icon: icons.store,
                label: t('merchantType'),
                value: merchantTypeLabel,
            },
            {
                key: 'business',
                icon: icons.store,
                label: t('businessName'),
                value: profile.businessName,
            },
            {
                key: 'id',
                icon: icons.badge,
                label: t('merchantId'),
                value: profile.merchantId || merchantId,
            },
            {
                key: 'email',
                icon: icons.mail,
                label: t('email'),
                value: profile.email,
            },
            {
                key: 'mobile',
                icon: icons.call,
                label: t('mobileNumber'),
                value: profile.mobileNumber,
            },
        ].filter((row) => row.value !== '')
        : [];

    return (
        <View style={styles.screen}>
            <AppHeader
                title={t('merchant')}
                leftIcon="menu"
                onLeftPress={openDrawer}
                // onProfilePress={() => router.push('/profile')}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >

                {/* Picture */}
                <View style={styles.avatarBox}>
                    <ProfileAvatar size={96} />
                </View>

                {isLoading ? (
                    <View style={styles.stateContainer}>
                        <ActivityIndicator
                            size="large"
                            color={colors.brand.primary}
                        />

                        <Text style={styles.mutedText}>
                            {t('loadingProfile')}
                        </Text>
                    </View>
                ) : hasError ? (
                    <View style={styles.stateContainer}>
                        <Text style={styles.errorText}>
                            {t('profileLoadFailed')}
                        </Text>

                        <AppButton
                            title={t('tryAgain')}
                            variant="outline"
                            onPress={() => void loadProfile()}
                        />
                    </View>
                ) : profile ? (
                    <>
                        {/* Wallet balances */}
                        <View style={styles.balanceGrid}>
                            <AppCard style={styles.balanceCard}>
                                <Text style={styles.balanceLabel}>
                                    {t('usdBalance')}
                                </Text>

                                <Text
                                    style={styles.balanceValue}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.6}
                                >
                                    {formatAmount(profile.usdBalance)}
                                </Text>
                            </AppCard>

                            <AppCard style={styles.balanceCard}>
                                <Text style={styles.balanceLabel}>
                                    {t('cdfBalance')}
                                </Text>

                                <Text
                                    style={styles.balanceValue}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.6}
                                >
                                    {formatAmount(profile.cdfBalance)}
                                </Text>
                            </AppCard>
                        </View>

                        {/* Details */}
                        <AppCard>
                            {infoRows.map((row, index) => (
                                <View
                                    key={row.key}
                                    style={[
                                        styles.infoRow,
                                        index > 0 && styles.rowDivider,
                                    ]}
                                >
                                    <View style={styles.rowIcon}>
                                        <SymbolView
                                            name={row.icon}
                                            size={18}
                                            tintColor={colors.text.primary}
                                        />
                                    </View>

                                    <View style={styles.rowTextBox}>
                                        <Text style={styles.rowLabel}>
                                            {row.label}
                                        </Text>

                                        <Text style={styles.rowValue}>
                                            {row.value}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </AppCard>
                    </>
                ) : null}

            </ScrollView>
        </View>
    );
}

// Styles are built from the current colours, so they follow light or dark mode.
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

        avatarBox: {
            alignItems: 'center',
            marginVertical: spacing.lg,
        },

        stateContainer: {
            minHeight: 160,
            justifyContent: 'center',
            alignItems: 'center',
            gap: spacing.md,
        },

        mutedText: {
            fontFamily: fontFamilies.regular,
            fontSize: 13,
            color: colors.text.secondary,
        },

        errorText: {
            fontFamily: fontFamilies.medium,
            fontSize: 13,
            color: colors.status.error,
            textAlign: 'center',
        },

        balanceGrid: {
            flexDirection: 'row',
            gap: spacing.sm,
            marginBottom: spacing.md,
        },

        balanceCard: {
            flex: 1,
            padding: spacing.md,
        },

        balanceLabel: {
            fontFamily: fontFamilies.medium,
            fontSize: 11,
            color: colors.text.secondary,
            textAlign: 'right'
        },

        balanceValue: {
            fontFamily: fontFamilies.bold,
            fontSize: 20,
            color: colors.text.primary,
            marginTop: spacing.sm,
            textAlign: 'right',
        },

        infoRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            paddingVertical: spacing.md,
        },

        rowDivider: {
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },

        rowIcon: {
            width: 36,
            height: 36,
            borderRadius: radius.md,
            backgroundColor: colors.brand.soft,
            alignItems: 'center',
            justifyContent: 'center',
        },

        rowTextBox: {
            flex: 1,
        },

        rowLabel: {
            fontFamily: fontFamilies.regular,
            fontSize: 11,
            color: colors.text.secondary,
        },

        rowValue: {
            fontFamily: fontFamilies.semiBold,
            fontSize: 14,
            color: colors.text.primary,
        },
    });
