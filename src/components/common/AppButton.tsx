// src/components/common/AppButton.tsx
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

import { colors } from '@/theme/colors';
import { dimensions, radius } from '@/theme/metrics';
import { fontFamilies } from '@/theme/typography';

type ButtonVariant = 'primary' | 'secondary' | 'outline';

interface AppButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    disabled?: boolean;
    loading?: boolean;
}

// Our variant names mapped to React Native Paper's button modes.
const paperModes = {
    primary: 'contained',
    secondary: 'contained-tonal',
    outline: 'outlined',
} as const;

export default function AppButton({
                                      title,
                                      onPress,
                                      variant = 'primary',
                                      disabled = false,
                                      loading = false,
                                  }: AppButtonProps) {
    return (
        <Button
            mode={paperModes[variant]}
            // Ignore taps while a request is running.
            onPress={loading ? () => {} : onPress}
            loading={loading}
            disabled={disabled}
            textColor={
                variant === 'primary'
                    ? colors.brand.onPrimary
                    : colors.text.primary
            }
            style={[
                styles.button,
                variant === 'outline' && styles.outline,
            ]}
            contentStyle={styles.content}
            labelStyle={styles.label}
        >
            {title}
        </Button>
    );
}

const styles = StyleSheet.create({
    button: {
        width: '100%',
        borderRadius: radius.lg,
    },

    outline: {
        backgroundColor: colors.surface,
    },

    content: {
        height: dimensions.buttonHeight,
    },

    label: {
        fontFamily: fontFamilies.semiBold,
        fontSize: 15,
    },
});