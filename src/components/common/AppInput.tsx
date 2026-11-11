
import { useState } from 'react';

import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
    type TextInputProps,
} from 'react-native';

import { SymbolView } from 'expo-symbols';

import { colors } from '@/theme/colors';
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
    const [passwordVisible, setPasswordVisible] = useState(false);

    const shouldHideText =
        secureTextEntry && !passwordVisible;

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>

            <View
                style={[
                    styles.inputContainer,
                    error ? styles.inputError : null,
                ]}
            >
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.text.secondary}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    autoCorrect={false}
                    secureTextEntry={shouldHideText}
                    returnKeyType={returnKeyType}
                    onSubmitEditing={onSubmitEditing}
                    accessibilityLabel={label}
                />

                {secureTextEntry && (
                    <Pressable
                        onPress={() =>
                            setPasswordVisible((visible) => !visible)
                        }
                        accessibilityRole="button"
                        accessibilityLabel={
                            passwordVisible ? 'Hide password' : 'Show password'
                        }
                        style={styles.passwordToggle}
                    >
                        <SymbolView
                            name={{
                                ios: passwordVisible ? 'eye.slash' : 'eye',
                                android: passwordVisible
                                    ? 'visibility_off'
                                    : 'visibility',
                                web: passwordVisible
                                    ? 'visibility_off'
                                    : 'visibility',
                            }}
                            size={21}
                            tintColor={colors.text.secondary}
                        />
                    </Pressable>
                )}
            </View>

            {error ? (
                <Text style={styles.errorText}>{error}</Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: spacing.lg,
    },

    label: {
        fontFamily: fontFamilies.medium,
        fontSize: 13,
        lineHeight: 20,
        color: colors.text.primary,
        marginBottom: spacing.sm,
    },

    inputContainer: {
        height: dimensions.inputHeight,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        paddingHorizontal: spacing.lg,
    },

    inputError: {
        borderColor: colors.status.error,
    },

    input: {
        flex: 1,
        minWidth: 0,
        height: '100%',
        color: colors.text.primary,
        fontFamily: fontFamilies.regular,
        fontSize: 14,
        paddingVertical: 0,
    },

    passwordToggle: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },

    errorText: {
        color: colors.status.error,
        fontFamily: fontFamilies.regular,
        fontSize: 12,
        lineHeight: 18,
        marginTop: spacing.xs,
    },
});
