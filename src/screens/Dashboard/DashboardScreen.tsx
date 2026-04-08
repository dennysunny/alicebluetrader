import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  usePortfolioStore,
  usePortfolioSummary,
  useFunds,
} from '../../store/portfolioStore';
import { useUserProfile } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import { Card, PnlText, Divider } from '../../components/common';
import {
  formatCurrency,
  formatPercent,
  formatDate,
} from '../../utils/formatters';
import { GlowType } from '../../types';

// ============================================================
// DASHBOARD SCREEN
// ============================================================

export function DashboardScreen() {
  const { colors, spacing, typography, radius, margin } = useTheme();
  const { fetchAll, isLoading, positions, holdings } = usePortfolioStore();
  const summary = usePortfolioSummary();
  const funds = useFunds();
  const profile = useUserProfile();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onRefresh = useCallback(() => {
    fetchAll();
  }, [fetchAll]);

  const today = formatDate(Date.now());

  return (
    <SafeAreaView style={[styles.flex, styles.transparentbg]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={{ ...styles.bottomPadding, gap: spacing.sm }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: spacing.base }]}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              Good morning,
            </Text>
            <Text style={[styles.name, { color: colors.text }]}>
              {profile?.name ?? 'Trader'}
            </Text>
          </View>
          <View
            style={[
              styles.dateBadge,
              {
                backgroundColor: colors.surfaceElevated,
                borderRadius: radius.full,
              },
            ]}
          >
            <Text
              style={{ color: colors.textSecondary, fontSize: typography.xs }}
            >
              {today}
            </Text>
          </View>
        </View>

        {/* Portfolio Value Card */}
        <View
          style={{ paddingHorizontal: spacing.base, marginTop: spacing.md }}
        >
          <Card
            style={styles.portfolioCard}
            glow={summary.totalPnl >= 0 ? GlowType.Profit : GlowType.Loss}
          >
            <View style={{ padding: spacing.base, paddingTop: spacing.lg }}>
              <Text
                style={{ color: colors.textSecondary, fontSize: typography.sm }}
              >
                Total Portfolio Value
              </Text>
              <Text
                style={{
                  color: colors.text,
                  fontSize: typography['4xl'],
                  ...styles.portfolioValue,
                }}
              >
                {formatCurrency(summary.currentValue, { compact: true })}
              </Text>
              <View style={styles.pnlText}>
                <PnlText
                  value={summary.totalPnl}
                  style={{ fontSize: typography.md }}
                  format={v => formatCurrency(v)}
                />
                <PnlText
                  value={summary.totalPnlPercent}
                  style={{ fontSize: typography.sm }}
                  format={v => formatPercent(v)}
                />
              </View>

              <Divider style={{ marginVertical: spacing.md }} />

              {/* Stats row */}
              <View style={styles.statsRow}>
                <StatItem
                  label="Invested"
                  value={formatCurrency(summary.totalInvestment, {
                    compact: true,
                  })}
                  valueColor={colors.text}
                />
                <View
                  style={[
                    styles.statDivider,
                    { backgroundColor: colors.border },
                  ]}
                />
                <StatItem
                  label="Day's P&L"
                  value={`${summary.dayPnl >= 0 ? '+' : ''}${formatCurrency(
                    summary.dayPnl,
                  )}`}
                  valueColor={summary.dayPnl >= 0 ? colors.profit : colors.loss}
                />
                <View
                  style={[
                    styles.statDivider,
                    { backgroundColor: colors.border },
                  ]}
                />
                <StatItem
                  label="Holdings"
                  value={summary.holdingsCount.toString()}
                  valueColor={colors.text}
                />
              </View>
            </View>
          </Card>
        </View>

        {/* Available Funds */}
        <View
          style={{ paddingHorizontal: spacing.base, marginTop: spacing.base }}
        >
          <Card style={{ padding: spacing.base }}>
            <View style={styles.fundsHeader}>
              <Text
                style={{
                  color: colors.text,
                  fontSize: typography.md,
                  fontWeight: typography[600],
                }}
              >
                Available Funds
              </Text>
              <TouchableOpacity>
                <Text
                  style={{ color: colors.primary, fontSize: typography.sm }}
                >
                  Add Funds
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.statsRow}>
              <StatItem
                label="Available"
                value={formatCurrency(funds?.availableBalance ?? 0, {
                  compact: true,
                })}
                valueColor={colors.profit}
              />
              <View
                style={[styles.statDivider, { backgroundColor: colors.border }]}
              />
              <StatItem
                label="Used Margin"
                value={formatCurrency(funds?.usedMargin ?? 0, {
                  compact: true,
                })}
                valueColor={colors.text}
              />
              <View
                style={[styles.statDivider, { backgroundColor: colors.border }]}
              />
              <StatItem
                label="Total"
                value={formatCurrency(funds?.totalMargin ?? 0, {
                  compact: true,
                })}
                valueColor={colors.text}
              />
            </View>
          </Card>
        </View>

        {/* Open Positions Summary */}
        {positions.filter(p => p.netQty !== 0).length > 0 && (
          <View
            style={{ paddingHorizontal: spacing.base, marginTop: spacing.base }}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Open Positions
              </Text>
              <Text style={{ color: colors.primary, fontSize: typography.sm }}>
                {positions.filter(p => p.netQty !== 0).length} active
              </Text>
            </View>

            <Card>
              {positions
                .filter(p => p.netQty !== 0)
                .slice(0, 5)
                .map((pos, idx, arr) => (
                  <View key={pos.token} style={{ marginBottom: spacing.sm }}>
                    <View
                      style={[
                        styles.positionRow,
                        {
                          paddingHorizontal: spacing.base,
                          paddingVertical: spacing.md,
                        },
                      ]}
                    >
                      <View style={styles.flex}>
                        <Text
                          style={{
                            color: colors.text,
                            fontWeight: typography[600],
                            fontSize: typography.base,
                          }}
                        >
                          {pos.symbol}
                        </Text>
                        <Text
                          style={{
                            color: colors.textSecondary,
                            fontSize: typography.xs,
                            marginTop: margin.sm,
                          }}
                        >
                          {pos.exchange} · {pos.productType} · Qty: {pos.netQty}
                        </Text>
                      </View>
                      <View style={styles.alignFlexEnd}>
                        <Text
                          style={{
                            color: colors.text,
                            fontWeight: typography[600],
                            fontSize: typography.base,
                          }}
                        >
                          {formatCurrency(pos.ltp)}
                        </Text>
                        <PnlText
                          value={pos.pnl}
                          style={{
                            fontSize: typography.xs,
                            marginTop: margin.sm,
                          }}
                          format={v =>
                            `${v >= 0 ? '+' : ''}${formatCurrency(v)}`
                          }
                        />
                      </View>
                    </View>
                    {idx < arr.length - 1 && <Divider />}
                  </View>
                ))}
            </Card>
          </View>
        )}

        {/* Holdings Summary */}
        {holdings.length > 0 && (
          <View
            style={{ paddingHorizontal: spacing.base, marginTop: spacing.base }}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Holdings
              </Text>
              <Text style={{ color: colors.primary, fontSize: typography.sm }}>
                {holdings.length} stocks
              </Text>
            </View>

            <Card>
              {holdings.slice(0, 5).map((holding, idx, arr) => (
                <View key={holding.token}>
                  <View
                    style={[
                      styles.positionRow,
                      {
                        paddingHorizontal: spacing.base,
                        paddingVertical: spacing.md,
                      },
                    ]}
                  >
                    <View style={styles.flex}>
                      <Text
                        style={{
                          color: colors.text,
                          fontWeight: typography[600],
                          fontSize: typography.base,
                        }}
                      >
                        {holding.symbol}
                      </Text>
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: typography.xs,
                          marginTop: margin.sm,
                        }}
                      >
                        {holding.quantity} shares · Avg{' '}
                        {formatCurrency(holding.avgPrice)}
                      </Text>
                    </View>
                    <View style={styles.alignFlexEnd}>
                      <Text
                        style={{
                          color: colors.text,
                          fontWeight: typography[600],
                          fontSize: typography.base,
                        }}
                      >
                        {formatCurrency(holding.ltp)}
                      </Text>
                      <PnlText
                        value={holding.pnlPercent}
                        style={{
                          fontSize: typography.xs,
                          marginTop: margin.sm,
                        }}
                        format={v => formatPercent(v)}
                      />
                    </View>
                  </View>
                  {idx < arr.length - 1 && <Divider />}
                </View>
              ))}
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function StatItem({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor: string;
}) {
  const { colors, typography, margin } = useTheme();
  return (
    <View style={[styles.alignFlexCenter, styles.flex]}>
      <Text
        style={{
          color: valueColor,
          fontSize: typography.base,
          fontWeight: typography[700],
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          color: colors.textMuted,
          fontSize: typography.xs,
          marginTop: margin.sm,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  flex: {
    flex: 1,
  },
  transparentbg: {
    backgroundColor: 'transparent',
  },
  bottomPadding: {
    paddingBottom: 120,
  },
  greeting: { fontSize: 13 },
  name: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4, marginTop: 2 },
  dateBadge: { paddingHorizontal: 12, paddingVertical: 6 },
  portfolioCard: { overflow: 'hidden' },
  portfolioValue: {
    fontWeight: '700',
    letterSpacing: -1,
    marginTop: 4,
  },
  pnlText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  cardAccent: { height: 4, width: '100%' },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statDivider: { width: StyleSheet.hairlineWidth, height: 32 },
  fundsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', letterSpacing: -0.3 },
  positionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alignFlexEnd: {
    alignItems: 'flex-end',
  },
  alignFlexCenter: {
    alignItems: 'center',
  },
});
