import { wsService } from './websocketService';
import { NotificationService } from '../store/notificationStore';
import { StorageHelper } from '../utils/storage';
import { Logger } from '../utils/logger';
import type { Exchange, WsTick } from '../types';

// ============================================================
// PRICE ALERT SERVICE
// ============================================================

export interface PriceAlert {
  id: string;
  token: string;
  symbol: string;
  exchange: Exchange;
  targetPrice: number;
  condition: 'above' | 'below';
  isTriggered: boolean;
  createdAt: number;
}

const ALERTS_STORAGE_KEY = 'price_alerts';

class PriceAlertService {
  private alerts: Map<string, PriceAlert> = new Map();
  private lastPrices: Map<string, number> = new Map();
  private unsubTick: (() => void) | null = null;

  start(): void {
    this.loadAlerts();
    this.unsubTick = wsService.onTick(this.handleTick.bind(this));
    Logger.info('PriceAlertService started');
  }

  stop(): void {
    this.unsubTick?.();
    this.unsubTick = null;
  }

  addAlert(
    alert: Omit<PriceAlert, 'id' | 'isTriggered' | 'createdAt'>,
  ): PriceAlert {
    const newAlert: PriceAlert = {
      ...alert,
      id: `alert_${Date.now()}`,
      isTriggered: false,
      createdAt: Date.now(),
    };

    this.alerts.set(newAlert.id, newAlert);
    this.persistAlerts();

    Logger.info('Price alert added', {
      symbol: alert.symbol,
      target: alert.targetPrice,
    });
    return newAlert;
  }

  removeAlert(id: string): void {
    this.alerts.delete(id);
    this.persistAlerts();
  }

  getAlerts(): PriceAlert[] {
    return Array.from(this.alerts.values()).filter(a => !a.isTriggered);
  }

  getAllAlerts(): PriceAlert[] {
    return Array.from(this.alerts.values());
  }

  clearTriggered(): void {
    for (const [id, alert] of this.alerts) {
      if (alert.isTriggered) this.alerts.delete(id);
    }
    this.persistAlerts();
  }

  private handleTick(tick: WsTick): void {
    const prevPrice = this.lastPrices.get(tick.token);
    this.lastPrices.set(tick.token, tick.ltp);

    if (!prevPrice) return; // Need previous price for comparison

    for (const [, alert] of this.alerts) {
      if (alert.token !== tick.token || alert.isTriggered) continue;

      const triggered =
        alert.condition === 'above'
          ? prevPrice < alert.targetPrice && tick.ltp >= alert.targetPrice
          : prevPrice > alert.targetPrice && tick.ltp <= alert.targetPrice;

      if (triggered) {
        alert.isTriggered = true;
        NotificationService.priceAlert(
          alert.symbol,
          tick.ltp,
          alert.targetPrice,
        );
        Logger.info('Price alert triggered', {
          symbol: alert.symbol,
          target: alert.targetPrice,
        });
        this.persistAlerts();
      }
    }
  }

  private loadAlerts(): void {
    try {
      const saved = StorageHelper.getJson<PriceAlert[]>(ALERTS_STORAGE_KEY);
      if (saved) {
        saved
          .filter(a => !a.isTriggered)
          .forEach(a => this.alerts.set(a.id, a));
      }
    } catch (error) {
      // MMKV not available (e.g. remote debugger active) — start with empty alerts
      Logger.warn(
        'PriceAlertService: storage unavailable, skipping alert restore',
        error,
      );
    }
  }

  private persistAlerts(): void {
    try {
      StorageHelper.setJson(
        ALERTS_STORAGE_KEY,
        Array.from(this.alerts.values()),
      );
    } catch (error) {
      Logger.warn(
        'PriceAlertService: storage unavailable, skipping persist',
        error,
      );
    }
  }
}

export const priceAlertService = new PriceAlertService();
