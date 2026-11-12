// src/app/dashboard.tsx
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import AppButton from '@/components/common/AppButton';
import AppCard from '@/components/common/AppCard';

import { useAuth } from '@/context/AuthContext';
import { getDashboardSummary } from '@/services/dashboard/dashboardService';

import type {
    DashboardPeriod,
    DashboardSummary,
} from '@/types/dashboard';

import { colors } from '@/theme/colors';
import { elevation, radius, spacing } from '@/theme/metrics';
import { fontFamilies } from '@/theme/typography';

// The period chips. Add more here once their server values are known.
const periods: { label: string; value: DashboardPeriod }[] = [
    { label: 'Today', value: 'TODAY' },
    { label: 'This year', value: 'THISYEAR' },
];

// Features that will get their own screens later.
const upcomingRows = ['Portal QR', 'Dynamic QR', 'Sales by branch'] as const;

// Formats an amount with its currency code, e.g. "CDF 248,000".
function formatAmount(currency: 'CDF' | 'USD', amount: number): string {
    return `${currency} ${amount.toLocaleString()}`;
}

export default function DashboardScreen() {
    const router = useRouter();
    const { user, accessToken } = useAuth();

    const [period, setPeriod] = useState<DashboardPeriod>('TODAY');
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const username = user?.username ?? '';
    const displayName = user?.fullName ?? 'Merchant';

    const initials = displayName
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');

    const loadSummary = useCallback(async () => {
        if (!username || !accessToken) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = await getDashboardSummary(
                username,
                accessToken,
                period
            );

            setSummary(data);
        } catch (loadError) {
            setError(
                loadError instanceof Error
                    ? loadError.message
                    : 'Unable to load dashboard information.'
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

    const amountCards = summary
        ? [
            {
                label: 'Successful CDF',
                value: formatAmount('CDF', summary.successfulAmountCDF),
            },
            {
                label: 'Successful USD',
                value: formatAmount('USD', summary.successfulAmountUSD),
            },
            {
                label: 'Failed CDF',
                value: formatAmount('CDF', summary.failedAmountCDF),
            },
            {
                label: 'Failed USD',
                value: formatAmount('USD', summary.failedAmountUSD),
            },
        ]
        : [];

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerText}>
                        <Text style={styles.greeting}>
                            Welcome back,
                        </Text>

                        <Text style={styles.merchantName}>
                            {displayName}
                        </Text>
                    </View>

                    <Pressable
                        style={styles.profileButton}
                        onPress={() => router.push('/profile')}
                        accessibilityRole="button"
                        accessibilityLabel="Open merchant profile"
                    >
                        <Text style={styles.profileInitials}>
                            {initials || 'M'}
                        </Text>
                    </Pressable>
                </View>

                {/* Period chips */}
                <View style={styles.chipRow}>
                    {periods.map((item) => {
                        const selected = item.value === period;

                        return (
                            <Pressable
                                key={item.value}
                                onPress={() => setPeriod(item.value)}
                                accessibilityRole="button"
                                accessibilityState={{ selected }}
                                style={[
                                    styles.chip,
                                    selected && styles.chipSelected,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.chipText,
                                        selected && styles.chipTextSelected,
                                    ]}
                                >
                                    {item.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                {isLoading ? (
                    <View style={styles.stateContainer}>
                        <ActivityIndicator
                            size="large"
                            color={colors.brand.primary}
                        />

                        <Text style={styles.stateText}>
                            Loading your figures...
                        </Text>
                    </View>
                ) : error ? (
                    <View style={styles.stateContainer}>
                        <Text style={styles.errorText}>
                            {error}
                        </Text>

                        <AppButton
                            title="Try Again"
                            variant="outline"
                            onPress={() => void loadSummary()}
                        />
                    </View>
                ) : (
                    <>
                        {/* Success rate */}
                        <AppCard style={styles.rateCard}>
                            <Text style={styles.cardLabel}>
                                Transactions
                            </Text>

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
                                    <Text style={styles.rateSuccessText}>
                                        {successPercent}% successful
                                    </Text>

                                    <Text style={styles.rateFailedText}>
                                        {failedPercent}% failed
                                    </Text>
                                </View>
                            ) : (
                                <Text style={styles.emptyText}>
                                    No transactions in this period.
                                </Text>
                            )}
                        </AppCard>

                        {/* Amounts */}
                        <View style={styles.amountGrid}>
                            {amountCards.map((card) => (
                                <AppCard
                                    key={card.label}
                                    style={styles.amountCard}
                                >
                                    <Text style={styles.cardLabel}>
                                        {card.label}
                                    </Text>

                                    <Text style={styles.amountValue}>
                                        {card.value}
                                    </Text>
                                </AppCard>
                            ))}
                        </View>
                    </>
                )}

                {/* Features that open their own screens later */}
                {upcomingRows.map((title) => (
                    <View key={title} style={styles.row}>
                        <Text style={styles.rowTitle}>
                            {title}
                        </Text>

                        <Text style={styles.rowTag}>
                            Soon
                        </Text>
                    </View>
                ))}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },

    scrollContent: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xxxl,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
    },

    headerText: {
        flex: 1,
    },

    greeting: {
        fontFamily: fontFamilies.regular,
        fontSize: 14,
        color: colors.text.secondary,
    },

    merchantName: {
        fontFamily: fontFamilies.bold,
        fontSize: 22,
        color: colors.text.primary,
        marginTop: spacing.xs,
    },

    profileButton: {
        width: 48,
        height: 48,
        borderRadius: radius.full,
        backgroundColor: colors.brand.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...elevation.card,
    },

    profileInitials: {
        fontFamily: fontFamilies.bold,
        fontSize: 16,
        color: colors.brand.onPrimary,
    },

    chipRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.xl,
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
        marginBottom: spacing.xl,
    },

    stateText: {
        fontFamily: fontFamilies.medium,
        fontSize: 13,
        color: colors.text.secondary,
    },

    errorText: {
        fontFamily: fontFamilies.medium,
        fontSize: 13,
        color: colors.status.error,
        textAlign: 'center',
    },

    rateCard: {
        marginBottom: spacing.md,
    },

    cardLabel: {
        fontFamily: fontFamilies.medium,
        fontSize: 12,
        color: colors.text.secondary,
    },

    rateTrack: {
        flexDirection: 'row',
        height: 10,
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

    rateSuccessText: {
        fontFamily: fontFamilies.semiBold,
        fontSize: 12,
        color: colors.status.success,
    },

    rateFailedText: {
        fontFamily: fontFamilies.semiBold,
        fontSize: 12,
        color: colors.status.error,
    },

    emptyText: {
        fontFamily: fontFamilies.regular,
        fontSize: 12,
        color: colors.text.secondary,
    },

    amountGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.xl,
    },

    amountCard: {
        width: '48%',
        padding: spacing.md,
    },

    amountValue: {
        fontFamily: fontFamilies.bold,
        fontSize: 17,
        color: colors.text.primary,
        marginTop: spacing.sm,
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        marginBottom: spacing.sm,
    },

    rowTitle: {
        fontFamily: fontFamilies.semiBold,
        fontSize: 14,
        color: colors.text.primary,
    },

    rowTag: {
        fontFamily: fontFamilies.medium,
        fontSize: 11,
        color: colors.text.secondary,
    },
});