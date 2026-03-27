import React, { memo } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { VictoryChart, VictoryLine, VictoryArea, VictoryAxis, VictoryScatter } from 'victory-native';
import { useTheme } from '../../hooks/useTheme';
import { formatCurrency } from '../../utils/formatters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================
// P&L SPARKLINE — compact version for Dashboard
// ============================================================

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export const PnlSparkline = memo(function PnlSparkline({
  data,
  width = 80,
  height = 32,
  color,
}: SparklineProps) {
  const { colors } = useTheme();
  const chartColor = color ?? (data[data.length - 1] >= data[0] ? colors.profit : colors.loss);

  if (data.length < 2) return null;

  const points = data.map((y, x) => ({ x, y }));

  return (
    <VictoryLine
      data={points}
      width={width}
      height={height}
      padding={2}
      style={{
        data: { stroke: chartColor, strokeWidth: 1.5 },
      }}
      interpolation="monotoneX"
    />
  );
});

// ============================================================
// FULL P&L CHART — for Portfolio screen
// ============================================================

export interface PnlDataPoint {
  date: string;
  pnl: number;
  investment: number;
  value: number;
}

interface PnlChartProps {
  data: PnlDataPoint[];
  title?: string;
}

export const PnlChart = memo(function PnlChart({ data, title }: PnlChartProps) {
  const { colors, spacing, typography, radius } = useTheme();

  if (data.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: radius.lg, borderColor: colors.border }]}>
        <Text style={{ color: colors.textMuted, textAlign: 'center', padding: 32, fontSize: typography.sm }}>
          No P&L history available
        </Text>
      </View>
    );
  }

  const pnlValues = data.map((d) => d.pnl);
  const minPnl = Math.min(...pnlValues);
  const maxPnl = Math.max(...pnlValues);
  const padding = Math.abs(maxPnl - minPnl) * 0.1 || 100;

  const lastPoint = data[data.length - 1];
  const firstPoint = data[0];
  const totalChange = lastPoint.pnl - firstPoint.pnl;
  const isProfit = lastPoint.pnl >= 0;
  const chartColor = isProfit ? colors.profit : colors.loss;

  const chartData = data.map((d, i) => ({ x: i, y: d.pnl }));

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: radius.lg, borderColor: colors.border }]}>
      {/* Header */}
      <View style={{ padding: spacing.base, paddingBottom: 8 }}>
        {title && (
          <Text style={{ color: colors.text, fontSize: typography.md, fontWeight: '600', marginBottom: 8 }}>
            {title}
          </Text>
        )}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text style={{ color: colors.textSecondary, fontSize: typography.xs }}>Total P&L</Text>
            <Text style={{ color: isProfit ? colors.profit : colors.loss, fontSize: typography['2xl'], fontWeight: '700', letterSpacing: -0.5 }}>
              {isProfit ? '+' : ''}{formatCurrency(lastPoint.pnl)}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: colors.textSecondary, fontSize: typography.xs }}>Change</Text>
            <Text style={{ color: totalChange >= 0 ? colors.profit : colors.loss, fontSize: typography.md, fontWeight: '600' }}>
              {totalChange >= 0 ? '+' : ''}{formatCurrency(totalChange)}
            </Text>
          </View>
        </View>
      </View>

      {/* Chart */}
      <VictoryChart
        width={SCREEN_WIDTH - 48}
        height={180}
        padding={{ left: 58, right: 16, top: 10, bottom: 36 }}
        domain={{ y: [minPnl - padding, maxPnl + padding] }}>

        {/* Zero line */}
        <VictoryLine
          data={[{ x: 0, y: 0 }, { x: data.length - 1, y: 0 }]}
          style={{ data: { stroke: colors.border, strokeWidth: 1, strokeDasharray: '4,4' } }}
        />

        <VictoryAxis
          style={{
            axis: { stroke: colors.border },
            tickLabels: { fill: colors.textMuted, fontSize: 9 },
          }}
          tickFormat={(t: number) => {
            const d = data[Math.round(t)];
            return d ? d.date.slice(5) : ''; // MM-DD
          }}
          tickCount={5}
        />

        <VictoryAxis
          dependentAxis
          style={{
            axis: { stroke: 'transparent' },
            tickLabels: { fill: colors.textMuted, fontSize: 9 },
            grid: { stroke: colors.borderFaint, strokeDasharray: '4,4' },
          }}
          tickFormat={(t: number) => {
            if (Math.abs(t) >= 100000) return `${(t / 100000).toFixed(1)}L`;
            if (Math.abs(t) >= 1000) return `${(t / 1000).toFixed(0)}K`;
            return t.toFixed(0);
          }}
        />

        {/* Area fill */}
        <VictoryArea
          data={chartData}
          style={{
            data: {
              fill: `${chartColor}15`,
              stroke: chartColor,
              strokeWidth: 2,
            },
          }}
          interpolation="monotoneX"
        />

        {/* Last point dot */}
        <VictoryScatter
          data={[chartData[chartData.length - 1]]}
          size={4}
          style={{ data: { fill: chartColor, stroke: colors.surface, strokeWidth: 2 } }}
        />
      </VictoryChart>

      {/* Investment vs Value Bar */}
      {lastPoint.investment > 0 && (
        <View style={{ paddingHorizontal: spacing.base, paddingBottom: spacing.base }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ color: colors.textMuted, fontSize: 10 }}>
              Invested: {formatCurrency(lastPoint.investment, { compact: true })}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 10 }}>
              Current: {formatCurrency(lastPoint.value, { compact: true })}
            </Text>
          </View>
          <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.surfaceElevated, overflow: 'hidden' }}>
            <View
              style={{
                height: '100%',
                width: `${Math.min(100, (lastPoint.value / lastPoint.investment) * 100)}%`,
                backgroundColor: isProfit ? colors.profit : colors.loss,
                borderRadius: 2,
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
});

// ============================================================
// MINI HOLDINGS DONUT — portfolio allocation visualization
// ============================================================

interface AllocationSlice {
  label: string;
  value: number;
  color: string;
}

interface AllocationChartProps {
  slices: AllocationSlice[];
  total: number;
}

export const AllocationChart = memo(function AllocationChart({
  slices,
  total,
}: AllocationChartProps) {
  const { colors, spacing, typography, radius } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: radius.lg, borderColor: colors.border, padding: spacing.base }]}>
      <Text style={{ color: colors.text, fontSize: typography.md, fontWeight: '600', marginBottom: 12 }}>
        Portfolio Allocation
      </Text>

      {slices.map((slice, i) => {
        const pct = total > 0 ? (slice.value / total) * 100 : 0;
        return (
          <View key={slice.label} style={{ marginBottom: i < slices.length - 1 ? 10 : 0 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: slice.color }} />
                <Text style={{ color: colors.text, fontSize: typography.sm, fontWeight: '500' }}>
                  {slice.label}
                </Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: typography.sm }}>
                {formatCurrency(slice.value, { compact: true })} ({pct.toFixed(1)}%)
              </Text>
            </View>
            <View style={{ height: 5, borderRadius: 3, backgroundColor: colors.surfaceElevated, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${pct}%`, backgroundColor: slice.color, borderRadius: 3 }} />
            </View>
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});
