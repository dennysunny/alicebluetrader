import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Badge, Divider, ScreenHeader } from '../../components/common';
import { PriceAlertModal } from '../../components/trading/PriceAlertModal';
import { useDebouncedCallback } from '../../hooks/useDebounce';
import { useInstrumentQuote, useMarketTicks } from '../../hooks/useMarketTicks';
import { useTheme } from '../../hooks/useTheme';
import {
  useMarketStore,
  useSearchResults,
  useWatchlist,
} from '../../store/marketStore';
import type {
  Instrument,
  RootStackParamList,
  WatchlistItem,
} from '../../types';
import { formatCurrency, formatPercent } from '../../utils/formatters';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Component for the Market Watch screen, which displays the user's watchlist of instruments with live price updates, and
 * allows adding new instruments via search.
 * Features:
 * - Displays a list of watchlist items with their LTP and change, updated in real-time via market ticks subscription.
 * - Allows adding new instruments to the watchlist by searching for them.
 * - Search results are shown in a dropdown, and tapping a result adds it to the watchlist.
 * - Tapping a watchlist item navigates to the Instrument Detail screen for that instrument.
 * - Long-pressing a watchlist item reveals options to set a price alert or remove it from the watchlist.
 * - Shows connection status (Live/Offline) in the header subtitle.
 */
