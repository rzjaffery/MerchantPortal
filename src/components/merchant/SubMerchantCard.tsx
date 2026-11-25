// src/components/merchant/SubMerchantCard.tsx
import { StyleSheet, Text, View } from 'react-native';

import AppCard from '@/components/common/AppCard';

import { useLanguage } from '@/context/LanguageContext';
import { useThemedStyles } from '@/context/ThemeContext';

import type { SubMerchant } from '@/types/subMerchant';
import { merchantTypeKey } from '@/utils/merchantType';

import type { AppColors } from '@/theme/colors';
import { radius, spacing } from '@/theme/metrics';
import { fontFamilies } from '@/theme/typography';

interface SubMerchantCardProps {
    subMerchant: SubMerchant;
}

// Shows only the last 4 characters of an ID number, e.g. "•••••1234".
function maskId(value: string): string {
    return value.length > 4 ? `•••••${value.slice(-4)}` : value;
}

// Every detail the server sent for one branch, shop or till.
export default function SubMerchantCard({ subMerchant }: SubMerchantCardProps) {
    const styles = useThemedStyles(createStyles);
    const { t } = useLanguage();

    const typeKey = merchantTypeKey(subMerchant.merchantType);
    const typeLabel = typeKey ? t(typeKey) : subMerchant.merchantType;

    // Rows with no value are left out.
    // To show the full ID number, use subMerchant.cnic instead of maskId(...).
    const rows = [
        { key: 'type', label: t('merchantType'), value: typeLabel },
        { key: 'business', label: t('businessName'), value: subMerchant.businessName },
        { key: 'id', label: t('merchantId'), value: subMerchant.merchantId },
        { key: 'parent', label: t('parentId'), value: subMerchant.parentId },
        { key: 'mobile', label: t('mobileNumber'), value: subMerchant.mobileNumber },
        { key: 'address', label: t('address'), value: subMerchant.address },
        { key: 'idType', label: t('identificationType'), value: subMerchant.identificationType },
        { key: 'cnic', label: t('cnic'), value: maskId(subMerchant.cnic) },
        { key: 'userId', label: t('userId'), value: subMerchant.userId },
    ].filter((row) => row.value !== '');

    return (
        <AppCard>
            <View style={styles.header}>
                <Text style={styles.title} numberOfLines={2}>
                    {subMerchant.businessName || subMerchant.merchantId}
                </Text>

                {typeLabel ? (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{typeLabel}</Text>
                    </View>
                ) : null}
            </View>

            {rows.map((row, index) => (
                <View
                    key={row.key}
                    style={[styles.row, index > 0 && styles.divider]}
                >
                    <Text style={styles.label}>{row.label}</Text>
                    <Text style={styles.value}>{row.value}</Text>
                </View>
            ))}
        </AppCard>
    );
}

const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.md,
            paddingBottom: spacing.md,
        },

        title: {
            flex: 1,
            fontFamily: fontFamilies.semiBold,
            fontSize: 16,
            color: colors.text.primary,
        },

        badge: {
            paddingHorizontal: spacing.sm,
            paddingVertical: 2,
            borderRadius: radius.md,
            backgroundColor: colors.brand.soft,
        },

        badgeText: {
            fontFamily: fontFamilies.semiBold,
            fontSize: 11,
            color: colors.brand.primary,
        },

        row: {
            paddingVertical: spacing.md,
        },

        divider: {
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },

        label: {
            fontFamily: fontFamilies.regular,
            fontSize: 11,
            color: colors.text.secondary,
        },

        value: {
            fontFamily: fontFamilies.semiBold,
            fontSize: 14,
            color: colors.text.primary,
        },
    });
