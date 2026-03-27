import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { portfolioApi } from '../api/portfolioApi';
import { Logger } from '../utils/logger';
import type { Position, Holding, FundsData, PortfolioSummary } from '../types';

// ============================================================
// PORTFOLIO STORE
// ============================================================

interface PortfolioState {
  positions: Position[];
  holdings: Holding[];
  funds: FundsData | null;
  isLoading: boolean;
  error: string | null;
  lastRefresh: number | null;
}

interface PortfolioActions {
  fetchAll: () => Promise<void>;
  fetchPositions: () => Promise<void>;
  fetchHoldings: () => Promise<void>;
  fetchFunds: () => Promise<void>;
  squareOffPosition: (position: Position) => Promise<string>;
  getSummary: () => PortfolioSummary;
}

type PortfolioStore = PortfolioState & PortfolioActions;

export const usePortfolioStore = create<PortfolioStore>()(
  immer((set, get) => ({
    positions: [],
    holdings: [],
    funds: null,
    isLoading: false,
    error: null,
    lastRefresh: null,

    fetchAll: async () => {
      set((state) => { state.isLoading = true; state.error = null; });
      try {
        const [positions, holdings, funds] = await Promise.all([
          portfolioApi.getPositions(),
          portfolioApi.getHoldings(),
          portfolioApi.getFunds(),
        ]);
        set((state) => {
          state.positions = positions;
          state.holdings = holdings;
          state.funds = funds;
          state.isLoading = false;
          state.lastRefresh = Date.now();
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load portfolio';
        Logger.error('Portfolio fetch failed', error);
        set((state) => {
          state.isLoading = false;
          state.error = message;
        });
      }
    },

    fetchPositions: async () => {
      const positions = await portfolioApi.getPositions();
      set((state) => { state.positions = positions; });
    },

    fetchHoldings: async () => {
      const holdings = await portfolioApi.getHoldings();
      set((state) => { state.holdings = holdings; });
    },

    fetchFunds: async () => {
      const funds = await portfolioApi.getFunds();
      set((state) => { state.funds = funds; });
    },

    squareOffPosition: async (position: Position) => {
      const orderId = await portfolioApi.squareOffPosition(position);
      await get().fetchPositions();
      return orderId;
    },

    getSummary: (): PortfolioSummary => {
      const { holdings, positions } = get();

      const holdingInvestment = holdings.reduce(
        (sum, h) => sum + h.investedValue, 0,
      );
      const holdingValue = holdings.reduce(
        (sum, h) => sum + h.currentValue, 0,
      );
      const holdingPnl = holdings.reduce((sum, h) => sum + h.pnl, 0);

      const positionPnl = positions.reduce((sum, p) => sum + p.pnl, 0);
      const positionDayPnl = positions.reduce(
        (sum, p) => sum + p.dayChange * Math.abs(p.netQty), 0,
      );

      const totalPnl = holdingPnl + positionPnl;
      const totalInvestment = holdingInvestment;
      const currentValue = holdingValue;
      const totalPnlPercent =
        totalInvestment > 0 ? (totalPnl / totalInvestment) * 100 : 0;

      return {
        totalInvestment,
        currentValue,
        totalPnl,
        totalPnlPercent,
        dayPnl: positionDayPnl,
        dayPnlPercent: 0,
        holdingsCount: holdings.length,
        positionsCount: positions.filter((p) => p.netQty !== 0).length,
      };
    },
  })),
);

export const usePositions = () => usePortfolioStore((s) => s.positions);
export const useHoldings = () => usePortfolioStore((s) => s.holdings);
export const useFunds = () => usePortfolioStore((s) => s.funds);
export const usePortfolioSummary = () =>
  usePortfolioStore((s) => s.getSummary());
