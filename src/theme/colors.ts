
export const colors = {
    // Brand colors
    brand: {
        primary: '#FFB713',
        pressed: '#E6A100',
        soft: '#FFF4D6',
        onPrimary: '#171A21',
    },

    // Application backgrounds
    background: '#F5F9FF',
    surface: '#FFFFFF',
    navigation: '#E9EDF3',

    // Text colors
    text: {
        primary: '#171A21',
        secondary: '#788292',
        inverse: '#FFFFFF',
    },

    // Borders and dividers
    border: '#E4EAF2',

    // Feedback colors
    status: {
        success: '#16865B',
        error: '#D64545',
        warning: '#B7791F',
    },
} as const;

export type ColorTokens = typeof colors;
