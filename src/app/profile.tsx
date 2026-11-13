// src/app/profile.tsx
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
import { Button, Dialog, Portal, Snackbar } from 'react-native-paper';
import { SymbolView } from 'expo-symbols';

import AppButton from '@/components/common/AppButton';
import AppCard from '@/components/common/AppCard';
import AppHeader from '@/components/common/AppHeader';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { getMerchantProfile } from '@/services/profile/profileService';

import type { MerchantProfile } from '@/types/profile';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/metrics';
import { fontFamilies } from '@/theme/typography';

// Icon names for each platform.
const icons = {
    person: { ios: 'person', android: 'person', web: 'person' },
    store: { ios: 'storefront', android: 'storefront', web: 'storefront' },
    badge: { ios: 'person.text.rectangle', android: 'badge', web: 'badge' },
    mail: { ios: 'envelope', android: 'mail', web: 'mail' },
    call: { ios: 'phone', android: 'call', web: 'call' },
    lock: { ios: 'lock', android: 'lock', web: 'lock' },
} as const;

// Formats money with two decimals, e.g. 10,854.44
function formatAmount(amount: number): string {
    return amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function ProfileScreen() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const { t } = useLanguage();

    const [profile, setProfile] = useState<MerchantProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
    const [feedback, setFeedback] = useState('');

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

    async function handleLogout() {
        setLogoutDialogVisible(false);
        setIsLoggingOut(true);

        try {
            await signOut();

            router.replace('/login');
        } catch (error) {
            console.warn('Logout failed:', error);

            setFeedback(t('logOutFailed'));
            setIsLoggingOut(false);
        }
    }

    // The website shows type 1 as "Merchant". Other codes are shown as sent.
    const merchantTypeLabel =
        profile?.merchantType === '1'
            ? t('merchant')
            : profile?.merchantType ?? '';

    // Rows with no value are left out.
    const infoRows = [
        {
            key: 'username',
            icon: icons.person,
            label: t('username'),
            value: user?.username ?? '',
        },
        {
            key: 'business',
            icon: icons.store,
            label: t('businessName'),
            value: profile?.businessName ?? '',
        },
        {
            key: 'type',
            icon: icons.store,
            label: t('merchantType'),
            value: merchantTypeLabel,
        },
        {
            key: 'id',
            icon: icons.badge,
            label: t('merchantId'),
            value: profile?.merchantId || merchantId,
        },
        {
            key: 'email',
            icon: icons.mail,
            label: t('email'),
            value: profile?.email || user?.email || '',
        },
        {
            key: 'mobile',
            icon: icons.call,
            label: t('mobileNumber'),
            value: profile?.mobileNumber ?? '',
        },
    ].filter((row) => row.value !== '');

    return (
        <View style={styles.screen}>
            <AppHeader
                title={t('myProfile')}
                leftIcon="back"
                onLeftPress={() => router.back()}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >

                {/* Header */}
                <AppCard style={[styles.card, styles.headerCard]}>
                    <View style={styles.avatar}>
                        <SymbolView
                            name={icons.person}
                            size={36}
                            tintColor={colors.text.secondary}
                        />
                    </View>

                    <Text style={styles.username}>
                        {user?.username ?? ''}
                    </Text>

                    {merchantTypeLabel ? (
                        <View style={styles.roleTag}>
                            <Text style={styles.roleTagText}>
                                {merchantTypeLabel}
                            </Text>
                        </View>
                    ) : null}
                </AppCard>

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
                    /* Wallet balances */
                    <View style={styles.balanceGrid}>
                        <AppCard style={styles.balanceCard}>
                            <Text style={styles.balanceLabel}>
                                {t('usdBalance')}
                            </Text>

                            <Text style={styles.balanceValue}>
                                {formatAmount(profile.usdBalance)}
                            </Text>
                        </AppCard>

                        <AppCard style={styles.balanceCard}>
                            <Text style={styles.balanceLabel}>
                                {t('cdfBalance')}
                            </Text>

                            <Text style={styles.balanceValue}>
                                {formatAmount(profile.cdfBalance)}
                            </Text>
                        </AppCard>
                    </View>
                ) : null}

                {/* Details */}
                <AppCard style={styles.card}>
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

                {/* Security (the PIN screens are a later step) */}
                <AppCard style={styles.card}>
                    <Text style={styles.cardTitle}>
                        {t('security')}
                    </Text>

                    {[t('updatePin'), t('resetPin')].map((title) => (
                        <View
                            key={title}
                            style={[styles.infoRow, styles.rowDivider]}
                        >
                            <View style={styles.rowIcon}>
                                <SymbolView
                                    name={icons.lock}
                                    size={18}
                                    tintColor={colors.text.primary}
                                />
                            </View>

                            <Text style={[styles.rowValue, styles.rowTextBox]}>
                                {title}
                            </Text>

                            <Text style={styles.rowLabel}>
                                {t('soon')}
                            </Text>
                        </View>
                    ))}
                </AppCard>

                {/* Log out */}
                <Pressable
                    onPress={() => setLogoutDialogVisible(true)}
                    disabled={isLoggingOut}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                        styles.logoutButton,
                        pressed && styles.pressed,
                        isLoggingOut && styles.disabled,
                    ]}
                >
                    {isLoggingOut ? (
                        <ActivityIndicator color={colors.status.error} />
                    ) : (
                        <Text style={styles.logoutText}>
                            {t('logOut')}
                        </Text>
                    )}
                </Pressable>

            </ScrollView>

            {/* Feedback message */}
            <Snackbar
                visible={feedback !== ''}
                onDismiss={() => setFeedback('')}
                duration={3000}
            >
                {feedback}
            </Snackbar>

            {/* Logout confirmation */}
            <Portal>
                <Dialog
                    visible={logoutDialogVisible}
                    onDismiss={() => setLogoutDialogVisible(false)}
                    style={styles.dialog}
                >
                    <Dialog.Title style={styles.dialogTitle}>
                        {t('logOutQuestion')}
                    </Dialog.Title>

                    <Dialog.Content>
                        <Text style={styles.mutedText}>
                            {t('logOutBody')}
                        </Text>
                    </Dialog.Content>

                    <Dialog.Actions>
                        <Button
                            textColor={colors.text.secondary}
                            onPress={() => setLogoutDialogVisible(false)}
                        >
                            {t('cancel')}
                        </Button>

                        <Button
                            textColor={colors.status.error}
                            onPress={handleLogout}
                        >
                            {t('logOut')}
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
            <View >
                <Text>
                    version 1.0.0
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
    },

    scrollContent: {
        padding: spacing.lg,
        paddingBottom: spacing.xxxl,
    },

    card: {
        marginBottom: spacing.md,
    },

    headerCard: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },

    avatar: {
        width: 80,
        height: 80,
        borderRadius: radius.full,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },

    username: {
        fontFamily: fontFamilies.bold,
        fontSize: 18,
        color: colors.text.primary,
    },

    roleTag: {
        marginTop: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radius.full,
        backgroundColor: colors.brand.soft,
    },

    roleTagText: {
        fontFamily: fontFamilies.semiBold,
        fontSize: 11,
        color: colors.text.primary,
    },

    stateContainer: {
        minHeight: 120,
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.md,
    },

    mutedText: {
        fontFamily: fontFamilies.regular,
        fontSize: 13,
        lineHeight: 20,
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
    },

    balanceValue: {
        fontFamily: fontFamilies.bold,
        fontSize: 20,
        color: colors.text.primary,
        marginTop: spacing.sm,
    },

    cardTitle: {
        fontFamily: fontFamilies.semiBold,
        fontSize: 15,
        color: colors.text.primary,
        marginBottom: spacing.sm,
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

    logoutButton: {
        minHeight: 52,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.sm,
    },

    logoutText: {
        fontFamily: fontFamilies.semiBold,
        fontSize: 15,
        color: colors.status.error,
    },

    pressed: {
        opacity: 0.6,
    },

    disabled: {
        opacity: 0.5,
    },

    dialog: {
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
    },

    dialogTitle: {
        fontFamily: fontFamilies.semiBold,
        fontSize: 18,
        color: colors.text.primary,
    },
});