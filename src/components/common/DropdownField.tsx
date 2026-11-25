// src/components/common/DropdownField.tsx
import { useState } from 'react';

import {
    Pressable,
    StyleSheet,
    Text,
    View,
    type LayoutChangeEvent,
} from 'react-native';

import { Menu } from 'react-native-paper';
import { SymbolView } from 'expo-symbols';

import { useAppTheme, useThemedStyles } from '@/context/ThemeContext';

import type { AppColors } from '@/theme/colors';
import { radius, spacing } from '@/theme/metrics';
import { fontFamilies } from '@/theme/typography';

const chevron = {
    ios: 'chevron.down',
    android: 'keyboard_arrow_down',
    web: 'keyboard_arrow_down',
} as const;

export interface DropdownOption {
    value: string;
    label: string;
}

interface DropdownFieldProps {
    // Small title above the field, e.g. "Branches (3)".
    label: string;
    // Shown while nothing is chosen, e.g. "Select a branch".
    placeholder: string;
    options: DropdownOption[];
    // The chosen option's value, or '' for none.
    selectedValue: string;
    onSelect: (value: string) => void;
}

export default function DropdownField({
                                          label,
                                          placeholder,
                                          options,
                                          selectedValue,
                                          onSelect,
                                      }: DropdownFieldProps) {
    const { colors } = useAppTheme();
    const styles = useThemedStyles(createStyles);

    const [open, setOpen] = useState(false);
    const [width, setWidth] = useState(0);

    const selected = options.find((option) => option.value === selectedValue);

    // The list is as wide as the field.
    function handleLayout(event: LayoutChangeEvent) {
        setWidth(event.nativeEvent.layout.width);
    }

    return (
        <View style={styles.wrapper} onLayout={handleLayout}>
            <Text style={styles.label}>{label}</Text>

            <Menu
                visible={open}
                onDismiss={() => setOpen(false)}
                anchorPosition="bottom"
                contentStyle={[styles.menu, { minWidth: width }]}
                anchor={
                    <Pressable
                        onPress={() => setOpen(true)}
                        accessibilityRole="button"
                        style={({ pressed }) => [
                            styles.field,
                            pressed && styles.pressed,
                        ]}
                    >
                        <Text
                            style={[
                                styles.value,
                                !selected && styles.placeholder,
                            ]}
                            numberOfLines={1}
                        >
                            {selected ? selected.label : placeholder}
                        </Text>

                        <SymbolView
                            name={chevron}
                            size={16}
                            tintColor={colors.text.secondary}
                        />
                    </Pressable>
                }
            >
                {options.map((option) => (
                    <Menu.Item
                        key={option.value}
                        title={option.label}
                        titleStyle={styles.menuItem}
                        onPress={() => {
                            setOpen(false);
                            onSelect(option.value);
                        }}
                    />
                ))}
            </Menu>
        </View>
    );
}

const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        wrapper: {
            gap: spacing.xs,
        },

        label: {
            fontFamily: fontFamilies.medium,
            fontSize: 12,
            color: colors.text.secondary,
        },

        field: {
            minHeight: 48,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.md,
            paddingHorizontal: spacing.lg,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
        },

        value: {
            flex: 1,
            fontFamily: fontFamilies.medium,
            fontSize: 14,
            color: colors.text.primary,
        },

        placeholder: {
            color: colors.text.secondary,
        },

        menu: {
            backgroundColor: colors.surface,
        },

        menuItem: {
            fontFamily: fontFamilies.regular,
            fontSize: 14,
            color: colors.text.primary,
        },

        pressed: {
            opacity: 0.7,
        },
    });
