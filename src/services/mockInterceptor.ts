/**
 * MOCK MODE INTERCEPTOR
 *
 * When MOCK_MODE=true, this module patches the stores to use
 * mock data instead of real API calls. Import this ONCE in App.tsx
 * before any store usage.
 *
 * Usage: import '@/services/mockInterceptor' at the top of App.tsx
 */

import { isMockMode } from './mockDataService';

if (!isMockMode) {
  // No-op in production
} else {
  // ============================================================
  // PATCH AUTH STORE
  // ============================================================
  const { useAuthStore } = require('../store/authStore');
  const { MOCK_SESSION, MOCK_PROFILE } = require('./mockDataService');

  const originalLogin = useAuthStore.getState().login;
  useAuthStore.setState({
    login: async () => {
      // Simulate network delay
      await new Promise((r) => setTimeout(r, 800));
      useAuthStore.setState({
        session: MOCK_SESSION,
        profile: MOCK_PROFILE,
        isLoading: false,
        error: null,
      });
    },
    logout: async () => {
      await new Promise((r) => setTimeout(r, 300));
      useAuthStore.setState({ session: null, profile: null });
    },
    initialize: async () => {
      // Don't auto-restore session in mock mode
      useAuthStore.setState({ isInitialized: true });
    },
  });

  // ============================================================
  // PATCH PORTFOLIO STORE
  // ============================================================
  const { usePortfolioStore } = require('../store/portfolioStore');
  const {
    MOCK_POSITIONS,
    MOCK_HOLDINGS,
    MOCK_FUNDS,
  } = require('./mockDataService');

  usePortfolioStore.setState({
    fetchAll: async () => {
      usePortfolioStore.setState({ isLoading: true });
      await new Promise((r) => setTimeout(r, 600));
      usePortfolioStore.setState({
        positions: MOCK_POSITIONS,
        holdings: MOCK_HOLDINGS,
        funds: MOCK_FUNDS,
        isLoading: false,
        lastRefresh: Date.now(),
      });
    },
    fetchPositions: async () => {
      usePortfolioStore.setState({ positions: MOCK_POSITIONS });
    },
    fetchHoldings: async () => {
      usePortfolioStore.setState({ holdings: MOCK_HOLDINGS });
    },
    fetchFunds: async () => {
      usePortfolioStore.setState({ funds: MOCK_FUNDS });
    },
  });

  // ============================================================
  // PATCH ORDERS STORE
  // ============================================================
  const { useOrdersStore } = require('../store/ordersStore');
  const { MOCK_ORDERS } = require('./mockDataService');

  useOrdersStore.setState({
    fetchOrders: async () => {
      useOrdersStore.setState({ isFetching: true });
      await new Promise((r) => setTimeout(r, 500));
      useOrdersStore.setState({
        orders: MOCK_ORDERS,
        isFetching: false,
        lastRefresh: Date.now(),
      });
    },
    placeOrder: async () => {
      useOrdersStore.setState({ isPlacing: true });
      await new Promise((r) => setTimeout(r, 700));
      const mockOrderId = `MOCK${Date.now()}`;
      useOrdersStore.setState({ isPlacing: false });
      return mockOrderId;
    },
    cancelOrder: async (orderId: string) => {
      useOrdersStore.setState((state: { orders: { orderId: string; status: string }[] }) => {
        const order = state.orders.find((o: { orderId: string }) => o.orderId === orderId);
        if (order) order.status = 'cancelled';
      });
    },
  });

  // ============================================================
  // PATCH MARKET STORE - with simulated live ticks
  // ============================================================
  const { useMarketStore } = require('../store/marketStore');
  const {
    MOCK_WATCHLIST_INSTRUMENTS,
    generateMockQuote,
  } = require('./mockDataService');

  useMarketStore.setState({
    loadWatchlist: async () => {
      useMarketStore.setState({
        watchlist: MOCK_WATCHLIST_INSTRUMENTS,
        isLoading: false,
        isConnected: true,
      });

      // Seed initial quotes
      MOCK_WATCHLIST_INSTRUMENTS.forEach(
        (inst: { token: string; symbol: string; exchange: string }) => {
          const quote = generateMockQuote(inst.token);
          useMarketStore.setState((state: { quotes: Record<string, unknown> }) => {
            state.quotes[inst.token] = { ...quote, symbol: inst.symbol };
          });
        },
      );

      // Simulate live tick updates every 2 seconds
      setInterval(() => {
        MOCK_WATCHLIST_INSTRUMENTS.forEach(
          (inst: { token: string; symbol: string }) => {
            const quote = generateMockQuote(inst.token);
            useMarketStore.getState().updateQuote({
              ...quote,
              symbol: inst.symbol,
            });
          },
        );
      }, 2000);
    },
  });

  console.info('[MOCK MODE] All stores patched with mock data.');
}

export {};
