import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/common';
import { useTheme } from '../../hooks/useTheme';

type OrderSuccessRoute = RouteProp<
  {
    OrderSuccess: {
      orderId: string;
      symbol?: string;
      side?: string;
      qty?: number;
    };
  },
  'OrderSuccess'
>;

/**
 * Component to
 *
 */
export function OrderSuccessScreen() {
  const { colors, spacing, typography, radius, margin, letterSpacing } =
    useTheme();
  const navigation = useNavigation();
  const route = useRoute<OrderSuccessRoute>();
  const { orderId, symbol, side, qty } = route.params;

  // Scale-in animation for the check circle
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, fadeAnim]);

  return (
    <SafeAreaView style={[styles.flex, styles.transparentbg]} edges={['top']}>
      <View style={[styles.container, { paddingHorizontal: spacing.xl }]}>
        {/* Animated Check */}
        <Animated.View
          style={[
            styles.checkCircle,
            {
              backgroundColor: `${colors.profit}18`,
              borderColor: `${colors.profit}40`,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={{ fontSize: typography['6xl'], color: colors.profit }}>
            ✓
          </Text>
        </Animated.View>

        {/* Message */}
        <Animated.View style={{ opacity: fadeAnim, ...styles.textAlignCenter }}>
          <Text
            style={{
              color: colors.text,
              fontSize: typography['3xl'],
              fontWeight: typography['700'],
              letterSpacing: letterSpacing.tight,
              marginTop: margin['3xl'],
              ...styles.textAlignCenter,
            }}
          >
            Order Placed!
          </Text>

          {symbol && side && qty && (
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.base,
                marginTop: margin.md,
                ...styles.textAlignCenter,
              }}
            >
              {side} {qty} qty of {symbol}
            </Text>
          )}

          {/* Order ID Card */}
          <View
            style={[
              styles.orderIdCard,
              {
                backgroundColor: colors.primaryMuted,
                borderRadius: radius.full,
                borderColor: colors.border,
                marginTop: margin['4xl'],
              },
            ]}
          >
            <Text
              style={{
                color: colors.textMuted,
                fontSize: typography.xs,
                marginBottom: margin.md,
              }}
            >
              ORDER ID
            </Text>
            <Text
              style={{
                color: colors.text,
                fontSize: typography.lg,
                fontWeight: typography['700'],
                fontVariant: ['tabular-nums'],
                letterSpacing: letterSpacing.wide,
              }}
            >
              {orderId}
            </Text>
          </View>

          <Text
            style={{
              color: colors.textMuted,
              fontSize: typography.sm,
              marginTop: margin['2xl'],
              lineHeight: spacing.lg,
              ...styles.textAlignCenter,
            }}
          >
            Your order has been submitted to the exchange.{'\n'}
            Check Orders for status updates.
          </Text>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View
          style={[
            styles.actions,
            styles.width100Percent,
            { gap: spacing.base },
          ]}
        >
          <Button
            label="View Orders"
            onPress={() => navigation.navigate('Orders' as never)}
            fullWidth={true}
            halfWidth={false}
            variant="primary"
            style={{
              backgroundColor: colors.profit,
            }}
          />

          <Button
            label="Back to Home"
            onPress={() => navigation.navigate('Main' as never)}
            fullWidth={true}
            halfWidth={false}
            variant="secondary"
            style={{
              backgroundColor: colors.profit,
            }}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  transparentbg: {
    backgroundColor: 'transparent',
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderIdCard: {
    padding: 20,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    width: '100%',
    justifyContent: 'center',
  },
  actions: {
    position: 'absolute',
    bottom: 32,
  },
  width100Percent: {
    width: '100%',
  },
  btn: {
    paddingVertical: 15,
    alignItems: 'center',
    width: '100%',
  },
  textAlignCenter: {
    textAlign: 'center',
    alignItems: 'center',
  },
});
