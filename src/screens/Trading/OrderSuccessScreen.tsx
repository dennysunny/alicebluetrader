import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';

type OrderSuccessRoute = RouteProp<
  { OrderSuccess: { orderId: string; symbol?: string; side?: string; qty?: number } },
  'OrderSuccess'
>;

export function OrderSuccessScreen() {
  const { colors, spacing, typography, radius } = useTheme();
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
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top', 'bottom']}>
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
          ]}>
          <Text style={{ fontSize: 48, color: colors.profit }}>✓</Text>
        </Animated.View>

        {/* Message */}
        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
          <Text
            style={{
              color: colors.text,
              fontSize: typography['3xl'],
              fontWeight: '700',
              letterSpacing: -0.5,
              marginTop: 28,
              textAlign: 'center',
            }}>
            Order Placed!
          </Text>

          {symbol && side && qty && (
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.base,
                marginTop: 8,
                textAlign: 'center',
              }}>
              {side} {qty} qty of {symbol}
            </Text>
          )}

          {/* Order ID Card */}
          <View
            style={[
              styles.orderIdCard,
              {
                backgroundColor: colors.surfaceElevated,
                borderRadius: radius.lg,
                borderColor: colors.border,
                marginTop: 32,
              },
            ]}>
            <Text style={{ color: colors.textMuted, fontSize: typography.xs, marginBottom: 6 }}>
              ORDER ID
            </Text>
            <Text
              style={{
                color: colors.text,
                fontSize: typography.lg,
                fontWeight: '700',
                fontVariant: ['tabular-nums'],
                letterSpacing: 0.5,
              }}>
              {orderId}
            </Text>
          </View>

          <Text
            style={{
              color: colors.textMuted,
              fontSize: typography.sm,
              marginTop: 20,
              textAlign: 'center',
              lineHeight: 20,
            }}>
            Your order has been submitted to the exchange.{'\n'}
            Check Orders for status updates.
          </Text>
        </Animated.View>

        {/* Actions */}
        <Animated.View
          style={[styles.actions, { opacity: fadeAnim, width: '100%' }]}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Orders' as never)}
            style={[
              styles.btn,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.md,
              },
            ]}>
            <Text
              style={{
                color: colors.textInverse,
                fontSize: typography.md,
                fontWeight: '700',
              }}>
              View Orders
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              navigation.navigate('Main' as never);
            }}
            style={[
              styles.btn,
              {
                backgroundColor: colors.surfaceElevated,
                borderRadius: radius.md,
                marginTop: 12,
              },
            ]}>
            <Text
              style={{
                color: colors.text,
                fontSize: typography.md,
                fontWeight: '600',
              }}>
              Back to Home
            </Text>
          </TouchableOpacity>
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
  },
  actions: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },
  btn: {
    paddingVertical: 15,
    alignItems: 'center',
    width: '100%',
  },
});
