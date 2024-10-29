import { broadcastToGamePlayers } from "../routes/game";
import { games } from "./dataBase";
import { getNextPlayer } from "./getNextPlayer";
import { AttackResult } from "./types";

export function performAttack(
  gameId: string | number,
  x: number,
  y: number,
  targetPlayerId: string | number
): AttackResult {
  const game = games[gameId];
  const targetPlayer = game.players[targetPlayerId];
  const cell = targetPlayer.board[y][x];

  if (!cell) {
    return { shot: false, message: "Already attacked" };
  }
  if (cell.shot) {

    return { shot: true };
  }

  if (!cell.hasShip) {

    return { shot: false };
  }

  const shotShip = targetPlayer.ships.find((ship) => {
    const { position, direction, length } = ship;
    for (let i = 0; i < length; i++) {
      const posX = direction ? position.x : position.x + i;
      const posY = direction ? position.y + i : position.y;
      if (posX === x && posY === y) {
        return true;
      }
    }
    return false;
  });

  if (shotShip) {
    const { position, direction, length } = shotShip;
    cell.shot = true;

    if (length === 1) {
      const currentPlayer = getNextPlayer(gameId, targetPlayerId);
      const surroundingCells = getSurroundingCells(
        position,
        length,
        direction,
        targetPlayerId,
        gameId
      );

      cell.killed = true;
      sendAttackFeedback(gameId, surroundingCells, currentPlayer, "miss");
      return { shot: true, killed: true };
    }

    const killed = Array.from({ length }).every((_, i) => {
      const posX = direction ? position.x : position.x + i;
      const posY = direction ? position.y + i : position.y;
      return targetPlayer.board[posY][posX]?.shot;
    });

    if (killed) {
      const currentPlayer = getNextPlayer(gameId, targetPlayerId);
      const surroundingCells = getSurroundingCells(
        position,
        length,
        direction,
        targetPlayerId,
        gameId
      );
      cell.killed = true;

      sendAttackFeedback(gameId, surroundingCells, currentPlayer, "miss");
      return { shot: true, killed: true };
    }
    cell.shot = true;
    return { shot: true, killed: false };
  }
  return { shot: false, message: "Error in attack processing" };
}

export function getSurroundingCells(
  shipPosition: { x: number; y: number },
  length: number,
  direction: boolean,
  targetPlayerId: string | number,
  gameId: string | number
): { x: number; y: number }[] {
  const surroundingCells: { x: number; y: number }[] = [];
  const { x, y } = shipPosition;

  const game = games[gameId];
  const targetPlayer = game.players[targetPlayerId];

  for (let i = 0; i < length; i++) {
    const posX = direction ? x : x + i;
    const posY = direction ? y + i : y;

    surroundingCells.push({ x: posX - 1, y: posY });
    surroundingCells.push({ x: posX + 1, y: posY });
    surroundingCells.push({ x: posX, y: posY - 1 });
    surroundingCells.push({ x: posX, y: posY + 1 });
  }

  for (let i = 0; i < length; i++) {
    const posX = direction ? x : x + i;
    const posY = direction ? y + i : y;

    surroundingCells.push({ x: posX - 1, y: posY - 1 });
    surroundingCells.push({ x: posX + 1, y: posY - 1 });
    surroundingCells.push({ x: posX - 1, y: posY + 1 });
    surroundingCells.push({ x: posX + 1, y: posY + 1 });
  }

  if (direction) {
    surroundingCells.push({ x: x - 1, y: y });
    surroundingCells.push({ x: x + 1, y: y });
    surroundingCells.push({ x: x, y: y - 1 });
    surroundingCells.push({ x: x, y: y + length });

    surroundingCells.push({ x: x - 1, y: y - 1 });
    surroundingCells.push({ x: x + 1, y: y - 1 });
    surroundingCells.push({ x: x - 1, y: y + length });
    surroundingCells.push({ x: x + 1, y: y + length });
  } else {
    surroundingCells.push({ x: x, y: y - 1 });
    surroundingCells.push({ x: x, y: y + 1 });
    surroundingCells.push({ x: x - 1, y: y });
    surroundingCells.push({ x: x + length - 1, y: y });

    surroundingCells.push({ x: x - 1, y: y - 1 });
    surroundingCells.push({ x: x + length - 1, y: y - 1 });
    surroundingCells.push({ x: x - 1, y: y + 1 });
    surroundingCells.push({ x: x + length - 1, y: y + 1 });
  }

  return surroundingCells.filter(
    (cell) =>
      cell.x >= 0 && cell.y >= 0 && !targetPlayer.board[cell.y][cell.x]?.shot
  );
}

export function sendAttackFeedback(
  gameId: string | number,
  cells: { x: number; y: number }[],
  currentPlayerId: string | number,
  status: "miss"
) {
  cells.forEach((cell) => {
    const attackResponse: any = {
      type: "attack",
      data: JSON.stringify({
        position: cell,
        currentPlayer: Number(currentPlayerId),
        status: status,
      }),
      id: 0,
    };

    broadcastToGamePlayers(gameId, attackResponse);
  });
}
