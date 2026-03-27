export const Colors = {
  // Brand
  primary: '#00D09C',
  primaryDark: '#00A87D',
  primaryLight: '#33DAAD',
  primaryMuted: 'rgba(0, 208, 156, 0.12)',

  // Semantic
  profit: '#00D09C',
  loss: '#FF4D4D',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Dark theme (default)
  dark: {
    background: '#0A0E14',
    surface: '#121820',
    surfaceElevated: '#1A2332',
    surfaceHighlight: '#1F2D3D',
    border: '#1E2C3A',
    borderFaint: '#151F2B',

    text: '#E8EDF3',
    textSecondary: '#7A8FA6',
    textMuted: '#4A5E6E',
    textInverse: '#0A0E14',

    tabBar: '#0D1219',
    header: '#0A0E14',

    inputBg: '#161E28',
    inputBorder: '#1E2C3A',
    inputFocus: '#00D09C',
  },

  // Light theme
  // light: {
  //   background: '#F5F7FA',
  //   surface: '#FFFFFF',
  //   surfaceElevated: '#FFFFFF',
  //   surfaceHighlight: '#EFF3F8',
  //   border: '#E2E8F0',
  //   borderFaint: '#F1F5F9',

  //   text: '#0D1219',
  //   textSecondary: '#64748B',
  //   textMuted: '#94A3B8',
  //   textInverse: '#FFFFFF',

  //   tabBar: '#FFFFFF',
  //   header: '#FFFFFF',

  //   inputBg: '#F8FAFC',
  //   inputBorder: '#E2E8F0',
  //   inputFocus: '#00D09C',
  // },
  light: {
    background: '#F3F5F8',
    surface: '#FAFBFC',
    surfaceElevated: '#FFFFFF',
    surfaceHighlight: '#F0F4F8',

    border: '#D8E0EA',
    borderFaint: '#E9EEF5',

    text: '#0F172A',
    textSecondary: '#5B6B7C',
    textMuted: '#8A9AA9',
    textInverse: '#FFFFFF',

    tabBar: '#FAFBFC',
    header: '#F3F5F8',

    inputBg: '#F6F8FB',
    inputBorder: '#D8E0EA',
    inputFocus: '#00D09C',
  }
} as const;

export const Typography = {
  // Font families
  fontRegular: 'System',
  fontMedium: 'System',
  fontSemiBold: 'System',
  fontBold: 'System',
  fontMono: 'Courier New',

  // Font sizes
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,

  // Line heights
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
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
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 20,
    elevation: 10,
  },
} as const;
