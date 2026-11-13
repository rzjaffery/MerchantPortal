
import type { ReactNode } from 'react';

import {
    StyleSheet,
    View,
    type StyleProp,
    type ViewStyle,
} from 'react-native';

import { colors } from '@/theme/colors';
import { elevation, radius, spacing } from '@/theme/metrics';

interface AppCardProps {
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
}

export default function AppCard({
                                    children,
                                    style,
                                }: AppCardProps) {
    return (
        <View style={[styles.card, style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.background,
        borderRadius: radius.md,
        padding: spacing.lg,
        ...elevation.card,
    },
});
