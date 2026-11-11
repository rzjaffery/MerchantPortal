
/**
 * Merchant Portal Design System
 * Spacing, dimensions, radii and elevation.
 */

// Consistent spacing scale (4-point system)
export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 40,
    massive: 48,
} as const;

// Rounded corner sizes
export const radius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 999,
} as const;

// Standard component dimensions
export const dimensions = {
    buttonHeight: 54,
    inputHeight: 54,
    iconButtonSize: 44,
    avatarSize: 52,
} as const;

// Card shadow
export const elevation = {
    card: {
        shadowColor: '#171A21',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
} as const;
