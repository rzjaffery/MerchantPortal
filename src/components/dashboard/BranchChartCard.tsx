// src/components/dashboard/BranchChartCard.tsx
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import AppCard from '@/components/common/AppCard';

import type { AppColors } from '@/theme/colors';
import { useThemedStyles } from '@/context/ThemeContext';
import { radius, spacing } from '@/theme/metrics';
import { fontFamilies } from '@/theme/typography';

// One bar: a branch name with its value in each currency.
export interface BranchChartPoint {
    label: string;
    usd: number;
    cdf: number;
}

interface BranchChartCardProps {
    data: BranchChartPoint[];
    // Shown when there is nothing to draw.
    emptyText: string;
}

const CHART_HEIGHT = 120;

export default function BranchChartCard({
                                            data,
                                            emptyText,
                                        }: BranchChartCardProps) {
    const styles = useThemedStyles(createStyles);

    const [currency, setCurrency] = useState<'USD' | 'CDF'>('USD');

    const values = data.map((point) =>
        currency === 'USD' ? point.usd : point.cdf
    );

    // The tallest bar fills the chart. The others are scaled to it.
    const maxValue = Math.max(...values, 0);

    return (
        <AppCard style={styles.card}>
            {/* USD / CDF switch */}
            <View style={styles.segmented}>
                {(['USD', 'CDF'] as const).map((item) => {
                    const selected = item === currency;

                    return (
                        <Pressable
                            key={item}
                            onPress={() => setCurrency(item)}
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                            style={[
                                styles.segment,
                                selected && styles.segmentSelected,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.segmentText,
                                    selected && styles.segmentTextSelected,
                                ]}
                            >
                                {item}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            {data.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>
                        {emptyText}
                    </Text>
                </View>
            ) : (
                <View style={styles.bars}>
                    {data.map((point, index) => {
                        const value = values[index] ?? 0;

                        const height =
                            maxValue > 0
                                ? Math.max(4, (value / maxValue) * CHART_HEIGHT)
                                : 4;

                        return (
                            <View key={point.label} style={styles.barColumn}>
                                <View style={styles.barTrack}>
                                    <View style={[styles.bar, { height }]} />
                                </View>

                                <Text
                                    style={styles.barLabel}
                                    numberOfLines={1}
                                >
                                    {point.label}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            )}
        </AppCard>
    );
}

// Styles are built from the current colours, so they follow light or dark mode.
const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        card: {
            marginBottom: spacing.md,
        },

        segmented: {
            flexDirection: 'row',
            alignSelf: 'flex-start',
            backgroundColor: colors.background,
            borderRadius: radius.md,
            padding: spacing.xs,
            marginBottom: spacing.md,
        },

        segment: {
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
            borderRadius: radius.md,
        },

        segmentSelected: {
            backgroundColor: colors.brand.primary,
        },

        segmentText: {
            fontFamily: fontFamilies.medium,
            fontSize: 12,
            color: colors.text.secondary,
        },

        segmentTextSelected: {
            fontFamily: fontFamilies.semiBold,
            color: colors.brand.onPrimary,
        },

        emptyBox: {
            height: CHART_HEIGHT,
            alignItems: 'center',
            justifyContent: 'center',
        },

        emptyText: {
            fontFamily: fontFamilies.regular,
            fontSize: 12,
            color: colors.text.secondary,
        },

        bars: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
        },

        barColumn: {
            flex: 1,
            alignItems: 'center',
        },

        barTrack: {
            height: CHART_HEIGHT,
            justifyContent: 'flex-end',
        },

        bar: {
            width: 22,
            borderRadius: radius.sm,
            backgroundColor: colors.brand.primary,
        },

        barLabel: {
            fontFamily: fontFamilies.regular,
            fontSize: 10,
            color: colors.text.secondary,
            marginTop: spacing.xs,
        },
    });
