import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { VictoryChart, VictoryCandlestick, VictoryAxis, VictoryLine, VictoryArea, VictoryTheme } from 'victory-native';
import { useTheme } from '../../hooks/useTheme';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { CHART_INTERVALS } from '../../constants';
import type { Candle, ChartInterval } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================
// CANDLESTICK CHART COMPONENT
// ============================================================

interface CandleChartProps {
  candles: Candle[];
  isLoading: boolean;
  symbol: string;
  ltp: number;
  change: number;
  changePercent: number;
  onIntervalChange: (interval: ChartInterval) => void;
  selectedInterval: ChartInterval;
}

export const CandleChart = memo(function CandleChart({
  candles,
  isLoading,
  symbol,
  ltp,
  change,
  changePercent,
  onIntervalChange,
  selectedInterval,
}: CandleChartProps) {
  const { colors, spacing, typography, radius } = useTheme();
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');

  const isProfit = change >= 0;
  const chartColor = isProfit ? colors.profit : colors.loss;

  // Convert candles to Victory format
  const candleData = candles.map((c) => ({
    x: new Date(c.timestamp),
    open: c.open,
    close: c.close,
    high: c.high,
    low: c.low,
    y: c.close,
  }));

  const lineData = candles.map((c) => ({
    x: new Date(c.timestamp),
    y: c.close,
  }));

  const yDomain = candles.length > 0
    ? [
        Math.min(...candles.map((c) => c.low)) * 0.999,
        Math.max(...candles.map((c) => c.high)) * 1.001,
      ]
    : [0, 100];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: 'transparent',
          borderRadius: radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
      ]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.base }]}>
        <View>
          <Text style={{ color: colors.text, fontSize: typography['2xl'], fontWeight: '700', letterSpacing: -0.5 }}>
            {formatCurrency(ltp)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
            <Text
              style={{
                color: isProfit ? colors.profit : colors.loss,
                fontSize: typography.sm,
                fontWeight: '600',
              }}>
              {isProfit ? '▲' : '▼'} {Math.abs(change).toFixed(2)}
            </Text>
            <View
              style={{
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderRadius: radius.full,
                backgroundColor: isProfit ? `${colors.profit}18` : `${colors.loss}18`,
              }}>
              <Text
                style={{
                  color: isProfit ? colors.profit : colors.loss,
                  fontSize: typography.xs,
                  fontWeight: '600',
                }}>
                {isProfit ? '+' : ''}{changePercent.toFixed(2)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Chart type toggle */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.surfaceElevated,
            borderRadius: radius.md,
            padding: 3,
          }}>
          {(['candle', 'line'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setChartType(type)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: radius.sm,
                backgroundColor: chartType === type ? colors.primary : 'transparent',
              }}>
              <Text
                style={{
                  color: chartType === type ? colors.textInverse : colors.textSecondary,
                  fontSize: typography.xs,
                  fontWeight: '600',
                }}>
                {type === 'candle' ? '🕯' : '📈'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Interval Selector */}
      <View style={[styles.intervalRow, { paddingHorizontal: spacing.base }]}>
        {CHART_INTERVALS.map((interval) => (
          <TouchableOpacity
            key={interval.value}
            onPress={() => onIntervalChange(interval.value)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: radius.full,
              backgroundColor:
                selectedInterval === interval.value
                  ? colors.primaryMuted
                  : 'transparent',
            }}>
            <Text
              style={{
                color:
                  selectedInterval === interval.value
                    ? colors.primary
                    : colors.textMuted,
                fontSize: typography.xs,
                fontWeight: selectedInterval === interval.value ? '700' : '400',
              }}>
              {interval.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart */}
      <View style={{ height: 280 }}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : candles.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={{ color: colors.textMuted, fontSize: typography.sm }}>
              No chart data available
            </Text>
          </View>
        ) : (
          <VictoryChart
            width={SCREEN_WIDTH - 32}
            height={280}
            padding={{ left: 55, right: 15, top: 10, bottom: 40 }}
            domainPadding={{ x: 10 }}
            domain={{ y: yDomain as [number, number] }}>

            <VictoryAxis
              style={{
                axis: { stroke: colors.border },
                tickLabels: {
                  fill: colors.textMuted,
                  fontSize: 9,
                },
                grid: { stroke: colors.borderFaint },
              }}
              tickFormat={(t: Date) => {
                const d = new Date(t);
                return selectedInterval === '1d' || selectedInterval === '1w'
                  ? `${d.getDate()}/${d.getMonth() + 1}`
                  : `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
              }}
              tickCount={5}
            />

            <VictoryAxis
              dependentAxis
              style={{
                axis: { stroke: 'transparent' },
                tickLabels: {
                  fill: colors.textMuted,
                  fontSize: 9,
                },
                grid: { stroke: colors.borderFaint, strokeDasharray: '4,4' },
              }}
              tickFormat={(t: number) =>
                t >= 1000 ? `${(t / 1000).toFixed(1)}K` : t.toFixed(0)
              }
            />

            {chartType === 'candle' ? (
              <VictoryCandlestick
                data={candleData}
                candleColors={{ positive: colors.profit, negative: colors.loss }}
                style={{
                  data: {
                    strokeWidth: 1,
                    stroke: ({ datum }: { datum: typeof candleData[0] }) =>
                      datum.close >= datum.open ? colors.profit : colors.loss,
                  },
                }}
                wickStrokeWidth={1}
                candleWidth={Math.max(4, (SCREEN_WIDTH - 80) / candles.length - 2)}
              />
            ) : (
              <>
                <VictoryArea
                  data={lineData}
                  style={{
                    data: {
                      fill: `${chartColor}18`,
                      stroke: chartColor,
                      strokeWidth: 1.5,
                    },
                  }}
                  interpolation="monotoneX"
                />
                <VictoryLine
                  data={lineData}
                  style={{
                    data: {
                      stroke: chartColor,
                      strokeWidth: 2,
                    },
                  }}
                  interpolation="monotoneX"
                />
              </>
            )}
          </VictoryChart>
        )}
      </View>

      {/* OHLC Summary */}
      {candles.length > 0 && (
        <View
          style={[
            styles.ohlcRow,
            {
              borderTopColor: colors.border,
              paddingHorizontal: spacing.base,
            },
          ]}>
          {[
            { label: 'O', value: candles[candles.length - 1]?.open },
            { label: 'H', value: candles[candles.length - 1]?.high },
            { label: 'L', value: candles[candles.length - 1]?.low },
            { label: 'C', value: candles[candles.length - 1]?.close },
          ].map(({ label, value }) => (
            <View key={label} style={{ alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted, fontSize: 10 }}>{label}</Text>
              <Text
                style={{
                  color: colors.text,
                  fontSize: typography.xs,
                  fontWeight: '600',
                  fontVariant: ['tabular-nums'],
                }}>
                {value?.toFixed(2) ?? '—'}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 16,
    paddingBottom: 12,
  },
  intervalRow: {
    flexDirection: 'row',
    gap: 2,
    paddingBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ohlcRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
