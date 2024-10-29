import { WebSocket } from "ws";
import {
  GameBoard,
  GameData,
  games,
  PlayerData,
  winners,
} from "../utils/dataBase.js";
import { updateWinners } from "./actions.js";
import {
  AddShipsMessage,
  AttackFeedbackMessage,
  AttackMessage,
  AttackResult,
  FinishGame,
  FinishGameMessage,
  Message,
  RandomAttackMessage,
  ShipPosition,
  TurnInfoMessage,
} from "../utils/types.js";
import { getNextPlayer } from "../utils/getNextPlayer.js";
import { checkForWin } from "../utils/checkForWin.js";
import { performAttack } from "../utils/performAttack.js";
import { getPlayerName } from "../utils/getPlayerName.js";

export function handleAddShips(ws: WebSocket, data: any) {
  const parsedData = JSON.parse(data.data);

  const { gameId, ships, indexPlayer } = parsedData;

  if (!games[gameId]) {
    games[gameId] = {
      players: {},
      shipsReadyCount: 0,
      indexPlayer: indexPlayer,
    };
  }

  if (!games[gameId].players[indexPlayer]) {
    initializePlayer(gameId, indexPlayer, ws);
  }

  ships.forEach((ship: ShipPosition) => {
    addShipToPlayer(gameId, indexPlayer, ship);
  });

  games[gameId].shipsReadyCount += 1;

  if (
    games[gameId].shipsReadyCount === 2 ||
    games[1232132].shipsReadyCount === 2
  ) {
    const players = games[gameId].players;

    for (const playerIndex in players) {
      const playerData = players[playerIndex];
      if (playerData.ws) {
        playerData.ws.send(
          JSON.stringify({
            type: "start_game",
            data: JSON.stringify({
              ships: playerData.ships,
              currentPlayerIndex: indexPlayer,
            }),
            id: 0,
          })
        );
      }
    }

    for (const playerIndex in players) {
      const playerData = players[playerIndex];
      if (playerData.ws) {
        playerData.ws.send(
          JSON.stringify({
            type: "turn",
            data: JSON.stringify({
              currentPlayer: Number(indexPlayer),
            }),
            id: 0,
          })
        );
      }
    }
  }
}

export function initializePlayer(
  gameId: string | number,
  playerId: string | number,
  ws: WebSocket
) {
  const board: GameBoard = Array(10)
    .fill(null)
    .map(() => Array(10).fill({ hasShip: false, shot: false }));
  games[gameId].players[playerId] = { board, ships: [], ws };
}

export function addShipToPlayer(
  gameId: string | number,
  playerId: string | number,
  ship: ShipPosition
) {
  const game = games[gameId];
  const playerData = game.players[playerId];
  const shipId = playerData.ships.length + 1;

  playerData.ships.push({ ...ship });

  placeShipOnBoard(playerData.board, ship, shipId);
}

function placeShipOnBoard(
  board: GameBoard,
  ship: ShipPosition,
  shipId: number
) {
  const { x, y } = ship.position;
  const direction = ship.direction;
  const length = ship.length;

  for (let i = 0; i < length; i++) {
    const posX = direction ? x : x + i;
    const posY = direction ? y + i : y;

    if (
      posX >= 0 &&
      posX < board[0].length &&
      posY >= 0 &&
      posY < board.length
    ) {
      board[posY][posX] = { hasShip: true, shot: false, length };
    }
  }
}

export function handleAttack(ws: WebSocket, data: any) {
  const parsedData = JSON.parse(data.data);
  const { gameId, x, y, indexPlayer } = parsedData;
  const targetPlayer = getNextPlayer(gameId, indexPlayer);
  console.log(targetPlayer, "targetPlayer", indexPlayer, "indexPlayer");
  const result = performAttack(gameId, x, y, targetPlayer);
  let attackStatus: "miss" | "killed" | "shot" = result.shot ? "shot" : "miss";

  if (result.shot && result.killed) {
    attackStatus = "killed";
  }

  const attackResponse: any = {
    type: "attack",
    data: JSON.stringify({
      position: { x, y },
      currentPlayer: indexPlayer,
      status: attackStatus,
    }),
    id: 0,
  };
  broadcastToGamePlayers(gameId, attackResponse);

  if (!result.shot) {
    const nextPlayer = getNextPlayer(gameId, indexPlayer);
    const turnInfo: any = {
      type: "turn",
      data: JSON.stringify({ currentPlayer: Number(nextPlayer) }),
      id: 0,
    };
    broadcastToGamePlayers(gameId, turnInfo);
  } else if (result.shot) {
    const nextPlayer = Number(indexPlayer);
    const turnInfo: any = {
      type: "turn",
      data: JSON.stringify({ currentPlayer: nextPlayer }),
      id: 0,
    };
    broadcastToGamePlayers(gameId, turnInfo);
  }

  if (checkForWin(gameId, targetPlayer)) {
    const finishMessage: any = {
      type: "finish",
      data: JSON.stringify({ winPlayer: indexPlayer }),
      id: 0,
    };
    broadcastToGamePlayers(gameId, finishMessage);
    const winnerName = getPlayerName(ws) || "unknown";
    const winner = { name: winnerName, wins: 1 };
    updateWinners(winner);
  }
}

export function broadcastToGamePlayers<T>(
  gameId: string | number,
  message: Message<T>
) {
  const players = games[gameId].players;
  for (const playerIndex in players) {
    const playerData = players[playerIndex];
    if (playerData.ws) {
      playerData.ws.send(JSON.stringify(message));
    }
  }
}

export function handleRandomAttack(ws: WebSocket, data: any) {
  const parsedData = JSON.parse(data.data);
  const { gameId, indexPlayer } = parsedData;
  const targetPlayer = getNextPlayer(gameId, indexPlayer);

  const opponentBoard = games[gameId].players[targetPlayer].board;

  let x, y;

  do {
    x = Math.floor(Math.random() * 10);
    y = Math.floor(Math.random() * 10);
  } while (opponentBoard[y][x].shot);

  handleAttack(ws, {
    type: "attack",
    data: JSON.stringify({
      gameId,
      x,
      y,
      indexPlayer,
    }),
    id: 0,
  });
}
