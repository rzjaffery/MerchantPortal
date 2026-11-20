// src/components/dashboard/CurrencySummary.tsx
import { useMemo, useState } from 'react';

import {
    PanResponder,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import CurrencyDonut from '@/components/dashboard/CurrencyDonut';

import { useThemedStyles } from '@/context/ThemeContext';

import type { DashboardSummary } from '@/types/dashboard';
import type { AppColors } from '@/theme/colors';
import { radius, spacing } from '@/theme/metrics';
import { fontFamilies } from '@/theme/typography';

type Currency = 'USD' | 'CDF';

const currencies: Currency[] = ['USD', 'CDF'];

// How far, in pixels, a finger must move sideways to count as a swipe.
const SWIPE_DISTANCE = 40;

interface CurrencySummaryProps {
    summary: DashboardSummary;
}

// One large donut with a USD / CDF switch.
// Swiping left or right on the donut also changes the currency.
export default function CurrencySummary({ summary }: CurrencySummaryProps) {
    const styles = useThemedStyles(createStyles);

    const [currency, setCurrency] = useState<Currency>('USD');

    // Watches for sideways swipes on the donut area.
    const swipeHandler = useMemo(
        () =>
            PanResponder.create({
                // Only take over when the finger moves clearly sideways,
                // so scrolling the page up and down still works.
                onMoveShouldSetPanResponder: (_event, gesture) =>
                    Math.abs(gesture.dx) > 20 &&
                    Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,

                // Let the page take the gesture back if it needs to.
                onPanResponderTerminationRequest: () => true,

                onPanResponderRelease: (_event, gesture) => {
                    if (gesture.dx <= -SWIPE_DISTANCE) {
                        // Finger moved left: show the next currency.
                        setCurrency('CDF');
                    } else if (gesture.dx >= SWIPE_DISTANCE) {
                        // Finger moved right: show the previous currency.
                        setCurrency('USD');
                    }
                },
            }),
        []
    );

    const amounts =
        currency === 'USD'
            ? {
                successful: summary.successfulAmountUSD,
                failed: summary.failedAmountUSD,
            }
            : {
                successful: summary.successfulAmountCDF,
                failed: summary.failedAmountCDF,
            };

    return (
        <View>
            {/* USD / CDF switch */}
            <View style={styles.segmented}>
                {currencies.map((item) => {
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

            {/* The donut. The swipe handler is attached here. */}
            <View {...swipeHandler.panHandlers}>
                <CurrencyDonut
                    currency={currency}
                    successfulAmount={amounts.successful}
                    failedAmount={amounts.failed}
                />
            </View>

            {/* Two dots showing which currency is on screen. */}
            <View style={styles.dots}>
                {currencies.map((item) => (
                    <View
                        key={item}
                        style={[
                            styles.pageDot,
                            item === currency && styles.pageDotActive,
                        ]}
                    />
                ))}
            </View>
        </View>
    );
}

// Styles are built from the current colours, so they follow light or dark mode.
const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        segmented: {
            flexDirection: 'row',
            alignSelf: 'center',
            backgroundColor: colors.background,
            borderRadius: radius.md,
            padding: spacing.xs,
            marginTop: spacing.md,
            marginBottom: spacing.lg,
        },

        segment: {
            paddingHorizontal: spacing.xl,
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

        dots: {
            flexDirection: 'row',
            justifyContent: 'center',
            gap: spacing.xs,
            marginTop: spacing.md,
        },

        pageDot: {
            width: 6,
            height: 6,
            borderRadius: radius.full,
            backgroundColor: colors.border,
        },

        pageDotActive: {
            width: 16,
            backgroundColor: colors.brand.primary,
        },
    });