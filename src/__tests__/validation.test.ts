import { OrderRequestSchema, LoginCredentialsSchema, PriceAlertSchema, parseOrThrow } from '../utils/validation';

// ============================================================
// VALIDATION SCHEMA TESTS
// ============================================================

describe('OrderRequestSchema', () => {
  const validOrder = {
    exchange: 'NSE' as const,
    symbol: 'RELIANCE',
    token: '2885',
    transactionType: 'BUY' as const,
    productType: 'MIS' as const,
    orderType: 'MARKET' as const,
    quantity: 10,
    price: 0,
    validity: 'DAY' as const,
  };

  it('accepts a valid market order', () => {
    const result = OrderRequestSchema.safeParse(validOrder);
    expect(result.success).toBe(true);
  });

  it('rejects zero quantity', () => {
    const result = OrderRequestSchema.safeParse({ ...validOrder, quantity: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects negative quantity', () => {
    const result = OrderRequestSchema.safeParse({ ...validOrder, quantity: -5 });
    expect(result.success).toBe(false);
  });

  it('requires price for LIMIT order', () => {
    const result = OrderRequestSchema.safeParse({ ...validOrder, orderType: 'LIMIT', price: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].path).toContain('price');
    }
  });

  it('accepts a valid LIMIT order with price', () => {
    const result = OrderRequestSchema.safeParse({ ...validOrder, orderType: 'LIMIT', price: 2450.5 });
    expect(result.success).toBe(true);
  });

  it('requires trigger price for SL order', () => {
    const result = OrderRequestSchema.safeParse({ ...validOrder, orderType: 'SL', price: 2400, triggerPrice: 0 });
    expect(result.success).toBe(false);
  });

  it('accepts valid SL order', () => {
    const result = OrderRequestSchema.safeParse({ ...validOrder, orderType: 'SL', price: 2400, triggerPrice: 2410 });
    expect(result.success).toBe(true);
  });

  it('rejects invalid exchange', () => {
    const result = OrderRequestSchema.safeParse({ ...validOrder, exchange: 'INVALID' });
    expect(result.success).toBe(false);
  });
});

describe('LoginCredentialsSchema', () => {
  it('accepts valid credentials', () => {
    const result = LoginCredentialsSchema.safeParse({ userId: 'USER001', password: 'mypass123' });
    expect(result.success).toBe(true);
  });

  it('rejects empty userId', () => {
    const result = LoginCredentialsSchema.safeParse({ userId: '', password: 'mypass123' });
    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = LoginCredentialsSchema.safeParse({ userId: 'USER001', password: '123' });
    expect(result.success).toBe(false);
  });
});

describe('PriceAlertSchema', () => {
  it('accepts valid alert', () => {
    const result = PriceAlertSchema.safeParse({
      token: '2885', symbol: 'RELIANCE', exchange: 'NSE', targetPrice: 2500, condition: 'above',
    });
    expect(result.success).toBe(true);
  });

  it('rejects zero target price', () => {
    const result = PriceAlertSchema.safeParse({
      token: '2885', symbol: 'RELIANCE', exchange: 'NSE', targetPrice: 0, condition: 'above',
    });
    expect(result.success).toBe(false);
  });
});

describe('parseOrThrow', () => {
  it('returns parsed data on success', () => {
    const data = parseOrThrow(LoginCredentialsSchema, { userId: 'ABC', password: 'password123' });
    expect(data.userId).toBe('ABC');
  });

  it('throws on invalid data', () => {
    expect(() => {
      parseOrThrow(LoginCredentialsSchema, { userId: '', password: '123' });
    }).toThrow('Validation failed');
  });
});
