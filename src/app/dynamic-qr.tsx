// src/app/dynamic-qr.tsx
import { useCallback, useEffect, useState } from 'react';

import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';

import { useRouter } from 'expo-router';
import { Menu, Modal, Portal } from 'react-native-paper';
import { SymbolView } from 'expo-symbols';
import QRCode from 'react-native-qrcode-svg';

import AppButton from '@/components/common/AppButton';
import AppCard from '@/components/common/AppCard';
import AppHeader from '@/components/common/AppHeader';
import AppInput from '@/components/common/AppInput';

import { useAuth } from '@/context/AuthContext';
import { useDrawer } from '@/context/DrawerContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAppTheme, useThemedStyles } from '@/context/ThemeContext';

import {
    generateDynamicQr,
    getTerminalList,
} from '@/services/dynamicQr/dynamicQrService';
import { getMerchantProfile } from '@/services/profile/profileService';

import type { QrCurrency, Terminal } from '@/types/dynamicQr';
import type { AppColors } from '@/theme/colors';
import { dimensions, radius, spacing } from '@/theme/metrics';
import { fontFamilies } from '@/theme/typography';
import {
    formatServerDateTime,
    toServerDateTime,
} from '@/utils/dateTime';

const currencies: QrCurrency[] = ['USD', 'CDF'];

// The highest amount the form accepts.
const MAX_AMOUNT = 1_000_000_000;

// The current time in the server's format, e.g. 20261120105130.
function currentPaymentDateTime(): string {
    return toServerDateTime(new Date());
}

// Formats money with two decimals, e.g. 10,854.44
function formatAmount(amount: number): string {
    return amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

// Reads the amount field. Accepts "200", "200.5" or "200,50".
// Returns null when the text is not a valid amount.
function parseAmount(text: string): number | null {
    const normalized = text.trim().replace(',', '.');

    if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
        return null;
    }

    return Number(normalized);
}

// The terminal as shown in the list, e.g. "21 - Sharyar Terminal".
function terminalLabel(terminal: Terminal): string {
    return terminal.description
        ? `${terminal.id} - ${terminal.description}`
        : terminal.id;
}

