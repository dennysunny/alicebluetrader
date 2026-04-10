import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { Button, Input } from '../../components/common';

// ============================================================
// LOGIN SCREEN
// ============================================================

export function LoginScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ userId?: string; password?: string }>({});

  const handleLogin = useCallback(async () => {
    clearError();
    
    const validate = (): boolean => {
      const newErrors: typeof errors = {};
      if (!userId.trim()) newErrors.userId = 'User ID is required';
      if (!password) newErrors.password = 'Password is required';
      if (password && password.length < 6)
        newErrors.password = 'Password must be at least 6 characters';
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
    
    if (!validate()) return;

    try {
      await login({ userId: userId.trim(), password });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: error ?? 'Please check your credentials',
        position: 'bottom',
      });
    }
  }, [clearError, login, userId, password, error]);

  return (
    <SafeAreaView style={[styles.container, styles.transparentbg]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Logo / Brand */}
          <View style={styles.header}>
            <View
              style={[
                styles.logoContainer,
                { backgroundColor: colors.primaryMuted, borderRadius: radius.xl },
              ]}>
              <Text style={[styles.logoText, { color: colors.primary }]}>AB</Text>
            </View>
            <Text style={[styles.brandName, { color: colors.text }]}>
              AliceBlue
            </Text>
            <Text style={[styles.brandTagline, { color: colors.textSecondary }]}>
              Professional Trading Platform
            </Text>
          </View>

          {/* Form Card */}
          <View
            style={[
              styles.formCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.xl,
              },
            ]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>
              Sign In
            </Text>
            <Text
              style={[styles.formSubtitle, { color: colors.textSecondary }]}>
              Enter your Alice Blue credentials
            </Text>

            <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
              <Input
                label="User ID"
                value={userId}
                onChangeText={(t) => {
                  setUserId(t);
                  if (errors.userId) setErrors((e) => ({ ...e, userId: undefined }));
                }}
                placeholder="Enter your User ID"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                error={errors.userId}
              />

              <Input
                label="Password"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
                }}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                error={errors.password}
                suffix={
                  <TouchableOpacity onPress={() => setShowPassword((s) => !s)}>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      {showPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                }
              />
            </View>

            {/* Error message */}
            {error && (
              <View
                style={[
                  styles.errorBanner,
                  { backgroundColor: `${colors.loss}18`, borderColor: `${colors.loss}40` },
                ]}>
                <Text style={{ color: colors.loss, fontSize: typography.sm }}>
                  {error}
                </Text>
              </View>
            )}

            <Button
              label="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              fullWidth
              style={{ marginTop: spacing.lg }}
            />
          </View>

          {/* Disclaimer */}
          <Text
            style={[
              styles.disclaimer,
              { color: colors.textMuted, fontSize: typography.xs },
            ]}>
            By signing in you agree to Alice Blue's Terms of Service.{'\n'}
            Market investments are subject to risk.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  transparentbg: {
    backgroundColor: 'transparent',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: { alignItems: 'center', marginBottom: 36 },
  logoContainer: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  brandName: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5, marginBottom: 6 },
  brandTagline: { fontSize: 14 },
  formCard: {
    padding: 24,
    borderWidth: StyleSheet.hairlineWidth,
  },
  formTitle: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  formSubtitle: { fontSize: 14 },
  errorBanner: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  disclaimer: { textAlign: 'center', marginTop: 32, lineHeight: 18 },
});