export function MarketWatchScreen() {
  const { colors, spacing, radius, margin, typography } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const {
    loadWatchlist,
    searchInstruments,
    clearSearch,
    addToWatchlist,
    removeFromWatchlist,
    isConnected,
  } = useMarketStore();
  const watchlist = useWatchlist();
  const searchResults = useSearchResults();
  const [query, setQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [alertTarget, setAlertTarget] = useState<WatchlistItem | null>(null);

  /**
   * Hook to subscribe to live market ticks for all instruments in the watchlist.
   * It takes the list of watchlist items and subscribes to their market data updates, ensuring that the displayed LTP and change values are updated in real-time as new ticks arrive.
   * The hook is called with an array of objects containing the token, exchange, and mode for each instrument in the watchlist.
   * Whenever the watchlist changes (e.g. adding/removing instruments), this hook will re-subscribe to the updated list of instruments.
   */
  useMarketTicks(
    watchlist.map(item => ({
      token: item.token,
      exchange: item.exchange,
      mode: 'Quote' as const,
    })),
  );

  /**
   * Effect to load the watchlist when the component mounts.
   * It calls the loadWatchlist method from the market store, which fetches the user's watchlist from the API and updates the state.
   * This ensures that the watchlist is populated with the latest data when the user navigates to the Market Watch screen.
   * The empty dependency array means this effect runs only once on mount.
   * If loadWatchlist changes (unlikely), it would re-run, but typically this is a stable function from the store.
   */
  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  /**
   * Method to handle changes in the search input when adding instruments to the watchlist.
   * It updates the local query state and triggers a debounced search function that queries the API for matching instruments.
   * The debouncing ensures that we don't flood the API with requests on every keystroke, but only after the user has paused typing for 300ms.
   * If the query is less than 2 characters, it clears the search results.
   * This method is called on the onChangeText event of the TextInput for searching instruments.
   * It allows users to find and add new instruments to their watchlist by typing in the search box.
   * @param text - the current text in the search input, used to query for matching instruments to add to the watchlist
   */
  const debouncedSearch = useDebouncedCallback((text: string) => {
    if (text.length >= 2) searchInstruments(text);
    else clearSearch();
  }, 300);

  /**
   * Method to handle changes in the search input when adding instruments to the watchlist.
   * It updates the local query state and triggers a debounced search function that queries the API for matching instruments.
   * The debouncing ensures that we don't flood the API with requests on every keystroke, but only after the user has paused typing for 300ms.
   * If the query is less than 2 characters, it clears the search results.
   * This method is called on the onChangeText event of the TextInput for searching instruments.
   * It allows users to find and add new instruments to their watchlist by typing in the search box.
   * @param text - the current text in the search input, used to query for matching instruments to add to the watchlist
   */
  const handleQueryChange = (text: string) => {
    setQuery(text);
    debouncedSearch(text);
  };

  /**
   * Method to handle adding an instrument to the watchlist. Called when tapping the "Add" button on a search result item.
   * It adds the selected instrument to the watchlist, clears the search query, and exits search mode.
   * The actual addition to the watchlist is done via the addToWatchlist method from the market store, which updates the state and triggers a re-render of the watchlist.
   */
  const handleAddInstrument = useCallback(
    (instrument: Instrument) => {
      addToWatchlist(instrument);
      setQuery('');
      setIsSearchMode(false);
      clearSearch();
    },
    [addToWatchlist, clearSearch],
  );

  /**
   * Method to handle pressing a watchlist item. Navigates to the InstrumentDetail screen, passing the instrument details as params.
   * This allows users to see detailed charts and info for the selected instrument.
   * The navigation is triggered on tap of the row, while long-press reveals Alert/Remove actions.
   * @param item - the watchlist item that was tapped, containing the instrument details to navigate to the detail screen
   */
  const handleItemPress = (item: WatchlistItem) => {
    navigation.navigate('InstrumentDetail', { instrument: item });
  };

  return (
    <SafeAreaView style={[styles.flex, styles.transparentbg]} edges={['top']}>
      <ScreenHeader
        title="Market Watch"
        subtitle={isConnected ? '● Live' : '○ Offline'}
        rightAction={
          <TouchableOpacity
            onPress={() => setIsSearchMode(s => !s)}
            style={[
              styles.addBtn,
              {
                backgroundColor: colors.primaryMuted,
                borderRadius: radius.base,
              },
            ]}
          >
            <Text
              style={{
                color: colors.primaryDark,
                fontWeight: typography['700'],
                fontSize: typography.base,
              }}
            >
              {isSearchMode ? 'Cancel' : '+ Add'}
            </Text>
          </TouchableOpacity>
        }
      />

      {isSearchMode && (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={{ paddingHorizontal: spacing.base, paddingBottom: spacing.md }}
        >
          <TextInput
            value={query}
            onChangeText={handleQueryChange}
            autoFocus
            placeholder="Search stocks, F&O, Commodity..."
            placeholderTextColor={colors.textMuted}
            style={[
              styles.searchInput,
              {
                backgroundColor: colors.inputBg,
                color: colors.text,
                borderColor: colors.border,
                borderRadius: radius.sm,
              },
            ]}
          />
        </Animated.View>
      )}

      {/* Search Results */}
      {isSearchMode && searchResults.length > 0 && (
        <Animated.View
          entering={FadeIn}
          style={[
            styles.searchResults,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <FlatList
            data={searchResults}
            keyExtractor={item => `${item.exchange}|${item.token}`}
            renderItem={({ item }) => (
              <SearchResultItem
                instrument={item}
                onAdd={handleAddInstrument}
                isAdded={watchlist.some(w => w.token === item.token)}
              />
            )}
            ItemSeparatorComponent={Divider}
            keyboardShouldPersistTaps="handled"
            style={[styles.maxHeight300]}
          />
        </Animated.View>
      )}

      {/* Watchlist */}
      <FlashList
        data={watchlist}
        keyExtractor={item => item.token}
        estimatedItemSize={72}
        contentContainerStyle={styles.bottomPadding}
        renderItem={({ item, index }) => (
          <WatchlistRow
            item={item}
            index={index}
            onPress={() => handleItemPress(item)}
            onSetAlert={() => setAlertTarget(item)}
            onRemove={() => removeFromWatchlist(item.token)}
          />
        )}
        ItemSeparatorComponent={Divider}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text
              style={{ fontSize: typography['4xl'], marginBottom: margin.lg }}
            >
              📈
            </Text>
            <Text
              style={{ color: colors.textMuted, fontSize: typography.base }}
            >
              {
                'No instruments in watchlist.\nTap "+ Add" to search and add stocks.'
              }
            </Text>
          </View>
        }
      />

      {/* Price Alert Modal */}
      {alertTarget && (
        <PriceAlertModal
          visible={!!alertTarget}
          instrument={alertTarget}
          currentPrice={0}
          onClose={() => setAlertTarget(null)}
        />
      )}
    </SafeAreaView>
  );
}

/**
 * Component for rendering each row in the watchlist. Shows instrument symbol, exchange, LTP, and change.
 * Supports tap to navigate to detail screen, and long-press to reveal Alert and Remove actions.
 * It is memoized to prevent unnecessary re-renders in the FlashList.
 * @param {{ item: WatchlistItem, index: number, onPress: () => void, onSetAlert: () => void, onRemove: () => void }} param0 - item: the watchlist item to display, index: the index of the item in the list (used for staggered animation), onPress: function to call when tapping the row, onSetAlert: function to call when tapping "Alert", onRemove: function to call when tapping "Remove"
 * @returns - a row component showing the watchlist item with LTP and change, supporting tap and long-press actions
 */
const WatchlistRow = memo(function WatchlistRow({
  item,
  index,
  onPress,
  onSetAlert,
  onRemove,
}: {
  item: WatchlistItem;
  index: number;
  onPress: () => void;
  onSetAlert: () => void;
  onRemove: () => void;
}) {
  const { colors, spacing, typography, radius, margin, padding } = useTheme();
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
        onLongPress={() => setShowActions(true)}
      >
        <View style={styles.flex}>
          <Text
            style={{
              color: colors.text,
              fontSize: typography.md,
              fontWeight: typography['600'],
            }}
          >
            {item.symbol}
          </Text>
          <View
            style={{
              ...styles.flexRow,
              ...styles.alignItemsCenter,
              gap: spacing.sm,
              marginTop: margin.sm,
            }}
          >
            <Badge
              label={item.exchange}
              size="sm"
              bgColor={colors.surfaceElevated}
              color={colors.textSecondary}
            />
            <Text style={{ color: colors.textMuted, fontSize: typography.xs }}>
              {item.instrumentType}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        {showActions ? (
          <View style={{ ...styles.flexRow, gap: spacing.sm }}>
            <TouchableOpacity
              onPress={() => {
                setShowActions(false);
                onSetAlert();
              }}
              style={{
                paddingHorizontal: padding.base,
                paddingVertical: padding.md,
                borderRadius: radius.full,
                backgroundColor: `${colors.warning}18`,
              }}
            >
              <Text
                style={{
                  color: colors.warning,
                  fontSize: typography.xs,
                  fontWeight: typography['600'],
                }}
              >
                Alert
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onRemove}
              style={{
                paddingHorizontal: padding.base,
                paddingVertical: padding.md,
                borderRadius: radius.full,
                backgroundColor: `${colors.loss}18`,
              }}
            >
              <Text
                style={{
                  color: colors.loss,
                  fontSize: typography.xs,
                  fontWeight: typography['600'],
                }}
              >
                Remove
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.alignItemsEnd}>
            <Text
              style={{
                color: colors.text,
                fontSize: typography.md,
                fontWeight: typography['700'],
                fontVariant: ['tabular-nums'],
              }}
            >
              {ltp > 0 ? formatCurrency(ltp) : '—'}
            </Text>
            {ltp > 0 && (
              <View
                style={{
                  ...styles.flexRow,
                  ...styles.alignItemsCenter,
                  gap: spacing.xs,
                  marginTop: margin.sm,
                }}
              >
                <Text
                  style={{
                    color: isProfit ? colors.profit : colors.loss,
                    fontSize: typography.xs,
                    fontWeight: typography['600'],
                  }}
                >
                  {isProfit ? '▲' : '▼'} {Math.abs(change).toFixed(2)}
                </Text>
                <View
                  style={[
                    styles.changeBadge,
                    {
                      backgroundColor: isProfit
                        ? `${colors.profit}18`
                        : `${colors.loss}18`,
                      borderRadius: radius.xxs,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: isProfit ? colors.profit : colors.loss,
                      fontSize: typography.xs,
                      fontWeight: typography['600'],
                    }}
                  >
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

/**
 * Component for rendering each search result item in the search results list when adding instruments to the watchlist.
 * Shows instrument symbol, name, exchange badge, and an "Add" button if not already in watchlist.
 * Tapping the item adds it to the watchlist.
 * It is memoized to prevent unnecessary re-renders in the FlatList.
 * @param {{ instrument: Instrument, onAdd: (i: Instrument) => void, isAdded: boolean }} param0 - instrument: the search result instrument to display, onAdd: function to call when adding to watchlist, isAdded: whether this instrument is already in the watchlist
 * @returns - a row component showing the search result with add button
 */
const SearchResultItem = memo(function SearchResultItem({
  instrument,
  onAdd,
  isAdded,
}: {
  instrument: Instrument;
  onAdd: (i: Instrument) => void;
  isAdded: boolean;
}) {
  const { colors, spacing, typography, radius, margin } = useTheme();
  return (
    <TouchableOpacity
      onPress={() => !isAdded && onAdd(instrument)}
      style={[styles.searchItem, { paddingHorizontal: spacing.base }]}
      activeOpacity={0.7}
    >
      <View style={styles.flex}>
        <Text
          style={{
            color: colors.text,
            fontSize: typography.base,
            fontWeight: typography['600'],
          }}
        >
          {instrument.symbol}
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.xs,
            marginTop: margin.xs,
          }}
          numberOfLines={1}
        >
          {instrument.name}
        </Text>
      </View>
      <View
        style={{
          ...styles.flexRow,
          ...styles.alignItemsCenter,
          gap: spacing.xs,
        }}
      >
        <Badge label={instrument.exchange} size="sm" />
        {isAdded ? (
          <Text style={{ color: colors.textMuted, fontSize: typography.xs }}>
            Added
          </Text>
        ) : (
          <View
            style={[
              styles.addChip,
              {
                backgroundColor: colors.primaryMuted,
                borderRadius: radius.full,
              },
            ]}
          >
            <Text
              style={{
                color: colors.primary,
                fontSize: typography.xs,
                fontWeight: typography['600'],
              }}
            >
              + Add
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  transparentbg: {
    backgroundColor: 'transparent',
  },
  bottomPadding: {
    paddingBottom: 120,
  },
  maxHeight300: {
    maxHeight: 300,
  },
  flexRow: {
    flexDirection: 'row',
  },
  alignItemsCenter: {
    alignItems: 'center',
  },
  alignItemsEnd: {
    alignItems: 'flex-end',
  },
  addBtn: { paddingHorizontal: 12, paddingVertical: 7 },
  searchInput: {
    height: 44,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '500',
  },
  searchResults: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: 8,
  },
  watchlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  changeBadge: { paddingHorizontal: 5, paddingVertical: 2 },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  addChip: { paddingHorizontal: 8, paddingVertical: 4 },
  emptyState: { paddingTop: 80, alignItems: 'center', paddingHorizontal: 32 },
});
