// ============================================================
// UNIT TESTS
// ============================================================

import {
  formatCurrency,
  formatPercent,
  formatVolume,
  formatPnl,
} from '../utils/formatters';

// ============================================================
// FORMATTER TESTS
// ============================================================

describe('formatCurrency', () => {
  it('formats basic currency correctly', () => {
    expect(formatCurrency(1234.56)).toBe('₹1,234.56');
  });

  it('formats compact large values', () => {
    expect(formatCurrency(150000, { compact: true })).toBe('₹1.50L');
    expect(formatCurrency(15000000, { compact: true })).toBe('₹1.50Cr');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('₹0.00');
  });

  it('handles negative values', () => {
    const result = formatCurrency(-500);
    expect(result).toContain('500');
  });
});

describe('formatPercent', () => {
  it('adds + sign for positive', () => {
    expect(formatPercent(5.25)).toBe('+5.25%');
  });

  it('keeps - sign for negative', () => {
    expect(formatPercent(-3.14)).toBe('-3.14%');
  });

  it('handles zero', () => {
    expect(formatPercent(0)).toBe('+0.00%');
  });
});

describe('formatVolume', () => {
  it('formats thousands', () => {
    expect(formatVolume(5000)).toBe('5.0K');
  });

  it('formats lakhs', () => {
    expect(formatVolume(150000)).toBe('1.5L');
  });

  it('formats crores', () => {
    expect(formatVolume(10000000)).toBe('1.0Cr');
  });
});

describe('formatPnl', () => {
  it('marks profit correctly', () => {
    const result = formatPnl(500);
    expect(result.isProfit).toBe(true);
    expect(result.text).toContain('+');
  });

  it('marks loss correctly', () => {
    const result = formatPnl(-200);
    expect(result.isProfit).toBe(false);
    expect(result.text).not.toContain('+');
  });
});

// ============================================================
// ORDER VALIDATION TESTS (pure function extraction)
// ============================================================

function validateOrderQuantity(
  quantity: number,
  lotSize: number,
  availableFunds: number,
  estimatedValue: number,
  isBuy: boolean,
): string | null {
  if (quantity <= 0) return 'Quantity must be positive';
  if (quantity % lotSize !== 0)
    return `Quantity must be in multiples of ${lotSize}`;
  if (isBuy && estimatedValue > availableFunds)
    return 'Insufficient funds';
  return null;
}

describe('validateOrderQuantity', () => {
  it('rejects zero quantity', () => {
    expect(validateOrderQuantity(0, 1, 100000, 0, true)).not.toBeNull();
  });

  it('rejects non-multiple of lot size', () => {
    expect(validateOrderQuantity(3, 75, 100000, 100, true)).not.toBeNull();
  });

  it('accepts valid multiple', () => {
    expect(validateOrderQuantity(75, 75, 100000, 100, true)).toBeNull();
  });

  it('rejects buy with insufficient funds', () => {
    expect(validateOrderQuantity(100, 1, 500, 1000, true)).not.toBeNull();
  });

  it('accepts sell with insufficient funds (no margin check on sell)', () => {
    expect(validateOrderQuantity(100, 1, 500, 1000, false)).toBeNull();
  });
});
