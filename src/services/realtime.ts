import { RealtimeMessage } from '../types/index.js';

type MessageHandler = (msg: RealtimeMessage) => void;

class RealtimeClient {
  private socket: WebSocket | null = null;
  private handlers = new Set<MessageHandler>();
  private isConnecting = false;
  private reconnectTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  public connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnecting = false;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const msg: RealtimeMessage = JSON.parse(event.data);
          this.handlers.forEach((handler) => handler(msg));
        } catch (e) {}
      };

      this.socket.onclose = () => {
        this.isConnecting = false;
        this.scheduleReconnect();
      };

      this.socket.onerror = () => {
        this.isConnecting = false;
        if (this.socket) {
          this.socket.close();
        }
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connect();
      }, 3000);
    }
  }

  public subscribe(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }
}

export const realtimeClient = new RealtimeClient();
