import { z } from 'zod';

// ============================================================
// ZOD VALIDATION SCHEMAS
// Use at API boundaries and form submission
// ============================================================

export const ExchangeSchema = z.enum(['NSE', 'BSE', 'NFO', 'CDS', 'MCX', 'BFO']);
export const ProductTypeSchema = z.enum(['CNC', 'MIS', 'NRML', 'BO', 'CO']);
export const OrderTypeSchema = z.enum(['MARKET', 'LIMIT', 'SL', 'SL-M']);
export const TransactionTypeSchema = z.enum(['BUY', 'SELL']);
export const OrderValiditySchema = z.enum(['DAY', 'IOC']);

export const OrderRequestSchema = z.object({
  exchange: ExchangeSchema,
  symbol: z.string().min(1, 'Symbol required'),
  token: z.string().min(1, 'Token required'),
  transactionType: TransactionTypeSchema,
  productType: ProductTypeSchema,
  orderType: OrderTypeSchema,
  quantity: z.number().int().positive('Quantity must be positive'),
  price: z.number().min(0),
  triggerPrice: z.number().min(0).optional(),
  disclosedQuantity: z.number().int().min(0).optional(),
  validity: OrderValiditySchema,
  isAmo: z.boolean().optional(),
  orderTag: z.string().max(20).optional(),
}).refine(
  (data) => {
    if (data.orderType === 'LIMIT' || data.orderType === 'SL') {
      return data.price > 0;
    }
    return true;
  },
  { message: 'Price required for LIMIT and SL orders', path: ['price'] },
).refine(
  (data) => {
    if (data.orderType === 'SL' || data.orderType === 'SL-M') {
      return (data.triggerPrice ?? 0) > 0;
    }
    return true;
  },
  { message: 'Trigger price required for SL orders', path: ['triggerPrice'] },
);

export const LoginCredentialsSchema = z.object({
  userId: z.string().min(1, 'User ID required').max(20),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  twoFactorAuth: z.string().optional(),
});

export const PriceAlertSchema = z.object({
  token: z.string().min(1),
  symbol: z.string().min(1),
  exchange: ExchangeSchema,
  targetPrice: z.number().positive('Target price must be positive'),
  condition: z.enum(['above', 'below']),
});

// Type inference from schemas
export type ValidatedOrderRequest = z.infer<typeof OrderRequestSchema>;
export type ValidatedLoginCredentials = z.infer<typeof LoginCredentialsSchema>;
export type ValidatedPriceAlert = z.infer<typeof PriceAlertSchema>;

// Helper: safe parse with error formatting
export function parseOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const messages = result.error.errors.map((e) => e.message).join(', ');
    throw new Error(`Validation failed: ${messages}`);
  }
  return result.data;
}
