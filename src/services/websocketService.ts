import { WS_BASE_URL, WS_RECONNECT_DELAY } from '../constants';
import { Logger } from '../utils/logger';
import type { WsTick, WsSubscription, Exchange } from '../types';

// ============================================================
// WEBSOCKET SERVICE
// Alice Blue uses a binary WebSocket protocol (Hydra)
// ============================================================

type TickCallback = (tick: WsTick) => void;
type ConnectionCallback = (connected: boolean) => void;

interface WsMessage {
  k: string; // key: exchange|token
  v?: number[]; // values array
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private userId: string = '';
  private sessionToken: string = '';

  private subscriptions: Map<string, WsSubscription> = new Map();
  private tickCallbacks: Set<TickCallback> = new Set();
  private connectionCallbacks: Set<ConnectionCallback> = new Set();

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isIntentionallyClosed = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  // ============================================================
  // PUBLIC API
  // ============================================================

  connect(userId: string, sessionToken: string): void {
    this.userId = userId;
    this.sessionToken = sessionToken;
    this.isIntentionallyClosed = false;
    this.reconnectAttempts = 0;
    this.establishConnection();
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.clearReconnectTimer();
    this.ws?.close();
    this.ws = null;
  }

  subscribe(items: WsSubscription[]): void {
    items.forEach((item) => {
      const key = this.makeKey(item.exchange, item.token);
      this.subscriptions.set(key, item);
    });

    if (this.isConnected()) {
      this.sendSubscribe(items);
    }
  }

  unsubscribe(items: WsSubscription[]): void {
    items.forEach((item) => {
      const key = this.makeKey(item.exchange, item.token);
      this.subscriptions.delete(key);
    });

    if (this.isConnected()) {
      this.sendUnsubscribe(items);
    }
  }

  onTick(callback: TickCallback): () => void {
    this.tickCallbacks.add(callback);
    return () => this.tickCallbacks.delete(callback);
  }

  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback);
    return () => this.connectionCallbacks.delete(callback);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // ============================================================
  // PRIVATE METHODS
  // ============================================================

  private establishConnection(): void {
    try {
      const url = `${WS_BASE_URL}?loginType=API&userId=${this.userId}&userSession=${this.sessionToken}`;
      this.ws = new WebSocket(url);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);

      Logger.info('WebSocket connecting...');
    } catch (error) {
      Logger.error('WebSocket connection failed', error);
      this.scheduleReconnect();
    }
  }

  private handleOpen(): void {
    Logger.info('WebSocket connected');
    this.reconnectAttempts = 0;
    this.notifyConnectionChange(true);

    // Re-subscribe to all active subscriptions
    const items = Array.from(this.subscriptions.values());
    if (items.length > 0) {
      this.sendSubscribe(items);
    }
  }

  private handleMessage(event: MessageEvent): void {
    try {
      if (event.data instanceof ArrayBuffer) {
        this.processBinaryMessage(event.data);
      } else {
        const message = JSON.parse(event.data as string) as WsMessage;
        this.processJsonMessage(message);
      }
    } catch (error) {
      Logger.error('WebSocket message parse error', error);
    }
  }

  private handleError(event: Event): void {
    Logger.error('WebSocket error', event);
  }

  private handleClose(event: CloseEvent): void {
    Logger.info('WebSocket closed', { code: event.code, reason: event.reason });
    this.notifyConnectionChange(false);

    if (!this.isIntentionallyClosed) {
      this.scheduleReconnect();
    }
  }

  private processBinaryMessage(buffer: ArrayBuffer): void {
    // Alice Blue binary packet format (simplified parsing)
    // Actual implementation would follow their binary protocol spec
    const view = new DataView(buffer);
    if (buffer.byteLength < 8) return;

    const token = view.getUint32(0, false).toString();
    const ltp = view.getFloat32(4, false);
    const change = buffer.byteLength >= 12 ? view.getFloat32(8, false) : 0;

    // Find the subscription for this token
    for (const [, sub] of this.subscriptions) {
      if (sub.token === token) {
        const tick: WsTick = {
          token,
          exchange: sub.exchange,
          ltp,
          change,
          changePercent: 0,
          timestamp: Date.now(),
        };
        this.notifyTick(tick);
        break;
      }
    }
  }

  private processJsonMessage(message: WsMessage): void {
    if (!message.k || !message.v) return;

    const [exchange, token] = message.k.split('|');
    const values = message.v;

    if (values.length < 1) return;

    const tick: WsTick = {
      token,
      exchange: exchange as Exchange,
      ltp: values[0] ?? 0,
      change: values[1] ?? 0,
      changePercent: values[2] ?? 0,
      timestamp: Date.now(),
    };

    this.notifyTick(tick);
  }

  private sendSubscribe(items: WsSubscription[]): void {
    if (!this.isConnected()) return;

    const payload = {
      k: items.map((i) => `${i.exchange}|${i.token}`).join('#'),
      t: 'd', // subscribe
    };

    this.ws?.send(JSON.stringify(payload));
  }

  private sendUnsubscribe(items: WsSubscription[]): void {
    if (!this.isConnected()) return;

    const payload = {
      k: items.map((i) => `${i.exchange}|${i.token}`).join('#'),
      t: 'ud', // unsubscribe
    };

    this.ws?.send(JSON.stringify(payload));
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      Logger.error('Max WebSocket reconnect attempts reached');
      return;
    }

    const delay = Math.min(
      WS_RECONNECT_DELAY * Math.pow(1.5, this.reconnectAttempts),
      30000,
    );

    Logger.info(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.establishConnection();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private makeKey(exchange: string, token: string): string {
    return `${exchange}|${token}`;
  }

  private notifyTick(tick: WsTick): void {
    this.tickCallbacks.forEach((cb) => cb(tick));
  }

  private notifyConnectionChange(connected: boolean): void {
    this.connectionCallbacks.forEach((cb) => cb(connected));
  }
}

// Singleton instance
export const wsService = new WebSocketService();
