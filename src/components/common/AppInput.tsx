// src/components/common/AppInput.tsx
import { useState } from 'react';

import {
    StyleSheet,
    Text,
    View,
    type TextInputProps,
} from 'react-native';

import { HelperText, TextInput } from 'react-native-paper';
import { SymbolView } from 'expo-symbols';

import type { AppColors } from '@/theme/colors';
import { useAppTheme, useThemedStyles } from '@/context/ThemeContext';
import { dimensions, radius, spacing } from '@/theme/metrics';
import { fontFamilies } from '@/theme/typography';

interface AppInputProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    keyboardType?: TextInputProps['keyboardType'];
    autoCapitalize?: TextInputProps['autoCapitalize'];
    secureTextEntry?: boolean;
    error?: string;
    returnKeyType?: TextInputProps['returnKeyType'];
    onSubmitEditing?: TextInputProps['onSubmitEditing'];
}

export default function AppInput({
                                     label,
                                     value,
                                     onChangeText,
                                     placeholder,
                                     keyboardType = 'default',
                                     autoCapitalize = 'sentences',
                                     secureTextEntry = false,
                                     error,
                                     returnKeyType = 'next',
                                     onSubmitEditing,
                                 }: AppInputProps) {
    const { colors } = useAppTheme();
    const styles = useThemedStyles(createStyles);

    const [passwordVisible, setPasswordVisible] = useState(false);

    const shouldHideText = secureTextEntry && !passwordVisible;

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                mode="outlined"
                accessibilityLabel={label}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                autoCorrect={false}
                secureTextEntry={shouldHideText}
                returnKeyType={returnKeyType}
                onSubmitEditing={onSubmitEditing}
                error={Boolean(error)}
                activeOutlineColor={colors.text.primary}
                style={styles.input}
                outlineStyle={styles.outline}
                right={
                    secureTextEntry ? (
                        <TextInput.Icon
                            // Keep the eye icon we already had.
                            icon={({ size, color }) => (
                                <SymbolView
                                    name={{
                                        ios: passwordVisible
                                            ? 'eye.slash'
                                            : 'eye',
                                        android: passwordVisible
                                            ? 'visibility_off'
                                            : 'visibility',
                                        web: passwordVisible
                                            ? 'visibility_off'
                                            : 'visibility',
                                    }}
                                    size={size}
                                    tintColor={color}
                                />
                            )}
                            onPress={() =>
                                setPasswordVisible((visible) => !visible)
                            }
                            forceTextInputFocus={false}
                            accessibilityLabel={
                                passwordVisible
                                    ? 'Hide password'
                                    : 'Show password'
                            }
                        />
                    ) : undefined
                }
            />

            {error ? (
                <HelperText
                    type="error"
                    visible
                    padding="none"
                    style={styles.errorText}
                >
                    {error}
                </HelperText>
            ) : null}
        </View>
    );
}

// Styles are built from the current colours, so they follow light or dark mode.
const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        container: {
            width: '100%',
            marginBottom: spacing.lg,
        },

        input: {
            height: dimensions.inputHeight,
            backgroundColor: colors.surface,
            fontFamily: fontFamilies.regular,
            fontSize: 14,
        },

        label: {
            fontFamily: fontFamilies.medium,
            fontSize: 13,
            color: colors.text.primary,
            marginBottom: spacing.sm,
        },

        outline: {
            borderRadius: radius.lg,
        },

        errorText: {
            fontFamily: fontFamilies.regular,
        },
    });
