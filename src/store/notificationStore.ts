import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import Toast from 'react-native-toast-message';
import type { AppNotification, NotificationType } from '../types';

// ============================================================
// NOTIFICATION STORE
// ============================================================

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
}

interface NotificationActions {
  push: (type: NotificationType, title: string, message: string, meta?: Record<string, unknown>) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clear: () => void;
}

type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>()(
  immer((set) => ({
    notifications: [],
    unreadCount: 0,

    push: (type, title, message, meta) => {
      const notification: AppNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type,
        title,
        message,
        timestamp: Date.now(),
        read: false,
        meta,
      };

      set((state) => {
        state.notifications.unshift(notification);
        // Keep max 100 notifications
        if (state.notifications.length > 100) {
          state.notifications = state.notifications.slice(0, 100);
        }
        state.unreadCount = state.notifications.filter((n) => !n.read).length;
      });

      // Also show a toast
      const toastType =
        type === 'trade' ? 'success' :
        type === 'error' ? 'error' : 'info';

      Toast.show({
        type: toastType,
        text1: title,
        text2: message,
        position: 'top',
        visibilityTime: type === 'error' ? 5000 : 3000,
      });
    },

    markAllRead: () => {
      set((state) => {
        state.notifications.forEach((n) => { n.read = true; });
        state.unreadCount = 0;
      });
    },

    markRead: (id) => {
      set((state) => {
        const notif = state.notifications.find((n) => n.id === id);
        if (notif) notif.read = true;
        state.unreadCount = state.notifications.filter((n) => !n.read).length;
      });
    },

    clear: () => {
      set((state) => {
        state.notifications = [];
        state.unreadCount = 0;
      });
    },
  })),
);

// Selector hooks
export const useNotifications = () =>
  useNotificationStore((s) => s.notifications);
export const useUnreadCount = () =>
  useNotificationStore((s) => s.unreadCount);

// ============================================================
// NOTIFICATION SERVICE (static helper)
// Use this from stores/services to push notifications
// ============================================================

export const NotificationService = {
  tradeSuccess: (symbol: string, side: string, qty: number, orderId: string) => {
    useNotificationStore.getState().push(
      'trade',
      `${side} Order Placed`,
      `${qty} qty of ${symbol} | Order ID: ${orderId}`,
      { orderId, symbol, side, qty },
    );
  },

  tradeError: (symbol: string, reason: string) => {
    useNotificationStore.getState().push(
      'error',
      'Order Failed',
      `${symbol}: ${reason}`,
    );
  },

  priceAlert: (symbol: string, ltp: number, target: number) => {
    useNotificationStore.getState().push(
      'alert',
      'Price Alert',
      `${symbol} hit ₹${target.toFixed(2)} (LTP: ₹${ltp.toFixed(2)})`,
      { symbol, ltp, target },
    );
  },

  info: (title: string, message: string) => {
    useNotificationStore.getState().push('info', title, message);
  },
};
