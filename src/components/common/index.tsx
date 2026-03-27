import React, { memo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
  type TextInputProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

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
  const { colors, radius, typography } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const bgColor = {
    primary: colors.primary,
    secondary: colors.surfaceElevated,
    danger: colors.loss,
    ghost: 'transparent',
  }[variant];

  const textColor = {
    primary: colors.textInverse,
    secondary: colors.text,
    danger: '#FFFFFF',
    ghost: colors.primary,
  }[variant];

  const height = { sm: 36, md: 44, lg: 52 }[size];
  const fontSize = { sm: typography.sm, md: typography.base, lg: typography.md }[size];

  return (
    <Animated.View style={[animStyle, fullWidth && { width: '100%' }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.9}
        style={[
          {
            height,
            backgroundColor: bgColor,
            borderRadius: radius.md,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 20,
            opacity: disabled ? 0.5 : 1,
            borderWidth: variant === 'ghost' ? 1 : 0,
            borderColor: variant === 'ghost' ? colors.primary : 'transparent',
          },
          style,
        ]}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' ? colors.textInverse : colors.primary}
          />
        ) : (
          <Text
            style={{
              color: textColor,
              fontSize,
              fontWeight: '600',
              letterSpacing: 0.3,
            }}>
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
  suffix?: string;
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
    <View style={{ gap: 6 }}>
      {label && (
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.sm,
            fontWeight: '500',
          }}>
          {label}
        </Text>
      )}
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.inputBg,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: error ? colors.loss : colors.inputBorder,
            paddingHorizontal: spacing.md,
            height: 48,
          },
        ]}>
        {prefix && (
          <Text style={{ color: colors.textSecondary, marginRight: 8, fontSize: typography.md }}>
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
              fontWeight: '500',
              padding: 0,
            },
            style as TextStyle,
          ]}
          {...rest}
        />
        {suffix && (
          <Text style={{ color: colors.textSecondary, marginLeft: 8, fontSize: typography.sm }}>
            {suffix}
          </Text>
        )}
      </View>
      {error && (
        <Text style={{ color: colors.loss, fontSize: typography.xs }}>
          {error}
        </Text>
      )}
    </View>
  );
});

// ============================================================
// CARD
// ============================================================

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export const Card = memo(function Card({ children, style, onPress }: CardProps) {
  const { colors, radius, shadow } = useTheme();

  const content = (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          ...shadow.sm,
        },
        style,
      ]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
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
        paddingHorizontal: size === 'sm' ? 6 : 10,
        paddingVertical: size === 'sm' ? 2 : 4,
        borderRadius: radius.full,
        backgroundColor: bgColor ?? colors.primaryMuted,
      }}>
      <Text
        style={{
          color: color ?? colors.primary,
          fontSize: size === 'sm' ? typography.xs : typography.sm,
          fontWeight: '600',
        }}>
        {label}
      </Text>
    </View>
  );
});

// ============================================================
// PNL TEXT (animated color change)
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
        {
          height: StyleSheet.hairlineWidth,
          backgroundColor: colors.border,
        },
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
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <ActivityIndicator size="large" color={colors.primary} />
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
        paddingVertical: spacing.md,
      }}>
      <View>
        <Text
          style={{
            color: colors.text,
            fontSize: typography['2xl'],
            fontWeight: '700',
            letterSpacing: -0.5,
          }}>
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.sm,
              marginTop: 2,
            }}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightAction}
    </View>
  );
});
