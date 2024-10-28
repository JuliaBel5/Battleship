import { games } from "./dataBase";

export function getNextPlayer(
  gameId: number | string,
  currentPlayerId: number | string
) {
  const playerIds = Object.keys(games[gameId].players);
  const currentIndex = playerIds.indexOf(String(currentPlayerId));
  return playerIds[(currentIndex + 1) % playerIds.length];
}
