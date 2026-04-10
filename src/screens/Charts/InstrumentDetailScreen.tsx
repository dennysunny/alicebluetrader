import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { marketApi } from '../../api/marketApi';
import { Badge, Button, Card, Divider } from '../../components/common';
import { CandleChart } from '../../components/trading/CandleChart';
import { useInstrumentQuote, useMarketTicks } from '../../hooks/useMarketTicks';
import { useTheme } from '../../hooks/useTheme';
import { useMarketStore } from '../../store/marketStore';
import type {
  Candle,
  ChartInterval,
  Instrument,
  RootStackParamList,
  TransactionType,
} from '../../types';
import { formatCurrency, formatVolume } from '../../utils/formatters';

type InstrumentDetailRoute = RouteProp<
  { InstrumentDetail: { instrument: Instrument } },
  'InstrumentDetail'
>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * INSTRUMENT DETAIL SCREEN
 * Shows detailed chart and market data for a specific instrument, with quick buy/sell buttons.
 * Accessed by tapping an instrument from the Market Watch or Dashboard screens.
 * Includes:
 * - Interactive candlestick chart with selectable intervals
 * - Key market data (open, high, low, close, volume, etc.)
 * - Buy/sell pressure indicator
 * - Add/remove from watchlist button
 */
export function InstrumentDetailScreen() {
  const { colors, spacing, typography, radius, margin, padding, shadow } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<InstrumentDetailRoute>();
  const { instrument } = route.params;

  const [candles, setCandles] = useState<Candle[]>([]);
  const [chartInterval, setChartInterval] = useState<ChartInterval>('5m');
  const [isChartLoading, setIsChartLoading] = useState(false);

  const quote = useInstrumentQuote(instrument.token);
  const { addToWatchlist, watchlist } = useMarketStore();

  const isInWatchlist = watchlist.some(w => w.token === instrument.token);

  // Subscribe to live ticks
  useMarketTicks([
    {
      token: instrument.token,
      exchange: instrument.exchange,
      mode: 'SnapQuote',
    },
  ]);

  /**
   * Fetch historical candles for the chart based on selected interval.
   * The duration of history fetched depends on the interval:
   * - 1m: last 1 hour
   * - 5m: last 5 hours
   * - 15m: last 2 days
   * - 30m: last 5 days
   * - 1h: last 30 days
   * - 1d: last 1 year
   * - 1w: last 3 years
   */
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

  /**
   * Fetch candles on mount and whenever the interval changes
   * If the user switches to a different interval, we fetch a new set of candles for that interval.
   */
  useEffect(() => {
    fetchCandles(chartInterval);
  }, [fetchCandles, chartInterval]);

  /**
   * Method to handle interval change from the chart's interval selector.
   * When the user selects a different interval (e.g. from 5m to 15m), we update the state and fetch new candles for that interval.
   * @param interval - The new chart interval selected by the user (e.g. '1m', '5m', '15m', etc.)
   */
  const handleIntervalChange = (interval: ChartInterval) => {
    setChartInterval(interval);
    fetchCandles(interval);
  };

  /**
   * Navigates to the order entry screen for placing a new order.
   * @param side - The transaction type (buy or sell)
   */
  const navigateToOrder = (side: TransactionType) => {
    navigation.navigate('OrderEntry', { instrument, side });
  };

  const ltp = quote?.ltp ?? 0;
  const change = quote?.change ?? 0;
  const changePercent = quote?.changePercent ?? 0;

  return (
    <SafeAreaView style={[styles.flex, styles.transparentbg]} edges={['top']}>
      {/* Navigation Header */}
      <View style={{...styles.navHeader}}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: padding.sm }}
        >
          <Text style={{ color: colors.primaryDark, fontSize: typography['4xl'] }}>
            ‹
          </Text>
        </TouchableOpacity>
        <View style={{ ...styles.flex, marginLeft: margin.sm }}>
          <View
            style={{
              ...styles.flexRow,
              ...styles.alignItemsCenter,
              gap: spacing.xs,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: typography.lg,
                fontWeight: typography['700'],
              }}
            >
              {instrument.symbol}
            </Text>
            <Badge label={instrument.exchange} size="sm" />
          </View>
          <Text
            style={{ color: colors.textSecondary, fontSize: typography.xs }}
          >
            {instrument.name}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => !isInWatchlist && addToWatchlist(instrument)}
          style={{
            paddingHorizontal: padding.lg,
            paddingVertical: padding.md,
            borderRadius: radius.full,
            backgroundColor: isInWatchlist
              ? colors.surfaceElevated
              : colors.primaryMuted,
          }}
        >
          <Text
            style={{
              color: isInWatchlist ? colors.textMuted : colors.primary,
              fontSize: typography.xs,
              fontWeight: typography['600'],
            }}
          >
            {isInWatchlist ? '★ Added' : '☆ Add'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: spacing.base,
          ...styles.paddingBottomLg,
          gap: spacing.base,
        }}
      >
        {/* Chart */}
        <Card>
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
        </Card>

        {/* Market Depth / Quote Details */}
        {quote && (
          <Card style={styles.quoteCard}>
            <Text
              style={{
                color: colors.text,
                fontSize: typography.base,
                fontWeight: typography['700'],
                padding: spacing.base,
                paddingBottom: padding.lg,
              }}
            >
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
                  {i > 0 && <Divider style={{ marginVertical: margin.md }} />}
                  <View style={styles.quoteRow}>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: typography.sm,
                      }}
                    >
                      {label}
                    </Text>
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: typography.sm,
                        fontWeight: typography['700'],
                      }}
                    >
                      {value}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Buy/Sell Pressure Bar */}
            {quote.totalBuyQty + quote.totalSellQty > 0 && (
              <View
                style={{
                  paddingHorizontal: spacing.base,
                  paddingBottom: spacing.base,
                }}
              >
                <Divider style={{ marginBottom: margin.lg }} />
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: typography.xs,
                    marginBottom: margin.md,
                  }}
                >
                  Buy / Sell Pressure
                </Text>
                <View
                  style={{
                    ...styles.flexRow,
                    ...styles.alignItemsCenter,
                    gap: spacing.sm,
                  }}
                >
                  <Text
                    style={{
                      color: colors.profit,
                      fontSize: typography.xs,
                      fontWeight: typography['700'],
                      ...styles.width50,
                    }}
                  >
                    {(
                      (quote.totalBuyQty /
                        (quote.totalBuyQty + quote.totalSellQty)) *
                      100
                    ).toFixed(0)}
                    %
                  </Text>
                  <View
                    style={{
                      ...styles.flex,
                      ...styles.height6,
                      borderRadius: radius.xxs,
                      backgroundColor: colors.surfaceElevated,
                      ...styles.overflowHidden,
                    }}
                  >
                    <View
                      style={{
                        ...styles.height100,
                        width: `${
                          (quote.totalBuyQty /
                            (quote.totalBuyQty + quote.totalSellQty)) *
                          100
                        }%`,
                        backgroundColor: colors.profit,
                        borderRadius: radius.xxs,
                      }}
                    />
                  </View>
                  <Text
                    style={{
                      color: colors.loss,
                      fontSize: typography.xs,
                      fontWeight: typography['700'],
                      ...styles.width50,
                      ...styles.textAlignRight,
                    }}
                  >
                    {(
                      (quote.totalSellQty /
                        (quote.totalBuyQty + quote.totalSellQty)) *
                      100
                    ).toFixed(0)}
                    %
                  </Text>
                </View>
                <View
                  style={{
                    ...styles.flexRow,
                    ...styles.spaceBetween,
                    marginTop: margin.sm,
                  }}
                >
                  <Text
                    style={{ color: colors.textMuted, fontSize: typography.xs }}
                  >
                    Buy: {formatVolume(quote.totalBuyQty)}
                  </Text>
                  <Text
                    style={{ color: colors.textMuted, fontSize: typography.xs }}
                  >
                    Sell: {formatVolume(quote.totalSellQty)}
                  </Text>
                </View>
              </View>
            )}
          </Card>
        )}
      </ScrollView>

      {/* Buy / Sell CTAs */}
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
              ...styles.flexRow,
              gap: spacing.base,
              ...styles.justifyContentCenter,
            }}
          >
            <Button
              label="Buy"
              onPress={() => navigateToOrder('BUY')}
              fullWidth={false}
              halfWidth={true}
              variant="primary"
              style={{
                backgroundColor: colors.profit,
              }}
            />
            <Button
              label="Sell"
              onPress={() => navigateToOrder('SELL')}
              fullWidth={false}
              halfWidth={true}
              variant="danger"
              style={{
                backgroundColor: colors.loss,
              }}
            />
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
}

