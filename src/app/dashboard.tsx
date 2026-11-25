// src/app/dashboard.tsx
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import AppButton from '@/components/common/AppButton';
import AppCard from '@/components/common/AppCard';
import AppHeader from '@/components/common/AppHeader';

import { useAuth } from '@/context/AuthContext';
import { useDrawer } from '@/context/DrawerContext';
import { useLanguage } from '@/context/LanguageContext';
import { getDashboardSummary } from '@/services/dashboard/dashboardService';

import type { TranslationKey } from '@/i18n/translations';

import { FAB } from 'react-native-paper';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type {
    DashboardPeriod,
    DashboardSummary,
} from '@/types/dashboard';

import type { AppColors } from '@/theme/colors';
import { useAppTheme, useThemedStyles } from '@/context/ThemeContext';
import { radius, spacing } from '@/theme/metrics';
import { fontFamilies } from '@/theme/typography';
import CurrencySummary from '@/components/dashboard/CurrencySummary';
import MerchantQrModal from '@/components/dashboard/MerchantQrModal';

// The period chips. A chip with value null is shown greyed out
// until we know the value the server expects for it.
const periods: {
    labelKey: TranslationKey;
    value: DashboardPeriod | null;
}[] = [
    { labelKey: 'today', value: 'TODAY' },
    { labelKey: 'yesterday', value: 'YESTERDAY' },
    { labelKey: 'last7Days', value: 'LAST7DAYS' },
    { labelKey: 'last30Days', value: 'LAST30DAYS' },
    { labelKey: 'thisYear', value: 'THISYEAR' },
];

