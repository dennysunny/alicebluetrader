import dayjs from 'dayjs';

// ============================================================
// FORMATTING UTILITIES
// ============================================================

/**
 * Format a number as Indian Rupee currency
 */
export function formatCurrency(
  value: number,
  options?: { compact?: boolean; decimals?: number },
): string {
  const decimals = options?.decimals ?? 2;

  if (options?.compact) {
    if (Math.abs(value) >= 1_00_00_000) {
      return `₹${(value / 1_00_00_000).toFixed(2)}Cr`;
    }
    if (Math.abs(value) >= 1_00_000) {
      return `₹${(value / 1_00_000).toFixed(2)}L`;
    }
    if (Math.abs(value) >= 1_000) {
      return `₹${(value / 1_000).toFixed(1)}K`;
    }
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format percentage with sign
 */
export function formatPercent(value: number, decimals = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format a price value (compact decimal display)
 */
export function formatPrice(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

/**
 * Format large numbers with Indian numbering system
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

/**
 * Format a P&L value with sign and color hint
 */
export function formatPnl(value: number): { text: string; isProfit: boolean } {
  const isProfit = value >= 0;
  const sign = isProfit ? '+' : '';
  return {
    text: `${sign}${formatCurrency(value)}`,
    isProfit,
  };
}

/**
 * Format timestamp to time string
 */
export function formatTime(timestamp: number | string): string {
  return dayjs(timestamp).format('HH:mm:ss');
}

/**
 * Format date
 */
export function formatDate(timestamp: number | string): string {
  return dayjs(timestamp).format('DD MMM YYYY');
}

/**
 * Format date and time
 */
export function formatDateTime(timestamp: number | string): string {
  return dayjs(timestamp).format('DD MMM, HH:mm');
}

/**
 * Format volume (e.g., 1234567 -> 12.3L)
 */
export function formatVolume(value: number): string {
  if (value >= 1_00_00_000) return `${(value / 1_00_00_000).toFixed(1)}Cr`;
  if (value >= 1_00_000) return `${(value / 1_00_000).toFixed(1)}L`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}
