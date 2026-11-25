// src/components/common/BottomNavBar.tsx
import { useEffect, useRef, useState } from 'react';

import { Animated, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';

import { usePathname, useRouter } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MerchantQrModal from '@/components/dashboard/MerchantQrModal';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAppTheme, useThemedStyles } from '@/context/ThemeContext';
import type { TranslationKey } from '@/i18n/translations';

import type { AppColors } from '@/theme/colors';
import { elevation, radius, spacing } from '@/theme/metrics';
import { fontFamilies } from '@/theme/typography';

// ───────────── Easy settings (change these) ─────────────

// true  = round "bubble" behind the selected icon that pops in.
// false = the old flat rounded rectangle.
const BUBBLE_STYLE = true;

// Icon sizes. Make these bigger or smaller if you like.
const ICON_SIZE = 28;
const CENTER_ICON_SIZE = 32;

// ─────────────────────────────────────────────────────────

type TabRoute =
    | '/dashboard'
    | '/transactions'
    | '/qr-payment-log'
    | '/dynamic-qr';

type Tab =
    | {
          kind: 'route';
          route: TabRoute;
          labelKey: TranslationKey;
          icon: SymbolViewProps['name'];
      }
    | {
          // Opens the static QR popup instead of a screen.
          kind: 'staticQr';
          labelKey: TranslationKey;
          icon: SymbolViewProps['name'];
      };

// The shortcuts, left to right. To change the bar, edit this list.
// Keep it at 5 items or fewer. The middle one is drawn raised.
const TABS: Tab[] = [
    {
        kind: 'route',
        route: '/dashboard',
        labelKey: 'home',
        icon: { ios: 'house', android: 'home', web: 'home' },
    },
    {
        kind: 'route',
        route: '/transactions',
        labelKey: 'transactions',
        icon: {
            ios: 'arrow.left.arrow.right',
            android: 'swap_horiz',
            web: 'swap_horiz',
        },
    },
    {
        kind: 'staticQr',
        labelKey: 'staticQr',
        icon: { ios: 'qrcode', android: 'qr_code_2', web: 'qr_code_2' },
    },
    {
        kind: 'route',
        route: '/qr-payment-log',
        labelKey: 'navPayments',
        icon: { ios: 'creditcard', android: 'payments', web: 'payments' },
    },
    {
        kind: 'route',
        route: '/dynamic-qr',
        labelKey: 'dynamicQr',
        icon: {
            ios: 'qrcode.viewfinder',
            android: 'qr_code_scanner',
            web: 'qr_code_scanner',
        },
    },
];

// The bar is shown only on these screens.
export const BOTTOM_BAR_ROUTES: string[] = TABS.flatMap((tab) =>
    tab.kind === 'route' ? [tab.route] : []
);

const CENTER_INDEX = Math.floor(TABS.length / 2);

export default function BottomNavBar() {
    const { colors } = useAppTheme();
    const styles = useThemedStyles(createStyles);

    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const { t } = useLanguage();
    const { user } = useAuth();

    const [qrVisible, setQrVisible] = useState(false);

    // Hide the bar while the keyboard is open, so it does not eat screen space.
    const [keyboardOpen, setKeyboardOpen] = useState(false);

    useEffect(() => {
        const show = Keyboard.addListener('keyboardDidShow', () =>
            setKeyboardOpen(true)
        );
        const hide = Keyboard.addListener('keyboardDidHide', () =>
            setKeyboardOpen(false)
        );

        return () => {
            show.remove();
            hide.remove();
        };
    }, []);

    // Same rules as the burger menu, so both behave the same way.
    function openRoute(route: TabRoute) {
        if (route === pathname) {
            return;
        }

        if (route === '/dashboard') {
            // Going Home: close every screen above it.
            router.dismissTo('/dashboard');
        } else if (pathname === '/dashboard') {
            // From Home: open on top, so Back returns to Home.
            router.push(route);
        } else {
            // From another tab: swap it, so Home stays underneath.
            router.replace(route);
        }
    }

    function onTabPress(tab: Tab) {
        if (tab.kind === 'staticQr') {
            setQrVisible(true);
        } else {
            openRoute(tab.route);
        }
    }

    return (
        <>
            {keyboardOpen ? null : (
                <View style={[styles.bar, { paddingBottom: insets.bottom }]}>
                    {TABS.map((tab, index) => (
                        <TabButton
                            key={tab.labelKey}
                            label={t(tab.labelKey)}
                            icon={tab.icon}
                            raised={index === CENTER_INDEX}
                            selected={
                                tab.kind === 'route' && pathname === tab.route
                            }
                            onPress={() => onTabPress(tab)}
                            colors={colors}
                            styles={styles}
                        />
                    ))}
                </View>
            )}

            {/* Static QR popup, available from every tab screen. */}
            <MerchantQrModal
                visible={qrVisible}
                onDismiss={() => setQrVisible(false)}
                qrValue={user?.id ?? ''}
            />
        </>
    );
}

