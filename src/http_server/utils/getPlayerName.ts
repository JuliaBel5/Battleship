import { players } from "./dataBase";
import { sendError } from "./sendError";
import { WebSocket } from "ws";

export function getPlayerName(ws: WebSocket) {
  const playerEntry = Array.from(players.entries()).find(
    ([_, player]) => player.ws === ws
  );

  if (!playerEntry) {
    sendError(ws, "Player not found");
    return;
  }

  return playerEntry[0];
}
