import { httpClient } from './httpClient';
import type { Position, Holding, FundsData } from '../types';

// ============================================================
// PORTFOLIO API
// ============================================================

export const portfolioApi = {
  /**
   * Fetch current positions (intraday + delivery)
   */
  getPositions: async (): Promise<Position[]> => {
    const data = await httpClient.get<RawPosition[]>(
      '/positionAndHoldings/positionBook',
    );
    return data.map(mapRawPosition);
  },

  /**
   * Fetch holdings (long-term delivery positions)
   */
  getHoldings: async (): Promise<Holding[]> => {
    const data = await httpClient.get<RawHolding[]>(
      '/positionAndHoldings/holdings',
    );
    return data.map(mapRawHolding);
  },

  /**
   * Fetch available funds and margin details
   */
  getFunds: async (): Promise<FundsData> => {
    const data = await httpClient.get<RawFunds>('/limits/getRmsLimits');
    return {
      availableBalance: parseFloat(data.net),
      usedMargin: parseFloat(data.marginused),
      totalMargin: parseFloat(data.grossavailablemargin),
      collateral: parseFloat(data.collateral),
      adhocMargin: parseFloat(data.adhocmargin),
      payIn: parseFloat(data.payin),
      payOut: parseFloat(data.payout),
    };
  },

  /**
   * Square off (exit) a position
   */
  squareOffPosition: async (position: Position): Promise<string> => {
    const { ordersApi } = await import('./ordersApi');
    return ordersApi.placeOrder({
      exchange: position.exchange,
      symbol: position.symbol,
      token: position.token,
      transactionType: position.netQty > 0 ? 'SELL' : 'BUY',
      productType: position.productType,
      orderType: 'MARKET',
      quantity: Math.abs(position.netQty),
      price: 0,
      validity: 'DAY',
    });
  },
};

// ============================================================
// RAW RESPONSE TYPES & MAPPERS
// ============================================================

interface RawPosition {
  Exchange: string;
  Tsym: string;
  Token: string;
  Pcode: string;
  Netqty: string;
  Buyqty: string;
  Sellqty: string;
  Avgnetprc: string;
  Avgbuyp: string;
  Avgsellp: string;
  ltp: string;
  realisedprofitloss: string;
  unrealisedprofitloss: string;
  Netprofitandloss: string;
  pricedifference: string;
  Changesymbol: string;
}

function mapRawPosition(raw: RawPosition): Position {
  const netQty = parseInt(raw.Netqty, 10);
  const ltp = parseFloat(raw.ltp);
  const dayChange = parseFloat(raw.pricedifference);
  const close = ltp - dayChange;

  return {
    symbol: raw.Tsym,
    exchange: raw.Exchange as Position['exchange'],
    token: raw.Token,
    productType: raw.Pcode as Position['productType'],
    netQty,
    buyQty: parseInt(raw.Buyqty, 10),
    sellQty: parseInt(raw.Sellqty, 10),
    buyAvgPrice: parseFloat(raw.Avgbuyp),
    sellAvgPrice: parseFloat(raw.Avgsellp),
    netAvgPrice: parseFloat(raw.Avgnetprc),
    ltp,
    realizedPnl: parseFloat(raw.realisedprofitloss),
    unrealizedPnl: parseFloat(raw.unrealisedprofitloss),
    pnl: parseFloat(raw.Netprofitandloss),
    dayChange,
    dayChangePercent: close > 0 ? (dayChange / close) * 100 : 0,
  };
}

interface RawHolding {
  Exchange: string;
  NSEsym: string;
  Token: string;
  ISIN: string;
  holdqty: string;
  Price: string;
  ltp: string;
  mktval: string;
  vwap: string;
  Pnlc: string;
  PnlPerc: string;
  T1qty: string;
}

function mapRawHolding(raw: RawHolding): Holding {
  const quantity = parseInt(raw.holdqty, 10);
  const avgPrice = parseFloat(raw.Price);
  const ltp = parseFloat(raw.ltp);

  return {
    symbol: raw.NSEsym,
    exchange: raw.Exchange as Holding['exchange'],
    token: raw.Token,
    isin: raw.ISIN,
    quantity,
    avgPrice,
    ltp,
    currentValue: parseFloat(raw.mktval),
    investedValue: quantity * avgPrice,
    pnl: parseFloat(raw.Pnlc),
    pnlPercent: parseFloat(raw.PnlPerc),
    t1Quantity: parseInt(raw.T1qty, 10),
  };
}

interface RawFunds {
  net: string;
  marginused: string;
  grossavailablemargin: string;
  collateral: string;
  adhocmargin: string;
  payin: string;
  payout: string;
}
