export const colors = {
  light: {
    // Primary green (Islamic/Ramadan)
    primary: '#22C55E',
    primaryLight: '#4ADE80',
    primaryDark: '#16A34A',
    primaryMuted: 'rgba(34, 197, 94, 0.12)',

    // Category colors — each tracker has its own colour identity
    fastingColor: '#22C55E',
    fastingMuted: 'rgba(34, 197, 94, 0.12)',
    prayerColor: '#A855F7',
    prayerMuted: 'rgba(168, 85, 247, 0.12)',
    rewardColor: '#F97316',
    rewardMuted: 'rgba(249, 115, 22, 0.12)',
    sunatColor: '#06B6D4',
    sunatMuted: 'rgba(6, 182, 212, 0.12)',
    quranColor: '#3B82F6',
    quranMuted: 'rgba(59, 130, 246, 0.12)',
    doaColor: '#EC4899',
    doaMuted: 'rgba(236, 72, 153, 0.12)',

    // Accent
    accent: '#F97316',
    accentLight: '#FB923C',

    // Status
    success: '#22C55E',
    warning: '#F97316',
    error: '#EF4444',

    // Fasting status pills
    fastingFull: '#22C55E',
    fastingHalf: '#F97316',
    fastingNone: '#EF4444',

    // Background — white with soft pastel gradient
    background: '#FFFFFF',
    backgroundSecondary: '#F8FAFF',
    backgroundGradient: ['#F0FFF4', '#FFFFFF', '#FFF8F0'] as const,

    // Glass card surface
    surface: 'rgba(255, 255, 255, 0.85)',
    surfaceSolid: '#FFFFFF',
    glass: 'rgba(255, 255, 255, 0.80)',
    glassBorder: 'rgba(255, 255, 255, 0.95)',
    glassShadow: 'rgba(0, 0, 0, 0.07)',

    // Text
    text: '#1A1A2E',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    textOnPrimary: '#FFFFFF',

    // Border
    border: 'rgba(0, 0, 0, 0.08)',
    borderLight: 'rgba(0, 0, 0, 0.04)',

    // Shadow
    shadow: 'rgba(0, 0, 0, 0.08)',

    // Tab bar — Telegram-style flat white
    tabBar: '#FFFFFF',
    tabBarBorder: 'rgba(0, 0, 0, 0.07)',
    tabActive: '#22C55E',
    tabInactive: '#94A3B8',
  },
  dark: {
    primary: '#4ADE80',
    primaryLight: '#6EE7A0',
    primaryDark: '#22C55E',
    primaryMuted: 'rgba(74, 222, 128, 0.15)',

    fastingColor: '#4ADE80',
    fastingMuted: 'rgba(74, 222, 128, 0.15)',
    prayerColor: '#C084FC',
    prayerMuted: 'rgba(192, 132, 252, 0.15)',
    rewardColor: '#FB923C',
    rewardMuted: 'rgba(251, 146, 60, 0.15)',
    sunatColor: '#22D3EE',
    sunatMuted: 'rgba(34, 211, 238, 0.15)',
    quranColor: '#60A5FA',
    quranMuted: 'rgba(96, 165, 250, 0.15)',
    doaColor: '#F472B6',
    doaMuted: 'rgba(244, 114, 182, 0.15)',

    accent: '#FB923C',
    accentLight: '#FDBA74',

    success: '#4ADE80',
    warning: '#FB923C',
    error: '#F87171',

    fastingFull: '#4ADE80',
    fastingHalf: '#FB923C',
    fastingNone: '#F87171',

    background: '#0F172A',
    backgroundSecondary: '#1E293B',
    backgroundGradient: ['#0F172A', '#1E293B', '#162032'] as const,

    surface: 'rgba(30, 41, 59, 0.85)',
    surfaceSolid: '#1E293B',
    glass: 'rgba(30, 41, 59, 0.80)',
    glassBorder: 'rgba(74, 222, 128, 0.20)',
    glassShadow: 'rgba(0, 0, 0, 0.30)',

    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textOnPrimary: '#FFFFFF',

    border: 'rgba(255, 255, 255, 0.08)',
    borderLight: 'rgba(255, 255, 255, 0.04)',

    shadow: 'rgba(0, 0, 0, 0.30)',

    tabBar: '#0F172A',
    tabBarBorder: 'rgba(255, 255, 255, 0.07)',
    tabActive: '#4ADE80',
    tabInactive: '#64748B',
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
  xxl: 24,
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
