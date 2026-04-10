// ============================================================
// AUTHENTICATION TYPES
// ============================================================

export interface LoginCredentials {
  userId: string;
  password: string;
  twoFactorAuth?: string;
}

export interface AuthSession {
  userId: string;
  sessionToken: string;
  encryptionKey: string;
  expiresAt: number;
}

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  mobile: string;
  pan: string;
  exchanges: Exchange[];
  products: ProductType[];
}

// ============================================================
// MARKET TYPES
// ============================================================

export type Exchange = 'NSE' | 'BSE' | 'NFO' | 'CDS' | 'MCX' | 'BFO';
export type ProductType = 'CNC' | 'MIS' | 'NRML' | 'BO' | 'CO';
export type OrderType = 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
export type TransactionType = 'BUY' | 'SELL';
export type OrderValidity = 'DAY' | 'IOC';
export type OrderStatus =
  | 'open'
  | 'complete'
  | 'cancelled'
  | 'rejected'
  | 'trigger pending'
  | 'after market order req received';

export interface Instrument {
  token: string;
  symbol: string;
  name: string;
  exchange: Exchange;
  instrumentType: string;
  lotSize: number;
  tickSize: number;
  expiry?: string;
  strikePrice?: number;
  optionType?: 'CE' | 'PE';
}

export interface MarketQuote {
  token: string;
  symbol: string;
  exchange: Exchange;
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  changePercent: number;
  volume: number;
  avgPrice: number;
  totalBuyQty: number;
  totalSellQty: number;
  upperCircuit: number;
  lowerCircuit: number;
  timestamp: number;
}

export interface WatchlistItem extends Instrument {
  quote?: MarketQuote;
}

// ============================================================
// ORDER TYPES
// ============================================================

export interface OrderRequest {
  exchange: Exchange;
  symbol: string;
  token: string;
  transactionType: TransactionType;
  productType: ProductType;
  orderType: OrderType;
  quantity: number;
  price: number;
  triggerPrice?: number;
  disclosedQuantity?: number;
  validity: OrderValidity;
  isAmo?: boolean;
  orderTag?: string;
}

export interface Order {
  orderId: string;
  exchange: Exchange;
  symbol: string;
  token: string;
  transactionType: TransactionType;
  productType: ProductType;
  orderType: OrderType;
  quantity: number;
  filledQuantity: number;
  pendingQuantity: number;
  price: number;
  avgPrice: number;
  triggerPrice: number;
  status: OrderStatus;
  statusMessage?: string;
  orderTimestamp: string;
  exchangeOrderId?: string;
  isAmo: boolean;
}

export interface ModifyOrderRequest {
  orderId: string;
  orderType: OrderType;
  quantity: number;
  price: number;
  triggerPrice?: number;
  validity: OrderValidity;
}

// ============================================================
// PORTFOLIO TYPES
// ============================================================

export interface Position {
  symbol: string;
  exchange: Exchange;
  token: string;
  productType: ProductType;
  netQty: number;
  buyQty: number;
  sellQty: number;
  buyAvgPrice: number;
  sellAvgPrice: number;
  netAvgPrice: number;
  ltp: number;
  realizedPnl: number;
  unrealizedPnl: number;
  pnl: number;
  dayChange: number;
  dayChangePercent: number;
}

export interface Holding {
  symbol: string;
  exchange: Exchange;
  token: string;
  isin: string;
  quantity: number;
  avgPrice: number;
  ltp: number;
  currentValue: number;
  investedValue: number;
  pnl: number;
  pnlPercent: number;
  t1Quantity: number;
}

export interface FundsData {
  availableBalance: number;
  usedMargin: number;
  totalMargin: number;
  collateral: number;
  adhocMargin: number;
  payIn: number;
  payOut: number;
}

export interface PortfolioSummary {
  totalInvestment: number;
  currentValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  dayPnl: number;
  dayPnlPercent: number;
  holdingsCount: number;
  positionsCount: number;
}

// ============================================================
// CHART TYPES
// ============================================================

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type ChartInterval = '1m' | '5m' | '15m' | '30m' | '1h' | '1d' | '1w';

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiResponse<T> {
  status: 'Ok' | 'Not Ok';
  message?: string;
  result?: T;
  errorCode?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ============================================================
// WEBSOCKET TYPES
// ============================================================

export type WsSubscriptionMode = 'LTP' | 'Quote' | 'SnapQuote';

export interface WsSubscription {
  token: string;
  exchange: Exchange;
  mode: WsSubscriptionMode;
}

export interface WsTick {
  token: string;
  exchange: Exchange;
  ltp: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

// ============================================================
// NOTIFICATION TYPES
// ============================================================

export type NotificationType = 'trade' | 'alert' | 'error' | 'info';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  meta?: Record<string, unknown>;
}

// ============================================================
// NAVIGATION TYPES
// ============================================================

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  OrderEntry: undefined;
  OrderConfirm: undefined;
  OrderSuccess: undefined;
  Notifications: undefined;
  InstrumentDetail: { instrument: WatchlistItem };
};

export type AuthStackParamList = {
  Login: undefined;
  TwoFactor: { userId: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  MarketWatch: undefined;
  Orders: undefined;
  Portfolio: undefined;
  Settings: undefined;
};

export type TradingStackParamList = {
  OrderEntry: { instrument: Instrument; side: TransactionType };
  OrderConfirm: { order: OrderRequest };
  OrderSuccess: { orderId: string };
};

// ============================================================
// OTHER UTILITY TYPES
// ============================================================

export enum BlurIntensity {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Lowest = 'lowest',
  Highest = 'highest',
}

export enum GlowType {
  Profit = 'profit',
  Loss = 'loss',
  Neutral = 'neutral',
}