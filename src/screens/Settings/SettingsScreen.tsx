import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore, useUserProfile } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { ScreenHeader, Card, Divider } from '../../components/common';
import { isMockMode } from '../../services/mockDataService';
import { Logger } from '../../utils/logger';

// ============================================================
// SETTINGS SCREEN
// ============================================================

export function SettingsScreen() {
  const { colors, spacing } = useTheme();
  const { logout, isLoading } = useAuthStore();
  const profile = useUserProfile();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: logout,
        },
      ],
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top']}>
      <ScreenHeader title="Settings" />

      <ScrollView
        contentContainerStyle={{ padding: spacing.base, gap: spacing.base, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}>

        {/* Profile Card */}
        <Card style={{ padding: spacing.base }}>
          <View style={styles.profileRow}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: colors.primaryMuted },
              ]}>
              <Text style={{ color: colors.primary, fontSize: 22, fontWeight: '700' }}>
                {profile?.name?.charAt(0) ?? 'U'}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: colors.text, fontSize: 17, fontWeight: '700' }}>
                {profile?.name ?? '—'}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                {profile?.userId ?? '—'}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 1 }}>
                {profile?.email ?? '—'}
              </Text>
            </View>
          </View>

          {profile && (
            <>
              <Divider style={{ marginVertical: 12 }} />
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {profile.exchanges.map((ex) => (
                  <View
                    key={ex}
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                      backgroundColor: colors.surfaceElevated,
                    }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}>
                      {ex}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </Card>

        {/* Account Info */}
        {profile && (
          <SettingsSection title="Account">
            <SettingsRow label="PAN Number" value={maskPan(profile.pan)} />
            <Divider />
            <SettingsRow label="Mobile" value={maskMobile(profile.mobile)} />
            <Divider />
            <SettingsRow
              label="Products Enabled"
              value={profile.products.join(' · ')}
            />
          </SettingsSection>
        )}

        {/* App Info */}
        <SettingsSection title="App">
          <SettingsRow label="Version" value="1.0.0" />
          <Divider />
          <SettingsRow label="Environment" value={isMockMode ? '🟡 Mock Mode' : '🟢 Live'} />
          <Divider />
          <SettingsSwitchRow
            label="Mock Mode"
            subtitle="Use simulated data (requires restart)"
            value={isMockMode}
            onChange={() => {
              Alert.alert(
                'Mock Mode',
                'Changing mock mode requires restarting the app. Set MOCK_MODE in your .env file.',
              );
            }}
          />
        </SettingsSection>

        {/* Support */}
        <SettingsSection title="Support">
          <SettingsNavRow
            label="Alice Blue Documentation"
            onPress={() => Logger.info('Open docs')}
          />
          <Divider />
          <SettingsNavRow
            label="View Debug Logs"
            onPress={() => {
              const logs = Logger.getRecentLogs(20);
              Alert.alert(
                'Recent Logs',
                logs.map((l) => `[${l.level.toUpperCase()}] ${l.message}`).join('\n'),
              );
            }}
          />
        </SettingsSection>

        {/* Sign Out */}
        <TouchableOpacity
          onPress={handleLogout}
          disabled={isLoading}
          style={[
            styles.signOutBtn,
            {
              backgroundColor: `${colors.loss}12`,
              borderColor: `${colors.loss}30`,
              borderRadius: 12,
            },
          ]}>
          <Text style={{ color: colors.loss, fontSize: 15, fontWeight: '600' }}>
            {isLoading ? 'Signing out...' : 'Sign Out'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// SETTINGS SECTION
// ============================================================

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { colors, typography } = useTheme();

  return (
    <View>
      <Text
        style={{
          color: colors.textMuted,
          fontSize: typography.xs,
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 8,
          paddingLeft: 4,
        }}>
        {title}
      </Text>
      <Card style={{ overflow: 'hidden' }}>{children}</Card>
    </View>
  );
}

// ============================================================
// SETTINGS ROW VARIANTS
// ============================================================

const SettingsRow = memo(function SettingsRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View
      style={[
        styles.settingsRow,
        { paddingHorizontal: spacing.base, paddingVertical: spacing.md },
      ]}>
      <Text style={{ color: colors.textSecondary, fontSize: typography.base }}>
        {label}
      </Text>
      <Text
        style={{
          color: colors.text,
          fontSize: typography.base,
          fontWeight: '500',
          maxWidth: '55%',
          textAlign: 'right',
        }}>
        {value}
      </Text>
    </View>
  );
});

const SettingsNavRow = memo(function SettingsNavRow({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const { colors, spacing, typography } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.settingsRow,
        { paddingHorizontal: spacing.base, paddingVertical: spacing.md },
      ]}>
      <Text style={{ color: colors.text, fontSize: typography.base }}>
        {label}
      </Text>
      <Text style={{ color: colors.textMuted, fontSize: 18 }}>›</Text>
    </TouchableOpacity>
  );
});

const SettingsSwitchRow = memo(function SettingsSwitchRow({
  label,
  subtitle,
  value,
  onChange,
}: {
  label: string;
  subtitle?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View
      style={[
        styles.settingsRow,
        { paddingHorizontal: spacing.base, paddingVertical: spacing.md },
      ]}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: typography.base }}>
          {label}
        </Text>
        {subtitle && (
          <Text style={{ color: colors.textMuted, fontSize: typography.xs, marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primaryMuted }}
        thumbColor={value ? colors.primary : colors.textMuted}
      />
    </View>
  );
});

// ============================================================
// HELPERS
// ============================================================

function maskPan(pan: string): string {
  if (!pan || pan.length < 5) return pan;
  return `${pan.slice(0, 2)}${'•'.repeat(pan.length - 4)}${pan.slice(-2)}`;
}

function maskMobile(mobile: string): string {
  if (!mobile || mobile.length < 6) return mobile;
  return `${mobile.slice(0, 2)}${'•'.repeat(mobile.length - 4)}${mobile.slice(-2)}`;
}

const styles = StyleSheet.create({
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  signOutBtn: {
    alignItems: 'center',
    paddingVertical: 15,
    borderWidth: 1,
  },
});
