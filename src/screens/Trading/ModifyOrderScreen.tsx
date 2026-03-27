import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useOrdersStore } from '../../store/ordersStore';
import { useTheme } from '../../hooks/useTheme';
import { Button, Input, Divider } from '../../components/common';
import { formatCurrency } from '../../utils/formatters';
import type { Order, OrderType, OrderValidity } from '../../types';

type ModifyOrderRoute = RouteProp<
  { ModifyOrder: { order: Order } },
  'ModifyOrder'
>;

const ORDER_TYPES: OrderType[] = ['MARKET', 'LIMIT', 'SL', 'SL-M'];
const VALIDITIES: OrderValidity[] = ['DAY', 'IOC'];

export function ModifyOrderScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<ModifyOrderRoute>();
  const { order } = route.params;
  const { modifyOrder } = useOrdersStore();

  const [orderType, setOrderType] = useState<OrderType>(order.orderType);
  const [quantity, setQuantity] = useState(order.pendingQuantity.toString());
  const [price, setPrice] = useState(order.price.toString());
  const [triggerPrice, setTriggerPrice] = useState(order.triggerPrice?.toString() ?? '');
  const [validity, setValidity] = useState<OrderValidity>('DAY');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const qty = parseInt(quantity, 10);

    if (!qty || qty <= 0) newErrors.quantity = 'Enter a valid quantity';
    if ((orderType === 'LIMIT' || orderType === 'SL') && (!parseFloat(price) || parseFloat(price) <= 0)) {
      newErrors.price = 'Enter a valid price';
    }
    if ((orderType === 'SL' || orderType === 'SL-M') && (!parseFloat(triggerPrice) || parseFloat(triggerPrice) <= 0)) {
      newErrors.triggerPrice = 'Enter a valid trigger price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleModify = useCallback(async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await modifyOrder({
        orderId: order.orderId,
        orderType,
        quantity: parseInt(quantity, 10),
        price: orderType === 'MARKET' ? 0 : parseFloat(price),
        triggerPrice: (orderType === 'SL' || orderType === 'SL-M') ? parseFloat(triggerPrice) : undefined,
        validity,
      });
      Toast.show({ type: 'success', text1: 'Order Modified', text2: `Order ${order.orderId} updated`, position: 'top' });
      navigation.goBack();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Modify Failed', text2: error instanceof Error ? error.message : 'Try again', position: 'top' });
    } finally {
      setIsLoading(false);
    }
  }, [orderType, quantity, price, triggerPrice, validity, order, modifyOrder, navigation]);

  const isBuy = order.transactionType === 'BUY';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: colors.primary, fontSize: typography.md }}>✕</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: colors.text, fontSize: typography.lg, fontWeight: '700' }}>
              Modify Order
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: typography.xs }}>
              {order.symbol} · {order.orderId}
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.xs,
              backgroundColor: isBuy ? `${colors.profit}20` : `${colors.loss}20`,
            }}>
            <Text style={{ color: isBuy ? colors.profit : colors.loss, fontSize: typography.xs, fontWeight: '700' }}>
              {order.transactionType}
            </Text>
          </View>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.base, gap: spacing.base }}>
          {/* Current Order Summary */}
          <View style={[styles.summaryCard, { backgroundColor: colors.surfaceElevated, borderRadius: radius.lg }]}>
            <Text style={{ color: colors.textSecondary, fontSize: typography.xs, marginBottom: 8, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Current Order
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <InfoChip label="Qty" value={`${order.filledQuantity}/${order.quantity}`} />
              <InfoChip label="Price" value={order.orderType === 'MARKET' ? 'MKT' : formatCurrency(order.price)} />
              <InfoChip label="Type" value={order.orderType} />
              <InfoChip label="Product" value={order.productType} />
            </View>
          </View>

          <Divider />

          {/* Order Type Chips */}
          <View>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Order Type</Text>
            <View style={styles.chipRow}>
              {ORDER_TYPES.map((ot) => (
                <TypeChip key={ot} label={ot} selected={orderType === ot} onPress={() => setOrderType(ot)} />
              ))}
            </View>
          </View>

          {/* Quantity */}
          <Input
            label="Quantity"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="number-pad"
            error={errors.quantity}
          />

          {/* Price */}
          {(orderType === 'LIMIT' || orderType === 'SL') && (
            <Input
              label="Price"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              prefix="₹"
              error={errors.price}
            />
          )}

          {/* Trigger Price */}
          {(orderType === 'SL' || orderType === 'SL-M') && (
            <Input
              label="Trigger Price"
              value={triggerPrice}
              onChangeText={setTriggerPrice}
              keyboardType="decimal-pad"
              prefix="₹"
              error={errors.triggerPrice}
            />
          )}

          {/* Validity */}
          <View>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Validity</Text>
            <View style={styles.chipRow}>
              {VALIDITIES.map((v) => (
                <TypeChip key={v} label={v} selected={validity === v} onPress={() => setValidity(v)} />
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Submit */}
        <View style={[styles.footer, { borderTopColor: colors.border, paddingHorizontal: spacing.base, backgroundColor: colors.background }]}>
          <Button label="Modify Order" onPress={handleModify} loading={isLoading} disabled={isLoading} fullWidth />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  const { colors, typography } = useTheme();
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: colors.textMuted, fontSize: 10 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: typography.xs, fontWeight: '600', marginTop: 2 }}>{value}</Text>
    </View>
  );
}

function TypeChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { colors, radius, typography } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full,
        backgroundColor: selected ? colors.primary : colors.surfaceElevated,
        borderWidth: 1, borderColor: selected ? colors.primary : colors.border,
      }}>
      <Text style={{ color: selected ? colors.textInverse : colors.textSecondary, fontSize: typography.xs, fontWeight: '600' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  summaryCard: { padding: 14 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  footer: { paddingTop: 12, paddingBottom: 28, borderTopWidth: StyleSheet.hairlineWidth },
});
