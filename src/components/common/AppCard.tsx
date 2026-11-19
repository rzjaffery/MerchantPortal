
import type { ReactNode } from 'react';

import {
    StyleSheet,
    View,
    type StyleProp,
    type ViewStyle,
} from 'react-native';

import type { AppColors } from '@/theme/colors';
import { useThemedStyles } from '@/context/ThemeContext';
import { elevation, radius, spacing } from '@/theme/metrics';

interface AppCardProps {
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
}

export default function AppCard({
                                    children,
                                    style,
                                }: AppCardProps) {
    const styles = useThemedStyles(createStyles);

    return (
        <View style={[styles.card, style]}>
            {children}
        </View>
    );
}

// Styles are built from the current colours, so they follow light or dark mode.
const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        card: {
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.background,
            borderRadius: radius.md,
            padding: spacing.lg,
            ...elevation.card,
        },
    });
