import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useOrdersStore, usePlacingOrder } from '../../store/ordersStore';
import { useFunds } from '../../store/portfolioStore';
import { useInstrumentQuote } from '../../hooks/useMarketTicks';
import { useTheme } from '../../hooks/useTheme';
import { Button, Input, Badge, Card, Divider } from '../../components/common';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import type {
  OrderType,
  ProductType,
  TransactionType,
  OrderValidity,
  Instrument,
  OrderRequest,
} from '../../types';
import { PRODUCT_LABELS } from '../../constants';

// ============================================================
// ORDER ENTRY SCREEN
// ============================================================

type OrderEntryRoute = RouteProp<
  { OrderEntry: { instrument: Instrument; side: TransactionType } },
  'OrderEntry'
>;

const ORDER_TYPES: OrderType[] = ['MARKET', 'LIMIT', 'SL', 'SL-M'];
const PRODUCT_TYPES: ProductType[] = ['MIS', 'CNC', 'NRML'];
const VALIDITIES: OrderValidity[] = ['DAY', 'IOC'];

export function OrderEntryScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<OrderEntryRoute>();
  const { instrument, side: initialSide } = route.params;

  const { placeOrder } = useOrdersStore();
  const isPlacing = usePlacingOrder();
  const funds = useFunds();
  const quote = useInstrumentQuote(instrument.token);

  const [side, setSide] = useState<TransactionType>(initialSide);
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [productType, setProductType] = useState<ProductType>('MIS');
  const [validity, setValidity] = useState<OrderValidity>('DAY');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [triggerPrice, setTriggerPrice] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const ltp = quote?.ltp ?? 0;
  const isBuy = side === 'BUY';

  const estimatedValue = useMemo(() => {
    const qty = parseInt(quantity, 10) || 0;
    const p = orderType === 'MARKET' ? ltp : parseFloat(price) || ltp;
    return qty * p;
  }, [quantity, price, ltp, orderType]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const qty = parseInt(quantity, 10);

    if (!qty || qty <= 0) newErrors.quantity = 'Enter a valid quantity';
    if (qty % instrument.lotSize !== 0)
      newErrors.quantity = `Quantity must be in multiples of ${instrument.lotSize}`;

    if (orderType === 'LIMIT' || orderType === 'SL') {
      const p = parseFloat(price);
      if (!p || p <= 0) newErrors.price = 'Enter a valid price';
    }

    if (orderType === 'SL' || orderType === 'SL-M') {
      const tp = parseFloat(triggerPrice);
      if (!tp || tp <= 0) newErrors.triggerPrice = 'Enter a valid trigger price';
    }

    if (
      isBuy &&
      funds &&
      estimatedValue > funds.availableBalance
    ) {
      newErrors.quantity = 'Insufficient funds';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = useCallback(async () => {
    if (!validate()) return;

    const order: OrderRequest = {
      exchange: instrument.exchange,
      symbol: instrument.symbol,
      token: instrument.token,
      transactionType: side,
      productType,
      orderType,
      quantity: parseInt(quantity, 10),
      price: orderType === 'MARKET' ? 0 : parseFloat(price) || 0,
      triggerPrice:
        orderType === 'SL' || orderType === 'SL-M'
          ? parseFloat(triggerPrice) || 0
          : undefined,
      validity,
    };

    try {
      const orderId = await placeOrder(order);
      navigation.navigate('OrderSuccess' as never, { orderId } as never);
      Toast.show({
        type: 'success',
        text1: 'Order Placed',
        text2: `Order ID: ${orderId}`,
        position: 'top',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Order Failed',
        text2: error instanceof Error ? error.message : 'Please try again',
        position: 'top',
      });
    }
  }, [side, orderType, productType, validity, quantity, price, triggerPrice, instrument, placeOrder, navigation]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: colors.primary, fontSize: typography.md }}>✕</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: colors.text, fontSize: typography.lg, fontWeight: '700' }}>
              {instrument.symbol}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: typography.xs }}>
              {instrument.exchange} · {instrument.instrumentType}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: colors.text, fontSize: typography.lg, fontWeight: '700' }}>
              {ltp > 0 ? formatCurrency(ltp) : '—'}
            </Text>
            {quote && (
              <Text
                style={{
                  color: quote.change >= 0 ? colors.profit : colors.loss,
                  fontSize: typography.xs,
                  fontWeight: '600',
                }}>
                {formatPercent(quote.changePercent)}
              </Text>
            )}
          </View>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: spacing.base, gap: spacing.base }}>

          {/* BUY / SELL Toggle */}
          <View
            style={[
              styles.sideToggle,
              { backgroundColor: colors.surfaceElevated, borderRadius: radius.lg },
            ]}>
            {(['BUY', 'SELL'] as TransactionType[]).map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setSide(s)}
                style={[
                  styles.sideBtn,
                  {
                    borderRadius: radius.md,
                    backgroundColor:
                      side === s
                        ? s === 'BUY'
                          ? colors.profit
                          : colors.loss
                        : 'transparent',
                  },
                ]}>
                <Text
                  style={{
                    color:
                      side === s
                        ? '#FFFFFF'
                        : colors.textSecondary,
                    fontWeight: '700',
                    fontSize: typography.md,
                  }}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Order Type */}
          <View>
            <Text style={[styles.segmentLabel, { color: colors.textSecondary }]}>
              Order Type
            </Text>
            <View style={styles.chipRow}>
              {ORDER_TYPES.map((ot) => (
                <Chip
                  key={ot}
                  label={ot}
                  selected={orderType === ot}
                  onPress={() => setOrderType(ot)}
                />
              ))}
            </View>
          </View>

          {/* Product Type */}
          <View>
            <Text style={[styles.segmentLabel, { color: colors.textSecondary }]}>
              Product
            </Text>
            <View style={styles.chipRow}>
              {PRODUCT_TYPES.map((pt) => (
                <Chip
                  key={pt}
                  label={`${pt} (${PRODUCT_LABELS[pt]})`}
                  selected={productType === pt}
                  onPress={() => setProductType(pt)}
                />
              ))}
            </View>
          </View>

          <Divider />

          {/* Quantity */}
          <Input
            label="Quantity"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="number-pad"
            error={errors.quantity}
            suffix={instrument.lotSize > 1 ? `Lot: ${instrument.lotSize}` : undefined}
          />

          {/* Price (for LIMIT / SL) */}
          {(orderType === 'LIMIT' || orderType === 'SL') && (
            <Input
              label="Price"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              prefix="₹"
              error={errors.price}
              placeholder={ltp > 0 ? ltp.toFixed(2) : '0.00'}
            />
          )}

          {/* Trigger Price (for SL / SL-M) */}
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
            <Text style={[styles.segmentLabel, { color: colors.textSecondary }]}>
              Validity
            </Text>
            <View style={styles.chipRow}>
              {VALIDITIES.map((v) => (
                <Chip
                  key={v}
                  label={v}
                  selected={validity === v}
                  onPress={() => setValidity(v)}
                />
              ))}
            </View>
          </View>

          {/* Order Summary */}
          <Card style={{ padding: spacing.md }}>
            <SummaryRow
              label="Estimated Value"
              value={formatCurrency(estimatedValue)}
            />
            <SummaryRow
              label="Available Margin"
              value={formatCurrency(funds?.availableBalance ?? 0)}
            />
            {isBuy && funds && (
              <SummaryRow
                label="Post-order Balance"
                value={formatCurrency(
                  Math.max(0, funds.availableBalance - estimatedValue),
                )}
              />
            )}
          </Card>
        </ScrollView>

        {/* Place Order CTA */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingHorizontal: spacing.base,
            },
          ]}>
          <Button
            label={`${isBuy ? 'Buy' : 'Sell'} ${instrument.symbol}`}
            onPress={handlePlaceOrder}
            loading={isPlacing}
            disabled={isPlacing}
            fullWidth
            style={{
              backgroundColor: isBuy ? colors.profit : colors.loss,
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============================================================
// CHIP COMPONENT
// ============================================================

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors, radius, typography } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: radius.full,
        backgroundColor: selected ? colors.primary : colors.surfaceElevated,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
      }}>
      <Text
        style={{
          color: selected ? colors.textInverse : colors.textSecondary,
          fontSize: typography.xs,
          fontWeight: '600',
        }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const { colors, typography } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
      }}>
      <Text style={{ color: colors.textSecondary, fontSize: typography.sm }}>
        {label}
      </Text>
      <Text style={{ color: colors.text, fontSize: typography.sm, fontWeight: '600' }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sideToggle: {
    flexDirection: 'row',
    padding: 4,
  },
  sideBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  footer: {
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
