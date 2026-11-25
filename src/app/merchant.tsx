// src/app/merchant.tsx
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { SymbolView } from 'expo-symbols';

import AppButton from '@/components/common/AppButton';
import AppCard from '@/components/common/AppCard';
import AppHeader from '@/components/common/AppHeader';
import DropdownField from '@/components/common/DropdownField';
import SubMerchantCard from '@/components/merchant/SubMerchantCard';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useDrawer } from '@/context/DrawerContext';
import { getSubMerchants } from '@/services/merchants/subMerchantService';
import { getMerchantProfile } from '@/services/profile/profileService';

import type { MerchantProfile } from '@/types/profile';
import type { SubMerchant } from '@/types/subMerchant';

import type { AppColors } from '@/theme/colors';
import { useAppTheme, useThemedStyles } from '@/context/ThemeContext';
import { radius, spacing } from '@/theme/metrics';
import { fontFamilies } from '@/theme/typography';
import { merchantTypeKey } from '@/utils/merchantType';

// Icon names for each platform.
const icons = {
    store: { ios: 'storefront', android: 'storefront', web: 'storefront' },
    badge: { ios: 'person.text.rectangle', android: 'badge', web: 'badge' },
    mail: { ios: 'envelope', android: 'mail', web: 'mail' },
    call: { ios: 'phone', android: 'call', web: 'call' },
} as const;

