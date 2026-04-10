import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Button, Card, Divider, Input } from '../../components/common';
import { PRODUCT_LABELS } from '../../constants';
import { useInstrumentQuote } from '../../hooks/useMarketTicks';
import { useTheme } from '../../hooks/useTheme';
import { useOrdersStore, usePlacingOrder } from '../../store/ordersStore';
import { useFunds } from '../../store/portfolioStore';
import {
  BlurIntensity,
  Instrument,
  OrderRequest,
  OrderType,
  OrderValidity,
  ProductType,
  RootStackParamList,
  TransactionType,
} from '../../types';
import { formatCurrency, formatPercent } from '../../utils/formatters';

type OrderEntryRoute = RouteProp<
  { OrderEntry: { instrument: Instrument; side: TransactionType } },
  'OrderEntry'
>;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ORDER_TYPES: OrderType[] = ['MARKET', 'LIMIT', 'SL', 'SL-M'];
const PRODUCT_TYPES: ProductType[] = ['MIS', 'CNC', 'NRML'];
const VALIDITIES: OrderValidity[] = ['DAY', 'IOC'];

/**
 * Order Entry Screen allows users to place new orders for a selected instrument. It provides options to choose between BUY/SELL, select order type (MARKET, LIMIT, SL, SL-M), product type (MIS, CNC, NRML), and validity (DAY, IOC). Users can input quantity, price (for LIMIT/SL), and trigger price (for SL/SL-M). The screen also displays an order summary with estimated value and available margin. Upon placing the order, it validates the inputs and shows success/error messages accordingly.
 * Features:
 * - BUY/SELL toggle
 * - Order type selection (MARKET, LIMIT, SL, SL-M)
 * - Product type selection (MIS, CNC, NRML)
 * - Validity selection (DAY, IOC)
 * - Input fields for quantity, price, and trigger price with validation
 * - Order summary showing estimated value and available margin
 * - Success/error toast notifications on order placement
 * - Navigation back to previous screen on successful order placement
 * - Real-time LTP and price change display for the selected instrument
 */
