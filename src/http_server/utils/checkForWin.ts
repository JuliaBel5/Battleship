import { games } from "./dataBase";

export function checkForWin(
  gameId: string | number,
  targetPlayerId: string | number
) {
  const targetPlayer = games[gameId].players[targetPlayerId];
  for (let row of targetPlayer.board) {
    for (let cell of row) {
      if (cell.hasShip && !cell.shot) {
        return false;
      }
    }
  }

  return true;
}
