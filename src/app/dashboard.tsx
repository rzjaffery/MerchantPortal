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
import { SymbolView } from 'expo-symbols';

import AppButton from '@/components/common/AppButton';
import AppCard from '@/components/common/AppCard';
import AppHeader from '@/components/common/AppHeader';
import BranchChartCard from '@/components/dashboard/BranchChartCard';

import { useAuth } from '@/context/AuthContext';
import { useDrawer } from '@/context/DrawerContext';
import { useLanguage } from '@/context/LanguageContext';
import { getDashboardSummary } from '@/services/dashboard/dashboardService';

import type { TranslationKey } from '@/i18n/translations';

import type {
    DashboardPeriod,
    DashboardSummary,
} from '@/types/dashboard';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/metrics';
import { fontFamilies } from '@/theme/typography';

// The period chips. A chip with value null is shown greyed out
// until we know the value the server expects for it.
const periods: {
    labelKey: TranslationKey;
    value: DashboardPeriod | null;
}[] = [
    { labelKey: 'today', value: 'TODAY' },
    { labelKey: 'yesterday', value: null },
    { labelKey: 'last7Days', value: null },
    { labelKey: 'last30Days', value: null },
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

    const loadSummary = useCallback(async () => {
        if (!username || !accessToken) {
            return;
        }

        setIsLoading(true);
        setHasError(false);
        setServerMessage('');

        try {
            const data = await getDashboardSummary(
                username,
                accessToken,
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
    }, [username, accessToken, period]);

    // Runs on first load and again whenever the period changes.
    useEffect(() => {
        void loadSummary();
    }, [loadSummary]);

    // Share of successful and failed transactions, as percentages.
    const totalSeries = summary
        ? summary.successfulSeries + summary.failedSeries
        : 0;

    const successPercent =
        summary && totalSeries > 0
            ? Math.round((summary.successfulSeries / totalSeries) * 100)
            : 0;

    const failedPercent = totalSeries > 0 ? 100 - successPercent : 0;

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
                        {/* Transactions summary */}
                        <AppCard style={styles.card}>
                            <View style={styles.cardTitleRow}>
                                <Text style={styles.cardTitle}>
                                    {t('transactionsSummary')}
                                </Text>

                                <Text style={styles.cardMeta}>
                                    {selectedPeriodLabel}
                                </Text>
                            </View>

                            <View style={styles.rateTrack}>
                                {totalSeries > 0 ? (
                                    <>
                                        <View
                                            style={[
                                                styles.rateSuccess,
                                                { flex: successPercent },
                                            ]}
                                        />
                                        <View
                                            style={[
                                                styles.rateFailed,
                                                { flex: failedPercent },
                                            ]}
                                        />
                                    </>
                                ) : null}
                            </View>

                            {totalSeries > 0 ? (
                                <View style={styles.rateLegend}>
                                    <View style={styles.legendItem}>
                                        <View
                                            style={[
                                                styles.dot,
                                                styles.dotSuccess,
                                            ]}
                                        />
                                        <Text style={styles.legendText}>
                                            {successPercent}% {t('successful')}
                                        </Text>
                                    </View>

                                    <View style={styles.legendItem}>
                                        <View
                                            style={[
                                                styles.dot,
                                                styles.dotFailed,
                                            ]}
                                        />
                                        <Text style={styles.legendText}>
                                            {failedPercent}% {t('failed')}
                                        </Text>
                                    </View>
                                </View>
                            ) : (
                                <Text style={styles.mutedText}>
                                    {t('noTransactions')}
                                </Text>
                            )}
                        </AppCard>

                        {/* USD and CDF amounts */}
                        <View style={styles.amountRow}>
                            <AppCard style={styles.amountCard}>
                                <Text style={styles.amountLabel}>
                                    {t('usdTransactions')}
                                </Text>

                                <Text style={styles.amountValue}>
                                    <Text style={styles.amountCurrency}>
                                        USD{' '}
                                    </Text>
                                    {formatAmount(summary.successfulAmountUSD)}
                                </Text>
                            </AppCard>

                            <AppCard style={styles.amountCard}>
                                <Text style={styles.amountLabel}>
                                    {t('cdfTransactions')}
                                </Text>

                                <Text style={styles.amountValue}>
                                    <Text style={styles.amountCurrency}>
                                        CDF{' '}
                                    </Text>
                                    {formatAmount(summary.successfulAmountCDF)}
                                </Text>
                            </AppCard>
                        </View>
                    </>
                ) : null}

                {/* Branch charts. No branch data is available yet,
                    so both receive an empty list. */}
                <Text style={styles.sectionTitle}>
                    {t('salesVolume')}
                </Text>

                <BranchChartCard data={[]} emptyText={t('noBranchData')} />

                <Text style={styles.sectionTitle}>
                    {t('transactionCount')}
                </Text>

                <BranchChartCard data={[]} emptyText={t('noBranchData')} />

                {/* QR code (the real code is a later step) */}
                <AppCard style={styles.qrCard}>
                    <Text style={styles.cardTitle}>
                        {t('myQrCode')}
                    </Text>

                    <Text style={styles.mutedText}>
                        {t('qrCaption')}
                    </Text>

                    <View style={styles.qrBox}>
                        <SymbolView
                            name={{
                                ios: 'qrcode',
                                android: 'qr_code_2',
                                web: 'qr_code_2',
                            }}
                            size={88}
                            tintColor={colors.text.primary}
                        />
                    </View>

                    <Text style={styles.cardMeta}>
                        {t('soon')}
                    </Text>
                </AppCard>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
    },

    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.xxxl,
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
    },

    amountValue: {
        fontFamily: fontFamilies.bold,
        fontSize: 16,
        color: colors.text.primary,
        textAlign: 'right',
        marginTop: spacing.lg,
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

    qrCard: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
        marginTop: spacing.sm,
        gap: spacing.xs,
    },

    qrBox: {
        width: 128,
        height: 128,
        borderRadius: radius.lg,
        backgroundColor: colors.brand.soft,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: spacing.md,
    },
});