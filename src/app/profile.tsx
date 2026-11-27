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
import { useEffect, useState } from 'react';
import { Button, Dialog, Portal, Snackbar } from 'react-native-paper';
import { SymbolView } from 'expo-symbols';

import AppCard from '@/components/common/AppCard';
import AppHeader from '@/components/common/AppHeader';
import ProfileAvatar from '@/components/common/ProfileAvatar';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { getMerchantProfile } from '@/services/profile/profileService';

import type { AppColors } from '@/theme/colors';
import {
    useAppTheme,
    useThemedStyles,
    type ThemePreference,
} from '@/context/ThemeContext';
import type { TranslationKey } from '@/i18n/translations';
import { radius, spacing } from '@/theme/metrics';
import { fontFamilies } from '@/theme/typography';
import Constants from 'expo-constants';
import { merchantTypeKey } from '@/utils/merchantType';

// The three appearance choices, in the order they are shown.
const themeOptions: { value: ThemePreference; labelKey: TranslationKey }[] = [
    { value: 'system', labelKey: 'themeSystem' },
    { value: 'light', labelKey: 'themeLight' },
    { value: 'dark', labelKey: 'themeDark' },
];

// Icon names for each platform.
const icons = {
    clock: { ios: 'clock', android: 'schedule', web: 'schedule' },
    store: { ios: 'storefront', android: 'storefront', web: 'storefront' },
    lock: { ios: 'lock', android: 'lock', web: 'lock' },
    image: { ios: 'photo', android: 'image', web: 'image' },
} as const;

// The app version from app.json, e.g. "1.0.0".
const appVersion = Constants.expoConfig?.version ?? '';

// Adds a leading zero: 7 becomes "07".
function pad(value: number): string {
    return String(value).padStart(2, '0');
}

// Formats a saved time as 2026-11-13 12:51:01, like the website.
function formatLoginTime(isoTime: string): string {
    const date = new Date(isoTime);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    );
}

