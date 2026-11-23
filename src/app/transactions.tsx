// src/app/transactions.tsx
import { useCallback, useEffect, useRef, useState } from 'react';

import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';

import { useRouter } from 'expo-router';
import { Modal, Portal } from 'react-native-paper';

import AppButton from '@/components/common/AppButton';
import AppCard from '@/components/common/AppCard';
import AppHeader from '@/components/common/AppHeader';

import { useAuth } from '@/context/AuthContext';
import { useDrawer } from '@/context/DrawerContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAppTheme, useThemedStyles } from '@/context/ThemeContext';

import { ApiError } from '@/services/api/apiClient';
import { getTransactions } from '@/services/transactions/transactionsService';
import { formatDateTime, periodRange } from '@/utils/dateTime';
import type { PeriodKey } from '@/utils/dateTime';

import type { TranslationKey } from '@/i18n/translations';
import type {
    Transaction,
    TransactionCurrencyFilter,
    TransactionStatusFilter,
} from '@/types/transactions';
import type { AppColors } from '@/theme/colors';
import { radius, spacing } from '@/theme/metrics';
import { fontFamilies } from '@/theme/typography';

// How many transactions to ask the server for at a time.
const PAGE_SIZE = 20;

// Response codes that mean "nothing found" rather than "something broke".
// Empty for now. After the first run, look in the Expo terminal for a line
// like "[API] searchtransactionlist -> 162 ..." when a period has no
// transactions, and add that code here as a string, e.g. ['162'].
const NO_RECORD_CODES: string[] = [];

const periods: PeriodKey[] = ['today', 'yesterday', 'last7Days', 'last30Days'];

const statusOptions: { value: TransactionStatusFilter; labelKey: TranslationKey }[] = [
    { value: 'ALL', labelKey: 'all' },
    { value: 'APPROVED', labelKey: 'successful' },
    { value: 'DECLINED', labelKey: 'failed' },
];

const currencyOptions: { value: TransactionCurrencyFilter; label: string }[] = [
    { value: 'USD', label: 'USD' },
    { value: 'CDF', label: 'CDF' },
];

