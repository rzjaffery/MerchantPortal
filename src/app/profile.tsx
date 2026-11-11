
import { useState } from 'react';

import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import AppButton from '@/components/common/AppButton';
import AppCard from '@/components/common/AppCard';
import AppInput from '@/components/common/AppInput';

import { useAuth } from '@/context/AuthContext';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/metrics';
import { fontFamilies } from '@/theme/typography';

export default function ProfileScreen() {
    const router = useRouter();

    const { user, signOut } = useAuth();

    const [isEditing, setIsEditing] = useState(false);
    const [fullName, setFullName] = useState(
        user?.fullName ?? 'Merchant'
    );
    const [draftName, setDraftName] = useState(fullName);

    const [nameError, setNameError] = useState('');
    const [feedback, setFeedback] = useState('');
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const initials = fullName
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');

    function handleEdit() {
        setDraftName(fullName);
        setNameError('');
        setFeedback('');
        setIsEditing(true);
    }

    function handleSave() {
        const cleanName = draftName.trim();

        if (!cleanName) {
            setNameError('Name cannot be empty.');
            return;
        }

        setFullName(cleanName);
        setIsEditing(false);
        setNameError('');

        setFeedback(
            'Your profile changes have been updated locally.'
        );
    }

    async function handleLogout() {
        setIsLoggingOut(true);
        setFeedback('');

        try {
            await signOut();
            router.replace('/login');
        } catch (error) {
            console.warn('Logout failed:', error);

            setIsLoggingOut(false);
            setFeedback('Unable to log out. Please try again.');
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                {/* Header */}
                <View style={styles.header}>
                    <Pressable
                        onPress={() => router.replace('/dashboard')}
                        style={styles.backButton}
                        accessibilityRole="button"
                        accessibilityLabel="Back to dashboard"
                    >
                        <Text style={styles.backArrow}>‹</Text>
                    </Pressable>

                    <Text style={styles.headerTitle}>
                        My Profile
                    </Text>

                    <View style={styles.headerSpacer} />
                </View>

                {/* Profile Identity */}
                <View style={styles.identitySection}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {initials || 'M'}
                        </Text>
                    </View>

                    <Text style={styles.name}>
                        {fullName}
                    </Text>

                    <Text style={styles.email}>
                        {user?.email ?? 'Email unavailable'}
                    </Text>

                    <View style={styles.statusBadge}>
                        <View style={styles.statusDot} />

                        <Text style={styles.statusText}>
                            {user?.status ?? 'UNKNOWN'}
                        </Text>
                    </View>
                </View>

                {/* Account Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Account Information
                    </Text>

                    <AppCard>
                        <InfoRow
                            label="Full Name"
                            value={fullName}
                        />

                        <View style={styles.divider} />

                        <InfoRow
                            label="Email Address"
                            value={user?.email ?? 'Not available'}
                        />

                        <View style={styles.divider} />

                        <InfoRow
                            label="Account Role"
                            value={user?.role ?? 'MERCHANT'}
                        />

                        <View style={styles.divider} />

                        <InfoRow
                            label="Account Status"
                            value={user?.status ?? 'UNKNOWN'}
                        />
                    </AppCard>
                </View>

                {/* Edit Profile */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Profile Settings
                    </Text>

                    {isEditing ? (
                        <AppCard style={styles.editCard}>
                            <AppInput
                                label="Full Name"
                                value={draftName}
                                onChangeText={(value) => {
                                    setDraftName(value);
                                    setNameError('');
                                }}
                                placeholder="Enter your full name"
                                autoCapitalize="words"
                                error={nameError}
                            />

                            <AppButton
                                title="Save Changes"
                                onPress={handleSave}
                            />

                            <View style={styles.cancelButton}>
                                <AppButton
                                    title="Cancel"
                                    variant="outline"
                                    onPress={() => {
                                        setIsEditing(false);
                                        setNameError('');
                                    }}
                                />
                            </View>
                        </AppCard>
                    ) : (
                        <AppButton
                            title="Edit Profile"
                            variant="outline"
                            onPress={handleEdit}
                        />
                    )}
                </View>

                {/* Feedback */}
                {feedback ? (
                    <View style={styles.feedbackBox}>
                        <Text style={styles.feedbackText}>
                            {feedback}
                        </Text>
                    </View>
                ) : null}

                {/* Logout */}
                <View style={styles.logoutSection}>
                    <Pressable
                        onPress={handleLogout}
                        disabled={isLoggingOut}
                        accessibilityRole="button"
                        style={[
                            styles.logoutButton,
                            isLoggingOut && styles.disabledButton,
                        ]}
                    >
                        <Text style={styles.logoutText}>
                            {isLoggingOut ? 'Logging out...' : 'Log Out'}
                        </Text>
                    </Pressable>
                </View>

                <Text style={styles.footer}>
                    Merchant Portal V0.1
                </Text>

            </ScrollView>
        </SafeAreaView>
    );
}

interface InfoRowProps {
    label: string;
    value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
                {label}
            </Text>

            <Text style={styles.infoValue}>
                {value}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },

    scrollContent: {
        padding: spacing.xl,
        paddingBottom: spacing.xxxl,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xxxl,
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },

    backArrow: {
        fontSize: 30,
        lineHeight: 34,
        color: colors.text.primary,
    },

    headerTitle: {
        fontFamily: fontFamilies.bold,
        fontSize: 19,
        color: colors.text.primary,
    },

    headerSpacer: {
        width: 42,
    },

    identitySection: {
        alignItems: 'center',
        marginBottom: spacing.xxxl,
    },

    avatar: {
        width: 88,
        height: 88,
        borderRadius: radius.full,
        backgroundColor: colors.brand.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },

    avatarText: {
        fontFamily: fontFamilies.bold,
        fontSize: 29,
        color: colors.brand.onPrimary,
    },

    name: {
        fontFamily: fontFamilies.bold,
        fontSize: 22,
        color: colors.text.primary,
    },

    email: {
        fontFamily: fontFamilies.regular,
        fontSize: 13,
        color: colors.text.secondary,
        marginTop: spacing.sm,
    },

    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E5F5ED',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radius.full,
        marginTop: spacing.md,
        gap: spacing.sm,
    },

    statusDot: {
        width: 7,
        height: 7,
        borderRadius: radius.full,
        backgroundColor: colors.status.success,
    },

    statusText: {
        fontFamily: fontFamilies.semiBold,
        fontSize: 10,
        color: colors.status.success,
    },

    section: {
        marginBottom: spacing.xxl,
    },

    sectionTitle: {
        fontFamily: fontFamilies.bold,
        fontSize: 16,
        color: colors.text.primary,
        marginBottom: spacing.md,
    },

    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        gap: spacing.md,
    },

    infoLabel: {
        fontFamily: fontFamilies.regular,
        fontSize: 12,
        color: colors.text.secondary,
        flexShrink: 1,
    },

    infoValue: {
        fontFamily: fontFamilies.semiBold,
        fontSize: 12,
        color: colors.text.primary,
        textAlign: 'right',
        flexShrink: 1,
    },

    divider: {
        height: 1,
        backgroundColor: colors.border,
    },

    editCard: {
        gap: spacing.md,
    },

    cancelButton: {
        marginTop: spacing.sm,
    },

    feedbackBox: {
        padding: spacing.lg,
        borderRadius: radius.md,
        backgroundColor: colors.brand.soft,
        marginBottom: spacing.xl,
    },

    feedbackText: {
        fontFamily: fontFamilies.regular,
        fontSize: 12,
        lineHeight: 19,
        color: colors.text.primary,
    },

    logoutSection: {
        marginTop: spacing.sm,
    },

    logoutButton: {
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF0F0',
        borderWidth: 1,
        borderColor: '#F2CECE',
        borderRadius: radius.lg,
    },

    logoutText: {
        fontFamily: fontFamilies.semiBold,
        fontSize: 15,
        color: colors.status.error,
    },

    disabledButton: {
        opacity: 0.5,
    },

    footer: {
        textAlign: 'center',
        fontFamily: fontFamilies.regular,
        fontSize: 11,
        color: colors.text.secondary,
        marginTop: spacing.xxl,
    },
});
