import { addShipToPlayer } from "./routes/game";
import { GameBoard, games } from "./utils/dataBase";
import { ShipPosition } from "./utils/types";

const BOARD_SIZE = 10;

function getRandomDirection() {
  return Math.random() < 0.5;
}

function canPlaceShip(
  board: { hasShip: boolean; shot: boolean }[][],
  x: number,
  y: number,
  length: number,
  direction: boolean
) {
  for (let i = 0; i < length; i++) {
    const posX = direction ? x : x + i;
    const posY = direction ? y + i : y;

    if (
      posX < 0 ||
      posX >= BOARD_SIZE ||
      posY < 0 ||
      posY >= BOARD_SIZE ||
      board[posY][posX].hasShip
    ) {
      return false;
    }

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const checkX = posX + dx;
        const checkY = posY + dy;
        if (
          checkX >= 0 &&
          checkX < BOARD_SIZE &&
          checkY >= 0 &&
          checkY < BOARD_SIZE &&
          board[checkY][checkX].hasShip
        ) {
          return false;
        }
      }
    }
  }
  return true;
}

const SHIP_TYPES: {
  type: ShipPosition["type"];
  length: number;
  count: number;
}[] = [
  { type: "huge", length: 4, count: 1 },
  { type: "large", length: 3, count: 2 },
  { type: "medium", length: 2, count: 3 },
  { type: "small", length: 1, count: 4 },
];

export function placeRandomShips(
  gameId: string | number,
  playerId: string | number
) {
  const board: GameBoard = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({
      hasShip: false,
      shot: false,
      length: 0,
    }))
  );
  const playerData = games[gameId].players[playerId];
  playerData.ships = [];

  for (const { type, length, count } of SHIP_TYPES) {
    for (let i = 0; i < count; i++) {
      let placed = false;

      while (!placed) {
        const direction = getRandomDirection();
        const x = Math.floor(Math.random() * BOARD_SIZE);
        const y = Math.floor(Math.random() * BOARD_SIZE);

        if (canPlaceShip(board, x, y, length, direction)) {
          const shipPosition: ShipPosition = {
            position: { x, y },
            direction,
            type,
            length,
          };
          for (let j = 0; j < length; j++) {
            const posX = direction ? x : x + j;
            const posY = direction ? y + j : y;
            board[posY][posX].hasShip = true;
          }
          addShipToPlayer(gameId, playerId, shipPosition);
          placed = true;
        }
      }
    }
  }

  playerData.board = board;
  games[gameId].shipsReadyCount += 1;
}
