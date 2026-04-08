export const Colors = {
  // Brand — softer, more Apple-like teal
  // primary: '#42b895',
  // primaryDark: '#25A882',
  // primaryLight: '#5EDEBC',
  // primaryMuted: 'rgba(50, 212, 164, 0.15)',

  // profit: '#289443', // Apple green
  // loss: '#FF453A', // Apple red
  // warning: '#FFD60A', // Apple yellow
  // info: '#0A84FF', // Apple blue

  dark: {
    // Deep navy-black base — not pure black, more like iOS dark
    background: '#080C14',
    backgroundGradientTop: '#0D1526',
    backgroundGradientBottom: '#070A10',

    // Frosted glass surfaces — semi-transparent white over dark
    surface: 'rgba(255, 255, 255, 0.06)',
    surfaceElevated: 'rgba(255, 255, 255, 0.10)',
    surfaceHighlight: 'rgba(255, 255, 255, 0.14)',
    surfaceStrong: 'rgba(255, 255, 255, 0.18)',

    // Borders — very subtle white lines like iOS
    border: 'rgba(255, 255, 255, 0.10)',
    borderFaint: 'rgba(255, 255, 255, 0.05)',
    borderStrong: 'rgba(255, 255, 255, 0.18)',

    // Typography — pure whites with varying opacity
    text: 'rgba(255, 255, 255, 0.95)',
    textSecondary: 'rgba(255, 255, 255, 0.55)',
    textMuted: 'rgb(81, 83, 79)',
    textInverse: '#080C14',

    tabBar: 'rgba(10, 14, 22, 1)',
    header: 'rgba(8, 12, 20, 0.92)',

    inputBg: 'rgba(255, 255, 255, 0.07)',
    inputBorder: 'rgba(255, 255, 255, 0.12)',
    inputFocus: '#32D4A4',

    fallback: '#121820',

    primary: '#42b895',
    primaryDark: '#25A882',
    primaryLight: '#5EDEBC',
    primaryMuted: 'rgba(50, 212, 164, 0.15)',

    profit: '#289443',
    loss: '#FF453A',
    warning: '#FFD60A',
    info: '#0A84FF',
  },

  light: {
    background: '#F2F4F8',
    backgroundGradientTop: 'rgb(238, 241, 247)',
    backgroundGradientBottom: '#F6F8FB',

    // Frosted glass — semi-transparent white, iOS vibrancy style
    surface: 'rgba(255, 255, 255, 0.72)',
    surfaceElevated: 'rgba(255, 255, 255, 0.88)',
    surfaceHighlight: 'rgba(255, 255, 255, 0.95)',
    surfaceStrong: '#FFFFFF',

    border: 'rgba(0, 0, 0, 0.07)',
    borderFaint: 'rgba(0, 0, 0, 0.04)',
    borderStrong: 'rgba(0, 0, 0, 0.14)',

    text: 'rgba(0, 0, 0, 0.90)',
    textSecondary: 'rgba(0, 0, 0, 0.50)',
    textMuted: 'rgba(0, 0, 0, 0.30)',
    textInverse: '#FFFFFF',

    tabBar: 'rgba(255, 255, 255, 1)',
    header: 'rgba(242, 244, 248, 0.92)',

    inputBg: 'rgba(255, 255, 255, 0.80)',
    inputBorder: 'rgba(0, 0, 0, 0.10)',
    inputFocus: '#065940',

    fallback: '#FFFFFF',

    primary: '#027c57',
    primaryDark: '#06b986',
    primaryLight: '#046148',
    primaryMuted: 'rgba(50, 212, 164, 0.15)',

    profit: '#074016',
    loss: '#b8170f',
    warning: '#ae9205',
    info: '#0553a1',
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

export const getColorIntensity = (
  intensity: 'lowest' | 'low' | 'medium' | 'high' | 'highest',
  IsDark: boolean,
) => {
  const opacity = {
    lowest: 0.1,
    low: 0.3,
    medium: 0.5,
    high: 0.7,
    highest: 0.9,
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
