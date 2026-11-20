// src/app/qr-payment-log.tsx
import { useCallback, useEffect, useState } from 'react';

import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    useWindowDimensions,
} from 'react-native';

import { useRouter } from 'expo-router';
import { Modal, Portal } from 'react-native-paper';
import { SymbolView } from 'expo-symbols';
import QRCode from 'react-native-qrcode-svg';

import AppButton from '@/components/common/AppButton';
import AppCard from '@/components/common/AppCard';
import AppHeader from '@/components/common/AppHeader';

import { useAuth } from '@/context/AuthContext';
import { useDrawer } from '@/context/DrawerContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAppTheme, useThemedStyles } from '@/context/ThemeContext';

import { getQrPaymentLog } from '@/services/qrLog/qrLogService';

import type { TranslationKey } from '@/i18n/translations';
import type { QrLogEntry } from '@/types/qrLog';
import type { AppColors } from '@/theme/colors';
import { radius, spacing } from '@/theme/metrics';
import { fontFamilies } from '@/theme/typography';

// How many entries to ask the server for at a time.
const PAGE_SIZE = 20;

type PeriodKey = 'today' | 'yesterday' | 'last7Days' | 'last30Days';

const periods: PeriodKey[] = ['today', 'yesterday', 'last7Days', 'last30Days'];

// The two transaction types the website's filter offers.
const typeFilters: { value: string; labelKey: TranslationKey }[] = [
    { value: 'ALL', labelKey: 'all' },
    { value: 'GenerateDynamicQR', labelKey: 'qrPayment' },
    { value: 'GenerateMobilePayment', labelKey: 'mobilePayment' },
];

// Start and end of a period, both included.
function periodRange(period: PeriodKey): { from: Date; to: Date } {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(startOfToday);
    endOfToday.setHours(23, 59, 59, 0);

    // A copy of a date moved by a number of days.
    const shift = (date: Date, days: number) => {
        const copy = new Date(date);
        copy.setDate(copy.getDate() + days);
        return copy;
    };

    switch (period) {
        case 'yesterday':
            return { from: shift(startOfToday, -1), to: shift(endOfToday, -1) };
        case 'last7Days':
            return { from: shift(startOfToday, -6), to: endOfToday };
        case 'last30Days':
            return { from: shift(startOfToday, -29), to: endOfToday };
        default:
            return { from: startOfToday, to: endOfToday };
    }
}

// Adds a leading zero: 7 becomes "07".
function pad(value: number): string {
    return String(value).padStart(2, '0');
}

// Shows a date as 2026-11-20 13:01:48.
function formatDateTime(date: Date | null): string {
    if (!date) {
        return '—';
    }

    return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    );
}