export default function DynamicQrScreen() {
    const { colors } = useAppTheme();
    const styles = useThemedStyles(createStyles);

    const router = useRouter();
    const { user, accessToken } = useAuth();
    const { t } = useLanguage();
    const { openDrawer } = useDrawer();
    const { width: screenWidth } = useWindowDimensions();

    const username = user?.username ?? '';
    const userId = user?.id ?? '';
    const merchantId = user?.merchantId ?? '';

    // Terminals for the Terminal ID list.
    const [terminals, setTerminals] = useState<Terminal[]>([]);
    const [terminalsLoading, setTerminalsLoading] = useState(true);
    const [terminalsError, setTerminalsError] = useState('');
    const [pickerVisible, setPickerVisible] = useState(false);
    const [terminal, setTerminal] = useState<Terminal | null>(null);

    // Read-only values from the merchant's profile.
    const [merchantName, setMerchantName] = useState('');
    const [address, setAddress] = useState('');
    const [profileError, setProfileError] = useState(false);

    // Fields the merchant fills in.
    const [mobile, setMobile] = useState('');
    const [invoiceId, setInvoiceId] = useState('');
    const [amountText, setAmountText] = useState('');
    const [currency, setCurrency] = useState<QrCurrency | null>(null);
    const [paymentDateTime, setPaymentDateTime] = useState(
        currentPaymentDateTime
    );

    // Validation messages, one per field.
    const [mobileError, setMobileError] = useState('');
    const [invoiceError, setInvoiceError] = useState('');
    const [amountError, setAmountError] = useState('');
    const [currencyError, setCurrencyError] = useState('');

    // Whether the currency dropdown is open.
    const [currencyMenuVisible, setCurrencyMenuVisible] = useState(false);

    // Generating and the result.
    const [isGenerating, setIsGenerating] = useState(false);
    const [generateError, setGenerateError] = useState('');
    const [qrContent, setQrContent] = useState('');
    const [generatedAmount, setGeneratedAmount] = useState(0);

    const qrSize = Math.min(Math.round(screenWidth * 0.7), 300);

    const loadTerminals = useCallback(async () => {
        if (!username || !accessToken || !userId || !merchantId) {
            return;
        }

        setTerminalsLoading(true);
        setTerminalsError('');

        try {
            const list = await getTerminalList(
                username,
                accessToken,
                userId,
                merchantId
            );

            setTerminals(list);
        } catch (error) {
            setTerminalsError(
                error instanceof Error
                    ? error.message
                    : t('terminalsLoadFailed')
            );
        } finally {
            setTerminalsLoading(false);
        }
    }, [username, accessToken, userId, merchantId, t]);

    const loadProfile = useCallback(async () => {
        if (!merchantId) {
            return;
        }

        setProfileError(false);

        try {
            const profile = await getMerchantProfile(merchantId);

            setMerchantName(profile.merchantName || profile.fullName);
            setAddress(profile.address);
        } catch {
            setProfileError(true);
        }
    }, [merchantId]);

    // Load both when the screen opens.
    useEffect(() => {
        void loadTerminals();
        void loadProfile();
    }, [loadTerminals, loadProfile]);

    function chooseTerminal(next: Terminal) {
        setTerminal(next);
        setPickerVisible(false);
        setPaymentDateTime(currentPaymentDateTime());
        setGenerateError('');
    }

    // Checks every field and shows a message under each wrong one.
    // Returns the amount when everything is valid, otherwise null.
    function validate(): number | null {
        const cleanMobile = mobile.trim();
        const amount = parseAmount(amountText);

        const nextMobileError = !cleanMobile
            ? t('mobileRequired')
            : !/^\d{9,15}$/.test(cleanMobile)
                ? t('mobileInvalid')
                : '';

        const nextInvoiceError = !invoiceId.trim()
            ? t('invoiceRequired')
            : '';

        const nextAmountError = !amountText.trim()
            ? t('amountRequired')
            : amount === null || amount <= 0
                ? t('amountInvalid')
                : amount > MAX_AMOUNT
                    ? t('amountTooLarge')
                    : '';

        const nextCurrencyError = currency === null
            ? t('currencyRequired')
            : '';

        setMobileError(nextMobileError);
        setInvoiceError(nextInvoiceError);
        setAmountError(nextAmountError);
        setCurrencyError(nextCurrencyError);

        const isValid =
            !nextMobileError &&
            !nextInvoiceError &&
            !nextAmountError &&
            !nextCurrencyError;

        return isValid ? amount : null;
    }

    async function handleGenerate() {
        setGenerateError('');

        const amount = validate();

        if (
            amount === null ||
            terminal === null ||
            currency === null ||
            !accessToken
        ) {
            return;
        }

        // Use the time of this request, and show it on screen.
        const requestTime = currentPaymentDateTime();
        setPaymentDateTime(requestTime);

        setIsGenerating(true);

        try {
            const content = await generateDynamicQr(username, accessToken, {
                terminalId: terminal.id,
                merchantId,
                merchantName,
                address,
                customerMobileNumber: mobile.trim(),
                invoiceId: invoiceId.trim(),
                amount,
                currency,
                paymentDateTime: requestTime,
            });

            setGeneratedAmount(amount);
            setQrContent(content);
        } catch (error) {
            setGenerateError(
                error instanceof Error
                    ? error.message
                    : t('qrGenerateFailed')
            );
        } finally {
            setIsGenerating(false);
        }
    }

    // Clears the payment fields for the next QR. Keeps the terminal.
    function startNewQr() {
        setQrContent('');
        setMobile('');
        setInvoiceId('');
        setAmountText('');
        setCurrency(null);
        setGeneratedAmount(0);
        setPaymentDateTime(currentPaymentDateTime());
    }

    // Merchant details, shown as information (not editable).
    const readOnlyFields = [
        { key: 'merchantId', label: t('merchantId'), value: merchantId },
        { key: 'merchantName', label: t('merchantName'), value: merchantName },
        { key: 'address', label: t('address'), value: address },
        {
            key: 'dateTime',
            label: t('paymentDateTime'),
            value: formatServerDateTime(paymentDateTime),
        },
    ];

    return (
        <View style={styles.screen}>
            <AppHeader
                title={t('dynamicQr')}
                leftIcon="menu"
                onLeftPress={openDrawer}
                onProfilePress={() => router.push('/profile')}
            />

            <KeyboardAvoidingView style={styles.flex} behavior="padding">
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {qrContent && terminal && currency ? (
                        /* ---------- Result: the generated QR ---------- */
                        <AppCard style={styles.resultCard}>
                            <Text style={styles.resultTitle}>
                                {t('qrReadyTitle')}
                            </Text>

                            <Text style={styles.resultWarning}>
                                {t('qrOnlyThisCustomer')}
                            </Text>

                            <View style={styles.qrBox}>
                                <QRCode
                                    value={qrContent}
                                    size={qrSize}
                                    ecl="M"
                                />
                            </View>

                            <Text style={styles.resultAmount}>
                                {currency} {formatAmount(generatedAmount)}
                            </Text>

                            {[
                                {
                                    label: t('terminalId'),
                                    value: terminalLabel(terminal),
                                },
                                { label: t('invoiceId'), value: invoiceId },
                                { label: t('customerMobile'), value: mobile },
                                {
                                    label: t('paymentDateTime'),
                                    value: paymentDateTime,
                                },
                            ].map((row) => (
                                <View key={row.label} style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>
                                        {row.label}
                                    </Text>

                                    <Text
                                        style={styles.summaryValue}
                                        numberOfLines={1}
                                    >
                                        {row.value}
                                    </Text>
                                </View>
                            ))}

                            <View style={styles.resultButton}>
                                <AppButton
                                    title={t('newQr')}
                                    onPress={startNewQr}
                                />
                            </View>
                        </AppCard>
                    ) : (
                        /* ---------- Form ---------- */
                        <>
                            {/* Terminal ID */}
                            <AppCard style={styles.card}>
                                <Text style={styles.fieldLabel}>
                                    {t('terminalId')}
                                </Text>

                                {terminalsLoading ? (
                                    <View style={styles.inlineState}>
                                        <ActivityIndicator
                                            color={colors.brand.primary}
                                        />
                                        <Text style={styles.mutedText}>
                                            {t('loadingTerminals')}
                                        </Text>
                                    </View>
                                ) : terminalsError ? (
                                    <View style={styles.inlineState}>
                                        <Text style={styles.errorText}>
                                            {terminalsError}
                                        </Text>
                                        <AppButton
                                            title={t('tryAgain')}
                                            variant="outline"
                                            onPress={() => void loadTerminals()}
                                        />
                                    </View>
                                ) : terminals.length === 0 ? (
                                    <Text style={styles.mutedText}>
                                        {t('noTerminals')}
                                    </Text>
                                ) : (
                                    <Pressable
                                        onPress={() => setPickerVisible(true)}
                                        accessibilityRole="button"
                                        accessibilityLabel={t('selectTerminal')}
                                        style={styles.pickerField}
                                    >
                                        <Text
                                            style={[
                                                styles.pickerText,
                                                !terminal &&
                                                styles.pickerPlaceholder,
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {terminal
                                                ? terminalLabel(terminal)
                                                : t('selectTerminal')}
                                        </Text>

                                        <SymbolView
                                            name={{
                                                ios: 'chevron.down',
                                                android: 'expand_more',
                                                web: 'expand_more',
                                            }}
                                            size={20}
                                            tintColor={colors.text.secondary}
                                        />
                                    </Pressable>
                                )}
                            </AppCard>

                            {/* The rest appears once a terminal is chosen. */}
                            {terminal ? (
                                <>
                                    {/* Merchant card: information only */}
                                    <AppCard style={styles.card}>
                                        <Text style={styles.cardTitle}>
                                            {t('merchant')}
                                        </Text>

                                        {profileError ? (
                                            <View style={styles.inlineState}>
                                                <Text style={styles.errorText}>
                                                    {t('profileLoadFailed')}
                                                </Text>
                                                <AppButton
                                                    title={t('tryAgain')}
                                                    variant="outline"
                                                    onPress={() =>
                                                        void loadProfile()
                                                    }
                                                />
                                            </View>
                                        ) : null}

                                        {readOnlyFields.map((field, index) => (
                                            <View
                                                key={field.key}
                                                style={[
                                                    styles.infoRow,
                                                    index > 0 &&
                                                    styles.infoRowDivider,
                                                ]}
                                            >
                                                <Text style={styles.infoLabel}>
                                                    {field.label}
                                                </Text>

                                                <Text style={styles.infoValue}>
                                                    {field.value || '—'}
                                                </Text>
                                            </View>
                                        ))}
                                    </AppCard>

                                    {/* Payment card: fields the merchant fills in */}
                                    <AppCard style={styles.card}>
                                        <AppInput
                                            label={t('customerMobile')}
                                            value={mobile}
                                            onChangeText={(value) => {
                                                setMobile(value);
                                                setMobileError('');
                                            }}
                                            placeholder={t('mobilePlaceholder')}
                                            keyboardType="phone-pad"
                                            autoCapitalize="none"
                                            error={mobileError}
                                        />

                                        <AppInput
                                            label={t('invoiceId')}
                                            value={invoiceId}
                                            onChangeText={(value) => {
                                                setInvoiceId(value);
                                                setInvoiceError('');
                                            }}
                                            placeholder={t('invoicePlaceholder')}
                                            autoCapitalize="none"
                                            error={invoiceError}
                                            bold
                                        />

                                        {/* Amount with the currency dropdown beside it */}
                                        <View style={styles.amountRow}>
                                            <View style={styles.amountField}>
                                                <AppInput
                                                    label={t('amount')}
                                                    value={amountText}
                                                    onChangeText={(value) => {
                                                        setAmountText(value);
                                                        setAmountError('');
                                                    }}
                                                    placeholder="0.00"
                                                    keyboardType="decimal-pad"
                                                    autoCapitalize="none"
                                                    error={amountError}
                                                    bold
                                                />
                                            </View>

                                            <View style={styles.currencyField}>
                                                <Text style={styles.fieldLabel}>
                                                    {t('currency')}
                                                </Text>

                                                <Menu
                                                    visible={currencyMenuVisible}
                                                    onDismiss={() =>
                                                        setCurrencyMenuVisible(false)
                                                    }
                                                    anchor={
                                                        <Pressable
                                                            onPress={() =>
                                                                setCurrencyMenuVisible(true)
                                                            }
                                                            accessibilityRole="button"
                                                            accessibilityLabel={t('currency')}
                                                            style={[
                                                                styles.currencyBox,
                                                                currencyError
                                                                    ? styles.currencyBoxError
                                                                    : null,
                                                            ]}
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.currencyText,
                                                                    !currency &&
                                                                    styles.pickerPlaceholder,
                                                                ]}
                                                            >
                                                                {currency ?? '—'}
                                                            </Text>

                                                            <SymbolView
                                                                name={{
                                                                    ios: 'chevron.down',
                                                                    android: 'expand_more',
                                                                    web: 'expand_more',
                                                                }}
                                                                size={18}
                                                                tintColor={colors.text.secondary}
                                                            />
                                                        </Pressable>
                                                    }
                                                    contentStyle={styles.currencyMenu}
                                                >
                                                    {currencies.map((item) => (
                                                        <Menu.Item
                                                            key={item}
                                                            title={item}
                                                            onPress={() => {
                                                                setCurrency(item);
                                                                setCurrencyError('');
                                                                setCurrencyMenuVisible(false);
                                                            }}
                                                            titleStyle={[
                                                                styles.currencyMenuText,
                                                                item === currency &&
                                                                styles.currencyMenuTextSelected,
                                                            ]}
                                                        />
                                                    ))}
                                                </Menu>

                                                {currencyError ? (
                                                    <Text style={styles.fieldError}>
                                                        {currencyError}
                                                    </Text>
                                                ) : null}
                                            </View>
                                        </View>
                                    </AppCard>

                                    {generateError ? (
                                        <Text style={styles.generateError}>
                                            {generateError}
                                        </Text>
                                    ) : null}

                                    <AppButton
                                        title={t('generateQr')}
                                        onPress={() => void handleGenerate()}
                                        loading={isGenerating}
                                        disabled={
                                            isGenerating ||
                                            profileError ||
                                            !merchantName
                                        }
                                    />
                                </>
                            ) : null}
                        </>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Terminal list */}
            <Portal>
                <Modal
                    visible={pickerVisible}
                    onDismiss={() => setPickerVisible(false)}
                    contentContainerStyle={styles.pickerModal}
                >
                    <Text style={styles.pickerTitle}>
                        {t('selectTerminal')}
                    </Text>

                    <ScrollView style={styles.pickerList}>
                        {terminals.map((item) => {
                            const selected = item.id === terminal?.id;

                            return (
                                <Pressable
                                    key={item.id}
                                    onPress={() => chooseTerminal(item)}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected }}
                                    style={[
                                        styles.pickerRow,
                                        selected && styles.pickerRowSelected,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.pickerRowText,
                                            selected &&
                                            styles.pickerRowTextSelected,
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {terminalLabel(item)}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>

                    <AppButton
                        title={t('cancel')}
                        variant="outline"
                        onPress={() => setPickerVisible(false)}
                    />
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

        flex: {
            flex: 1,
        },

        scrollContent: {
            padding: spacing.lg,
            paddingBottom: spacing.xxxl,
        },

        fieldLabel: {
            fontFamily: fontFamilies.medium,
            fontSize: 13,
            color: colors.text.primary,
            marginBottom: spacing.sm,
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

        inlineState: {
            alignItems: 'center',
            gap: spacing.md,
            paddingVertical: spacing.md,
        },

        pickerField: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            minHeight: 52,
            paddingHorizontal: spacing.lg,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
        },

        pickerText: {
            flex: 1,
            fontFamily: fontFamilies.medium,
            fontSize: 14,
            color: colors.text.primary,
        },

        pickerPlaceholder: {
            color: colors.text.secondary,
        },










        card: {
            marginBottom: spacing.md,
        },

        cardTitle: {
            fontFamily: fontFamilies.semiBold,
            fontSize: 15,
            color: colors.text.primary,
            marginBottom: spacing.xs,
        },

        infoRow: {
            paddingVertical: spacing.sm,
        },

        infoRowDivider: {
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },

        infoLabel: {
            fontFamily: fontFamilies.regular,
            fontSize: 11,
            color: colors.text.secondary,
        },

        infoValue: {
            fontFamily: fontFamilies.semiBold,
            fontSize: 14,
            color: colors.text.primary,
            marginTop: 2,
        },

        amountRow: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: spacing.sm,
        },

        amountField: {
            flex: 1,
        },

        currencyField: {
            width: 110,
        },

        currencyBox: {
            height: dimensions.inputHeight,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.md,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
        },

        currencyBoxError: {
            borderColor: colors.status.error,
        },

        currencyText: {
            fontFamily: fontFamilies.bold,
            fontSize: 16,
            color: colors.text.primary,
        },

        currencyMenu: {
            backgroundColor: colors.surface,
        },

        currencyMenuText: {
            fontFamily: fontFamilies.medium,
            fontSize: 14,
            color: colors.text.primary,
        },

        currencyMenuTextSelected: {
            fontFamily: fontFamilies.bold,
            color: colors.brand.pressed,
        },

        fieldError: {
            fontFamily: fontFamilies.regular,
            fontSize: 12,
            color: colors.status.error,
            marginTop: spacing.xs,
        },

        generateError: {
            fontFamily: fontFamilies.medium,
            fontSize: 13,
            color: colors.status.error,
            marginBottom: spacing.md,
        },


        resultCard: {
            alignItems: 'center',
            paddingVertical: spacing.xl,
        },

        resultTitle: {
            fontFamily: fontFamilies.semiBold,
            fontSize: 18,
            color: colors.text.primary,
        },

        resultWarning: {
            fontFamily: fontFamilies.regular,
            fontSize: 12,
            lineHeight: 18,
            color: colors.text.secondary,
            textAlign: 'center',
            marginTop: spacing.sm,
        },

        qrBox: {
            padding: spacing.md,
            borderRadius: radius.lg,
            // Always white, even in dark mode: scanners need a light
            // background around a QR code.
            backgroundColor: '#FFFFFF',
            marginVertical: spacing.lg,
        },

        resultAmount: {
            fontFamily: fontFamilies.bold,
            fontSize: 22,
            color: colors.text.primary,
            marginBottom: spacing.md,
        },

        summaryRow: {
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: spacing.md,
            paddingVertical: spacing.sm,
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },

        summaryLabel: {
            fontFamily: fontFamilies.regular,
            fontSize: 12,
            color: colors.text.secondary,
        },

        summaryValue: {
            flexShrink: 1,
            fontFamily: fontFamilies.semiBold,
            fontSize: 13,
            color: colors.text.primary,
            textAlign: 'right',
        },

        resultButton: {
            width: '100%',
            marginTop: spacing.lg,
        },

        pickerModal: {
            backgroundColor: colors.surface,
            marginHorizontal: spacing.xl,
            padding: spacing.lg,
            borderRadius: radius.xl,
            maxHeight: '75%',
            gap: spacing.md,
        },

        pickerTitle: {
            fontFamily: fontFamilies.semiBold,
            fontSize: 17,
            color: colors.text.primary,
        },

        pickerList: {
            flexGrow: 0,
        },

        pickerRow: {
            minHeight: 48,
            justifyContent: 'center',
            paddingHorizontal: spacing.md,
            borderRadius: radius.md,
        },

        pickerRowSelected: {
            backgroundColor: colors.brand.primary,
        },

        pickerRowText: {
            fontFamily: fontFamilies.medium,
            fontSize: 14,
            color: colors.text.primary,
        },

        pickerRowTextSelected: {
            fontFamily: fontFamilies.semiBold,
            color: colors.brand.onPrimary,
        },
    });
