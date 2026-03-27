import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { formatCurrency } from '../../utils/formatters';
import { PRODUCT_LABELS } from '../../constants';
import type { OrderRequest } from '../../types';

type OrderConfirmRoute = {
  params: { order: OrderRequest };
};

export function OrderConfirmScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  // In real usage, get from route.params
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.base }}>
        <Text style={{ color: colors.text, fontSize: typography.xl, fontWeight: '700' }}>
          Confirm Order
        </Text>
      </View>
    </SafeAreaView>
  );
}
