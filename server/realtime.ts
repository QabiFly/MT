import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { RealtimeMessage } from '../src/types/index.js';

let wss: WebSocketServer | null = null;
const activeClients = new Set<WebSocket>();

export function initWebSocketServer(server: Server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    activeClients.add(ws);

    // Send initial welcome & connection ack
    const welcomeMsg: RealtimeMessage = {
      type: 'sync:ack',
      payload: { status: 'connected', clientsCount: activeClients.size },
      timestamp: new Date().toISOString(),
    };
    ws.send(JSON.stringify(welcomeMsg));

    ws.on('message', (message: string) => {
      try {
        const parsed = JSON.parse(message.toString());
        if (parsed.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        }
      } catch (err) {
        // Ignore unparseable client messages
      }
    });

    ws.on('close', () => {
      activeClients.delete(ws);
    });

    ws.on('error', () => {
      activeClients.delete(ws);
    });
  });

  return wss;
}

export function broadcastRealtime(type: RealtimeMessage['type'], payload: any) {
  if (!wss) return;

  const msg: RealtimeMessage = {
    type,
    payload,
    timestamp: new Date().toISOString(),
  };

  const serialized = JSON.stringify(msg);

  activeClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(serialized);
      } catch (err) {
        activeClients.delete(client);
      }
    }
  });
}
