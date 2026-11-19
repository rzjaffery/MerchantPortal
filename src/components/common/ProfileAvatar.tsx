// src/components/common/ProfileAvatar.tsx
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';

import { useAuth } from '@/context/AuthContext';

import type { AppColors } from '@/theme/colors';
import { useAppTheme, useThemedStyles } from '@/context/ThemeContext';

interface ProfileAvatarProps {
    // Total width and height, including the ring.
    size: number;
}

// The user's picture in a framed circle, or a person icon when there is none.
export default function ProfileAvatar({ size }: ProfileAvatarProps) {
    const { colors } = useAppTheme();
    const styles = useThemedStyles(createStyles);

    const { picture } = useAuth();

    // The ring and the white gap grow with the avatar, so a small
    // avatar in the top bar gets a thin frame and a large one a thicker one.
    const ringWidth = Math.max(2, Math.round(size * 0.035));
    const gap = Math.max(1, Math.round(size * 0.03));

    // The photo's size once the ring and gap are taken out.
    const innerSize = size - (ringWidth + gap) * 2;

    const outerCircle = {
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: ringWidth,
        padding: gap,
    };

    const innerCircle = {
        width: innerSize,
        height: innerSize,
        borderRadius: innerSize / 2,
    };

    return (
        <View style={[styles.frame, outerCircle]}>
            {picture ? (
                <Image
                    source={{ uri: picture }}
                    style={innerCircle}
                    // Fill the circle without stretching the photo.
                    contentFit="cover"
                    // Keep the centre of the photo, where the face usually is.
                    contentPosition="center"
                    transition={150}
                    accessibilityLabel="Profile picture"
                />
            ) : (
                <View style={[styles.placeholder, innerCircle]}>
                    <SymbolView
                        name={{ ios: 'person', android: 'person', web: 'person' }}
                        size={innerSize * 0.5}
                        tintColor={colors.text.secondary}
                    />
                </View>
            )}
        </View>
    );
}

// Styles are built from the current colours, so they follow light or dark mode.
const createStyles = (colors: AppColors) =>
    StyleSheet.create({
        frame: {
            borderColor: colors.brand.primary,
            backgroundColor: colors.surface,
        },

        placeholder: {
            backgroundColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
        },
    });