// Formats money with two decimals, e.g. 10,854.44
function formatAmount(amount: number): string {
    return amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function DashboardScreen() {
    const { colors } = useAppTheme();
    const styles = useThemedStyles(createStyles);

    const router = useRouter();
    const { user, accessToken } = useAuth();
    const { t } = useLanguage();
    const { openDrawer } = useDrawer();

    const [period, setPeriod] = useState<DashboardPeriod>('TODAY');
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [serverMessage, setServerMessage] = useState('');

    const username = user?.username ?? '';
    const userId = user?.id ?? '';

    const [qrVisible, setQrVisible] = useState(false);
    const insets = useSafeAreaInsets();

    const loadSummary = useCallback(async () => {
        if (!username || !accessToken || !userId) {
            return;
        }

        setIsLoading(true);
        setHasError(false);
        setServerMessage('');

        try {
            const data = await getDashboardSummary(
                username,
                accessToken,
                userId,
                period
            );

            setSummary(data);
        } catch (loadError) {
            setHasError(true);

            setServerMessage(
                loadError instanceof Error ? loadError.message : ''
            );
        } finally {
            setIsLoading(false);
        }
    }, [username, accessToken, userId, period]);

    // Runs on first load and again whenever the period changes.
    useEffect(() => {
        void loadSummary();
    }, [loadSummary]);

    const selectedPeriodLabel = t(
        periods.find((item) => item.value === period)?.labelKey ?? 'today'
    );

    return (
        <View style={styles.screen}>
            <AppHeader
                title={t('home')}
                leftIcon="menu"
                onLeftPress={openDrawer}
                onProfilePress={() => router.push('/profile')}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >

                {/* Period chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipRow}
                >
                    {periods.map((item) => {
                        const value = item.value;
                        const selected = value !== null && value === period;

                        return (
                            <Pressable
                                key={item.labelKey}
                                disabled={value === null}
                                onPress={() => {
                                    if (value !== null) {
                                        setPeriod(value);
                                    }
                                }}
                                accessibilityRole="button"
                                accessibilityState={{
                                    selected,
                                    disabled: value === null,
                                }}
                                style={[
                                    styles.chip,
                                    selected && styles.chipSelected,
                                    value === null && styles.chipDisabled,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.chipText,
                                        selected && styles.chipTextSelected,
                                    ]}
                                >
                                    {t(item.labelKey)}
                                </Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>

                {isLoading ? (
                    <View style={styles.stateContainer}>
                        <ActivityIndicator
                            size="large"
                            color={colors.brand.primary}
                        />

                        <Text style={styles.mutedText}>
                            {t('loadingFigures')}
                        </Text>
                    </View>
                ) : hasError ? (
                    <View style={styles.stateContainer}>
                        <Text style={styles.errorText}>
                            {serverMessage || t('loadFailed')}
                        </Text>

                        <AppButton
                            title={t('tryAgain')}
                            variant="outline"
                            onPress={() => void loadSummary()}
                        />
                    </View>
                ) : summary ? (
                    <>
                        <AppCard style={styles.card}>
                            <View style={styles.cardTitleRow}>
                                <Text style={styles.cardTitle}>
                                    {t('transactionsSummary')}
                                </Text>

                                <Text style={styles.cardMeta}>
                                    {selectedPeriodLabel}
                                </Text>
                            </View>

                            {/* One large donut, with a USD / CDF switch and swipe */}
                            <CurrencySummary summary={summary} />

                            <Text style={styles.chartNote}>
                                {t('donutNote')}
                            </Text>
                        </AppCard>

                        {/* USD and CDF amounts */}
                        <View style={styles.amountRow}>
                            <AppCard style={styles.amountCard}>
                                <Text style={styles.amountLabel}>
                                    {t('usdTransactions')}
                                </Text>

                                <View style={styles.amountValueRow}>
                                    <Text style={styles.amountCurrency}>
                                        USD
                                    </Text>

                                    <Text
                                        style={styles.amountValue}
                                        numberOfLines={1}
                                        adjustsFontSizeToFit
                                        minimumFontScale={0.6}
                                    >
                                        {formatAmount(summary.successfulAmountUSD)}
                                    </Text>
                                </View>
                            </AppCard>

                            <AppCard style={styles.amountCard}>
                                <Text style={styles.amountLabel}>
                                    {t('cdfTransactions')}
                                </Text>

                                <View style={styles.amountValueRow}>
                                    <Text style={styles.amountCurrency}>
                                        CDF
                                    </Text>

                                    <Text
                                        style={styles.amountValue}
                                        numberOfLines={1}
                                        adjustsFontSizeToFit
                                        minimumFontScale={0.6}
                                    >
                                        {formatAmount(summary.successfulAmountCDF)}
                                    </Text>
                                </View>
                            </AppCard>
                        </View>
                    </>
                ) : null}
            </ScrollView>

            {/* Floating QR button */}
            {userId ? (
                <FAB
                    customSize={76}
                    icon={({ size }) => (
                        <SymbolView
                            name={{
                                ios: 'qrcode',
                                android: 'qr_code_2',
                                web: 'qr_code_2',
                            }}
                            size={size}
                            tintColor={colors.brand.onPrimary}
                        />
                    )}
                    onPress={() => setQrVisible(true)}
                    accessibilityLabel={t('myQrCode')}
                    color={colors.brand.onPrimary}
                    style={[
                        styles.fab,
                        { bottom: insets.bottom + spacing.xl },
                    ]}
                />
            ) : null}

            {/* QR code popup */}
            <MerchantQrModal
                visible={qrVisible}
                onDismiss={() => setQrVisible(false)}
                qrValue={userId}
            />
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
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: 96,
        },

        chipRow: {
            gap: spacing.sm,
            paddingBottom: spacing.md,
        },

        chip: {
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
            borderRadius: radius.full,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
        },

        chipSelected: {
            backgroundColor: colors.brand.primary,
            borderColor: colors.brand.primary,
        },

        chipDisabled: {
            opacity: 0.45,
        },

        chipText: {
            fontFamily: fontFamilies.medium,
            fontSize: 12,
            color: colors.text.secondary,
        },

        chipTextSelected: {
            fontFamily: fontFamilies.semiBold,
            color: colors.brand.onPrimary,
        },

        stateContainer: {
            minHeight: 180,
            justifyContent: 'center',
            alignItems: 'center',
            gap: spacing.md,
            marginBottom: spacing.md,
        },

        mutedText: {
            fontFamily: fontFamilies.regular,
            fontSize: 12,
            color: colors.text.secondary,
        },

        errorText: {
            fontFamily: fontFamilies.medium,
            fontSize: 13,
            color: colors.status.error,
            textAlign: 'center',
        },

        card: {
            marginBottom: spacing.md,
        },

        donutRow: {
            flexDirection: 'row',
            gap: spacing.sm,
            marginTop: spacing.md,
        },

        chartNote: {
            fontFamily: fontFamilies.regular,
            fontSize: 10,
            color: colors.text.secondary,
            marginTop: spacing.sm,
        },

        cardTitleRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },

        cardTitle: {
            fontFamily: fontFamilies.semiBold,
            fontSize: 14,
            color: colors.text.primary,
        },

        cardMeta: {
            fontFamily: fontFamilies.medium,
            fontSize: 11,
            color: colors.text.secondary,
        },

        rateTrack: {
            flexDirection: 'row',
            height: 8,
            borderRadius: radius.full,
            overflow: 'hidden',
            backgroundColor: colors.border,
            marginTop: spacing.md,
            marginBottom: spacing.sm,
        },

        rateSuccess: {
            backgroundColor: colors.status.success,
        },

        rateFailed: {
            backgroundColor: colors.status.error,
        },

        rateLegend: {
            flexDirection: 'row',
            justifyContent: 'space-between',
        },

        legendItem: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
        },

        legendText: {
            fontFamily: fontFamilies.medium,
            fontSize: 11,
            color: colors.text.primary,
        },

        dot: {
            width: 8,
            height: 8,
            borderRadius: radius.full,
        },

        dotSuccess: {
            backgroundColor: colors.status.success,
        },

        dotFailed: {
            backgroundColor: colors.status.error,
        },

        amountRow: {
            flexDirection: 'row',
            gap: spacing.sm,
            marginBottom: spacing.md,
        },

        amountCard: {
            flex: 1,
            padding: spacing.md,
        },

        amountLabel: {
            fontFamily: fontFamilies.medium,
            fontSize: 11,
            color: colors.text.secondary,
            textAlign: 'right',
        },

        amountValueRow: {
            flexDirection: 'row',
            alignItems: 'baseline',
            justifyContent: 'flex-end',
            gap: spacing.xs,
            marginTop: spacing.lg,
        },

        amountValue: {
            // Lets the number shrink instead of pushing out of the card.
            flexShrink: 1,
            fontFamily: fontFamilies.bold,
            fontSize: 16,
            color: colors.text.primary,
            textAlign: 'right',
        },

        amountCurrency: {
            fontFamily: fontFamilies.semiBold,
            fontSize: 10,
            color: colors.text.secondary,
        },

        sectionTitle: {
            fontFamily: fontFamilies.semiBold,
            fontSize: 15,
            color: colors.text.primary,
            marginTop: spacing.sm,
            marginBottom: spacing.sm,
        },

        fab: {
            position: 'absolute',
            right: spacing.lg,
            backgroundColor: colors.brand.primary,
            borderRadius: radius.full,
        },
    });