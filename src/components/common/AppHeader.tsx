// src/components/common/AppHeader.tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';

import { useLanguage } from '@/context/LanguageContext';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/metrics';
import { fontFamilies } from '@/theme/typography';

// Icon names for each platform.
const leftIcons = {
    menu: { ios: 'line.3.horizontal', android: 'menu', web: 'menu' },
    back: { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' },
} as const;

interface AppHeaderProps {
    title: string;
    leftIcon: 'menu' | 'back';
    onLeftPress: () => void;
    // When given, a round profile button is shown on the right.
    onProfilePress?: () => void;
}

export default function AppHeader({
                                      title,
                                      leftIcon,
                                      onLeftPress,
                                      onProfilePress,
                                  }: AppHeaderProps) {
    // Space taken by the phone's status bar (clock, battery).
    const insets = useSafeAreaInsets();
    const { language, toggleLanguage } = useLanguage();

    return (
        <View style={[styles.bar, { paddingTop: insets.top }]}>
            <StatusBar style="light" />

            <View style={styles.row}>
                <Pressable
                    style={styles.iconButton}
                    onPress={onLeftPress}
                    accessibilityRole="button"
                    accessibilityLabel={
                        leftIcon === 'menu' ? 'Open menu' : 'Go back'
                    }
                >
                    <SymbolView
                        name={leftIcons[leftIcon]}
                        size={24}
                        tintColor={colors.text.inverse}
                    />
                </Pressable>

                <Text style={styles.title} numberOfLines={1}>
                    {title}
                </Text>

                <Pressable
                    style={styles.languageButton}
                    onPress={toggleLanguage}
                    accessibilityRole="button"
                    accessibilityLabel="Change language"
                >
                    <Text style={styles.languageText}>
                        {language === 'en' ? 'English' : 'Français'}
                    </Text>
                </Pressable>

                {onProfilePress ? (
                    <Pressable
                        style={styles.profileButton}
                        onPress={onProfilePress}
                        accessibilityRole="button"
                        accessibilityLabel="Open profile"
                    >
                        <SymbolView
                            name={{
                                ios: 'person',
                                android: 'person',
                                web: 'person',
                            }}
                            size={18}
                            tintColor={colors.text.inverse}
                        />
                    </Pressable>
                ) : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    bar: {
        backgroundColor: colors.appBar,
    },

    row: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        gap: spacing.xs,
    },

    iconButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },

    title: {
        flex: 1,
        fontFamily: fontFamilies.semiBold,
        fontSize: 18,
        color: colors.text.inverse,
    },

    languageButton: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
    },

    languageText: {
        fontFamily: fontFamilies.medium,
        fontSize: 12,
        color: colors.text.inverse,
    },

    profileButton: {
        width: 34,
        height: 34,
        borderRadius: radius.full,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
});