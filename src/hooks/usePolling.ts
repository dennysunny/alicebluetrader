import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useOrdersStore } from '../store/ordersStore';

// ============================================================
// ORDER POLLING HOOK
// Polls order book every 30s while app is in foreground
// to keep order statuses current between WS messages
// ============================================================

const POLL_INTERVAL_MS = 30_000;

export function useOrderPolling(enabled = true): void {
  const { fetchOrders } = useOrdersStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const startPolling = () => {
    stopPolling();
    if (!enabled) return;
    intervalRef.current = setInterval(fetchOrders, POLL_INTERVAL_MS);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchOrders();
    startPolling();

    // Pause polling when app goes to background, resume on foreground
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        fetchOrders();
        startPolling();
      } else if (nextState.match(/inactive|background/)) {
        stopPolling();
      }
      appStateRef.current = nextState;
    });

    return () => {
      stopPolling();
      sub.remove();
    };
  }, [enabled, fetchOrders]);
}

// ============================================================
// PORTFOLIO POLLING HOOK
// ============================================================

const PORTFOLIO_POLL_INTERVAL_MS = 60_000;

export function usePortfolioPolling(enabled = true): void {
  const { fetchAll } = require('@/store/portfolioStore').usePortfolioStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    fetchAll();
    intervalRef.current = setInterval(fetchAll, PORTFOLIO_POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, fetchAll]);
}