export function OrderEntryScreen() {
  const { colors, spacing, typography, radius, margin, padding } = useTheme();
  const navigation = useNavigation<NavigationProp>();
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

  /**
   * Calculate the estimated value of the order based on the quantity and price.
   * For MARKET orders, we use the current LTP as the price.
   * For LIMIT orders, we use the user-entered price.
   * For SL/SL-M orders, we also use the user-entered price.
   * This helps users see the potential cost of their order before placing it,
   * and is also used for validating against available funds for BUY orders.
   */
  const estimatedValue = useMemo(() => {
    const qty = parseInt(quantity, 10) || 0;
    const p = orderType === 'MARKET' ? ltp : parseFloat(price) || ltp;
    return qty * p;
  }, [quantity, price, ltp, orderType]);

  /**
   * Handle the place order action when user taps the "Buy/Sell" button. This function performs the following steps:
   * 1. Validates the user inputs for quantity, price, and trigger price based on the selected order type. It checks for valid numbers, positive values, and ensures quantity is in multiples of lot size. It also checks if the user has sufficient funds for BUY orders.
   * 2. If validation fails, it sets the appropriate error messages which are displayed below the input fields.
   * 3. If validation passes, it constructs the OrderRequest object with all the necessary details and calls the placeOrder function from the orders store.
   * 4. On successful order placement, it navigates to the OrderSuccess screen and shows a success toast with the order ID.
   * 5. If there is an error during order placement, it catches the error and shows an error toast with the message.
   * This function ensures that only valid orders are placed and provides feedback to the user on the status of their order.
   * It also handles navigation upon successful order placement.
   */
  const handlePlaceOrder = useCallback(async () => {
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
        if (!tp || tp <= 0)
          newErrors.triggerPrice = 'Enter a valid trigger price';
      }

      if (isBuy && funds && estimatedValue > funds.availableBalance) {
        newErrors.quantity = 'Insufficient funds';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    if (!validate()) return;

    /**
     * Construct the order request object with all necessary details for placing the order.
     * This includes the exchange, symbol, token, transaction type (BUY/SELL),
     * product type (MIS/CNC/NRML),
     * order type (MARKET/LIMIT/SL/SL-M), quantity, price (if applicable),
     * trigger price (if applicable), and validity (DAY/IOC).
     * This object is then passed to the placeOrder function to execute the order.
     * The price is set to 0 for MARKET orders since the exchange will fill it at the best available price.
     * For LIMIT and SL orders, we use the user-entered price. For SL and SL-M orders, we also include the trigger price.
     * This structured order request ensures that all necessary information is provided for the order execution.
     */
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

    /**
     * Place the order using the placeOrder function from the orders store.
     * This is an asynchronous operation that interacts with the backend API to execute the order.
     * If the order is placed successfully, it returns an order ID which is then used to navigate to the OrderSuccess screen
     * and display a success toast notification with the order ID.
     * If there is an error during the order placement (e.g. network issues, API errors, validation errors from the backend),
     * it catches the error and displays an error toast notification with the error message.
     */
    try {
      const orderId = await placeOrder(order);
      navigation.navigate('OrderSuccess', { orderId });
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
  }, [
    instrument.exchange,
    instrument.symbol,
    instrument.token,
    instrument.lotSize,
    side,
    productType,
    orderType,
    quantity,
    price,
    triggerPrice,
    validity,
    isBuy,
    funds,
    estimatedValue,
    placeOrder,
    navigation,
  ]);

  return (
    <SafeAreaView style={[styles.flex, styles.transparentbg]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text
              style={{ color: colors.primaryDark, fontSize: typography.xl }}
            >
              ✕
            </Text>
          </TouchableOpacity>
          <View style={{ ...styles.flex, marginLeft: margin.lg }}>
            <Text
              style={{
                color: colors.text,
                fontSize: typography.lg,
                fontWeight: typography['700'],
              }}
            >
              {instrument.symbol}
            </Text>
            <Text
              style={{ color: colors.textSecondary, fontSize: typography.xs }}
            >
              {instrument.exchange} · {instrument.instrumentType}
            </Text>
          </View>
          <View style={styles.alignItemsEnd}>
            <Text
              style={{
                color: colors.text,
                fontSize: typography.lg,
                fontWeight: typography['700'],
              }}
            >
              {ltp > 0 ? formatCurrency(ltp) : '—'}
            </Text>
            {quote && (
              <Text
                style={{
                  color: quote.change >= 0 ? colors.profit : colors.loss,
                  fontSize: typography.xs,
                  fontWeight: typography['600'],
                }}
              >
                {formatPercent(quote.changePercent)}
              </Text>
            )}
          </View>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: spacing.base, gap: spacing.base }}
        >
          {/* BUY / SELL Toggle */}
          <Card
            style={{ borderRadius: radius.full }}
            intensity={BlurIntensity.Medium}
          >
            <View
              style={[
                styles.sideToggle,
                { ...styles.transparentbg, borderRadius: radius.full },
              ]}
            >
              {(['BUY', 'SELL'] as TransactionType[]).map(s => (
                <Button
                  key={s}
                  label={s}
                  onPress={() => setSide(s)}
                  fullWidth={false}
                  halfWidth={true}
                  variant={s === side ? s === 'BUY' ? 'primary' : 'danger' : 'noborder'}
                  // eslint-disable-next-line react-native/no-inline-styles
                  style={{
                    backgroundColor:
                      side === s
                        ? s === 'BUY'
                          ? colors.profit
                          : colors.loss
                        : 'transparent',
                  }}
                />
              ))}
            </View>
          </Card>

          {/* Order Type */}
          <View>
            <Text
              style={[styles.segmentLabel, { color: colors.textSecondary }]}
            >
              Order Type
            </Text>
            <View style={styles.chipRow}>
              {ORDER_TYPES.map(ot => (
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
            <Text
              style={[styles.segmentLabel, { color: colors.textSecondary }]}
            >
              Product
            </Text>
            <View style={styles.chipRow}>
              {PRODUCT_TYPES.map(pt => (
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
            suffix={
              instrument.lotSize > 1 ? `Lot: ${instrument.lotSize}` : undefined
            }
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
            <Text
              style={[styles.segmentLabel, { color: colors.textSecondary }]}
            >
              Validity
            </Text>
            <View style={styles.chipRow}>
              {VALIDITIES.map(v => (
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
        <View style={styles.footer}>
          <Card
            style={{
              padding: padding.xl,
              margin: margin.sm,
              borderRadius: radius.full,
            }}
          >
            <View
              style={{
                ...styles.flexDirectionRow,
                gap: spacing.base,
                ...styles.justifyContentCenter,
              }}
            >
              <Button
                label={`${isBuy ? 'Buy' : 'Sell'} ${instrument.symbol}`}
                onPress={handlePlaceOrder}
                loading={isPlacing}
                disabled={isPlacing}
                variant={isBuy ? 'primary' : 'danger'}
                fullWidth
                style={{
                  backgroundColor: isBuy ? colors.profit : colors.loss,
                }}
              />
            </View>
          </Card>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * Method to render a selectable chip component used for options like order type, product type, and validity.
 * It takes in a label to display, a boolean indicating if it is currently selected, and an onPress handler to update the selected state.
 * The chip changes its background color and text color based on whether it is selected or not, providing a clear visual indication of the current selection.
 * This reusable component helps maintain consistency across different option selections in the order entry screen.
 * It uses the theme colors and typography for styling, and applies appropriate padding and border radius to match the overall design of the app.
 * The onPress handler allows it to be interactive, enabling users to easily switch between different options by tapping on the chips.
 * @param param0 - An object containing the label to display on the chip, a boolean indicating if the chip is currently selected, and an onPress function to handle when the chip is tapped.
 * @returns - A styled TouchableOpacity component that visually represents a selectable chip, which can be used for selecting order type, product type, or validity in the order entry screen.
 */
function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors, radius, typography, padding, border } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: padding.lg,
        paddingVertical: padding.md,
        borderRadius: radius.full,
        backgroundColor: selected ? colors.primary : colors.surfaceElevated,
        borderWidth: border.thin,
        borderColor: selected ? colors.primary : colors.border,
      }}
    >
      <Text
        style={{
          color: selected ? colors.textInverse : colors.textSecondary,
          fontSize: typography.xs,
          fontWeight: typography['600'],
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * Method to render a summary row in the order summary card, displaying a label and its corresponding value.
 * It takes in a label string and a value string as props, and styles them according to the theme.
 * The label is displayed in a secondary text color, while the value is displayed in the primary text color with a slightly larger font size and bold weight for emphasis.
 * This component is used to show key information such as estimated order value, available margin, and
 * post-order balance in a clear and organized manner within the order summary section of the order entry screen.
 * @param param0 - An object containing a label string that describes the summary item (e.g. "Estimated Value") and
 * a value string that shows the corresponding value (e.g. "₹10,000").
 * @returns - A styled View component that displays the label and value in a row, with appropriate spacing and colors based on the app's theme.
 * This component is used within the order summary card to present important information about the order being placed.
 */
function SummaryRow({ label, value }: { label: string; value: string }) {
  const { colors, typography, padding } = useTheme();
  return (
    <View
      style={{
        ...styles.flexDirectionRow,
        ...styles.spaceBetween,
        paddingVertical: padding.sm,
      }}
    >
      <Text style={{ color: colors.textSecondary, fontSize: typography.sm }}>
        {label}
      </Text>
      <Text
        style={{
          color: colors.text,
          fontSize: typography.sm,
          fontWeight: typography['600'],
        }}
      >
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
  },
  flex: {
    flex: 1,
  },
  transparentbg: {
    backgroundColor: 'transparent',
  },
  alignItemsEnd: {
    alignItems: 'flex-end',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  flexDirectionRow: {
    flexDirection: 'row',
  },
  justifyContentCenter: {
    justifyContent: 'center',
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
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    paddingBottom: 18,
  },
});
