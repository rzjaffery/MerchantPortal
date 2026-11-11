export const fontFamilies = {
    regular: 'Montserrat_400Regular',
    medium: 'Montserrat_500Medium',
    semiBold: 'Montserrat_600SemiBold',
    bold: 'Montserrat_700Bold',
} as const;

export const typography = {
    display: {
        fontFamily: fontFamilies.bold,
        fontSize: 32,
        lineHeight: 40,
        letterSpacing: -0.5,
    },

    heading1: {
        fontFamily: fontFamilies.bold,
        fontSize: 28,
        lineHeight: 36,
    },

    heading2: {
        fontFamily: fontFamilies.semiBold,
        fontSize: 22,
        lineHeight: 30,
    },

    heading3: {
        fontFamily: fontFamilies.semiBold,
        fontSize: 18,
        lineHeight: 26,
    },

    body: {
        fontFamily: fontFamilies.regular,
        fontSize: 15,
        lineHeight: 23,
    },

    bodyMedium: {
        fontFamily: fontFamilies.medium,
        fontSize: 15,
        lineHeight: 23,
    },

    label: {
        fontFamily: fontFamilies.semiBold,
        fontSize: 14,
        lineHeight: 20,
    },

    caption: {
        fontFamily: fontFamilies.regular,
        fontSize: 12,
        lineHeight: 18,
    },

    button: {
        fontFamily: fontFamilies.semiBold,
        fontSize: 15,
        lineHeight: 20,
    },
} as const;