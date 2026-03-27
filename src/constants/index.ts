import Config from 'react-native-config';

// ============================================================
// API CONSTANTS
// ============================================================

export const API_BASE_URL =
  Config.ALICE_BLUE_BASE_URL ||
  'https://ant.aliceblueonline.com/rest/AliceBlueAPIService/api';

export const WS_BASE_URL =
  Config.ALICE_BLUE_WS_URL || 'wss://ant.aliceblueonline.com/hydra';

export const API_TIMEOUT = parseInt(Config.API_TIMEOUT || '30000', 10);
export const WS_RECONNECT_DELAY = parseInt(
  Config.WS_RECONNECT_DELAY || '3000',
  10,
);
export const SESSION_REFRESH_INTERVAL = parseInt(
  Config.SESSION_REFRESH_INTERVAL || '3600000',
  10,
);
//export const MOCK_MODE = Config.MOCK_MODE === 'true';
export const MOCK_MODE = true;

// ============================================================
// STORAGE KEYS
// ============================================================

export const STORAGE_KEYS = {
  SESSION: 'auth_session',
  USER_PROFILE: 'user_profile',
  WATCHLIST: 'watchlist',
  THEME: 'app_theme',
  ONBOARDED: 'app_onboarded',
} as const;

export const KEYCHAIN_SERVICE = 'com.aliceblutrader.auth';

// ============================================================
// EXCHANGE DISPLAY NAMES
// ============================================================

export const EXCHANGE_LABELS: Record<string, string> = {
  NSE: 'NSE',
  BSE: 'BSE',
  NFO: 'NSE F&O',
  CDS: 'Currency',
  MCX: 'MCX',
  BFO: 'BSE F&O',
};

// ============================================================
// PRODUCT TYPE DISPLAY
// ============================================================

export const PRODUCT_LABELS: Record<string, string> = {
  CNC: 'Delivery',
  MIS: 'Intraday',
  NRML: 'Normal',
  BO: 'Bracket',
  CO: 'Cover',
};

// ============================================================
// ORDER STATUS COLORS
// ============================================================

export const ORDER_STATUS_COLORS: Record<string, string> = {
  open: '#3B82F6',
  complete: '#10B981',
  cancelled: '#6B7280',
  rejected: '#EF4444',
  'trigger pending': '#F59E0B',
  'after market order req received': '#8B5CF6',
};

// ============================================================
// CHART INTERVALS
// ============================================================

export const CHART_INTERVALS = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '30m', value: '30m' },
  { label: '1H', value: '1h' },
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
] as const;

// ============================================================
// PAGINATION
// ============================================================

export const DEFAULT_PAGE_SIZE = 20;

// ============================================================
// WEBSOCKET SUBSCRIPTIONS
// ============================================================

export const WS_MODES = {
  LTP: 'LTP',
  QUOTE: 'Quote',
  SNAP_QUOTE: 'SnapQuote',
} as const;

// ============================================================
// ERROR CODES
// ============================================================

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_ORDER: 'INVALID_ORDER',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  MARKET_CLOSED: 'MARKET_CLOSED',
  RATE_LIMITED: 'RATE_LIMITED',
  UNKNOWN: 'UNKNOWN',
} as const;
