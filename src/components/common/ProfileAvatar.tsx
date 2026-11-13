// src/components/common/ProfileAvatar.tsx
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';

import { useAuth } from '@/context/AuthContext';

import { colors } from '@/theme/colors';

interface ProfileAvatarProps {
    // Width and height of the circle.
    size: number;
}

// The user's picture in a circle, or a person icon when there is none.
export default function ProfileAvatar({ size }: ProfileAvatarProps) {
    const { picture } = useAuth();

    const circle = {
        width: size,
        height: size,
        borderRadius: size / 2,
    };

    if (picture) {
        return (
            <Image
                source={{ uri: picture }}
                style={circle}
                contentFit="cover"
                accessibilityLabel="Profile picture"
            />
        );
    }

    return (
        <View style={[styles.placeholder, circle]}>
            <SymbolView
                name={{ ios: 'person', android: 'person', web: 'person' }}
                size={size * 0.5}
                tintColor={colors.text.secondary}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    placeholder: {
        backgroundColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
});