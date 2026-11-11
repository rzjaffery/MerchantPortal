
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
} from 'react-native';

import { colors } from '@/theme/colors';
import { dimensions, radius, spacing } from '@/theme/metrics';
import { fontFamilies } from '@/theme/typography';

type ButtonVariant = 'primary' | 'secondary' | 'outline';

interface AppButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    disabled?: boolean;
    loading?: boolean;
}

export default function AppButton({
                                      title,
                                      onPress,
                                      variant = 'primary',
                                      disabled = false,
                                      loading = false,
                                  }: AppButtonProps) {
    const isDisabled = disabled || loading;

    const buttonVariant = {
        primary: styles.primary,
        secondary: styles.secondary,
        outline: styles.outline,
    }[variant];

    const textVariant =
        variant === 'primary'
            ? styles.primaryText
            : styles.secondaryText;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{
                disabled: isDisabled,
                busy: loading,
            }}
            onPress={onPress}
            disabled={isDisabled}
            style={({ pressed }) => [
                styles.button,
                buttonVariant,
                pressed && styles.pressed,
                isDisabled && styles.disabled,
            ]}
        >
            {loading ? (
                <ActivityIndicator
                    color={
                        variant === 'primary'
                            ? colors.brand.onPrimary
                            : colors.text.primary
                    }
                />
            ) : (
                <Text style={[styles.label, textVariant]}>
                    {title}
                </Text>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        height: dimensions.buttonHeight,
        borderRadius: radius.lg,
        paddingHorizontal: spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },

    primary: {
        backgroundColor: colors.brand.primary,
    },

    secondary: {
        backgroundColor: colors.brand.soft,
    },

    outline: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },

    label: {
        fontFamily: fontFamilies.semiBold,
        fontSize: 15,
        lineHeight: 20,
    },

    primaryText: {
        color: colors.brand.onPrimary,
    },

    secondaryText: {
        color: colors.text.primary,
    },

    pressed: {
        opacity: 0.8,
    },

    disabled: {
        opacity: 0.5,
    },
});
