import { FlashList } from '@shopify/flash-list';
import React, { memo, useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Divider, ScreenHeader } from '../../components/common';
import { ORDER_STATUS_COLORS } from '../../constants';
import { useTheme } from '../../hooks/useTheme';
import {
  useOpenOrders,
  useOrders,
  useOrdersStore,
} from '../../store/ordersStore';
import type { Order } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

type TabType = 'orders' | 'open';

/**
 * Main screen for displaying orders and open orders.
 * Shows a header with total orders count, tabs to switch between all orders and open orders, and a list of order cards.
 * Each order card displays order details and allows cancelling open orders.
 * It fetches orders data from the store on mount and supports pull-to-refresh to reload orders. 
 * Uses FlashList for efficient rendering of the order list.
 * @returns - the Orders screen component with header, tabs, and list of orders 
 */
export function OrdersScreen() {
  const { colors, spacing, typography } = useTheme();
  const { fetchOrders, isFetching, cancelOrder } = useOrdersStore();
  const allOrders = useOrders();
  const openOrders = useOpenOrders();
  const [activeTab, setActiveTab] = useState<TabType>('orders');

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const data = activeTab === 'orders' ? allOrders : openOrders;

  return (
    <SafeAreaView style={[styles.flex, styles.transparentbg]} edges={['top']}>
      <ScreenHeader
        title="Orders"
        subtitle={`${allOrders.length} orders today`}
      />

      {/* Tabs */}
      <View
        style={[
          styles.tabsContainer,
          { marginHorizontal: spacing.base, borderColor: colors.border },
        ]}
      >
        {(
          [
            { key: 'orders', label: `All (${allOrders.length})` },
            { key: 'open', label: `Open (${openOrders.length})` },
          ] as { key: TabType; label: string }[]
        ).map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[
              styles.tab,
              activeTab === tab.key && {
                borderBottomColor: colors.primary,
                borderBottomWidth: StyleSheet.hairlineWidth * 4,
              },
            ]}
          >
            <Text
              style={{
                color:
                  activeTab === tab.key ? colors.primary : colors.textSecondary,
                fontWeight:
                  activeTab === tab.key ? typography['700'] : typography['500'],
                fontSize: typography.base,
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlashList
        data={data}
        keyExtractor={item => item.orderId}
        contentContainerStyle={styles.bottomPadding}
        estimatedItemSize={100}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={fetchOrders}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <OrderCard order={item} onCancel={cancelOrder} />
        )}
        ItemSeparatorComponent={Divider}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text
              style={{
                color: colors.textMuted,
                fontSize: typography.base,
              }}
            >
              {activeTab === 'open'
                ? 'No open orders'
                : 'No orders placed today'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

/**
 * Card component for displaying individual orders in the orders screen, used in the FlashList renderItem. Shows order details like symbol, status, quantity, price, etc. and allows cancelling open orders.
 * @param {{ order: Order, onCancel: (id: string) => Promise<void> }} param0 - order: the order data to display, onCancel: function to call when cancelling an order
 * @returns - a styled card component showing the order details and a cancel button if the order is open
 */
const OrderCard = memo(function OrderCard({
  order,
  onCancel,
}: {
  order: Order;
  onCancel: (id: string) => Promise<void>;
}) {
  const { colors, spacing, typography, radius, padding, margin } = useTheme();
  const isBuy = order.transactionType === 'BUY';
  const statusColor = ORDER_STATUS_COLORS[order.status] ?? colors.textSecondary;

  const handleCancel = () => {
    Alert.alert('Cancel Order', `Cancel order for ${order.symbol}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancel Order',
        style: 'destructive',
        onPress: () => onCancel(order.orderId),
      },
    ]);
  };

  return (
    <View
      style={[
        styles.orderCard,
        { paddingHorizontal: spacing.base, paddingVertical: spacing.md },
      ]}
    >
      {/* Row 1: Symbol + Status */}
      <View style={styles.row}>
        <View style={styles.symbolStatus}>
          <View
            style={[
              styles.sideTag,
              {
                backgroundColor: isBuy
                  ? `${colors.profit}20`
                  : `${colors.loss}20`,
                borderRadius: radius.xs,
              },
            ]}
          >
            <Text
              style={{
                color: isBuy ? colors.profit : colors.loss,
                fontSize: typography.xs,
                fontWeight: typography['700'],
              }}
            >
              {order.transactionType}
            </Text>
          </View>
          <Text
            style={{
              color: colors.text,
              fontSize: typography.md,
              fontWeight: typography['600'],
            }}
          >
            {order.symbol}
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: padding.md,
            paddingVertical: padding.sm,
            borderRadius: radius.full,
            backgroundColor: `${statusColor}18`,
          }}
        >
          <Text
            style={{
              color: statusColor,
              fontSize: typography.xs,
              fontWeight: typography['600'],
            }}
          >
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Text>
        </View>
      </View>

      {/* Row 2: Details */}
      <View style={[styles.row, { marginTop: margin.md }]}>
        <Text style={{ color: colors.textSecondary, fontSize: typography.xs }}>
          {order.exchange} · {order.productType} · {order.orderType}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: typography.xs }}>
          {formatDateTime(order.orderTimestamp)}
        </Text>
      </View>

      {/* Row 3: Qty + Price */}
      <View style={[styles.row, { marginTop: margin.md }]}>
        <View style={styles.row}>
          <MetaChip
            label="Qty"
            value={`${order.filledQuantity}/${order.quantity}`}
          />
          <MetaChip
            label="Price"
            value={
              order.orderType === 'MARKET' ? 'MKT' : formatCurrency(order.price)
            }
          />
          {order.avgPrice > 0 && (
            <MetaChip label="Avg" value={formatCurrency(order.avgPrice)} />
          )}
        </View>

        {order.status === 'open' && (
          <TouchableOpacity onPress={handleCancel}>
            <Text
              style={{
                color: colors.loss,
                fontSize: typography.xs,
                fontWeight: typography['600'],
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Rejection reason */}
      {order.statusMessage && order.status === 'rejected' && (
        <Text
          style={{
            color: colors.loss,
            fontSize: typography.xs,
            marginTop: margin.md,
          }}
        >
          {order.statusMessage}
        </Text>
      )}
    </View>
  );
});

/**
 * For displaying small metadata values like quantity, price, etc. in the order card
 * @param {{ label: string; value: string }} param0 - label: the type of metadata (e.g. "Qty", "Price"), value: the actual value to display
 * @returns - a small chip with the label and value, used in the order card for displaying order details
 */
function MetaChip({ label, value }: { label: string; value: string }) {
  const { colors, typography, margin } = useTheme();
  return (
    <View style={{ marginRight: margin.lg }}>
      <Text style={{ color: colors.textMuted, fontSize: typography.xs }}>
        {label}
      </Text>
      <Text
        style={{
          color: colors.text,
          fontSize: typography.xs,
          fontWeight: typography['600'],
        }}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  flex: {
    flex: 1,
  },
  transparentbg: {
    backgroundColor: 'transparent',
  },
  bottomPadding: {
    paddingBottom: 120,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomColor: 'transparent',
    borderBottomWidth: 2,
  },
  orderCard: {},
  symbolStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sideTag: { paddingHorizontal: 6, paddingVertical: 2 },
  emptyState: {
    paddingTop: 80,
    alignItems: 'center',
  },
});
