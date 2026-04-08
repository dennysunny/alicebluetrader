import { BlurView } from '@react-native-community/blur';
import React, { memo } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { getColorIntensity } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { BlurIntensity, GlowType } from '../../types';

// ============================================================
// GLASS CARD — the core frosted glass primitive
// ============================================================

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  intensity?: BlurIntensity;
  glow?: GlowType;
}

export const GlassCard = memo(function GlassCard({
  children,
  style,
  onPress,
  intensity = BlurIntensity.Lowest,
}: GlassCardProps) {
  const { radius, shadow, isDark, colors } = useTheme();
  const s = styles(radius, colors, shadow, isDark);

  const content = (
    <View style={[s.container, style]}>
      <BlurView
        style={s.blur}
        blurType={isDark ? 'dark' : 'light'}
        blurAmount={Platform.OS === 'ios' ? 24 : 16}
        reducedTransparencyFallbackColor={colors.fallback}
      />

      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: getColorIntensity(intensity, isDark) },
        ]}
      />

      <View style={s.borderGlow} />

      <View style={s.content}>{children}</View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.82}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
});

// Keep Card as alias for backward compat
export const Card = GlassCard;

// ============================================================
// BUTTON
// ============================================================

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export const Button = memo(function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  fullWidth = false,
}: ButtonProps) {
  const { colors, radius, typography, shadow } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const config: Record<
    string,
    { bg: string; text: string; border?: string; shadow?: object }
  > = {
    primary: {
      bg: colors.primary,
      text: colors.textInverse,
      shadow: shadow.glow,
    },
    secondary: {
      bg: colors.surfaceElevated,
      text: colors.text,
      border: colors.border,
    },
    danger: {
      bg: `${colors.loss}22`,
      text: colors.loss,
      border: `${colors.loss}40`,
    },
    ghost: {
      bg: 'transparent',
      text: colors.primary,
      border: `${colors.primary}50`,
    },
  };

  const c = config[variant];
  const height = { sm: 38, md: 50, lg: 56 }[size];
  const fontSize = {
    sm: typography.sm,
    md: typography.base,
    lg: typography.md,
  }[size];

  return (
    <Animated.View style={[animStyle, fullWidth && { width: '100%' }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 18 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 18 });
        }}
        disabled={disabled || loading}
        activeOpacity={1}
        style={[
          {
            height,
            backgroundColor: c.bg,
            borderRadius: radius.lg,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 24,
            opacity: disabled ? 0.4 : 1,
            borderWidth: c.border ? 1 : 0,
            borderColor: c.border ?? 'transparent',
            ...(variant === 'primary' ? c.shadow : {}),
          },
          style,
        ]}
      >
        {/* Top shimmer on primary */}
        {variant === 'primary' && !loading && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: '15%',
              right: '15%',
              height: '50%',
              backgroundColor: 'rgba(255,255,255,0.18)',
              borderBottomLeftRadius: 999,
              borderBottomRightRadius: 999,
            }}
          />
        )}
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' ? colors.textInverse : colors.primary}
          />
        ) : (
          <Text
            style={{
              color: c.text,
              fontSize,
              fontWeight: '600',
              letterSpacing: 0.2,
              zIndex: 1,
            }}
          >
            {label}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

// ============================================================
// INPUT
// ============================================================

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  suffix?: React.ReactNode | string;
  prefix?: string;
}

export const Input = memo(function Input({
  label,
  error,
  suffix,
  prefix,
  style,
  ...rest
}: InputProps) {
  const { colors, typography, radius, spacing } = useTheme();

  return (
    <View style={{ gap: 7 }}>
      {label && (
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.sm,
            fontWeight: '500',
            letterSpacing: 0.3,
          }}
        >
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.inputBg,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: error ? colors.loss : colors.inputBorder,
          paddingHorizontal: spacing.md,
          height: 52,
        }}
      >
        {prefix && (
          <Text
            style={{
              color: colors.textSecondary,
              marginRight: 8,
              fontSize: typography.md,
              fontWeight: '300',
            }}
          >
            {prefix}
          </Text>
        )}
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[
            {
              flex: 1,
              color: colors.text,
              fontSize: typography.md,
              fontWeight: '400',
              padding: 0,
            },
            style as TextStyle,
          ]}
          {...rest}
        />
        {suffix &&
          (typeof suffix === 'string' ? (
            <Text
              style={{
                color: colors.textMuted,
                marginLeft: 8,
                fontSize: typography.sm,
              }}
            >
              {suffix}
            </Text>
          ) : (
            suffix
          ))}
      </View>
      {error && (
        <Text
          style={{ color: colors.loss, fontSize: typography.xs, marginLeft: 4 }}
        >
          {error}
        </Text>
      )}
    </View>
  );
});

// ============================================================
// BADGE
// ============================================================

interface BadgeProps {
  label: string;
  color?: string;
  bgColor?: string;
  size?: 'sm' | 'md';
}

export const Badge = memo(function Badge({
  label,
  color,
  bgColor,
  size = 'sm',
}: BadgeProps) {
  const { colors, typography, radius } = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: size === 'sm' ? 7 : 11,
        paddingVertical: size === 'sm' ? 2 : 5,
        borderRadius: radius.full,
        backgroundColor: bgColor ?? colors.surfaceElevated,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
      }}
    >
      <Text
        style={{
          color: color ?? colors.textSecondary,
          fontSize: size === 'sm' ? typography.xs : typography.sm,
          fontWeight: '500',
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </View>
  );
});

// ============================================================
// PNL TEXT
// ============================================================

interface PnlTextProps {
  value: number;
  style?: TextStyle;
  showSign?: boolean;
  format?: (v: number) => string;
}

export const PnlText = memo(function PnlText({
  value,
  style,
  showSign = true,
  format,
}: PnlTextProps) {
  const { colors } = useTheme();
  const isProfit = value >= 0;
  const color = isProfit ? colors.profit : colors.loss;
  const text = format
    ? format(value)
    : `${showSign && isProfit ? '+' : ''}${value.toFixed(2)}`;
  return <Text style={[{ color, fontWeight: '600' }, style]}>{text}</Text>;
});

// ============================================================
// DIVIDER
// ============================================================

export const Divider = memo(function Divider({ style }: { style?: ViewStyle }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
        style,
      ]}
    />
  );
});

// ============================================================
// LOADING OVERLAY
// ============================================================

export const LoadingOverlay = memo(function LoadingOverlay() {
  const { colors } = useTheme();
  return (
    <View
      style={{
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          backgroundColor: colors.surfaceElevated,
          borderRadius: 20,
          padding: 20,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </View>
  );
});

// ============================================================
// SCREEN HEADER
// ============================================================

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}

export const ScreenHeader = memo(function ScreenHeader({
  title,
  subtitle,
  rightAction,
}: ScreenHeaderProps) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.base,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
      }}
    >
      <View>
        <Text
          style={{
            color: colors.text,
            fontSize: typography['3xl'],
            fontWeight: '700',
            letterSpacing: -0.8,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.sm,
              marginTop: 2,
              letterSpacing: 0.1,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {rightAction}
    </View>
  );
});

const styles = (radius: any, colors: any, shadow: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: 'hidden',
      ...(isDark ? shadow.lg : shadow.md),
    },
    blur: {
      ...StyleSheet.absoluteFill,
    },
    highlight: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '45%',
    },
    borderGlow: {
      ...StyleSheet.absoluteFill,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)',
    },
    content: {
      position: 'relative',
      zIndex: 2,
    },
  });
