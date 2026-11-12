// src/theme/paperTheme.ts
import {
    MD3LightTheme,
    configureFonts,
    type MD3Theme,
} from 'react-native-paper';

import { colors } from '@/theme/colors';
import { fontFamilies } from '@/theme/typography';

// Tells React Native Paper to use our brand colours and Montserrat.
export const paperTheme: MD3Theme = {
    ...MD3LightTheme,

    fonts: configureFonts({
        config: { fontFamily: fontFamilies.regular },
    }),

    colors: {
        ...MD3LightTheme.colors,
        primary: colors.brand.primary,
        onPrimary: colors.brand.onPrimary,
        primaryContainer: colors.brand.soft,
        onPrimaryContainer: colors.text.primary,
        secondaryContainer: colors.brand.soft,
        onSecondaryContainer: colors.text.primary,
        background: colors.background,
        surface: colors.surface,
        onSurface: colors.text.primary,
        onSurfaceVariant: colors.text.secondary,
        outline: colors.border,
        error: colors.status.error,
    },
};