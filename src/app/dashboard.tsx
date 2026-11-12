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
import { getDashboardSummary } from '@/services/dashboard/dashboardService';
import type { DashboardSummary } from '@/types/dashboard';

import AppCard from '@/components/common/AppCard';

import { useAuth } from '@/context/AuthContext';

import { colors } from '@/theme/colors';
import { elevation, radius, spacing } from '@/theme/metrics';
import { fontFamilies } from '@/theme/typography';


const quickActions = [
    {
        title: 'Orders',
        description: 'Manage customer orders',
        symbol: 'O',
    },
    {
        title: 'Products',
        description: 'Manage your catalog',
        symbol: 'P',
    },
    {
        title: 'Reports',
        description: 'View business insights',
        symbol: 'R',
    },
] as const;

export default function DashboardScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const displayName = user?.fullName ?? 'Merchant';

    const initials = displayName
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');

    const loadSummary = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await getDashboardSummary();

            setSummary(data);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'Unable to load dashboard information.'
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadSummary();
    }, [loadSummary]);

    // Formats an amount with its currency code, e.g. "CDF 248,000".
    function formatAmount(currency: 'CDF' | 'USD', amount: number): string {
        return `${currency} ${amount.toLocaleString()}`;
    }

    const dashboardMetrics = summary
        ? [
            {
                label: 'Successful CDF',
                value: formatAmount('CDF', summary.successfulAmountCDF),
                detail: 'Completed payments',
                symbol: 'S',
            },
            {
                label: 'Successful USD',
                value: formatAmount('USD', summary.successfulAmountUSD),
                detail: 'Completed payments',
                symbol: 'S',
            },
            {
                label: 'Failed CDF',
                value: formatAmount('CDF', summary.failedAmountCDF),
                detail: 'Unsuccessful payments',
                symbol: 'F',
            },
            {
                label: 'Failed USD',
                value: formatAmount('USD', summary.failedAmountUSD),
                detail: 'Unsuccessful payments',
                symbol: 'F',
            },
        ]
        : [];

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >

                {/* Dashboard Header */}
                <View style={styles.header}>
                    <View style={styles.headerText}>
                        <Text style={styles.eyebrow}>
                            MERCHANT WORKSPACE
                        </Text>

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

                {/* Welcome Banner */}
                <View style={styles.banner}>
                    <View style={styles.bannerBadge}>
                        <Text style={styles.bannerBadgeText}>
                            DEMO MODE
                        </Text>
                    </View>

                    <Text style={styles.bannerTitle}>
                        Your business,{'\n'}at a glance.
                    </Text>

                    <Text style={styles.bannerDescription}>
                        Everything you need to manage your
                        merchant account in one place.
                    </Text>

                    <Text style={styles.bannerBrand}>
                        MERCHANT PORTAL
                    </Text>
                </View>

                {/* Business Metrics */}
                <View style={styles.sectionHeader}>
                    <View>
                        <Text style={styles.sectionTitle}>
                            Business Overview
                        </Text>

                        <Text style={styles.sectionSubtitle}>
                            Your merchant performance
                        </Text>
                    </View>

                    <Text style={styles.sampleLabel}>
                        SAMPLE DATA
                    </Text>
                </View>

                {isLoading ? (
                    <View style={styles.stateContainer}>
                        <ActivityIndicator
                            size="large"
                            color={colors.brand.primary}
                        />

                        <Text style={styles.stateText}>
                            Loading business overview...
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
                    <View style={styles.metricsContainer}>
                        {dashboardMetrics.map((metric) => (
                            <AppCard
                                key={metric.label}
                                style={styles.metricCard}
                            >
                                <View style={styles.metricTopRow}>
                                    <Text style={styles.metricLabel}>
                                        {metric.label}
                                    </Text>

                                    <View style={styles.metricIcon}>
                                        <Text style={styles.metricIconText}>
                                            {metric.symbol}
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.metricValue}>
                                    {metric.value}
                                </Text>

                                <Text style={styles.metricDetail}>
                                    {metric.detail}
                                </Text>
                            </AppCard>
                        ))}
                    </View>
                )}

                {/* Quick Actions */}
                <View style={styles.quickActionHeader}>
                    <Text style={styles.sectionTitle}>
                        Quick Actions
                    </Text>

                    <Text style={styles.sectionSubtitle}>
                        Your business tools
                    </Text>
                </View>

                <View style={styles.actionsContainer}>
                    {quickActions.map((action) => (
                        <AppCard
                            key={action.title}
                            style={styles.actionCard}
                        >
                            <View style={styles.actionIcon}>
                                <Text style={styles.actionIconText}>
                                    {action.symbol}
                                </Text>
                            </View>

                            <Text style={styles.actionTitle}>
                                {action.title}
                            </Text>

                            <Text style={styles.actionDescription}>
                                {action.description}
                            </Text>

                            <Text style={styles.comingSoon}>
                                Coming soon
                            </Text>
                        </AppCard>
                    ))}
                </View>

                {/* Demo Notice */}
                <View style={styles.notice}>
                    <Text style={styles.noticeText}>
                        Dashboard figures are sample values.
                        Live business information will be
                        provided by the merchant API.
                    </Text>
                </View>

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
        marginBottom: spacing.xxl,
    },

    headerText: {
        flex: 1,
    },

    eyebrow: {
        fontFamily: fontFamilies.semiBold,
        fontSize: 10,
        letterSpacing: 1.5,
        color: colors.text.secondary,
        marginBottom: spacing.xs,
    },

    greeting: {
        fontFamily: fontFamilies.regular,
        fontSize: 15,
        color: colors.text.secondary,
    },

    merchantName: {
        fontFamily: fontFamilies.bold,
        fontSize: 23,
        color: colors.text.primary,
        marginTop: spacing.xs,
    },

    stateContainer: {
        minHeight: 140,
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.xxxl,
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

    banner: {
        backgroundColor: colors.brand.primary,
        padding: spacing.xxl,
        borderRadius: radius.xxl,
        marginBottom: spacing.xxxl,
    },

    bannerBadge: {
        backgroundColor: colors.brand.soft,
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radius.full,
        marginBottom: spacing.lg,
    },

    bannerBadgeText: {
        fontFamily: fontFamilies.bold,
        fontSize: 9,
        color: colors.brand.onPrimary,
        letterSpacing: 1,
    },

    bannerTitle: {
        fontFamily: fontFamilies.bold,
        fontSize: 26,
        lineHeight: 34,
        color: colors.brand.onPrimary,
        marginBottom: spacing.md,
    },

    bannerDescription: {
        fontFamily: fontFamilies.medium,
        fontSize: 13,
        lineHeight: 21,
        color: colors.brand.onPrimary,
        maxWidth: 280,
    },

    bannerBrand: {
        fontFamily: fontFamilies.bold,
        fontSize: 10,
        letterSpacing: 2,
        color: colors.brand.onPrimary,
        marginTop: spacing.xl,
    },

    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },

    sectionTitle: {
        fontFamily: fontFamilies.bold,
        fontSize: 18,
        color: colors.text.primary,
    },

    sectionSubtitle: {
        fontFamily: fontFamilies.regular,
        fontSize: 12,
        color: colors.text.secondary,
        marginTop: spacing.xs,
    },

    sampleLabel: {
        fontFamily: fontFamilies.semiBold,
        fontSize: 9,
        color: colors.text.secondary,
    },

    metricsContainer: {
        flexWrap: 'wrap',
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.xxxl,
    },

    metricCard: {
        width:"47%",
        padding: spacing.md,
    },

    metricTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },

    metricLabel: {
        fontFamily: fontFamilies.medium,
        fontSize: 11,
        color: colors.text.secondary,
    },

    metricIcon: {
        width: 27,
        height: 27,
        borderRadius: radius.sm,
        backgroundColor: colors.brand.soft,
        alignItems: 'center',
        justifyContent: 'center',
    },

    metricIconText: {
        fontFamily: fontFamilies.bold,
        fontSize: 12,
        color: colors.brand.onPrimary,
    },

    metricValue: {
        fontFamily: fontFamilies.bold,
        fontSize: 19,
        color: colors.text.primary,
    },

    metricDetail: {
        fontFamily: fontFamilies.regular,
        fontSize: 10,
        color: colors.text.secondary,
        marginTop: spacing.xs,
    },

    quickActionHeader: {
        marginBottom: spacing.lg,
    },

    actionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },

    actionCard: {
        width: '47%',
        padding: spacing.lg,
    },

    actionIcon: {
        width: 36,
        height: 36,
        borderRadius: radius.md,
        backgroundColor: colors.brand.soft,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },

    actionIconText: {
        fontFamily: fontFamilies.bold,
        fontSize: 15,
        color: colors.brand.onPrimary,
    },

    actionTitle: {
        fontFamily: fontFamilies.semiBold,
        fontSize: 14,
        color: colors.text.primary,
    },

    actionDescription: {
        fontFamily: fontFamilies.regular,
        fontSize: 11,
        lineHeight: 17,
        color: colors.text.secondary,
        marginTop: spacing.xs,
    },

    comingSoon: {
        fontFamily: fontFamilies.medium,
        fontSize: 10,
        color: colors.text.secondary,
        marginTop: spacing.md,
    },

    notice: {
        marginTop: spacing.xxl,
        padding: spacing.lg,
        backgroundColor: colors.brand.soft,
        borderRadius: radius.md,
    },

    noticeText: {
        fontFamily: fontFamilies.regular,
        fontSize: 11,
        lineHeight: 18,
        color: colors.text.primary,
    },
});