interface TabButtonProps {
    label: string;
    icon: SymbolViewProps['name'];
    raised: boolean;
    selected: boolean;
    onPress: () => void;
    colors: AppColors;
    styles: ReturnType<typeof createStyles>;
}

function TabButton({
    label,
    icon,
    raised,
    selected,
    onPress,
    colors,
    styles,
}: TabButtonProps) {
    // 0 = not selected, 1 = selected. Drives the bubble pop.
    const progress = useRef(new Animated.Value(selected ? 1 : 0)).current;
    // Small squeeze when the finger goes down.
    const press = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.spring(progress, {
            toValue: selected ? 1 : 0,
            friction: 5,
            tension: 140,
            useNativeDriver: true,
        }).start();
    }, [selected, progress]);

    function squeeze(to: number) {
        Animated.spring(press, {
            toValue: to,
            friction: 4,
            tension: 200,
            useNativeDriver: true,
        }).start();
    }

    const bubbleScale = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0.4, 1],
    });

    // The icon hops up a little when its bubble is showing.
    const iconLift = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, BUBBLE_STYLE ? -2 : 0],
    });

    return (
        <Pressable
            onPress={onPress}
            onPressIn={() => squeeze(0.88)}
            onPressOut={() => squeeze(1)}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            style={styles.tab}
        >
            <Animated.View
                style={[styles.tabInner, { transform: [{ scale: press }] }]}
            >
                {raised ? (
                    <View style={styles.raisedButton}>
                        <SymbolView
                            name={icon}
                            size={CENTER_ICON_SIZE}
                            tintColor={colors.brand.onPrimary}
                        />
                    </View>
                ) : (
                    <View style={styles.iconSlot}>
                        <Animated.View
                            style={[
                                BUBBLE_STYLE ? styles.bubble : styles.pill,
                                {
                                    opacity: progress,
                                    transform: [{ scale: bubbleScale }],
                                },
                            ]}
                        />

                        <Animated.View
                            style={{ transform: [{ translateY: iconLift }] }}
                        >
                            <SymbolView
                                name={icon}
                                size={ICON_SIZE}
                                tintColor={
                                    selected
                                        ? colors.brand.primary
                                        : colors.text.secondary
                                }
                            />
                        </Animated.View>
                    </View>
                )}

                <Text
                    style={[styles.label, selected && styles.labelSelected]}
                    numberOfLines={1}
                >
                    {label}
                </Text>
            </Animated.View>
        </Pressable>
    );
}

const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        bar: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingTop: spacing.sm,
            paddingHorizontal: spacing.xs,
        },

        tab: {
            flex: 1,
            alignItems: 'center',
        },

        tabInner: {
            alignItems: 'center',
            gap: 2,
            paddingBottom: spacing.xs,
        },

        // Fixed size so the selected bubble never shifts the layout.
        iconSlot: {
            width: 56,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
        },

        // Round bubble behind the selected icon.
        bubble: {
            position: 'absolute',
            width: 46,
            height: 46,
            borderRadius: radius.full,
            backgroundColor: colors.brand.soft,
        },

        // The old flat look (used when BUBBLE_STYLE is false).
        pill: {
            position: 'absolute',
            width: 56,
            height: 34,
            borderRadius: radius.md,
            backgroundColor: colors.brand.soft,
        },

        // Sits higher than the other icons, like a floating button.
        raisedButton: {
            width: 64,
            height: 64,
            marginTop: -30,
            marginBottom: 2,
            borderRadius: radius.full,
            backgroundColor: colors.brand.primary,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 4,
            borderColor: colors.surface,
            ...elevation.card,
        },

        label: {
            fontFamily: fontFamilies.medium,
            fontSize: 11,
            color: colors.text.secondary,
        },

        labelSelected: {
            fontFamily: fontFamilies.semiBold,
            color: colors.brand.primary,
        },
    });
