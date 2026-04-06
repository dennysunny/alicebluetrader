// Enhanced version of MarketWatchScreen
// Drop-in replacement for: src/screens/MarketWatch/MarketWatchScreen.tsx
//
// New features added:
// - 300ms debounced search via useDebouncedCallback
// - Long-press row reveals: Alert | Remove actions
// - Tap row navigates to InstrumentDetailScreen (with chart)
// - PriceAlertModal integration for price alerts
// - Empty state with icon
//
// To use: rename this file to MarketWatchScreen.tsx and delete the original

import React, { useEffect, useState, useCallback, memo } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { useMarketStore, useWatchlist, useSearchResults } from '../../store/marketStore';
import { useMarketTicks, useInstrumentQuote } from '../../hooks/useMarketTicks';
import { useDebouncedCallback } from '../../hooks/useDebounce';
import { useTheme } from '../../hooks/useTheme';
import { Badge, Divider, ScreenHeader } from '../../components/common';
import { PriceAlertModal } from '../../components/trading/PriceAlertModal';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import type { WatchlistItem, Instrument } from '../../types';

export function MarketWatchScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation();
  const {
    loadWatchlist, searchInstruments, clearSearch,
    addToWatchlist, removeFromWatchlist, isConnected,
  } = useMarketStore();
  const watchlist = useWatchlist();
  const searchResults = useSearchResults();
  const [query, setQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [alertTarget, setAlertTarget] = useState<WatchlistItem | null>(null);

  useMarketTicks(watchlist.map((item) => ({
    token: item.token, exchange: item.exchange, mode: 'Quote' as const,
  })));

  useEffect(() => { loadWatchlist(); }, [loadWatchlist]);

  const debouncedSearch = useDebouncedCallback((text: string) => {
    if (text.length >= 2) searchInstruments(text);
    else clearSearch();
  }, 300);

  const handleQueryChange = (text: string) => { setQuery(text); debouncedSearch(text); };

  const handleAddInstrument = useCallback((instrument: Instrument) => {
    addToWatchlist(instrument);
    setQuery(''); setIsSearchMode(false); clearSearch();
  }, [addToWatchlist, clearSearch]);

  const handleItemPress = (item: WatchlistItem) => {
    navigation.navigate('InstrumentDetail' as never, { instrument: item } as never);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScreenHeader
        title="Market Watch"
        subtitle={isConnected ? '● Live' : '○ Offline'}
        rightAction={
          <TouchableOpacity
            onPress={() => setIsSearchMode((s) => !s)}
            style={[styles.addBtn, { backgroundColor: colors.primaryMuted, borderRadius: 8 }]}>
            <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>
              {isSearchMode ? 'Cancel' : '+ Add'}
            </Text>
          </TouchableOpacity>
        }
      />

      {isSearchMode && (
        <Animated.View entering={FadeIn.duration(200)} style={{ paddingHorizontal: spacing.base, paddingBottom: spacing.md }}>
          <TextInput
            value={query} onChangeText={handleQueryChange} autoFocus
            placeholder="Search stocks, F&O, Commodity..." placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, borderRadius: 10 }]}
          />
        </Animated.View>
      )}

      {isSearchMode && searchResults.length > 0 && (
        <Animated.View entering={FadeIn} style={[styles.searchResults, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <FlatList
            data={searchResults} keyExtractor={(item) => `${item.exchange}|${item.token}`}
            renderItem={({ item }) => (
              <SearchResultItem instrument={item} onAdd={handleAddInstrument} isAdded={watchlist.some((w) => w.token === item.token)} />
            )}
            ItemSeparatorComponent={Divider} keyboardShouldPersistTaps="handled" style={{ maxHeight: 300 }}
          />
        </Animated.View>
      )}

      <FlashList
        data={watchlist} keyExtractor={(item) => item.token} estimatedItemSize={72}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item, index }) => (
          <WatchlistRow
            item={item} index={index}
            onPress={() => handleItemPress(item)}
            onSetAlert={() => setAlertTarget(item)}
            onRemove={() => removeFromWatchlist(item.token)}
          />
        )}
        ItemSeparatorComponent={Divider}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 36, marginBottom: 12 }}>📈</Text>
            <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: 'center' }}>
              {'No instruments in watchlist.\nTap "+ Add" to search and add stocks.'}
            </Text>
          </View>
        }
      />

      {alertTarget && (
        <PriceAlertModal
          visible={!!alertTarget} instrument={alertTarget}
          currentPrice={0} onClose={() => setAlertTarget(null)}
        />
      )}
    </SafeAreaView>
  );
}

