import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { marketApi } from '../api/marketApi';
import { wsService } from '../services/websocketService';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants';
import { Logger } from '../utils/logger';
import type { WatchlistItem, Instrument, MarketQuote } from '../types';

// ============================================================
// MARKET WATCH STORE
// ============================================================

interface MarketState {
  watchlist: WatchlistItem[];
  quotes: Record<string, MarketQuote>; // keyed by token
  searchResults: Instrument[];
  isSearching: boolean;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

interface MarketActions {
  loadWatchlist: () => Promise<void>;
  addToWatchlist: (instrument: Instrument) => void;
  removeFromWatchlist: (token: string) => void;
  searchInstruments: (query: string) => Promise<void>;
  clearSearch: () => void;
  updateQuote: (quote: MarketQuote) => void;
  subscribeAll: () => void;
  setConnected: (connected: boolean) => void;
}

type MarketStore = MarketState & MarketActions;

export const useMarketStore = create<MarketStore>()(
  immer((set, get) => ({
    watchlist: [],
    quotes: {},
    searchResults: [],
    isSearching: false,
    isConnected: false,
    isLoading: false,
    error: null,

    loadWatchlist: async () => {
      set((state) => { state.isLoading = true; });

      try {
        // Load saved watchlist from storage
        const saved = storage.getString(STORAGE_KEYS.WATCHLIST);
        const items: WatchlistItem[] = saved ? JSON.parse(saved) : [];

        set((state) => {
          state.watchlist = items;
          state.isLoading = false;
        });

        // Fetch initial quotes
        if (items.length > 0) {
          const subscriptions = items.map((i) => ({
            token: i.token,
            exchange: i.exchange,
            mode: 'Quote' as const,
          }));

          wsService.subscribe(subscriptions);

          // Fetch initial quote data via REST
          const quotes = await marketApi.getBulkQuotes(subscriptions);
          quotes.forEach((q, i) => {
            get().updateQuote({ ...q, symbol: items[i].symbol });
          });
        }
      } catch (error) {
        Logger.error('Failed to load watchlist', error);
        set((state) => {
          state.isLoading = false;
          state.error = 'Failed to load watchlist';
        });
      }
    },

    addToWatchlist: (instrument: Instrument) => {
      const { watchlist } = get();
      if (watchlist.some((i) => i.token === instrument.token)) return;

      set((state) => {
        state.watchlist.push(instrument);
      });

      // Persist
      const updated = [...watchlist, instrument];
      storage.set(STORAGE_KEYS.WATCHLIST, JSON.stringify(updated));

      // Subscribe to WebSocket
      wsService.subscribe([{
        token: instrument.token,
        exchange: instrument.exchange,
        mode: 'Quote',
      }]);
    },

    removeFromWatchlist: (token: string) => {
      const { watchlist } = get();
      const instrument = watchlist.find((i) => i.token === token);

      set((state) => {
        state.watchlist = state.watchlist.filter((i) => i.token !== token);
        delete state.quotes[token];
      });

      if (instrument) {
        const updated = watchlist.filter((i) => i.token !== token);
        storage.set(STORAGE_KEYS.WATCHLIST, JSON.stringify(updated));

        wsService.unsubscribe([{
          token: instrument.token,
          exchange: instrument.exchange,
          mode: 'Quote',
        }]);
      }
    },

    searchInstruments: async (query: string) => {
      if (query.length < 2) {
        set((state) => { state.searchResults = []; });
        return;
      }

      set((state) => { state.isSearching = true; });

      try {
        const results = await marketApi.searchInstruments(query);
        set((state) => {
          state.searchResults = results;
          state.isSearching = false;
        });
      } catch (error) {
        Logger.error('Search failed', error);
        set((state) => {
          state.isSearching = false;
          state.error = 'Search failed';
        });
      }
    },

    clearSearch: () => {
      set((state) => { state.searchResults = []; });
    },

    updateQuote: (quote: MarketQuote) => {
      set((state) => {
        state.quotes[quote.token] = quote;
      });
    },

    subscribeAll: () => {
      const { watchlist } = get();
      wsService.subscribe(
        watchlist.map((i) => ({
          token: i.token,
          exchange: i.exchange,
          mode: 'Quote' as const,
        })),
      );
    },

    setConnected: (connected: boolean) => {
      set((state) => { state.isConnected = connected; });
    },
  })),
);

// Selector hooks
export const useWatchlist = () => useMarketStore((s) => s.watchlist);
export const useQuote = (token: string) =>
  useMarketStore((s) => s.quotes[token]);
export const useSearchResults = () => useMarketStore((s) => s.searchResults);
