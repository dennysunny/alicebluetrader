import { useColorScheme } from 'react-native';
import { useMemo } from 'react';
import { Colors, Typography, Spacing, Radius, Shadow } from '../constants/theme';

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
        primary: Colors.primary,
        primaryDark: Colors.primaryDark,
        primaryLight: Colors.primaryLight,
        primaryMuted: Colors.primaryMuted,
        profit: Colors.profit,
        loss: Colors.loss,
        warning: Colors.warning,
        info: Colors.info,
      },
      typography: Typography,
      spacing: Spacing,
      radius: Radius,
      shadow: Shadow,
    };
  }, [mode]);

  return theme;
}

export type AppTheme = ReturnType<typeof useTheme>;
