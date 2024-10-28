import { WebSocket } from "ws";
import { GameBoard, GameData, games, PlayerData } from "../utils/dataBase.js";
import { updateWinners } from "./actions.js";
import {
  AddShipsMessage,
  AttackFeedbackMessage,
  AttackMessage,
  AttackResult,
  FinishGame,
  FinishGameMessage,
  Message,
  ShipPosition,
  TurnInfoMessage,
} from "../utils/types.js";
import { getNextPlayer } from "../utils/getNextPlayer.js";
import { checkForWin } from "../utils/checkForWin.js";
import { performAttack } from "../utils/performAttack.js";

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

  if (games[gameId].shipsReadyCount === 2) {
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
            id: data.id,
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

function initializePlayer(
  gameId: string | number,
  playerId: string | number,
  ws: WebSocket
) {
  const board: GameBoard = Array(10)
    .fill(null)
    .map(() => Array(10).fill({ hasShip: false, shot: false }));
  games[gameId].players[playerId] = { board, ships: [], ws };
}

function addShipToPlayer(
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
  const result = performAttack(gameId, x, y, targetPlayer);
  let attackStatus: "miss" | "killed" | "shot" = result.shot ? "shot" : "miss";

  if (result.shot && result.killed) {
    attackStatus = "killed";
  }
  console.log(attackStatus);

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
    //обновить победителей для всех участников
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
