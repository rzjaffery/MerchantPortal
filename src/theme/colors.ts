// src/theme/colors.ts

// The shape every colour palette must have.
// Light and dark use the same names, so screens never need to know which is active.
export interface AppColors {
    brand: {
        primary: string;
        pressed: string;
        soft: string;
        onPrimary: string;
    };

    background: string;
    appBar: string;
    surface: string;
    navigation: string;

    text: {
        primary: string;
        secondary: string;
        inverse: string;
    };

    border: string;

    status: {
        success: string;
        error: string;
        warning: string;
    };
}

export const lightColors: AppColors = {
    // Brand colors
    brand: {
        primary: '#FFB713',
        pressed: '#E6A100',
        soft: '#FFF4D6',
        onPrimary: '#171A21',
    },

    // Application backgrounds
    background: '#F3F4F6',
    appBar: '#5F676B',
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
};

export const darkColors: AppColors = {
    // The brand yellow stays the same, with dark text on it.
    brand: {
        primary: '#FFB713',
        pressed: '#E6A100',
        soft: '#3A2E0F',
        onPrimary: '#171A21',
    },

    background: '#121417',
    appBar: '#2A2F35',
    surface: '#1C1F24',
    navigation: '#24282E',

    text: {
        primary: '#F2F4F7',
        secondary: '#9AA3AF',
        inverse: '#FFFFFF',
    },

    border: '#2E333A',

    // Lighter shades, so they stay readable on a dark background.
    status: {
        success: '#3DBE8B',
        error: '#F06A6A',
        warning: '#E0A847',
    },
};
