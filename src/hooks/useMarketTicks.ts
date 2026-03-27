import { useEffect, useRef } from 'react';
import { wsService } from '../services/websocketService';
import { useMarketStore } from '../store/marketStore';
import type { WsSubscription, WsTick } from '../types';

// ============================================================
// WEBSOCKET TICK SUBSCRIPTION HOOK
// ============================================================

/**
 * Subscribe to live ticks for a set of instruments.
 * Automatically updates the market store with incoming ticks.
 */
export function useMarketTicks(subscriptions: WsSubscription[]): void {
  const updateQuote = useMarketStore((s) => s.updateQuote);
  const setConnected = useMarketStore((s) => s.setConnected);
  const subsRef = useRef(subscriptions);
  subsRef.current = subscriptions;

  useEffect(() => {
    if (subscriptions.length === 0) return;

    wsService.subscribe(subscriptions);

    const unsubTick = wsService.onTick((tick: WsTick) => {
      updateQuote({
        token: tick.token,
        symbol: '',
        exchange: tick.exchange,
        ltp: tick.ltp,
        open: 0,
        high: 0,
        low: 0,
        close: 0,
        change: tick.change,
        changePercent: tick.changePercent,
        volume: 0,
        avgPrice: 0,
        totalBuyQty: 0,
        totalSellQty: 0,
        upperCircuit: 0,
        lowerCircuit: 0,
        timestamp: tick.timestamp,
      });
    });

    const unsubConn = wsService.onConnectionChange(setConnected);

    return () => {
      wsService.unsubscribe(subsRef.current);
      unsubTick();
      unsubConn();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(subscriptions.map((s) => s.token))]);
}

/**
 * Single instrument tick hook - returns live quote fields
 */
export function useInstrumentQuote(token: string) {
  return useMarketStore((s) => s.quotes[token]);
}
