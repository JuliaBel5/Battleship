import { wsServer } from "../wsServer.js";

export function broadcastToAllClients(data) {
  if (!wsServer || !wsServer.clients) {
    console.error("WebSocket server not initialized or clients missing");
    return;
  }

  wsServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}
