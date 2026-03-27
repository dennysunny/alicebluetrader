import { httpClient } from './httpClient';
import type { Order, OrderRequest, ModifyOrderRequest } from '../types';

// ============================================================
// ORDERS API
// ============================================================

export const ordersApi = {
  /**
   * Place a new order
   */
  placeOrder: async (order: OrderRequest): Promise<string> => {
    const payload = {
      exchange: order.exchange,
      tradingsymbol: order.symbol,
      symboltoken: order.token,
      transactiontype: order.transactionType,
      producttype: order.productType,
      ordertype: order.orderType,
      quantity: order.quantity.toString(),
      price: order.price.toString(),
      triggerprice: order.triggerPrice?.toString() ?? '0',
      squareoff: '0',
      stoploss: '0',
      disclosedquantity: order.disclosedQuantity?.toString() ?? '0',
      duration: order.validity,
      ordertag: order.orderTag ?? '',
      variety: order.isAmo ? 'AMO' : 'NORMAL',
    };

    const data = await httpClient.post<{ orderid: string }>(
      '/placeOrder/executePlaceOrder',
      [payload],
    );

    return data.orderid;
  },

  /**
   * Modify an existing open order
   */
  modifyOrder: async (request: ModifyOrderRequest): Promise<string> => {
    const data = await httpClient.post<{ orderid: string }>(
      '/placeOrder/modifyOrder',
      {
        nestOrderNumber: request.orderId,
        orderType: request.orderType,
        qty: request.quantity.toString(),
        price: request.price.toString(),
        triggerPrice: request.triggerPrice?.toString() ?? '0',
        duration: request.validity,
      },
    );
    return data.orderid;
  },

  /**
   * Cancel an open order
   */
  cancelOrder: async (orderId: string): Promise<string> => {
    const data = await httpClient.post<{ orderid: string }>(
      '/placeOrder/cancelOrder',
      { nestOrderNumber: orderId },
    );
    return data.orderid;
  },

  /**
   * Fetch order book (all orders for the day)
   */
  getOrderBook: async (): Promise<Order[]> => {
    const data = await httpClient.get<RawOrder[]>('/placeOrder/fetchOrderBook');
    return data.map(mapRawOrder);
  },

  /**
   * Fetch trade book (executed trades)
   */
  getTradeBook: async (): Promise<Order[]> => {
    const data = await httpClient.get<RawOrder[]>('/placeOrder/fetchTradeBook');
    return data.map(mapRawOrder);
  },
};

// ============================================================
// RAW ORDER MAPPING
// ============================================================

interface RawOrder {
  Nstordno: string;
  Exchange: string;
  Trsym: string;
  Token: string;
  Trantype: string;
  Pcode: string;
  Prctype: string;
  Qty: string;
  Fillshares: string;
  Unfilledsize: string;
  Price: string;
  Avgprc: string;
  Trgprc: string;
  Status: string;
  RejReason?: string;
  OrderedTime: string;
  ExchOrderID?: string;
  AMO: string;
}

function mapRawOrder(raw: RawOrder): Order {
  return {
    orderId: raw.Nstordno,
    exchange: raw.Exchange as Order['exchange'],
    symbol: raw.Trsym,
    token: raw.Token,
    transactionType: raw.Trantype as Order['transactionType'],
    productType: raw.Pcode as Order['productType'],
    orderType: raw.Prctype as Order['orderType'],
    quantity: parseInt(raw.Qty, 10),
    filledQuantity: parseInt(raw.Fillshares, 10),
    pendingQuantity: parseInt(raw.Unfilledsize, 10),
    price: parseFloat(raw.Price),
    avgPrice: parseFloat(raw.Avgprc),
    triggerPrice: parseFloat(raw.Trgprc),
    status: raw.Status.toLowerCase() as Order['status'],
    statusMessage: raw.RejReason,
    orderTimestamp: raw.OrderedTime,
    exchangeOrderId: raw.ExchOrderID,
    isAmo: raw.AMO === 'Yes',
  };
}
