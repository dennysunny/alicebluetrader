import { useColorScheme } from 'react-native';
import { useMemo } from 'react';
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadow,
  Margin,
  Padding,
  FlexTypes,
} from '../constants/theme';

// ============================================================
// THEME HOOK
// ============================================================

type ThemeMode = 'dark' | 'light';

export function useTheme() {
  const systemScheme = useColorScheme();
  const mode: ThemeMode = systemScheme === 'light' ? 'light' : 'dark';

  const theme = useMemo(() => {
    const palette = mode === 'dark' ? Colors.dark : Colors.light;

    return {
      mode,
      isDark: mode === 'dark',
      colors: {
        ...palette,
      },
      typography: Typography,
      spacing: Spacing,
      radius: Radius,
      shadow: Shadow,
      margin: Margin,
      padding: Padding,
      flexTypes: FlexTypes,
    };
  }, [mode]);

  return theme;
}

export type AppTheme = ReturnType<typeof useTheme>;
