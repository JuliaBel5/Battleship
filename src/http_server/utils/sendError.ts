export function sendError(ws: WebSocket, message: string): void {
  ws.send(
    JSON.stringify({
      type: "error",
      data: JSON.stringify({ message }),
      id: 0,
    })
  );
}
