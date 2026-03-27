import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { ordersApi } from '../api/ordersApi';
import { Logger } from '../utils/logger';
import type { Order, OrderRequest, ModifyOrderRequest } from '../types';

// ============================================================
// ORDERS STORE
// ============================================================

interface OrdersState {
  orders: Order[];
  isPlacing: boolean;
  isFetching: boolean;
  placingError: string | null;
  fetchError: string | null;
  lastRefresh: number | null;
}

interface OrdersActions {
  fetchOrders: () => Promise<void>;
  placeOrder: (order: OrderRequest) => Promise<string>;
  modifyOrder: (request: ModifyOrderRequest) => Promise<string>;
  cancelOrder: (orderId: string) => Promise<void>;
  clearErrors: () => void;
}

type OrdersStore = OrdersState & OrdersActions;

export const useOrdersStore = create<OrdersStore>()(
  immer((set) => ({
    orders: [],
    isPlacing: false,
    isFetching: false,
    placingError: null,
    fetchError: null,
    lastRefresh: null,

    fetchOrders: async () => {
      set((state) => { state.isFetching = true; state.fetchError = null; });
      try {
        const orders = await ordersApi.getOrderBook();
        set((state) => {
          state.orders = orders;
          state.isFetching = false;
          state.lastRefresh = Date.now();
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch orders';
        Logger.error('Fetch orders failed', error);
        set((state) => {
          state.isFetching = false;
          state.fetchError = message;
        });
      }
    },

    placeOrder: async (order: OrderRequest) => {
      set((state) => { state.isPlacing = true; state.placingError = null; });
      try {
        const orderId = await ordersApi.placeOrder(order);
        Logger.info('Order placed', { orderId });
        set((state) => { state.isPlacing = false; });
        return orderId;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Order placement failed';
        Logger.error('Place order failed', error);
        set((state) => {
          state.isPlacing = false;
          state.placingError = message;
        });
        throw error;
      }
    },

    modifyOrder: async (request: ModifyOrderRequest) => {
      try {
        const orderId = await ordersApi.modifyOrder(request);
        Logger.info('Order modified', { orderId });
        return orderId;
      } catch (error) {
        Logger.error('Modify order failed', error);
        throw error;
      }
    },

    cancelOrder: async (orderId: string) => {
      try {
        await ordersApi.cancelOrder(orderId);
        set((state) => {
          const order = state.orders.find((o) => o.orderId === orderId);
          if (order) order.status = 'cancelled';
        });
        Logger.info('Order cancelled', { orderId });
      } catch (error) {
        Logger.error('Cancel order failed', error);
        throw error;
      }
    },

    clearErrors: () => {
      set((state) => {
        state.placingError = null;
        state.fetchError = null;
      });
    },
  })),
);

// Selectors
export const useOrders = () => useOrdersStore((s) => s.orders);
export const useOpenOrders = () =>
  useOrdersStore((s) => s.orders.filter((o) => o.status === 'open'));
export const useOrdersLoading = () => useOrdersStore((s) => s.isFetching);
export const usePlacingOrder = () => useOrdersStore((s) => s.isPlacing);
