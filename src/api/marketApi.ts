import { httpClient } from './httpClient';
import type {
  Instrument,
  MarketQuote,
  Exchange,
  WsSubscription,
  Candle,
  ChartInterval,
} from '../types';

// ============================================================
// MARKET DATA API
// ============================================================

interface SearchResponse {
  values: Array<{
    token: string;
    symbol: string;
    trading_symbol: string;
    description: string;
    exchange: string;
    instrument_type: string;
    lot_size: number;
    tick_size: number;
  }>;
}

interface QuoteResponse {
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  change_percent: number;
  volume: number;
  avg_price: number;
  total_buy_qty: number;
  total_sell_qty: number;
  upper_circuit: number;
  lower_circuit: number;
  timestamp: number;
}

interface CandleResponse {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  dateTime: string;
}

export const marketApi = {
  /**
   * Search instruments by query string
   */
  searchInstruments: async (
    query: string,
    exchange?: Exchange,
  ): Promise<Instrument[]> => {
    const params: Record<string, string> = { query };
    if (exchange) params.exchange = exchange;

    const data = await httpClient.get<SearchResponse>(
      '/ScripSearch/getScripQuoteDetails',
      { params },
    );

    return data.values.map((item) => ({
      token: item.token,
      symbol: item.trading_symbol,
      name: item.description,
      exchange: item.exchange as Exchange,
      instrumentType: item.instrument_type,
      lotSize: item.lot_size,
      tickSize: item.tick_size,
    }));
  },

  /**
   * Get real-time quote for a single instrument
   */
  getQuote: async (
    token: string,
    exchange: Exchange,
  ): Promise<MarketQuote> => {
    const data = await httpClient.get<QuoteResponse>(
      `/ScripDetails/getScripQuoteDetails`,
      { params: { token, exchange } },
    );

    return {
      token,
      symbol: '',
      exchange,
      ltp: data.ltp,
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
      change: data.change,
      changePercent: data.change_percent,
      volume: data.volume,
      avgPrice: data.avg_price,
      totalBuyQty: data.total_buy_qty,
      totalSellQty: data.total_sell_qty,
      upperCircuit: data.upper_circuit,
      lowerCircuit: data.lower_circuit,
      timestamp: data.timestamp,
    };
  },

  /**
   * Get bulk quotes for multiple instruments
   */
  getBulkQuotes: async (
    subscriptions: WsSubscription[],
  ): Promise<MarketQuote[]> => {
    const data = await httpClient.post<QuoteResponse[]>(
      '/marketWatch/scripsMW',
      {
        scrips: subscriptions.map((s) => `${s.exchange}|${s.token}`).join('#'),
        scripsData: subscriptions
          .map((s) => `${s.exchange}|${s.token}`)
          .join('#'),
      },
    );

    return data.map((quote, i) => ({
      token: subscriptions[i].token,
      symbol: '',
      exchange: subscriptions[i].exchange,
      ltp: quote.ltp,
      open: quote.open,
      high: quote.high,
      low: quote.low,
      close: quote.close,
      change: quote.change,
      changePercent: quote.change_percent,
      volume: quote.volume,
      avgPrice: quote.avg_price,
      totalBuyQty: quote.total_buy_qty,
      totalSellQty: quote.total_sell_qty,
      upperCircuit: quote.upper_circuit,
      lowerCircuit: quote.lower_circuit,
      timestamp: quote.timestamp,
    }));
  },

  /**
   * Fetch OHLC candlestick data for charting
   */
  getCandles: async (
    token: string,
    exchange: Exchange,
    interval: ChartInterval,
    from: string,
    to: string,
  ): Promise<Candle[]> => {
    const data = await httpClient.get<CandleResponse[]>(
      '/chart/history',
      {
        params: { token, exchange, resolution: interval, from, to },
      },
    );

    return data.map((candle) => ({
      timestamp: new Date(candle.dateTime).getTime(),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
    }));
  },
};
