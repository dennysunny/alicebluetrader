import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { marketApi } from '../../api/marketApi';
import { useMarketStore } from '../../store/marketStore';
import { useInstrumentQuote, useMarketTicks } from '../../hooks/useMarketTicks';
import { useTheme } from '../../hooks/useTheme';
import { CandleChart } from '../../components/trading/CandleChart';
import { Badge, Button, Divider } from '../../components/common';
import { formatCurrency, formatPercent, formatVolume } from '../../utils/formatters';
import type { Instrument, Candle, ChartInterval, TransactionType } from '../../types';

type InstrumentDetailRoute = RouteProp<
  { InstrumentDetail: { instrument: Instrument } },
  'InstrumentDetail'
>;

export function InstrumentDetailScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<InstrumentDetailRoute>();
  const { instrument } = route.params;

  const [candles, setCandles] = useState<Candle[]>([]);
  const [chartInterval, setChartInterval] = useState<ChartInterval>('5m');
  const [isChartLoading, setIsChartLoading] = useState(false);

  const quote = useInstrumentQuote(instrument.token);
  const { addToWatchlist, watchlist } = useMarketStore();

  const isInWatchlist = watchlist.some((w) => w.token === instrument.token);

  // Subscribe to live ticks
  useMarketTicks([{ token: instrument.token, exchange: instrument.exchange, mode: 'SnapQuote' }]);

  const fetchCandles = useCallback(
    async (interval: ChartInterval) => {
      setIsChartLoading(true);
      try {
        const now = new Date();
        const from = new Date(now.getTime() - getHistoryDuration(interval));
        const data = await marketApi.getCandles(
          instrument.token,
          instrument.exchange,
          interval,
          from.toISOString(),
          now.toISOString(),
        );
        setCandles(data);
      } catch {
        setCandles([]);
      } finally {
        setIsChartLoading(false);
      }
    },
    [instrument],
  );

  useEffect(() => {
    fetchCandles(chartInterval);
  }, [fetchCandles, chartInterval]);

  const handleIntervalChange = (interval: ChartInterval) => {
    setChartInterval(interval);
    fetchCandles(interval);
  };

  const navigateToOrder = (side: TransactionType) => {
    navigation.navigate('OrderEntry' as never, { instrument, side } as never);
  };

  const ltp = quote?.ltp ?? 0;
  const change = quote?.change ?? 0;
  const changePercent = quote?.changePercent ?? 0;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top', 'bottom']}>

      {/* Navigation Header */}
      <View style={[styles.navHeader, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Text style={{ color: colors.primary, fontSize: 22 }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: colors.text, fontSize: typography.lg, fontWeight: '700' }}>
              {instrument.symbol}
            </Text>
            <Badge label={instrument.exchange} size="sm" />
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: typography.xs }}>
            {instrument.name}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => !isInWatchlist && addToWatchlist(instrument)}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: radius.full,
            backgroundColor: isInWatchlist ? colors.surfaceElevated : colors.primaryMuted,
          }}>
          <Text
            style={{
              color: isInWatchlist ? colors.textMuted : colors.primary,
              fontSize: typography.xs,
              fontWeight: '600',
            }}>
            {isInWatchlist ? '★ Added' : '☆ Add'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.base, paddingBottom: 100, gap: spacing.base }}>

        {/* Chart */}
        <CandleChart
          candles={candles}
          isLoading={isChartLoading}
          symbol={instrument.symbol}
          ltp={ltp}
          change={change}
          changePercent={changePercent}
          onIntervalChange={handleIntervalChange}
          selectedInterval={chartInterval}
        />

        {/* Market Depth / Quote Details */}
        {quote && (
          <View
            style={[
              styles.quoteCard,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                borderColor: colors.border,
              },
            ]}>
            <Text
              style={{
                color: colors.text,
                fontSize: typography.base,
                fontWeight: '600',
                padding: spacing.base,
                paddingBottom: 12,
              }}>
              Market Details
            </Text>
            <Divider />

            <View style={{ padding: spacing.base }}>
              {[
                { label: 'Open', value: formatCurrency(quote.open) },
                { label: 'Day High', value: formatCurrency(quote.high) },
                { label: 'Day Low', value: formatCurrency(quote.low) },
                { label: 'Prev Close', value: formatCurrency(quote.close) },
                { label: 'Volume', value: formatVolume(quote.volume) },
                { label: 'Avg Price', value: formatCurrency(quote.avgPrice) },
                {
                  label: 'Upper Circuit',
                  value: formatCurrency(quote.upperCircuit),
                },
                {
                  label: 'Lower Circuit',
                  value: formatCurrency(quote.lowerCircuit),
                },
              ].map(({ label, value }, i) => (
                <View key={label}>
                  {i > 0 && <Divider style={{ marginVertical: 8 }} />}
                  <View style={styles.quoteRow}>
                    <Text style={{ color: colors.textSecondary, fontSize: typography.sm }}>
                      {label}
                    </Text>
                    <Text style={{ color: colors.text, fontSize: typography.sm, fontWeight: '600' }}>
                      {value}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Buy/Sell Pressure Bar */}
            {quote.totalBuyQty + quote.totalSellQty > 0 && (
              <View style={{ paddingHorizontal: spacing.base, paddingBottom: spacing.base }}>
                <Divider style={{ marginBottom: 12 }} />
                <Text style={{ color: colors.textSecondary, fontSize: typography.xs, marginBottom: 8 }}>
                  Buy / Sell Pressure
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: colors.profit, fontSize: typography.xs, fontWeight: '600', width: 50 }}>
                    {((quote.totalBuyQty / (quote.totalBuyQty + quote.totalSellQty)) * 100).toFixed(0)}%
                  </Text>
                  <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.surfaceElevated, overflow: 'hidden' }}>
                    <View
                      style={{
                        height: '100%',
                        width: `${(quote.totalBuyQty / (quote.totalBuyQty + quote.totalSellQty)) * 100}%`,
                        backgroundColor: colors.profit,
                        borderRadius: 3,
                      }}
                    />
                  </View>
                  <Text style={{ color: colors.loss, fontSize: typography.xs, fontWeight: '600', width: 50, textAlign: 'right' }}>
                    {((quote.totalSellQty / (quote.totalBuyQty + quote.totalSellQty)) * 100).toFixed(0)}%
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={{ color: colors.textMuted, fontSize: 10 }}>
                    Buy: {formatVolume(quote.totalBuyQty)}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 10 }}>
                    Sell: {formatVolume(quote.totalSellQty)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Buy / Sell CTAs */}
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
          label="Buy"
          onPress={() => navigateToOrder('BUY')}
          fullWidth={false}
          style={{
            flex: 1,
            backgroundColor: colors.profit,
          }}
        />
        <Button
          label="Sell"
          onPress={() => navigateToOrder('SELL')}
          fullWidth={false}
          style={{
            flex: 1,
            backgroundColor: colors.loss,
          }}
        />
      </View>
    </SafeAreaView>
  );
}

// ============================================================
// HELPERS
// ============================================================

function getHistoryDuration(interval: ChartInterval): number {
  const MS = {
    '1m': 60 * 60 * 1000,           // 1 hour of 1m candles
    '5m': 5 * 60 * 60 * 1000,       // 5 hours
    '15m': 2 * 24 * 60 * 60 * 1000, // 2 days
    '30m': 5 * 24 * 60 * 60 * 1000, // 5 days
    '1h': 30 * 24 * 60 * 60 * 1000, // 30 days
    '1d': 365 * 24 * 60 * 60 * 1000,// 1 year
    '1w': 3 * 365 * 24 * 60 * 60 * 1000, // 3 years
  };
  return MS[interval] ?? MS['1d'];
}

const styles = StyleSheet.create({
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  quoteCard: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
