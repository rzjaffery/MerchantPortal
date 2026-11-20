// src/components/dashboard/CurrencyDonut.tsx
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { useLanguage } from '@/context/LanguageContext';
import { useAppTheme, useThemedStyles } from '@/context/ThemeContext';

import type { AppColors } from '@/theme/colors';
import { radius, spacing } from '@/theme/metrics';
import { fontFamilies } from '@/theme/typography';

interface CurrencyDonutProps {
    currency: 'USD' | 'CDF';
    successfulAmount: number;
    failedAmount: number;
}

// Size of the donut and the thickness of its ring.
const CHART_SIZE = 156;
const RING_WIDTH = 18;

// Formats money with two decimals, e.g. 10,854.44
function formatAmount(amount: number): string {
    return amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

// A donut chart of successful against failed amounts for one currency.
export default function CurrencyDonut({
                                          currency,
                                          successfulAmount,
                                          failedAmount,
                                      }: CurrencyDonutProps) {
    const { colors } = useAppTheme();
    const styles = useThemedStyles(createStyles);
    const { t } = useLanguage();

    const total = successfulAmount + failedAmount;
    const hasData = total > 0;

    const successShare = hasData ? successfulAmount / total : 0;
    const successPercent = Math.round(successShare * 100);

    // A ring is a circle drawn with a thick outline.
    // "circumference" is the full length of that outline.
    const ringRadius = (CHART_SIZE - RING_WIDTH) / 2;
    const circumference = 2 * Math.PI * ringRadius;

    // How much of the outline each part covers.
    const successLength = circumference * successShare;
    const failedLength = circumference - successLength;

    const center = CHART_SIZE / 2;

    // The two legend lines under the donut.
    const legend = [
        {
            key: 'successful',
            label: t('successful'),
            amount: successfulAmount,
            dotStyle: styles.dotSuccess,
        },
        {
            key: 'failed',
            label: t('failed'),
            amount: failedAmount,
            dotStyle: styles.dotFailed,
        },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.chartBox}>
                <Svg width={CHART_SIZE} height={CHART_SIZE}>
                    {/* Turn the drawing so the ring starts at the top. */}
                    <G rotation={-90} origin={`${center}, ${center}`}>
                        {/* Grey full ring underneath. */}
                        <Circle
                            cx={center}
                            cy={center}
                            r={ringRadius}
                            stroke={colors.border}
                            strokeWidth={RING_WIDTH}
                            fill="none"
                        />

                        {hasData ? (
                            <>
                                {/* Green part: draw only successLength of the outline. */}
                                <Circle
                                    cx={center}
                                    cy={center}
                                    r={ringRadius}
                                    stroke={colors.status.success}
                                    strokeWidth={RING_WIDTH}
                                    strokeDasharray={`${successLength} ${circumference}`}
                                    fill="none"
                                />

                                {/* Red part: starts where the green part ends. */}
                                <Circle
                                    cx={center}
                                    cy={center}
                                    r={ringRadius}
                                    stroke={colors.status.error}
                                    strokeWidth={RING_WIDTH}
                                    strokeDasharray={`${failedLength} ${circumference}`}
                                    strokeDashoffset={-successLength}
                                    fill="none"
                                />
                            </>
                        ) : null}
                    </G>
                </Svg>

                {/* Text in the hole of the donut. */}
                <View style={styles.centerLabel}>
                    <Text style={styles.percent}>
                        {hasData ? `${successPercent}%` : '—'}
                    </Text>

                    <Text style={styles.percentCaption}>
                        {hasData ? t('successful') : t('noData')}
                    </Text>
                </View>
            </View>

            {/* Legend: label on the left, amount on the right. */}
            {legend.map((item) => (
                <View key={item.key} style={styles.legendRow}>
                    <View style={[styles.dot, item.dotStyle]} />

                    <Text style={styles.legendLabel} numberOfLines={1}>
                        {item.label}
                    </Text>

                    <Text
                        style={styles.legendAmount}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.6}
                    >
                        <Text style={styles.legendCurrency}>
                            {currency}{' '}
                        </Text>
                        {formatAmount(item.amount)}
                    </Text>
                </View>
            ))}
        </View>
    );
}

// Styles are built from the current colours, so they follow light or dark mode.
const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        container: {
            width: '100%',
        },

        chartBox: {
            width: CHART_SIZE,
            height: CHART_SIZE,
            alignSelf: 'center',
            marginBottom: spacing.lg,
        },

        centerLabel: {
            // Fill the whole chart area and centre the text in it.
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
        },

        percent: {
            fontFamily: fontFamilies.bold,
            fontSize: 26,
            color: colors.text.primary,
        },

        percentCaption: {
            fontFamily: fontFamilies.regular,
            fontSize: 11,
            color: colors.text.secondary,
        },

        legendRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            paddingVertical: spacing.xs,
        },

        dot: {
            width: 10,
            height: 10,
            borderRadius: radius.full,
        },

        dotSuccess: {
            backgroundColor: colors.status.success,
        },

        dotFailed: {
            backgroundColor: colors.status.error,
        },

        legendLabel: {
            fontFamily: fontFamilies.medium,
            fontSize: 12,
            color: colors.text.secondary,
        },

        legendAmount: {
            // Takes the rest of the row, so the amount sits on the right.
            flex: 1,
            fontFamily: fontFamilies.semiBold,
            fontSize: 14,
            color: colors.text.primary,
            textAlign: 'right',
        },

        legendCurrency: {
            fontFamily: fontFamilies.medium,
            fontSize: 11,
            color: colors.text.secondary,
        },
    });