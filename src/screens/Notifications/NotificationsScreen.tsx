import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import {
  useNotifications,
  useUnreadCount,
  useNotificationStore,
} from '../../store/notificationStore';
import { useTheme } from '../../hooks/useTheme';
import { ScreenHeader, Divider } from '../../components/common';
import { formatDateTime } from '../../utils/formatters';
import type { AppNotification, NotificationType } from '../../types';

// ============================================================
// NOTIFICATIONS SCREEN
// ============================================================

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: string; color: (colors: Record<string, string>) => string }
> = {
  trade: { icon: '✓', color: (c) => c.profit },
  alert: { icon: '⚑', color: (c) => c.warning },
  error: { icon: '✕', color: (c) => c.loss },
  info: { icon: 'ℹ', color: (c) => c.info },
};

export function NotificationsScreen() {
  const { colors, spacing } = useTheme();
  const notifications = useNotifications();
  const unreadCount = useUnreadCount();
  const { markAllRead, clear } = useNotificationStore();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top']}>
      <ScreenHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        rightAction={
          notifications.length > 0 ? (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllRead}>
                  <Text style={{ color: colors.primary, fontSize: 13 }}>
                    Mark all read
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={clear}>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                  Clear
                </Text>
              </TouchableOpacity>
            </View>
          ) : undefined
        }
      />

      <FlashList
        data={notifications}
        keyExtractor={(item) => item.id}
        estimatedItemSize={80}
        renderItem={({ item }) => <NotificationItem notification={item} />}
        ItemSeparatorComponent={Divider}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🔔</Text>
            <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: 'center' }}>
              No notifications yet.{'\n'}Trade confirmations and alerts will appear here.
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </SafeAreaView>
  );
}

// ============================================================
// NOTIFICATION ITEM
// ============================================================

const NotificationItem = memo(function NotificationItem({
  notification,
}: {
  notification: AppNotification;
}) {
  const { colors, spacing, typography, radius } = useTheme();
  const { markRead } = useNotificationStore();
  const config = TYPE_CONFIG[notification.type];
  const iconColor = config.color(colors as unknown as Record<string, string>);

  return (
    <TouchableOpacity
      onPress={() => markRead(notification.id)}
      activeOpacity={0.7}
      style={[
        styles.item,
        {
          paddingHorizontal: spacing.base,
          paddingVertical: spacing.md,
          backgroundColor: notification.read
            ? 'transparent'
            : `${colors.primary}06`,
        },
      ]}>
      {/* Icon */}
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: `${iconColor}18`,
            borderRadius: radius.full,
          },
        ]}>
        <Text style={{ color: iconColor, fontSize: 14, fontWeight: '700' }}>
          {config.icon}
        </Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={styles.titleRow}>
          <Text
            style={{
              color: colors.text,
              fontSize: typography.base,
              fontWeight: notification.read ? '500' : '700',
              flex: 1,
            }}>
            {notification.title}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: typography.xs }}>
            {formatDateTime(notification.timestamp)}
          </Text>
        </View>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.sm,
            marginTop: 3,
            lineHeight: 18,
          }}>
          {notification.message}
        </Text>
      </View>

      {/* Unread dot */}
      {!notification.read && (
        <View
          style={[
            styles.unreadDot,
            { backgroundColor: colors.primary },
          ]}
        />
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'flex-start' },
  iconContainer: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginLeft: 8,
  },
  emptyState: {
    paddingTop: 100,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
});