const WatchlistRow = memo(function WatchlistRow({
  item, index, onPress, onSetAlert, onRemove,
}: { item: WatchlistItem; index: number; onPress: () => void; onSetAlert: () => void; onRemove: () => void }) {
  const { colors, spacing, typography, radius } = useTheme();
  const quote = useInstrumentQuote(item.token);
  const [showActions, setShowActions] = useState(false);
  const ltp = quote?.ltp ?? 0;
  const change = quote?.change ?? 0;
  const changePercent = quote?.changePercent ?? 0;
  const isProfit = change >= 0;

  return (
    <Animated.View entering={SlideInRight.delay(index * 25).duration(220)}>
      <TouchableOpacity
        style={[styles.watchlistRow, { paddingHorizontal: spacing.base }]}
        activeOpacity={0.7}
        onPress={showActions ? () => setShowActions(false) : onPress}
        onLongPress={() => setShowActions(true)}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: typography.md, fontWeight: '600' }}>{item.symbol}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <Badge label={item.exchange} size="sm" bgColor={colors.surfaceElevated} color={colors.textSecondary} />
            <Text style={{ color: colors.textMuted, fontSize: typography.xs }}>{item.instrumentType}</Text>
          </View>
        </View>

        {showActions ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => { setShowActions(false); onSetAlert(); }} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full, backgroundColor: `${colors.warning}18` }}>
              <Text style={{ color: colors.warning, fontSize: 11, fontWeight: '600' }}>Alert</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onRemove} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full, backgroundColor: `${colors.loss}18` }}>
              <Text style={{ color: colors.loss, fontSize: 11, fontWeight: '600' }}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: colors.text, fontSize: typography.md, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
              {ltp > 0 ? formatCurrency(ltp) : '—'}
            </Text>
            {ltp > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                <Text style={{ color: isProfit ? colors.profit : colors.loss, fontSize: typography.xs, fontWeight: '600' }}>
                  {isProfit ? '▲' : '▼'} {Math.abs(change).toFixed(2)}
                </Text>
                <View style={[styles.changeBadge, { backgroundColor: isProfit ? `${colors.profit}18` : `${colors.loss}18`, borderRadius: 3 }]}>
                  <Text style={{ color: isProfit ? colors.profit : colors.loss, fontSize: 10, fontWeight: '600' }}>
                    {formatPercent(changePercent)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

const SearchResultItem = memo(function SearchResultItem({ instrument, onAdd, isAdded }: { instrument: Instrument; onAdd: (i: Instrument) => void; isAdded: boolean }) {
  const { colors, spacing, typography, radius } = useTheme();
  return (
    <TouchableOpacity onPress={() => !isAdded && onAdd(instrument)} style={[styles.searchItem, { paddingHorizontal: spacing.base }]} activeOpacity={0.7}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: typography.base, fontWeight: '600' }}>{instrument.symbol}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: typography.xs, marginTop: 2 }} numberOfLines={1}>{instrument.name}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Badge label={instrument.exchange} size="sm" />
        {isAdded ? (
          <Text style={{ color: colors.textMuted, fontSize: typography.xs }}>Added</Text>
        ) : (
          <View style={[styles.addChip, { backgroundColor: colors.primaryMuted, borderRadius: radius.full }]}>
            <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '600' }}>+ Add</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  addBtn: { paddingHorizontal: 12, paddingVertical: 7 },
  searchInput: { height: 44, borderWidth: 1, paddingHorizontal: 14, fontSize: 15, fontWeight: '500' },
  searchResults: { marginHorizontal: 16, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', marginBottom: 8 },
  watchlistRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  changeBadge: { paddingHorizontal: 5, paddingVertical: 2 },
  searchItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  addChip: { paddingHorizontal: 8, paddingVertical: 4 },
  emptyState: { paddingTop: 80, alignItems: 'center', paddingHorizontal: 32 },
});