// Formats money with two decimals, e.g. 10,854.44
function formatAmount(amount: number): string {
    return amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function MerchantScreen() {
    const { colors } = useAppTheme();
    const styles = useThemedStyles(createStyles);

    const router = useRouter();
    const { user, accessToken } = useAuth();
    const { t } = useLanguage();
    const { openDrawer } = useDrawer();

    const [profile, setProfile] = useState<MerchantProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const merchantId = user?.merchantId ?? '';
    const username = user?.username ?? '';

    // Branches, shops and tills under this merchant.
    const [subMerchants, setSubMerchants] = useState<SubMerchant[]>([]);
    const [subError, setSubError] = useState(false);
    // The merchantId of the branch, shop or till the user picked.
    const [selectedId, setSelectedId] = useState('');

    const loadProfile = useCallback(async () => {
        if (!merchantId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setHasError(false);

        try {
            const data = await getMerchantProfile(merchantId);

            setProfile(data);
        } catch {
            setHasError(true);
        } finally {
            setIsLoading(false);
        }
    }, [merchantId]);

    useEffect(() => {
        void loadProfile();
    }, [loadProfile]);

    const loadSubMerchants = useCallback(async () => {
        setSubError(false);

        try {
            const list = await getSubMerchants(
                username,
                accessToken ?? '',
                user?.id ?? '',
                merchantId
            );

            setSubMerchants(list);
        } catch {
            setSubError(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [username, accessToken, merchantId]);

    // A till has nothing under it, so we only ask for the other types.
    useEffect(() => {
        if (profile && profile.merchantType !== '4') {
            void loadSubMerchants();
        }
    }, [profile, loadSubMerchants]);

    // Group the list by type: 2 = branch, 3 = shop, 4 = till.
    const groups = [
        { type: '2', title: t('branches'), placeholder: t('selectBranch') },
        { type: '3', title: t('shops'), placeholder: t('selectShop') },
        { type: '4', title: t('tills'), placeholder: t('selectTill') },
    ]
        .map((group) => ({
            ...group,
            items: subMerchants.filter(
                (item) => item.merchantType === group.type
            ),
        }))
        .filter((group) => group.items.length > 0);

    const selectedSubMerchant = subMerchants.find(
        (item) => item.merchantId === selectedId
    );

    // Shows the name (Merchant, Branch, Shop, Till) instead of the number.
    // An unknown code is shown as sent.
    const typeKey = merchantTypeKey(profile?.merchantType ?? '');
    const merchantTypeLabel = typeKey
        ? t(typeKey)
        : profile?.merchantType ?? '';

    // Rows with no value are left out.
    const infoRows = profile
        ? [
            {
                key: 'type',
                icon: icons.store,
                label: t('merchantType'),
                value: merchantTypeLabel,
            },
            {
                key: 'business',
                icon: icons.store,
                label: t('businessName'),
                value: profile.businessName,
            },
            {
                key: 'id',
                icon: icons.badge,
                label: t('merchantId'),
                value: profile.merchantId || merchantId,
            },
            {
                key: 'email',
                icon: icons.mail,
                label: t('email'),
                value: profile.email,
            },
            {
                key: 'mobile',
                icon: icons.call,
                label: t('mobileNumber'),
                value: profile.mobileNumber,
            },
        ].filter((row) => row.value !== '')
        : [];

    return (
        <View style={styles.screen}>
            <AppHeader
                title={t('merchant')}
                leftIcon="menu"
                onLeftPress={openDrawer}
                // onProfilePress={() => router.push('/profile')}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >

                {/* Username, centred */}
                <View style={styles.usernameBox}>
                    <Text style={styles.username} numberOfLines={1}>
                        {username}
                    </Text>

                    {merchantTypeLabel ? (
                        <Text style={styles.usernameSub}>
                            {merchantTypeLabel}
                        </Text>
                    ) : null}
                </View>

                {isLoading ? (
                    <View style={styles.stateContainer}>
                        <ActivityIndicator
                            size="large"
                            color={colors.brand.primary}
                        />

                        <Text style={styles.mutedText}>
                            {t('loadingProfile')}
                        </Text>
                    </View>
                ) : hasError ? (
                    <View style={styles.stateContainer}>
                        <Text style={styles.errorText}>
                            {t('profileLoadFailed')}
                        </Text>

                        <AppButton
                            title={t('tryAgain')}
                            variant="outline"
                            onPress={() => void loadProfile()}
                        />
                    </View>
                ) : profile ? (
                    <>
                        {/* Wallet balances */}
                        <View style={styles.balanceGrid}>
                            <AppCard style={styles.balanceCard}>
                                <Text style={styles.balanceLabel}>
                                    {t('usdBalance')}
                                </Text>

                                <Text
                                    style={styles.balanceValue}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.6}
                                >
                                    {formatAmount(profile.usdBalance)}
                                </Text>
                            </AppCard>

                            <AppCard style={styles.balanceCard}>
                                <Text style={styles.balanceLabel}>
                                    {t('cdfBalance')}
                                </Text>

                                <Text
                                    style={styles.balanceValue}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.6}
                                >
                                    {formatAmount(profile.cdfBalance)}
                                </Text>
                            </AppCard>
                        </View>

                        {/* Details */}
                        <AppCard>
                            {infoRows.map((row, index) => (
                                <View
                                    key={row.key}
                                    style={[
                                        styles.infoRow,
                                        index > 0 && styles.rowDivider,
                                    ]}
                                >
                                    <View style={styles.rowIcon}>
                                        <SymbolView
                                            name={row.icon}
                                            size={18}
                                            tintColor={colors.text.primary}
                                        />
                                    </View>

                                    <View style={styles.rowTextBox}>
                                        <Text style={styles.rowLabel}>
                                            {row.label}
                                        </Text>

                                        <Text style={styles.rowValue}>
                                            {row.value}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </AppCard>

                        {/* Branches, shops and tills under this merchant */}
                        {groups.map((group) => (
                            <View key={group.type} style={styles.dropdownBox}>
                                <DropdownField
                                    label={`${group.title} (${group.items.length})`}
                                    placeholder={group.placeholder}
                                    options={group.items.map((item) => ({
                                        value: item.merchantId,
                                        label:
                                            item.businessName || item.merchantId,
                                    }))}
                                    selectedValue={
                                        selectedSubMerchant?.merchantType ===
                                        group.type
                                            ? selectedId
                                            : ''
                                    }
                                    onSelect={setSelectedId}
                                />
                            </View>
                        ))}

                        {subError ? (
                            <View style={styles.dropdownBox}>
                                <Text style={styles.errorText}>
                                    {t('subMerchantsLoadFailed')}
                                </Text>

                                <AppButton
                                    title={t('tryAgain')}
                                    variant="outline"
                                    onPress={() => void loadSubMerchants()}
                                />
                            </View>
                        ) : null}

                        {/* Everything the server sent for the one picked */}
                        {selectedSubMerchant ? (
                            <View style={styles.dropdownBox}>
                                <SubMerchantCard
                                    subMerchant={selectedSubMerchant}
                                />
                            </View>
                        ) : null}
                    </>
                ) : null}

            </ScrollView>
        </View>
    );
}

// Styles are built from the current colours, so they follow light or dark mode.
const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        screen: {
            flex: 1,
            backgroundColor: colors.background,
        },

        scrollContent: {
            padding: spacing.lg,
            paddingBottom: spacing.xxxl,
        },

        usernameBox: {
            alignItems: 'center',
            marginVertical: spacing.lg,
            gap: spacing.xs,
        },

        username: {
            fontFamily: fontFamilies.bold,
            fontSize: 22,
            color: colors.text.primary,
            textAlign: 'center',
        },

        usernameSub: {
            fontFamily: fontFamilies.medium,
            fontSize: 13,
            color: colors.brand.primary,
        },

        dropdownBox: {
            marginTop: spacing.md,
            gap: spacing.md,
        },

        stateContainer: {
            minHeight: 160,
            justifyContent: 'center',
            alignItems: 'center',
            gap: spacing.md,
        },

        mutedText: {
            fontFamily: fontFamilies.regular,
            fontSize: 13,
            color: colors.text.secondary,
        },

        errorText: {
            fontFamily: fontFamilies.medium,
            fontSize: 13,
            color: colors.status.error,
            textAlign: 'center',
        },

        balanceGrid: {
            flexDirection: 'row',
            gap: spacing.sm,
            marginBottom: spacing.md,
        },

        balanceCard: {
            flex: 1,
            padding: spacing.md,
        },

        balanceLabel: {
            fontFamily: fontFamilies.medium,
            fontSize: 11,
            color: colors.text.secondary,
            textAlign: 'right'
        },

        balanceValue: {
            fontFamily: fontFamilies.bold,
            fontSize: 20,
            color: colors.text.primary,
            marginTop: spacing.sm,
            textAlign: 'right',
        },

        infoRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            paddingVertical: spacing.md,
        },

        rowDivider: {
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },

        rowIcon: {
            width: 36,
            height: 36,
            borderRadius: radius.md,
            backgroundColor: colors.brand.soft,
            alignItems: 'center',
            justifyContent: 'center',
        },

        rowTextBox: {
            flex: 1,
        },

        rowLabel: {
            fontFamily: fontFamilies.regular,
            fontSize: 11,
            color: colors.text.secondary,
        },

        rowValue: {
            fontFamily: fontFamilies.semiBold,
            fontSize: 14,
            color: colors.text.primary,
        },
    });