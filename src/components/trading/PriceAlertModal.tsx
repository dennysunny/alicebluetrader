import React, { useState, memo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Input, Button, Divider } from '../../components/common';
import { priceAlertService } from '../../services/priceAlertService';
import { NotificationService } from '../../store/notificationStore';
import type { Instrument } from '../../types';

// ============================================================
// PRICE ALERT MODAL
// ============================================================

interface PriceAlertModalProps {
  visible: boolean;
  instrument: Instrument;
  currentPrice: number;
  onClose: () => void;
}

export const PriceAlertModal = memo(function PriceAlertModal({
  visible,
  instrument,
  currentPrice,
  onClose,
}: PriceAlertModalProps) {
  const { colors, spacing, typography, radius } = useTheme();
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [error, setError] = useState('');

  const handleCreate = () => {
    const price = parseFloat(targetPrice);
    if (!price || price <= 0) {
      setError('Enter a valid target price');
      return;
    }
    if (condition === 'above' && price <= currentPrice) {
      setError('Target must be above current price for "above" alert');
      return;
    }
    if (condition === 'below' && price >= currentPrice) {
      setError('Target must be below current price for "below" alert');
      return;
    }

    priceAlertService.addAlert({
      token: instrument.token,
      symbol: instrument.symbol,
      exchange: instrument.exchange,
      targetPrice: price,
      condition,
    });

    NotificationService.info(
      'Alert Created',
      `Alert set for ${instrument.symbol} ${condition} ₹${price.toFixed(2)}`,
    );

    setTargetPrice('');
    setError('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            },
          ]}>
          {/* Handle */}
          <View
            style={[
              styles.handle,
              { backgroundColor: colors.border },
            ]}
          />

          <View style={{ padding: spacing.base, gap: spacing.base }}>
            <View>
              <Text style={{ color: colors.text, fontSize: typography.xl, fontWeight: '700' }}>
                Set Price Alert
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: typography.sm, marginTop: 4 }}>
                {instrument.symbol} · Current: ₹{currentPrice.toFixed(2)}
              </Text>
            </View>

            <Divider />

            {/* Condition Toggle */}
            <View>
              <Text style={{ color: colors.textSecondary, fontSize: typography.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Trigger When
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {(['above', 'below'] as const).map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCondition(c)}
                    style={[
                      styles.conditionBtn,
                      {
                        flex: 1,
                        borderRadius: radius.md,
                        backgroundColor:
                          condition === c
                            ? c === 'above'
                              ? `${colors.profit}20`
                              : `${colors.loss}20`
                            : colors.surfaceElevated,
                        borderColor:
                          condition === c
                            ? c === 'above'
                              ? colors.profit
                              : colors.loss
                            : colors.border,
                      },
                    ]}>
                    <Text
                      style={{
                        color:
                          condition === c
                            ? c === 'above'
                              ? colors.profit
                              : colors.loss
                            : colors.textSecondary,
                        fontWeight: '600',
                        fontSize: typography.base,
                      }}>
                      {c === 'above' ? '▲ Above' : '▼ Below'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Input
              label="Target Price"
              value={targetPrice}
              onChangeText={(t) => {
                setTargetPrice(t);
                setError('');
              }}
              keyboardType="decimal-pad"
              prefix="₹"
              error={error}
              placeholder={currentPrice.toFixed(2)}
              autoFocus
            />

            <Button
              label="Create Alert"
              onPress={handleCreate}
              fullWidth
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  conditionBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
});
