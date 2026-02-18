export const colors = {
  light: {
    // Primary green palette (Ramadan theme)
    primary: '#10B981',
    primaryLight: '#34D399',
    primaryDark: '#059669',
    primaryMuted: 'rgba(16, 185, 129, 0.15)',

    // Accent colors
    accent: '#F59E0B',
    accentLight: '#FBBF24',

    // Status colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',

    // Fasting status
    fastingFull: '#10B981',
    fastingHalf: '#F59E0B',
    fastingNone: '#EF4444',

    // Background
    background: '#F0FDF4',
    backgroundSecondary: '#ECFDF5',
    surface: 'rgba(255, 255, 255, 0.7)',
    surfaceSolid: '#FFFFFF',

    // Glass effect
    glass: 'rgba(255, 255, 255, 0.6)',
    glassBorder: 'rgba(255, 255, 255, 0.8)',

    // Text
    text: '#1F2937',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    textOnPrimary: '#FFFFFF',

    // Border
    border: 'rgba(16, 185, 129, 0.2)',
    borderLight: 'rgba(0, 0, 0, 0.05)',

    // Shadow
    shadow: 'rgba(0, 0, 0, 0.1)',

    // Tab bar
    tabBar: 'rgba(255, 255, 255, 0.9)',
    tabBarBorder: 'rgba(16, 185, 129, 0.1)',
  },
  dark: {
    // Primary green palette (Ramadan theme)
    primary: '#10B981',
    primaryLight: '#34D399',
    primaryDark: '#059669',
    primaryMuted: 'rgba(16, 185, 129, 0.2)',

    // Accent colors
    accent: '#F59E0B',
    accentLight: '#FBBF24',

    // Status colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',

    // Fasting status
    fastingFull: '#10B981',
    fastingHalf: '#F59E0B',
    fastingNone: '#EF4444',

    // Background
    background: '#0A1F13',
    backgroundSecondary: '#0F2D1B',
    surface: 'rgba(15, 45, 27, 0.7)',
    surfaceSolid: '#0F2D1B',

    // Glass effect
    glass: 'rgba(15, 45, 27, 0.6)',
    glassBorder: 'rgba(16, 185, 129, 0.3)',

    // Text
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    textMuted: '#9CA3AF',
    textOnPrimary: '#FFFFFF',

    // Border
    border: 'rgba(16, 185, 129, 0.3)',
    borderLight: 'rgba(255, 255, 255, 0.1)',

    // Shadow
    shadow: 'rgba(0, 0, 0, 0.3)',

    // Tab bar
    tabBar: 'rgba(15, 45, 27, 0.95)',
    tabBarBorder: 'rgba(16, 185, 129, 0.2)',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 41,
  },
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  title2: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 25,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  callout: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 21,
  },
  subhead: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
};

export type ThemeColors = typeof colors.light;
export type ColorScheme = 'light' | 'dark';