// Shows an amount with separators, e.g. 15,000.00
function formatAmount(amount: number): string {
    return amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function TransactionsScreen() {
    const { colors } = useAppTheme();
    const styles = useThemedStyles(createStyles);

    const router = useRouter();
    const { user, accessToken } = useAuth();
    const { t } = useLanguage();
    const { openDrawer } = useDrawer();
    const { height: screenHeight } = useWindowDimensions();

    const username = user?.username ?? '';
    const userId = user?.id ?? '';
    const merchantId = user?.merchantId ?? '';

    // Filters. All three are sent to the server.
    const [period, setPeriod] = useState<PeriodKey>('today');
    const [status, setStatus] = useState<TransactionStatusFilter>('ALL');
    const [currency, setCurrency] = useState<TransactionCurrencyFilter>('ALL');

    // Data from the server.
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState('');

    // The transaction open in the details sheet.
    const [selected, setSelected] = useState<Transaction | null>(null);

    const detailsMaxHeight = Math.round(screenHeight * 0.55);

    // Counts the requests. If the user taps another filter while a request
    // is still running, the older answer arrives late and is thrown away.
    const latestRequest = useRef(0);

    // Loads one page. Page 1 replaces the list, later pages are added.
    const loadPage = useCallback(
        async (pageToLoad: number) => {
            if (!username || !accessToken || !merchantId) {
                return;
            }

            latestRequest.current += 1;
            const thisRequest = latestRequest.current;

            const { from, to } = periodRange(period);

            const result = await getTransactions({
                username,
                token: accessToken,
                userId,
                merchantId,
                from,
                to,
                status,
                currency,
                page: pageToLoad,
                pageSize: PAGE_SIZE,
            });

            if (thisRequest !== latestRequest.current) {
                return;
            }

            setTransactions((current) =>
                pageToLoad === 1
                    ? result.transactions
                    : [...current, ...result.transactions]
            );
            setTotalCount(result.totalCount);
            setPage(pageToLoad);
        },
        [username, accessToken, userId, merchantId, period, status, currency]
    );

    // Shows the right message for a failed request.
    const handleLoadError = useCallback(
        (loadError: unknown) => {
            if (
                loadError instanceof ApiError &&
                NO_RECORD_CODES.includes(loadError.code)
            ) {
                setTransactions([]);
                setTotalCount(0);
                setError('');
                return;
            }

            setError(
                loadError instanceof Error
                    ? loadError.message
                    : t('transactionsLoadFailed')
            );
        },
        [t]
    );

    // First load, and again whenever a filter changes.
    const loadFirstPage = useCallback(async () => {
        setIsLoading(true);
        setError('');

        try {
            await loadPage(1);
        } catch (loadError) {
            setTransactions([]);
            handleLoadError(loadError);
        } finally {
            setIsLoading(false);
        }
    }, [loadPage, handleLoadError]);

    useEffect(() => {
        void loadFirstPage();
    }, [loadFirstPage]);

    // Pull down to refresh.
    async function handleRefresh() {
        setIsRefreshing(true);
        setError('');

        try {
            await loadPage(1);
        } catch (loadError) {
            handleLoadError(loadError);
        } finally {
            setIsRefreshing(false);
        }
    }

    async function handleLoadMore() {
        setIsLoadingMore(true);

        try {
            await loadPage(page + 1);
        } catch (loadError) {
            handleLoadError(loadError);
        } finally {
            setIsLoadingMore(false);
        }
    }

    const hasMore = transactions.length < totalCount;

    // Colours for the status badge.
    function statusColors(isApproved: boolean) {
        return {
            text: isApproved ? colors.status.success : colors.status.error,
            background: colors.background,
        };
    }

    // A row of selectable chips, used for the three filters.
    function renderChips<T extends string>(
        options: { value: T; label: string }[],
        value: T,
        onChange: (next: T) => void
    ) {
        return (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
            >
                {options.map((option) => {
                    const isSelected = option.value === value;

                    return (
                        <Pressable
                            key={option.value}
                            onPress={() => onChange(option.value)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isSelected }}
                            style={[
                                styles.chip,
                                isSelected && styles.chipSelected,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.chipText,
                                    isSelected && styles.chipTextSelected,
                                ]}
                            >
                                {option.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>
        );
    }

    // Filters and the record count, shown above the list.
    const listHeader = (
        <View>
            {renderChips(
                periods.map((key) => ({ value: key, label: t(key) })),
                period,
                setPeriod
            )}

            <Text style={styles.filterLabel}>{t('status')}</Text>
            {renderChips(
                statusOptions.map((option) => ({
                    value: option.value,
                    label: t(option.labelKey),
                })),
                status,
                setStatus
            )}

            <Text style={styles.filterLabel}>{t('currency')}</Text>
            {renderChips(
                [{ value: 'ALL' as const, label: t('all') }, ...currencyOptions],
                currency,
                setCurrency
            )}

            {!isLoading && !error ? (
                <Text style={styles.countText}>
                    {transactions.length} / {totalCount} {t('records')}
                </Text>
            ) : null}
        </View>
    );

    // The rows shown in the details sheet. Empty ones are hidden.
    const detailRows = selected
        ? [
            { label: t('referenceNumber'), value: selected.id },
            { label: t('dateAndTime'), value: formatDateTime(selected.dateTime) },
            {
                label: t('amount'),
                value: `${formatAmount(selected.amount)} ${selected.currency}`.trim(),
            },
            {
                label: t('status'),
                value: selected.isApproved ? t('successful') : t('failed'),
            },
            {
                label: t('description'),
                value: [selected.responseCode, selected.responseDescription]
                    .filter(Boolean)
                    .join(' - '),
            },
            { label: t('paymentMethod'), value: selected.paymentMethod },
            { label: t('transactionType'), value: selected.transactionType },
            { label: t('invoiceId'), value: selected.invoiceId },
            { label: t('mobileNumber'), value: selected.mobileNumber },
            { label: t('destinationMobile'), value: selected.destinationMobileNumber },
            { label: t('businessName'), value: selected.businessName },
        ].filter((row) => row.value)
        : [];

    return (
        <View style={styles.screen}>
            <AppHeader
                title={t('transactions')}
                leftIcon="menu"
                onLeftPress={openDrawer}
                onProfilePress={() => router.push('/profile')}
            />

            <FlatList
                data={isLoading || error ? [] : transactions}
                // A reference number can repeat, so the position is added.
                keyExtractor={(item, index) => `${item.id}-${index}`}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={listHeader}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => void handleRefresh()}
                        colors={[colors.brand.primary]}
                        tintColor={colors.brand.primary}
                    />
                }
                renderItem={({ item }) => {
                    const badge = statusColors(item.isApproved);

                    return (
                        <Pressable
                            onPress={() => setSelected(item)}
                            accessibilityRole="button"
                        >
                            <AppCard style={styles.entryCard}>
                                <View style={styles.entryTopRow}>
                                    <Text
                                        style={styles.entryTitle}
                                        numberOfLines={1}
                                    >
                                        {item.paymentMethod ||
                                            item.transactionType ||
                                            '—'}
                                    </Text>

                                    <Text
                                        style={styles.entryAmount}
                                        numberOfLines={1}
                                        adjustsFontSizeToFit
                                        minimumFontScale={0.6}
                                    >
                                        {formatAmount(item.amount)} {item.currency}
                                    </Text>
                                </View>

                                <View style={styles.entryBottomRow}>
                                    <Text style={styles.entryMeta}>
                                        {formatDateTime(item.dateTime)}
                                    </Text>

                                    <View
                                        style={[
                                            styles.badge,
                                            { backgroundColor: badge.background },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.badgeText,
                                                { color: badge.text },
                                            ]}
                                        >
                                            {item.isApproved
                                                ? t('successful')
                                                : t('failed')}
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.entryMeta} numberOfLines={1}>
                                    {t('referenceNumber')}: {item.id || '—'}
                                </Text>
                            </AppCard>
                        </Pressable>
                    );
                }}
                ListEmptyComponent={
                    isLoading ? (
                        <View style={styles.stateBox}>
                            <ActivityIndicator
                                size="large"
                                color={colors.brand.primary}
                            />
                            <Text style={styles.mutedText}>
                                {t('loadingTransactions')}
                            </Text>
                        </View>
                    ) : error ? (
                        <View style={styles.stateBox}>
                            <Text style={styles.errorText}>{error}</Text>
                            <AppButton
                                title={t('tryAgain')}
                                variant="outline"
                                onPress={() => void loadFirstPage()}
                            />
                        </View>
                    ) : (
                        <View style={styles.stateBox}>
                            <Text style={styles.mutedText}>
                                {t('noTransactions')}
                            </Text>
                        </View>
                    )
                }
                ListFooterComponent={
                    !isLoading && !error && hasMore ? (
                        <View style={styles.footer}>
                            <AppButton
                                title={t('loadMore')}
                                variant="outline"
                                loading={isLoadingMore}
                                disabled={isLoadingMore}
                                onPress={() => void handleLoadMore()}
                            />
                        </View>
                    ) : undefined
                }
            />

            {/* Details sheet */}
            <Portal>
                <Modal
                    visible={selected !== null}
                    onDismiss={() => setSelected(null)}
                    contentContainerStyle={styles.sheet}
                >
                    <Text style={styles.sheetTitle}>
                        {t('transactionDetails')}
                    </Text>

                    <ScrollView
                        style={[
                            styles.sheetScroll,
                            { maxHeight: detailsMaxHeight },
                        ]}
                    >
                        {detailRows.map((row) => (
                            <View key={row.label} style={styles.detailRow}>
                                <Text style={styles.detailLabel}>
                                    {row.label}
                                </Text>
                                <Text style={styles.detailValue}>
                                    {row.value}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>

                    <View style={styles.sheetButtons}>
                        <AppButton
                            title={t('close')}
                            variant="outline"
                            onPress={() => setSelected(null)}
                        />
                    </View>
                </Modal>
            </Portal>
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

        listContent: {
            padding: spacing.lg,
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

        chipText: {
            fontFamily: fontFamilies.medium,
            fontSize: 12,
            color: colors.text.secondary,
        },

        chipTextSelected: {
            fontFamily: fontFamilies.semiBold,
            color: colors.brand.onPrimary,
        },

        filterLabel: {
            fontFamily: fontFamilies.medium,
            fontSize: 12,
            color: colors.text.secondary,
            marginBottom: spacing.sm,
        },

        countText: {
            fontFamily: fontFamilies.medium,
            fontSize: 12,
            color: colors.text.secondary,
            marginBottom: spacing.md,
        },

        entryCard: {
            marginBottom: spacing.sm,
            gap: spacing.xs,
        },

        entryTopRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
        },

        entryTitle: {
            flex: 1,
            fontFamily: fontFamilies.semiBold,
            fontSize: 15,
            color: colors.text.primary,
        },

        entryAmount: {
            flexShrink: 1,
            fontFamily: fontFamilies.bold,
            fontSize: 16,
            color: colors.text.primary,
            textAlign: 'right',
        },

        entryBottomRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },

        entryMeta: {
            fontFamily: fontFamilies.regular,
            fontSize: 12,
            color: colors.text.secondary,
        },

        badge: {
            paddingHorizontal: spacing.sm,
            paddingVertical: 2,
            borderRadius: radius.full,
        },

        badgeText: {
            fontFamily: fontFamilies.semiBold,
            fontSize: 11,
        },

        stateBox: {
            alignItems: 'center',
            gap: spacing.md,
            paddingVertical: spacing.xxxl,
        },

        mutedText: {
            fontFamily: fontFamilies.regular,
            fontSize: 13,
            color: colors.text.secondary,
            textAlign: 'center',
        },

        errorText: {
            fontFamily: fontFamilies.medium,
            fontSize: 13,
            color: colors.status.error,
            textAlign: 'center',
        },

        footer: {
            marginTop: spacing.md,
        },

        sheet: {
            backgroundColor: colors.surface,
            marginHorizontal: spacing.lg,
            padding: spacing.lg,
            borderRadius: radius.xl,
        },

        sheetTitle: {
            fontFamily: fontFamilies.semiBold,
            fontSize: 17,
            color: colors.text.primary,
            marginBottom: spacing.md,
        },

        sheetScroll: {
            flexGrow: 0,
        },

        detailRow: {
            paddingVertical: spacing.sm,
            borderTopWidth: 1,
            borderTopColor: colors.border,
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
            marginTop: 2,
        },

        sheetButtons: {
            gap: spacing.sm,
            marginTop: spacing.md,
        },
    });