// Shows the stored amount with separators, e.g. "125.00" or "15,000.00".
function formatAmount(amount: string): string {
    const value = Number(amount);

    if (!amount || !Number.isFinite(value)) {
        return amount || '—';
    }

    return value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function QrPaymentLogScreen() {
    const { colors } = useAppTheme();
    const styles = useThemedStyles(createStyles);

    const router = useRouter();
    const { user, accessToken } = useAuth();
    const { t } = useLanguage();
    const { openDrawer } = useDrawer();
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    const username = user?.username ?? '';
    const merchantId = user?.merchantId ?? '';

    // Filters.
    const [period, setPeriod] = useState<PeriodKey>('today');
    const [invoiceSearch, setInvoiceSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');

    // Data from the server.
    const [entries, setEntries] = useState<QrLogEntry[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState('');

    // The entry open in the details sheet, and whether its QR is showing.
    const [selected, setSelected] = useState<QrLogEntry | null>(null);
    const [showQr, setShowQr] = useState(false);

    const qrSize = Math.min(Math.round(screenWidth * 0.6), 260);
    const detailsMaxHeight = Math.round(screenHeight * 0.55);

    // Loads one page. Page 1 replaces the list, later pages are added.
    const loadPage = useCallback(
        async (pageToLoad: number) => {
            if (!username || !accessToken || !merchantId) {
                return;
            }

            const { from, to } = periodRange(period);

            const result = await getQrPaymentLog({
                username,
                token: accessToken,
                merchantId,
                from,
                to,
                page: pageToLoad,
                pageSize: PAGE_SIZE,
            });

            setEntries((current) =>
                pageToLoad === 1 ? result.entries : [...current, ...result.entries]
            );
            setTotalCount(result.totalCount);
            setPage(pageToLoad);
        },
        [username, accessToken, merchantId, period]
    );

    // First load, and again whenever the period changes.
    const loadFirstPage = useCallback(async () => {
        setIsLoading(true);
        setError('');

        try {
            await loadPage(1);
        } catch (loadError) {
            setEntries([]);
            setError(
                loadError instanceof Error
                    ? loadError.message
                    : t('logLoadFailed')
            );
        } finally {
            setIsLoading(false);
        }
    }, [loadPage, t]);

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
            setError(
                loadError instanceof Error
                    ? loadError.message
                    : t('logLoadFailed')
            );
        } finally {
            setIsRefreshing(false);
        }
    }

    async function handleLoadMore() {
        setIsLoadingMore(true);

        try {
            await loadPage(page + 1);
        } catch (loadError) {
            setError(
                loadError instanceof Error
                    ? loadError.message
                    : t('logLoadFailed')
            );
        } finally {
            setIsLoadingMore(false);
        }
    }

    // The status choices come from the data itself, e.g. PENDING.
    const statuses = [
        'ALL',
        ...Array.from(
            new Set(entries.map((entry) => entry.status).filter(Boolean))
        ),
    ];

    // Invoice, status and type are filtered on the phone.
    const search = invoiceSearch.trim().toLowerCase();

    const visibleEntries = entries.filter(
        (entry) =>
            (!search || entry.invoiceId.toLowerCase().includes(search)) &&
            (statusFilter === 'ALL' || entry.status === statusFilter) &&
            (typeFilter === 'ALL' || entry.transactionType === typeFilter)
    );

    const hasMore = entries.length < totalCount;

    // Colours for the status badge.
    function statusColors(status: string) {
        if (status === 'PENDING') {
            return { text: colors.status.warning, background: colors.brand.soft };
        }

        if (['PAID', 'SUCCESS', 'APPROVED', 'COMPLETED'].includes(status)) {
            return { text: colors.status.success, background: colors.background };
        }

        if (['CANCELLED', 'FAILED', 'REVERSED', 'EXPIRED'].includes(status)) {
            return { text: colors.status.error, background: colors.background };
        }

        return { text: colors.text.secondary, background: colors.background };
    }

    function openDetails(entry: QrLogEntry) {
        setSelected(entry);
        setShowQr(false);
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

            <View style={styles.searchBox}>
                <SymbolView
                    name={{
                        ios: 'magnifyingglass',
                        android: 'search',
                        web: 'search',
                    }}
                    size={18}
                    tintColor={colors.text.secondary}
                />

                <TextInput
                    style={styles.searchInput}
                    value={invoiceSearch}
                    onChangeText={setInvoiceSearch}
                    placeholder={t('searchInvoice')}
                    placeholderTextColor={colors.text.secondary}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>

            <Text style={styles.filterLabel}>{t('status')}</Text>
            {renderChips(
                statuses.map((status) => ({
                    value: status,
                    label: status === 'ALL' ? t('all') : status,
                })),
                statusFilter,
                setStatusFilter
            )}

            <Text style={styles.filterLabel}>{t('transactionType')}</Text>
            {renderChips(
                typeFilters.map((option) => ({
                    value: option.value,
                    label: t(option.labelKey),
                })),
                typeFilter,
                setTypeFilter
            )}

            {!isLoading && !error ? (
                <Text style={styles.countText}>
                    {visibleEntries.length} / {totalCount} {t('records')}
                </Text>
            ) : null}
        </View>
    );

    // The rows shown in the details sheet.
    const detailRows = selected
        ? [
            { label: t('referenceNumber'), value: selected.referenceNumber },
            { label: t('merchantId'), value: selected.merchantId },
            { label: t('invoiceId'), value: selected.invoiceId },
            { label: t('amount'), value: formatAmount(selected.amount) },
            { label: t('status'), value: selected.status },
            { label: t('createDate'), value: formatDateTime(selected.createDate) },
            { label: t('paymentDate'), value: formatDateTime(selected.paymentDate) },
            { label: t('transactionType'), value: selected.transactionType },
            { label: t('mobileNumber'), value: selected.mobileNumber },
            { label: t('requestTransaction'), value: selected.referenceNumber },
            { label: t('paymentTransaction'), value: selected.paymentTxn },
            { label: t('reverseTransaction'), value: selected.reversedTxn },
            { label: t('cancelTransaction'), value: selected.cancelTxn },
        ]
        : [];

    return (
        <View style={styles.screen}>
            <AppHeader
                title={t('merchantPaymentLog')}
                leftIcon="menu"
                onLeftPress={openDrawer}
                onProfilePress={() => router.push('/profile')}
            />

            <FlatList
                data={isLoading || error ? [] : visibleEntries}
                keyExtractor={(entry) => entry.id}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
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
                    const badge = statusColors(item.status);

                    return (
                        <Pressable
                            onPress={() => openDetails(item)}
                            accessibilityRole="button"
                        >
                            <AppCard style={styles.entryCard}>
                                <View style={styles.entryTopRow}>
                                    <Text
                                        style={styles.entryInvoice}
                                        numberOfLines={1}
                                    >
                                        {item.invoiceId || '—'}
                                    </Text>

                                    <Text
                                        style={styles.entryAmount}
                                        numberOfLines={1}
                                        adjustsFontSizeToFit
                                        minimumFontScale={0.6}
                                    >
                                        {formatAmount(item.amount)}
                                    </Text>
                                </View>

                                <View style={styles.entryBottomRow}>
                                    <Text style={styles.entryMeta}>
                                        {formatDateTime(item.createDate)}
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
                                            {item.status || '—'}
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.entryMeta}>
                                    {t('referenceNumber')}: {item.referenceNumber}
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
                                {t('loadingLog')}
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
                                {entries.length === 0
                                    ? t('noLogEntries')
                                    : t('noLogMatches')}
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
                        {t('merchantPaymentLog')}
                    </Text>

                    <ScrollView
                        style={[
                            styles.sheetScroll,
                            { maxHeight: detailsMaxHeight },
                        ]}
                    >
                        {showQr && selected?.qrData ? (
                            <View style={styles.qrBox}>
                                <QRCode
                                    value={selected.qrData}
                                    size={qrSize}
                                    ecl="M"
                                />
                            </View>
                        ) : null}

                        {detailRows.map((row) => (
                            <View key={row.label} style={styles.detailRow}>
                                <Text style={styles.detailLabel}>
                                    {row.label}
                                </Text>
                                <Text style={styles.detailValue}>
                                    {row.value || '—'}
                                </Text>
                            </View>
                        ))}

                        {selected?.qrData ? (
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>
                                    {t('qrData')}
                                </Text>
                                <Text
                                    style={styles.detailValue}
                                    numberOfLines={2}
                                    ellipsizeMode="middle"
                                >
                                    {selected.qrData}
                                </Text>
                            </View>
                        ) : null}
                    </ScrollView>

                    <View style={styles.sheetButtons}>
                        {selected?.qrData ? (
                            <AppButton
                                title={showQr ? t('hideQr') : t('showQr')}
                                onPress={() => setShowQr((value) => !value)}
                            />
                        ) : null}

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

        searchBox: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            height: 44,
            paddingHorizontal: spacing.md,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            marginBottom: spacing.md,
        },

        searchInput: {
            flex: 1,
            fontFamily: fontFamilies.regular,
            fontSize: 14,
            color: colors.text.primary,
            paddingVertical: 0,
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

        entryInvoice: {
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

        qrBox: {
            alignSelf: 'center',
            padding: spacing.md,
            borderRadius: radius.lg,
            // Always white, even in dark mode: scanners need a light
            // background around a QR code.
            backgroundColor: '#FFFFFF',
            marginBottom: spacing.md,
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
