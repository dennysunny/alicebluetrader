import { MOCK_MODE } from '../constants';
import type {
  AuthSession,
  UserProfile,
  Position,
  Holding,
  FundsData,
  Order,
  MarketQuote,
  Instrument,
} from '../types';

// ============================================================
// MOCK DATA SERVICE
// Enable with MOCK_MODE=true in .env
// ============================================================

export const MOCK_SESSION: AuthSession = {
  userId: 'DEMO001',
  sessionToken: 'mock-session-token-12345',
  encryptionKey: 'mock-enc-key',
  expiresAt: Date.now() + 86400000,
};

export const MOCK_PROFILE: UserProfile = {
  userId: 'DEMO001',
  name: 'Denny Sunny',
  email: 'iamdennysunny@gmail.com',
  mobile: '9961282177',
  pan: 'BJUPM0036M',
  exchanges: ['NSE', 'BSE', 'NFO'],
  products: ['CNC', 'MIS', 'NRML'],
};

export const MOCK_FUNDS: FundsData = {
  availableBalance: 156420.5,
  usedMargin: 43580.0,
  totalMargin: 200000.5,
  collateral: 0,
  adhocMargin: 0,
  payIn: 0,
  payOut: 0,
};

export const MOCK_POSITIONS: Position[] = [
  {
    symbol: 'RELIANCE',
    exchange: 'NSE',
    token: '2885',
    productType: 'MIS',
    netQty: 10,
    buyQty: 10,
    sellQty: 0,
    buyAvgPrice: 2455.6,
    sellAvgPrice: 0,
    netAvgPrice: 2455.6,
    ltp: 2478.3,
    realizedPnl: 0,
    unrealizedPnl: 227.0,
    pnl: 227.0,
    dayChange: 22.7,
    dayChangePercent: 0.93,
  },
  {
    symbol: 'NIFTY25APRFUT',
    exchange: 'NFO',
    token: '46022',
    productType: 'NRML',
    netQty: -75,
    buyQty: 0,
    sellQty: 75,
    buyAvgPrice: 0,
    sellAvgPrice: 22450.0,
    netAvgPrice: 22450.0,
    ltp: 22380.5,
    realizedPnl: 0,
    unrealizedPnl: 5212.5,
    pnl: 5212.5,
    dayChange: -69.5,
    dayChangePercent: -0.31,
  },
];

export const MOCK_HOLDINGS: Holding[] = [
  {
    symbol: 'TCS',
    exchange: 'NSE',
    token: '11536',
    isin: 'INE467B01029',
    quantity: 15,
    avgPrice: 3245.0,
    ltp: 3512.4,
    currentValue: 52686.0,
    investedValue: 48675.0,
    pnl: 4011.0,
    pnlPercent: 8.24,
    t1Quantity: 0,
  },
  {
    symbol: 'HDFC',
    exchange: 'NSE',
    token: '1333',
    isin: 'INE001A01036',
    quantity: 20,
    avgPrice: 1620.0,
    ltp: 1698.5,
    currentValue: 33970.0,
    investedValue: 32400.0,
    pnl: 1570.0,
    pnlPercent: 4.84,
    t1Quantity: 0,
  },
  {
    symbol: 'INFY',
    exchange: 'NSE',
    token: '1594',
    isin: 'INE009A01021',
    quantity: 30,
    avgPrice: 1450.0,
    ltp: 1389.2,
    currentValue: 41676.0,
    investedValue: 43500.0,
    pnl: -1824.0,
    pnlPercent: -4.19,
    t1Quantity: 0,
  },
];

export const MOCK_ORDERS: Order[] = [
  {
    orderId: 'ORD001',
    exchange: 'NSE',
    symbol: 'RELIANCE',
    token: '2885',
    transactionType: 'BUY',
    productType: 'MIS',
    orderType: 'MARKET',
    quantity: 10,
    filledQuantity: 10,
    pendingQuantity: 0,
    price: 0,
    avgPrice: 2455.6,
    triggerPrice: 0,
    status: 'complete',
    orderTimestamp: new Date().toISOString(),
    isAmo: false,
  },
  {
    orderId: 'ORD002',
    exchange: 'NSE',
    symbol: 'TCS',
    token: '11536',
    transactionType: 'BUY',
    productType: 'CNC',
    orderType: 'LIMIT',
    quantity: 5,
    filledQuantity: 0,
    pendingQuantity: 5,
    price: 3490.0,
    avgPrice: 0,
    triggerPrice: 0,
    status: 'open',
    orderTimestamp: new Date().toISOString(),
    isAmo: false,
  },
];

export const MOCK_WATCHLIST_INSTRUMENTS: Instrument[] = [
  {
    token: '2885',
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd',
    exchange: 'NSE',
    instrumentType: 'EQ',
    lotSize: 1,
    tickSize: 0.05,
  },
  {
    token: '11536',
    symbol: 'TCS',
    name: 'Tata Consultancy Services Ltd',
    exchange: 'NSE',
    instrumentType: 'EQ',
    lotSize: 1,
    tickSize: 0.05,
  },
  {
    token: '1333',
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Ltd',
    exchange: 'NSE',
    instrumentType: 'EQ',
    lotSize: 1,
    tickSize: 0.05,
  },
];

// ============================================================
// MOCK QUOTE GENERATOR (simulates live ticks)
// ============================================================

const BASE_PRICES: Record<string, number> = {
  '2885': 2478.3,
  '11536': 3512.4,
  '1333': 1698.5,
};

export function generateMockQuote(token: string): MarketQuote {
  const base = BASE_PRICES[token] ?? 1000;
  const noise = (Math.random() - 0.5) * 0.002 * base;
  const ltp = parseFloat((base + noise).toFixed(2));
  const change = parseFloat(noise.toFixed(2));
  const close = base;

  return {
    token,
    symbol: '',
    exchange: 'NSE',
    ltp,
    open: close * 0.998,
    high: ltp * 1.005,
    low: ltp * 0.995,
    close,
    change,
    changePercent: parseFloat(((change / close) * 100).toFixed(2)),
    volume: Math.floor(Math.random() * 1000000),
    avgPrice: ltp,
    totalBuyQty: Math.floor(Math.random() * 50000),
    totalSellQty: Math.floor(Math.random() * 50000),
    upperCircuit: base * 1.2,
    lowerCircuit: base * 0.8,
    timestamp: Date.now(),
  };
}

export const isMockMode = MOCK_MODE;
