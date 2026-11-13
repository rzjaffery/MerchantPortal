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

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/metrics';
import { fontFamilies } from '@/theme/typography';

// Icon names for each platform.
const icons = {
    clock: { ios: 'clock', android: 'schedule', web: 'schedule' },
    store: { ios: 'storefront', android: 'storefront', web: 'storefront' },
    lock: { ios: 'lock', android: 'lock', web: 'lock' },
    image: { ios: 'photo', android: 'image', web: 'image' },
} as const;

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
    const merchantTypeLabel =
        merchantType === '1' ? t('merchant') : merchantType;

    // Rows with no value are left out.
    const infoRows = [
        {
            key: 'loginTime',
            icon: icons.clock,
            label: t('loginTime'),
            value: loginTime ? formatLoginTime(loginTime) : '',
        },
        {
            key: 'type',
            icon: icons.store,
            label: t('merchantType'),
            value: merchantTypeLabel,
        },
    ].filter((row) => row.value !== '');

    // Actions whose screens are built in later steps.
    const upcomingActions = [
        { key: 'picture', icon: icons.image, title: t('updateProfilePicture') },
        { key: 'updatePin', icon: icons.lock, title: t('updatePin') },
        { key: 'resetPin', icon: icons.lock, title: t('resetPin') },
    ];

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
                    {upcomingActions.map((action, index) => (
                        <View
                            key={action.key}
                            style={[
                                styles.row,
                                index > 0 && styles.rowDivider,
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
});