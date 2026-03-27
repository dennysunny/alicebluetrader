/**
 * Store tests using React Testing Library + Jest
 */

import { act, renderHook } from '@testing-library/react-native';
import { useNotificationStore } from '../store/notificationStore';
import { usePortfolioStore } from '../store/portfolioStore';
import { MOCK_POSITIONS, MOCK_HOLDINGS, MOCK_FUNDS } from '../services/mockDataService';

// ============================================================
// NOTIFICATION STORE TESTS
// ============================================================

describe('NotificationStore', () => {
  beforeEach(() => {
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
    });
  });

  it('pushes a notification and increments unread count', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.push('trade', 'Buy Executed', 'RELIANCE 10 qty');
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.notifications[0].type).toBe('trade');
  });

  it('marks all notifications as read', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.push('trade', 'T1', 'Msg1');
      result.current.push('alert', 'T2', 'Msg2');
    });

    expect(result.current.unreadCount).toBe(2);

    act(() => {
      result.current.markAllRead();
    });

    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications.every((n) => n.read)).toBe(true);
  });

  it('marks a single notification as read', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.push('info', 'Title', 'Message');
    });

    const id = result.current.notifications[0].id;

    act(() => {
      result.current.markRead(id);
    });

    expect(result.current.notifications[0].read).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  it('clears all notifications', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      result.current.push('error', 'Error', 'Something failed');
      result.current.push('info', 'Info', 'FYI');
    });

    act(() => {
      result.current.clear();
    });

    expect(result.current.notifications).toHaveLength(0);
    expect(result.current.unreadCount).toBe(0);
  });

  it('caps notifications at 100', () => {
    const { result } = renderHook(() => useNotificationStore());

    act(() => {
      for (let i = 0; i < 110; i++) {
        result.current.push('info', `Title ${i}`, `Message ${i}`);
      }
    });

    expect(result.current.notifications.length).toBeLessThanOrEqual(100);
  });
});

// ============================================================
// PORTFOLIO STORE - SUMMARY CALCULATION TESTS
// ============================================================

describe('PortfolioStore getSummary()', () => {
  beforeEach(() => {
    usePortfolioStore.setState({
      positions: MOCK_POSITIONS,
      holdings: MOCK_HOLDINGS,
      funds: MOCK_FUNDS,
      isLoading: false,
      error: null,
      lastRefresh: null,
    });
  });

  it('computes holding totals correctly', () => {
    const summary = usePortfolioStore.getState().getSummary();

    const expectedInvestment = MOCK_HOLDINGS.reduce(
      (sum, h) => sum + h.investedValue,
      0,
    );

    expect(summary.totalInvestment).toBeCloseTo(expectedInvestment, 0);
    expect(summary.holdingsCount).toBe(MOCK_HOLDINGS.length);
  });

  it('computes position count correctly (non-zero qty only)', () => {
    const summary = usePortfolioStore.getState().getSummary();
    const nonZero = MOCK_POSITIONS.filter((p) => p.netQty !== 0).length;
    expect(summary.positionsCount).toBe(nonZero);
  });

  it('returns zero totals when no holdings', () => {
    usePortfolioStore.setState({ holdings: [], positions: [] });
    const summary = usePortfolioStore.getState().getSummary();
    expect(summary.totalInvestment).toBe(0);
    expect(summary.totalPnl).toBe(0);
    expect(summary.holdingsCount).toBe(0);
  });
});

// ============================================================
// MOCK DATA INTEGRITY TESTS
// ============================================================

describe('Mock data integrity', () => {
  it('all mock positions have required fields', () => {
    MOCK_POSITIONS.forEach((pos) => {
      expect(pos.symbol).toBeTruthy();
      expect(pos.token).toBeTruthy();
      expect(pos.exchange).toBeTruthy();
      expect(typeof pos.netQty).toBe('number');
      expect(typeof pos.pnl).toBe('number');
    });
  });

  it('all mock holdings have valid P&L', () => {
    MOCK_HOLDINGS.forEach((holding) => {
      const expectedPnl = holding.currentValue - holding.investedValue;
      expect(Math.abs(holding.pnl - expectedPnl)).toBeLessThan(1); // within ₹1
    });
  });

  it('mock funds balance is positive', () => {
    expect(MOCK_FUNDS.availableBalance).toBeGreaterThan(0);
    expect(MOCK_FUNDS.totalMargin).toBeGreaterThanOrEqual(MOCK_FUNDS.availableBalance);
  });
});
