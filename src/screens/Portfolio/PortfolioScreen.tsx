import React, { useEffect, useState, memo } from 'react';
import { View, Text, TouchableOpacity, RefreshControl, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { usePortfolioStore, usePositions, useHoldings, useFunds, usePortfolioSummary } from '../../store/portfolioStore';
import { useTheme } from '../../hooks/useTheme';
import { ScreenHeader, PnlText, Divider } from '../../components/common';
import { PnlChart, AllocationChart, type PnlDataPoint } from '../../components/trading/PnlChart';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import type { Position, Holding } from '../../types';
import dayjs from 'dayjs';

type TabType = 'overview' | 'positions' | 'holdings';

function generatePnlHistory(currentPnl: number, days = 30): PnlDataPoint[] {
  const points: PnlDataPoint[] = [];
  let running = currentPnl * 0.2;
  const step = (currentPnl - running) / days;
  for (let i = days; i >= 0; i--) {
    const noise = (Math.random() - 0.4) * Math.abs(step) * 2;
    running = i === 0 ? currentPnl : running + step + noise;
    points.push({ date: dayjs().subtract(i, 'day').format('YYYY-MM-DD'), pnl: running, investment: 124575, value: 124575 + running });
  }
  return points;
}

export function PortfolioScreen() {
  const { colors, spacing, typography } = useTheme();
  const { fetchAll, isLoading, squareOffPosition } = usePortfolioStore();
  const positions = usePositions();
  const holdings = useHoldings();
  const summary = usePortfolioSummary();
  const funds = useFunds();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const activePositions = positions.filter((p) => p.netQty !== 0);
  const pnlHistory = generatePnlHistory(summary.totalPnl);
  const COLORS = ['#00D09C', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444'];
  const allocationSlices = holdings.slice(0, 5).map((h, i) => ({ label: h.symbol, value: h.currentValue, color: COLORS[i % COLORS.length] }));
  const allocationTotal = allocationSlices.reduce((s, sl) => s + sl.value, 0);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const TABS: { key: TabType; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'positions', label: `Positions (${activePositions.length})` },
    { key: 'holdings', label: `Holdings (${holdings.length})` },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScreenHeader title="Portfolio" />
      <View style={[styles.summaryBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <SummaryTile label="Total P&L" value={summary.totalPnl} subtitle={formatPercent(summary.totalPnlPercent)} isPnl />
        <View style={[styles.dividerV, { backgroundColor: colors.border }]} />
        <SummaryTile label="Day's P&L" value={summary.dayPnl} subtitle="today" isPnl />
        <View style={[styles.dividerV, { backgroundColor: colors.border }]} />
        <SummaryTile label="Invested" value={summary.totalInvestment} subtitle={`${summary.holdingsCount} stocks`} isPnl={false} />
      </View>
      <View style={[styles.tabsContainer, { marginHorizontal: spacing.base, borderColor: colors.border }]}>
        {TABS.map((tab) => (
          <TouchableOpacity key={tab.key} onPress={() => setActiveTab(tab.key)} style={[styles.tab, activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}>
            <Text style={{ color: activeTab === tab.key ? colors.primary : colors.textSecondary, fontWeight: activeTab === tab.key ? '600' : '400', fontSize: 13 }}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {activeTab === 'overview' ? (
        <ScrollView refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchAll} tintColor={colors.primary} />} contentContainerStyle={{ padding: spacing.base, gap: spacing.base, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          {funds && (
            <View style={[styles.fundsCard, { backgroundColor: colors.surface, borderRadius: 12, borderColor: colors.border }]}>
              <Text style={{ color: colors.text, fontSize: typography.md, fontWeight: '600', marginBottom: 12 }}>Available Funds</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <FundsItem label="Available" value={formatCurrency(funds.availableBalance, { compact: true })} color={colors.profit} />
                <FundsItem label="Used Margin" value={formatCurrency(funds.usedMargin, { compact: true })} color={colors.text} />
                <FundsItem label="Total" value={formatCurrency(funds.totalMargin, { compact: true })} color={colors.text} />
              </View>
              <View style={{ marginTop: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: colors.textMuted, fontSize: 10 }}>Margin Utilization</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 10 }}>{funds.totalMargin > 0 ? ((funds.usedMargin / funds.totalMargin) * 100).toFixed(1) : 0}%</Text>
                </View>
                <View style={{ height: 5, borderRadius: 3, backgroundColor: colors.surfaceElevated, overflow: 'hidden' }}>
                  <View style={{ height: '100%', width: `${funds.totalMargin > 0 ? (funds.usedMargin / funds.totalMargin) * 100 : 0}%`, backgroundColor: funds.usedMargin / funds.totalMargin > 0.8 ? colors.loss : colors.primary, borderRadius: 3 }} />
                </View>
              </View>
            </View>
          )}
          <PnlChart data={pnlHistory} title="30-Day P&L Trend" />
          {allocationSlices.length > 0 && <AllocationChart slices={allocationSlices} total={allocationTotal} />}
        </ScrollView>
      ) : (
        <FlashList
          data={activeTab === 'positions' ? activePositions as (Position | Holding)[] : holdings as (Position | Holding)[]}
          keyExtractor={(item) => item.token}
          estimatedItemSize={110}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchAll} tintColor={colors.primary} />}
          renderItem={({ item }) => activeTab === 'positions' ? <PositionRow position={item as Position} onSquareOff={squareOffPosition} /> : <HoldingRow holding={item as Holding} />}
          ItemSeparatorComponent={Divider}
          ListEmptyComponent={<View style={styles.emptyState}><Text style={{ color: colors.textMuted, fontSize: 14, textAlign: 'center' }}>{activeTab === 'positions' ? 'No open positions' : 'No holdings'}</Text></View>}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </SafeAreaView>
  );
}

const PositionRow = memo(function PositionRow({ position, onSquareOff }: { position: Position; onSquareOff: (p: Position) => Promise<string> }) {
  const { colors, spacing, typography, radius } = useTheme();
  const isLong = position.netQty > 0;
  const handleSquareOff = () => Alert.alert('Square Off', `Exit ${Math.abs(position.netQty)} qty of ${position.symbol}?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Square Off', style: 'destructive', onPress: () => onSquareOff(position) }]);
  return (
    <View style={[styles.listRow, { paddingHorizontal: spacing.base, paddingVertical: spacing.md }]}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.xs, backgroundColor: isLong ? `${colors.profit}18` : `${colors.loss}18` }}>
            <Text style={{ color: isLong ? colors.profit : colors.loss, fontSize: 10, fontWeight: '700' }}>{isLong ? 'LONG' : 'SHORT'}</Text>
          </View>
          <Text style={{ color: colors.text, fontSize: typography.md, fontWeight: '600' }}>{position.symbol}</Text>
        </View>
        <Text style={{ color: colors.textSecondary, fontSize: typography.xs }}>{position.exchange} · {position.productType} · Qty: {Math.abs(position.netQty)} · Avg: {formatCurrency(position.netAvgPrice)}</Text>
        <Text style={{ color: colors.text, fontSize: typography.sm, marginTop: 4 }}>LTP: <Text style={{ fontWeight: '600' }}>{formatCurrency(position.ltp)}</Text></Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <PnlText value={position.pnl} style={{ fontSize: typography.md }} format={(v) => `${v >= 0 ? '+' : ''}${formatCurrency(v)}`} />
        <PnlText value={position.dayChangePercent} style={{ fontSize: typography.xs, marginTop: 2 }} format={formatPercent} />
        <TouchableOpacity onPress={handleSquareOff} style={{ marginTop: 8, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full, backgroundColor: `${colors.loss}18` }}>
          <Text style={{ color: colors.loss, fontSize: 11, fontWeight: '600' }}>Exit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const HoldingRow = memo(function HoldingRow({ holding }: { holding: Holding }) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={[styles.listRow, { paddingHorizontal: spacing.base, paddingVertical: spacing.md }]}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: typography.md, fontWeight: '600', marginBottom: 4 }}>{holding.symbol}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: typography.xs }}>{holding.quantity} shares · Avg {formatCurrency(holding.avgPrice)}</Text>
        <Text style={{ color: colors.text, fontSize: typography.sm, marginTop: 4 }}>Current: {formatCurrency(holding.ltp)}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <PnlText value={holding.pnl} style={{ fontSize: typography.md }} format={(v) => `${v >= 0 ? '+' : ''}${formatCurrency(v)}`} />
        <PnlText value={holding.pnlPercent} style={{ fontSize: typography.xs, marginTop: 2 }} format={formatPercent} />
      </View>
    </View>
  );
});

function SummaryTile({ label, value, subtitle, isPnl }: { label: string; value: number; subtitle: string; isPnl: boolean }) {
  const { colors, typography } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 12 }}>
      <Text style={{ color: colors.textMuted, fontSize: 10, marginBottom: 4 }}>{label}</Text>
      {isPnl ? <PnlText value={value} style={{ fontSize: typography.sm }} format={(v) => formatCurrency(v, { compact: true })} /> : <Text style={{ color: colors.text, fontSize: typography.sm, fontWeight: '600' }}>{formatCurrency(value, { compact: true })}</Text>}
      <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 2 }}>{subtitle}</Text>
    </View>
  );
}

function FundsItem({ label, value, color }: { label: string; value: string; color: string }) {
  const { colors, typography } = useTheme();
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color, fontSize: typography.md, fontWeight: '700' }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryBar: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderTopWidth: StyleSheet.hairlineWidth },
  dividerV: { width: StyleSheet.hairlineWidth },
  tabsContainer: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 4 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomColor: 'transparent', borderBottomWidth: 2 },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  emptyState: { paddingTop: 80, alignItems: 'center' },
  fundsCard: { padding: 14, borderWidth: StyleSheet.hairlineWidth },
});
