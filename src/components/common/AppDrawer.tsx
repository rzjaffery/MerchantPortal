// src/components/common/AppDrawer.tsx
import { useEffect, useState } from 'react';

import {
    Animated,
    Dimensions,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/metrics';
import { fontFamilies } from '@/theme/typography';

// The drawer covers most of the screen width, up to 320.
const PANEL_WIDTH = Math.min(320, Dimensions.get('window').width * 0.82);

// The menu. Items with a "route" open a screen. The rest show "Soon".
const menuItems = [
    {
        label: 'Home',
        route: '/dashboard',
        icon: { ios: 'house', android: 'home', web: 'home' },
    },
    {
        label: 'Wallets And Accounts',
        icon: {
            ios: 'creditcard',
            android: 'account_balance_wallet',
            web: 'account_balance_wallet',
        },
    },
    {
        label: 'Wallet To Account Push Pull',
        icon: {
            ios: 'arrow.left.arrow.right',
            android: 'swap_horiz',
            web: 'swap_horiz',
        },
    },
    {
        label: 'Merchant',
        route: '/merchant',
        icon: { ios: 'storefront', android: 'storefront', web: 'storefront' },
    },
    {
        label: 'Wallet To Wallet Push Pull',
        icon: {
            ios: 'arrow.left.arrow.right',
            android: 'swap_horiz',
            web: 'swap_horiz',
        },
    },
    {
        label: 'Live Transactions',
        icon: {
            ios: 'list.bullet.rectangle',
            android: 'receipt_long',
            web: 'receipt_long',
        },
    },
    {
        label: 'illicocash Reporting',
        icon: { ios: 'chart.bar', android: 'bar_chart', web: 'bar_chart' },
    },
    {
        label: 'Bulk Payment',
        icon: { ios: 'banknote', android: 'payments', web: 'payments' },
    },
    {
        label: 'Bulk Payment Checker',
        icon: {
            ios: 'checkmark.circle',
            android: 'check_circle',
            web: 'check_circle',
        },
    },
    {
        label: 'Bulk Payment Approver',
        icon: {
            ios: 'checkmark.shield',
            android: 'verified_user',
            web: 'verified_user',
        },
    },
    {
        label: 'Portal QR',
        icon: { ios: 'qrcode', android: 'qr_code_2', web: 'qr_code_2' },
    },
    {
        label: 'Register Employee Excel',
        icon: {
            ios: 'person.badge.plus',
            android: 'group_add',
            web: 'group_add',
        },
    },
    {
        label: 'Terminal ID Configuration',
        icon: {
            ios: 'desktopcomputer',
            android: 'point_of_sale',
            web: 'point_of_sale',
        },
    },
    {
        label: 'Dynamic QR',
        icon: { ios: 'qrcode', android: 'qr_code_2', web: 'qr_code_2' },
    },
    {
        label: 'Dynamic Payment Via Mobile',
        icon: { ios: 'iphone', android: 'smartphone', web: 'smartphone' },
    },
    {
        label: 'Payment via Mobile Number',
        icon: { ios: 'iphone', android: 'smartphone', web: 'smartphone' },
    },
    {
        label: 'Merchant Payment Log',
        icon: { ios: 'list.bullet', android: 'list_alt', web: 'list_alt' },
    },
    {
        label: 'Wallet Sweeping Batch Summary',
        icon: {
            ios: 'arrow.triangle.2.circlepath',
            android: 'sync_alt',
            web: 'sync_alt',
        },
    },
    {
        label: 'Per Transaction Wallet Sweep',
        icon: {
            ios: 'arrow.triangle.2.circlepath',
            android: 'sync_alt',
            web: 'sync_alt',
        },
    },
] as const;

interface AppDrawerProps {
    visible: boolean;
    onClose: () => void;
}

export default function AppDrawer({ visible, onClose }: AppDrawerProps) {
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { t } = useLanguage();

    const [query, setQuery] = useState('');

    // The panel's horizontal position. It starts off-screen on the left.
    const [translateX] = useState(() => new Animated.Value(-PANEL_WIDTH));

    // Slide the panel in each time the drawer opens.
    useEffect(() => {
        if (visible) {
            translateX.setValue(-PANEL_WIDTH);

            Animated.timing(translateX, {
                toValue: 0,
                duration: 220,
                useNativeDriver: true,
            }).start();
        }
    }, [visible, translateX]);

    const visibleItems = menuItems.filter((item) =>
        item.label.toLowerCase().includes(query.trim().toLowerCase())
    );

    function handleClose() {
        setQuery('');
        onClose();
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.panel,
                        {
                            paddingTop: insets.top + spacing.md,
                            paddingBottom: insets.bottom + spacing.md,
                            transform: [{ translateX }],
                        },
                    ]}
                >
                    {/* Logo and app name */}
                    <View style={styles.header}>
                        <Image
                            source={require('@/assets/images/illico_cash.png')}
                            style={styles.logo}
                            contentFit="contain"
                            accessibilityLabel="Merchant Portal logo"
                        />

                        <Text style={styles.appName}>
                            Merchant Portal
                        </Text>
                    </View>

                    {/* Search */}
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
                            value={query}
                            onChangeText={setQuery}
                            placeholder={t('search')}
                            placeholderTextColor={colors.text.secondary}
                            autoCorrect={false}
                            autoCapitalize="none"
                        />
                    </View>

                    {/* Menu */}
                    <ScrollView
                        style={styles.menu}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {visibleItems.map((item) => {
                            const route = 'route' in item ? item.route : null;
                            const selected = route !== null && pathname === route;

                            return (
                                <Pressable
                                    key={item.label}
                                    disabled={route === null}
                                    onPress={() => {
                                        handleClose();

                                        if (route !== null && !selected) {
                                            router.navigate(route);
                                        }
                                    }}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected }}
                                    style={[
                                        styles.menuRow,
                                        selected && styles.menuRowSelected,
                                    ]}
                                >
                                    <SymbolView
                                        name={item.icon}
                                        size={20}
                                        tintColor={
                                            route === null
                                                ? colors.text.secondary
                                                : colors.text.primary
                                        }
                                    />

                                    <Text
                                        numberOfLines={1}
                                        style={[
                                            styles.menuLabel,
                                            route === null &&
                                            styles.menuLabelMuted,
                                        ]}
                                    >
                                        {item.label}
                                    </Text>

                                    {route === null ? (
                                        <Text style={styles.soonTag}>
                                            {t('soon')}
                                        </Text>
                                    ) : null}
                                </Pressable>
                            );
                        })}

                        {visibleItems.length === 0 ? (
                            <Text style={styles.noResults}>
                                {t('noMenuResults')}
                            </Text>
                        ) : null}
                    </ScrollView>

                    {/* Footer */}
                    {user?.merchantId ? (
                        <Text style={styles.footerText}>
                            {t('merchantId')}: {user.merchantId}
                        </Text>
                    ) : null}
                </Animated.View>

                {/* Tapping the dark area closes the drawer */}
                <Pressable
                    style={styles.backdrop}
                    onPress={handleClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close menu"
                />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'rgba(23, 26, 33, 0.45)',
    },

    panel: {
        width: PANEL_WIDTH,
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.md,
    },

    backdrop: {
        flex: 1,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingHorizontal: spacing.sm,
        marginBottom: spacing.lg,
    },

    logo: {
        width: 44,
        height: 44,
    },

    appName: {
        fontFamily: fontFamilies.semiBold,
        fontSize: 16,
        color: colors.text.primary,
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
        backgroundColor: colors.background,
        marginBottom: spacing.md,
    },

    searchInput: {
        flex: 1,
        fontFamily: fontFamilies.regular,
        fontSize: 14,
        color: colors.text.primary,
        paddingVertical: 0,
    },

    menu: {
        flex: 1,
    },

    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        minHeight: 48,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
    },

    menuRowSelected: {
        backgroundColor: colors.brand.primary,
    },

    menuLabel: {
        flex: 1,
        fontFamily: fontFamilies.medium,
        fontSize: 13,
        color: colors.text.primary,
    },

    menuLabelMuted: {
        color: colors.text.secondary,
    },

    soonTag: {
        fontFamily: fontFamilies.medium,
        fontSize: 10,
        color: colors.text.secondary,
    },

    noResults: {
        fontFamily: fontFamilies.regular,
        fontSize: 13,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: spacing.xl,
    },

    footerText: {
        fontFamily: fontFamilies.regular,
        fontSize: 11,
        color: colors.text.secondary,
        paddingHorizontal: spacing.sm,
        paddingTop: spacing.md,
    },
});