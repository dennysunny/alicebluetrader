import { BlurIntensity } from '../types';

export const Colors = {
  dark: {
    background: '#060A12',
    backgroundGradientTop: '#0B1424',
    backgroundGradientBottom: '#05080F',

    surface: 'rgba(255,255,255,0.03)',
    surfaceElevated: 'rgba(255,255,255,0.06)',
    surfaceHighlight: 'rgba(255, 255, 255, 0.12)',
    surfaceStrong: 'rgba(255, 255, 255, 0.16)',

    border: 'rgba(255, 255, 255, 0.08)',
    borderFaint: 'rgba(255, 255, 255, 0.04)',
    borderStrong: 'rgba(255, 255, 255, 0.16)',

    text: 'rgba(255, 255, 255, 0.96)',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    textMuted: 'rgba(255, 255, 255, 0.35)',
    textInverse: '#060A12',

    tabBar: 'rgba(8, 12, 20, 0.95)',
    header: 'rgba(6, 10, 18, 0.9)',

    inputBg: 'rgba(255, 255, 255, 0.06)',
    inputBorder: 'rgba(255, 255, 255, 0.1)',
    inputFocus: '#3EE6B0',

    fallback: '#0E1623',

    primary: '#3EE6B0',
    primaryDark: '#1FCF95',
    primaryLight: '#7EF0CC',
    primaryMuted: 'rgba(62, 230, 176, 0.12)',

    profit: '#22C55E',
    loss: '#FF5C5C',
    warning: '#FFD166',
    info: '#3B82F6',
  },

  light: {
    background: '#F7F9FC',
    backgroundGradientTop: '#FFFFFF',
    backgroundGradientBottom: '#EEF2F7',

    surface: 'rgba(255,255,255,0.5)',
    surfaceElevated: 'rgba(255,255,255,0.7)',
    surfaceHighlight: 'rgba(255, 255, 255, 0.95)',
    surfaceStrong: '#FFFFFF',

    border: 'rgba(0, 0, 0, 0.06)',
    borderFaint: 'rgba(0, 0, 0, 0.03)',
    borderStrong: 'rgba(0, 0, 0, 0.12)',

    text: 'rgba(15, 23, 42, 0.95)',
    textSecondary: 'rgba(15, 23, 42, 0.55)',
    textMuted: 'rgba(15, 23, 42, 0.35)',
    textInverse: '#FFFFFF',

    tabBar: 'rgba(255, 255, 255, 0.95)',
    header: 'rgba(247, 249, 252, 0.9)',

    inputBg: 'rgba(255, 255, 255, 0.9)',
    inputBorder: 'rgba(0, 0, 0, 0.08)',
    inputFocus: '#10B981',

    fallback: '#FFFFFF',

    primary: '#10B981',
    primaryDark: '#059669',
    primaryLight: '#6EE7B7',
    primaryMuted: 'rgba(16, 185, 129, 0.12)',

    profit: '#16A34A',
    loss: '#DC2626',
    warning: '#F59E0B',
    info: '#2563EB',
  },
} as const;

export const Typography = {
  fontRegular: 'System',
  fontMedium: 'System',
  fontSemiBold: 'System',
  fontBold: 'System',
  fontMono: 'Menlo',

  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 19,
  xl: 21,
  '2xl': 26,
  '3xl': 30,
  '4xl': 34,
  '5xl': 42,

  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,

  600: '600',
  700: '700',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  '2xl': 28,
  full: 999,
} as const;

export const Margin = {
  xs: 2,
  sm: 4,
  md: 8,
}

export const Padding = {
  xs: 2,
  sm: 4,
  md: 8,
}

export const FlexTypes = {
  row: 'row',
  column: 'column',
  center: 'center',
  spaceBetween: 'space-between',
  flexEnd: 'flex-end',
}

export const getColorIntensity = (
  intensity: BlurIntensity,
  IsDark: boolean,
) => {
  const opacity = {
    [BlurIntensity.Lowest]: 0.1,
    [BlurIntensity.Low]: 0.3,
    [BlurIntensity.Medium]: 0.5,
    [BlurIntensity.High]: 0.7,
    [BlurIntensity.Highest]: 0.9,
  }[intensity];
  if (IsDark) {
    return `rgba(2, 2, 2, ${opacity})`;
  } else {
    return `rgba(238, 240, 245, ${opacity})`;
  }
};

// Frosted glass shadow — softer, more diffuse than before
export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 8,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 14,
  },
  // Glow shadow for primary elements
  glow: {
    shadowColor: '#32D4A4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