/**
 * Method to determine how much historical data to fetch based on the selected chart interval.
 * For shorter intervals, we fetch less history to keep the chart performant and relevant.
 * For longer intervals, we fetch more history to provide a comprehensive view of the price action.
 * @param interval - The selected chart interval (e.g. '1m', '5m', '15m', etc.)
 * @returns - The duration in milliseconds for which to fetch historical candles based on the interval
 */
function getHistoryDuration(interval: ChartInterval): number {
  const MS = {
    '1m': 60 * 60 * 1000, // 1 hour of 1m candles
    '5m': 5 * 60 * 60 * 1000, // 5 hours
    '15m': 2 * 24 * 60 * 60 * 1000, // 2 days
    '30m': 5 * 24 * 60 * 60 * 1000, // 5 days
    '1h': 30 * 24 * 60 * 60 * 1000, // 30 days
    '1d': 365 * 24 * 60 * 60 * 1000, // 1 year
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
  },
  flex: {
    flex: 1,
  },
  transparentbg: {
    backgroundColor: 'transparent',
  },
  paddingBottomLg: {
    paddingBottom: 130,
  },
  flexRow: {
    flexDirection: 'row',
  },
  alignItemsCenter: {
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  justifyContentCenter: {
    justifyContent: 'center',
  },
  textAlignRight: {
    textAlign: 'right',
  },
  width50: {
    width: 50,
  },
  height100: {
    height: '100%',
  },
  height6: {
    height: 6,
  },
  overflowHidden: {
    overflow: 'hidden',
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
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    paddingBottom: 18,
  },
});
