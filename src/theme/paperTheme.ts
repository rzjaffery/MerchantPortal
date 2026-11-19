// src/theme/paperTheme.ts
import {
    MD3DarkTheme,
    MD3LightTheme,
    configureFonts,
    type MD3Theme,
} from 'react-native-paper';

import type { AppColors } from '@/theme/colors';
import { fontFamilies } from '@/theme/typography';

// Tells React Native Paper to use our brand colours and Montserrat,
// starting from Paper's own light or dark theme.
export function createPaperTheme(colors: AppColors, isDark: boolean): MD3Theme {
    const base = isDark ? MD3DarkTheme : MD3LightTheme;

    return {
        ...base,
        dark: isDark,

        fonts: configureFonts({
            config: { fontFamily: fontFamilies.regular },
        }),

        colors: {
            ...base.colors,
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
}