export default function ProfileScreen() {
    const { colors, preference, setPreference } = useAppTheme();
    const styles = useThemedStyles(createStyles);

    const router = useRouter();
    const { user, loginTime, signOut } = useAuth();
    const { t } = useLanguage();

    const [merchantType, setMerchantType] = useState('');

    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
    const [feedback, setFeedback] = useState('');

    const merchantId = user?.merchantId ?? '';

    // The merchant type comes from the server's profile.
    // If this fails, the row is simply left out.
    useEffect(() => {
        if (!merchantId) {
            return;
        }

        let cancelled = false;

        getMerchantProfile(merchantId)
            .then((profile) => {
                if (!cancelled) {
                    setMerchantType(profile.merchantType);
                }
            })
            .catch(() => {
                // Nothing to show. The rest of the screen still works.
            });

        return () => {
            cancelled = true;
        };
    }, [merchantId]);

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
    // const typeKey = merchantTypeKey(merchantType);
    // const merchantTypeLabel = typeKey ? t(typeKey) : merchantType;

    // Rows with no value are left out.
    const infoRows = [
        {
            key: 'loginTime',
            icon: icons.clock,
            label: t('loginTime'),
            value: loginTime ? formatLoginTime(loginTime) : '',
        },
        // {
        //     key: 'type',
        //     icon: icons.store,
        //     label: t('merchantType'),
        //     value: merchantTypeLabel,
        // },
    ].filter((row) => row.value !== '');

    // Actions in the card. A row with no onPress is not built yet.
    // Tills (type 4) have no PIN, so the PIN rows are left out for them.
    const actions: {
        key: string;
        icon: typeof icons.lock;
        title: string;
        onPress?: () => void;
    }[] = [
        // { key: 'picture', icon: icons.image, title: t('updateProfilePicture') },
        ...(merchantType === '4'
            ? []
            : [
                // { key: 'updatePin', icon: icons.lock, title: t('updatePin') },
                {
                    key: 'resetPin',
                    icon: icons.lock,
                    title: t('resetPin'),
                    onPress: () => router.push('/reset-pin'),
                },
            ]),
        {
            key: 'resetPassword',
            icon: icons.lock,
            title: t('resetPassword'),
            onPress: () => router.push('/reset-password'),
        },
    ];

    return (
        <View style={styles.screen}>
            <AppHeader
                title={t('userProfile')}
                leftIcon="back"
                onLeftPress={() => router.back()}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >

                {/* Picture and username */}
                <AppCard style={[styles.card, styles.headerCard]}>
                    <ProfileAvatar size={96} />

                    <Text style={styles.usernameLabel}>
                        {t('username')}
                    </Text>

                    <Text style={styles.username}>
                        {user?.username ?? ''}
                    </Text>
                </AppCard>

                {/* Login time and merchant type */}
                {infoRows.length > 0 ? (
                    <AppCard style={styles.card}>
                        {infoRows.map((row, index) => (
                            <View
                                key={row.key}
                                style={[
                                    styles.row,
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
                ) : null}

                {/* Picture and PIN actions */}
                <AppCard style={styles.card}>
                    {actions.map((action, index) => (
                        <Pressable
                            key={action.key}
                            onPress={action.onPress}
                            disabled={!action.onPress}
                            accessibilityRole={action.onPress ? 'button' : undefined}
                            style={({ pressed }) => [
                                styles.row,
                                index > 0 && styles.rowDivider,
                                pressed && styles.pressed,
                            ]}
                        >
                            <View style={styles.rowIcon}>
                                <SymbolView
                                    name={action.icon}
                                    size={18}
                                    tintColor={colors.text.primary}
                                />
                            </View>

                            <Text style={[styles.rowValue, styles.rowTextBox]}>
                                {action.title}
                            </Text>

                            {action.onPress ? null : (
                                <Text style={styles.rowLabel}>
                                    {t('soon')}
                                </Text>
                            )}
                        </Pressable>
                    ))}
                </AppCard>

                {/* Appearance: System / Light / Dark */}
                <AppCard style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        {t('appearance')}
                    </Text>

                    <View style={styles.segmented}>
                        {themeOptions.map((option) => {
                            const selected = option.value === preference;

                            return (
                                <Pressable
                                    key={option.value}
                                    onPress={() => setPreference(option.value)}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected }}
                                    style={[
                                        styles.segment,
                                        selected && styles.segmentSelected,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.segmentText,
                                            selected &&
                                            styles.segmentTextSelected,
                                        ]}
                                    >
                                        {t(option.labelKey)}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    {preference === 'system' ? (
                        <Text style={styles.hintText}>
                            {t('themeSystemHint')}
                        </Text>
                    ) : null}
                </AppCard>

                <View style={styles.spacer}/>

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


                {/* App version */}
                {appVersion ? (
                    <Text style={styles.versionText}>
                        {t('version')} {appVersion}
                    </Text>
                ) : null}

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
                        <Text style={styles.dialogText}>
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

        sectionTitle: {
            fontFamily: fontFamilies.semiBold,
            fontSize: 15,
            color: colors.text.primary,
            marginBottom: spacing.md,
        },

        segmented: {
            flexDirection: 'row',
            backgroundColor: colors.background,
            borderRadius: radius.md,
            padding: spacing.xs,
        },

        segment: {
            flex: 1,
            alignItems: 'center',
            paddingVertical: spacing.sm,
            borderRadius: radius.md,
        },

        segmentSelected: {
            backgroundColor: colors.brand.primary,
        },

        segmentText: {
            fontFamily: fontFamilies.medium,
            fontSize: 13,
            color: colors.text.secondary,
        },

        segmentTextSelected: {
            fontFamily: fontFamilies.semiBold,
            color: colors.brand.onPrimary,
        },

        hintText: {
            fontFamily: fontFamilies.regular,
            fontSize: 11,
            color: colors.text.secondary,
            marginTop: spacing.sm,
        },

        spacer: {
            flex: 1,
            // The smallest gap between the cards and Log Out.
            minHeight: spacing.xxl,
        },

        scrollContent: {
            flexGrow: 1,
            padding: spacing.lg,
            paddingBottom: spacing.xl,
        },

        card: {
            marginBottom: spacing.md,
        },

        headerCard: {
            alignItems: 'center',
            paddingVertical: spacing.xl,
        },

        usernameLabel: {
            fontFamily: fontFamilies.regular,
            fontSize: 11,
            color: colors.text.secondary,
            marginTop: spacing.md,
        },

        username: {
            fontFamily: fontFamilies.bold,
            fontSize: 20,
            color: colors.text.primary,
        },

        row: {
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

        dialogText: {
            fontFamily: fontFamilies.regular,
            fontSize: 13,
            lineHeight: 20,
            color: colors.text.secondary,
        },
        versionText: {
            fontFamily: fontFamilies.regular,
            fontSize: 11,
            color: colors.text.secondary,
            textAlign: 'center',
            marginTop: spacing.md,
        },
    });