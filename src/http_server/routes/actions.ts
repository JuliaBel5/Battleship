import { players, rooms, RoomUser, winners } from "../utils/dataBase";
import { sendError } from "../utils/sendError";
import { Winner } from "../utils/types";
import { wsServer } from "../wsServer";
import { WebSocket } from "ws";

export let gameIdCounter = 0;

export function handleRegistration(
  ws: WebSocket,
  data: { name: string; password: string }
): void {
  const { name, password } = data;

  if (!name || !password) {
    ws.send(
      JSON.stringify({
        type: "reg",
        data: JSON.stringify({
          name: "",
          index: "",
          error: true,
          errorText: "Name and password are required",
        }),
        id: 0,
      })
    );
    return;
  }

  if (players.has(name)) {
    ws.send(
      JSON.stringify({
        type: "reg",
        data: JSON.stringify({
          name: "",
          index: "",
          error: true,
          errorText: "Player already exists",
        }),
        id: 0,
      })
    );
    return;
  }

  players.set(name, { name, password, wins: 0, ws });
  ws.send(
    JSON.stringify({
      type: "reg",
      data: JSON.stringify({
        name,
        index: name,
        error: false,
        errorText: "",
      }),
      id: 0,
    })
  );
  sendWinnersList(ws);
  updateRooms(ws);
}

export function handleCreateRoom(ws: WebSocket): void {
  const playerEntry = Array.from(players.entries()).find(
    ([_, player]) => player.ws === ws
  );

  if (!playerEntry) {
    sendError(ws, "Player not found");
    return;
  }

  const name = playerEntry[0];

  const currentRoom = Array.from(rooms.values()).find((room) =>
    room.roomUsers.some((user) => user.name === name)
  );

  if (currentRoom) {
    console.log(
      `Игрок ${name} уже создал комнату ${currentRoom.roomId}. Удаляем старую комнату.`
    );

    rooms.delete(currentRoom.roomId);
    console.log(`Старая комната ${currentRoom.roomId} удалена.`);
  }

  const roomId = gameIdCounter++;
  const roomUsers: RoomUser[] = [{ name, index: 1 }];
  rooms.set(roomId, { roomId, roomUsers });

  updateRooms(ws);
}

export function sendWinnersList(ws: WebSocket): void {
  const winnersListMessage = JSON.stringify({
    type: "update_winners",
    data: JSON.stringify(winners),
    id: 0,
  });

  ws.send(winnersListMessage);
}

export function updateRooms(ws: WebSocket): void {
  const existingRooms = Array.from(rooms.values()).filter(
    (room) => room.roomUsers[0].index === 1
  );

  const updateRoomMessage = JSON.stringify({
    type: "update_room",
    data: JSON.stringify(existingRooms),
    id: 0,
  });

  broadcastToAllClients(updateRoomMessage);
}

export function handleAddUserToRoom(ws: WebSocket, indexRoom: number): void {
  if (!rooms.has(indexRoom)) {
    sendError(ws, "Room does not exist");
    return;
  }

  if (typeof indexRoom === "undefined") {
    sendError(ws, "Invalid data format for adding user to room");
    return;
  }

  const playerEntry = Array.from(players.entries()).find(
    ([_, player]) => player.ws === ws
  );

  if (!playerEntry) {
    sendError(ws, "Player not found");
    return;
  }

  const playerName = playerEntry[0];
  const currentRoom = Array.from(rooms.values()).find((room) =>
    room.roomUsers.some((user) => user.name === playerName)
  );

  if (currentRoom) {
    if (currentRoom.roomId === indexRoom) {
      console.log(
        `Игрок ${playerName} уже находится в комнате ${currentRoom.roomId}. `
      );
      return;
    } else {
      console.log(
        `Игрок ${playerName} уже находится в комнате ${currentRoom.roomId}.`
      );

      rooms.delete(currentRoom.roomId);
      console.log(`Старая комната ${currentRoom.roomId} удалена.`);
    }
  }

  const room = rooms.get(indexRoom);

  if (room && room.roomUsers.length >= 2) {
    sendError(ws, "Room is already full");
    return;
  }

  room?.roomUsers.push({ name: playerName, index: room.roomUsers.length + 1 });

  updateRooms(ws);
  startGame(indexRoom);
}

export function updateWinners(winnerData: Winner): void {
  const { name, wins } = winnerData || {};

  if (name && wins) {
    const existingWinner = winners.find((winner) => winner.name === name);
    if (existingWinner) {
      existingWinner.wins;
    } else {
      winners.push({ name, wins });
    }

    console.log(`Winner updated: ${name}`);
  }
  const updateWinnerMessage = JSON.stringify({
    type: "update_winners",
    data: JSON.stringify(winners),
    id: 0,
  });

  broadcastToAllClients(updateWinnerMessage);
}

export function startGame(roomId: number): void {
  const idGame = roomId;
  const gamers = rooms.get(roomId)?.roomUsers;

  if (!gamers || gamers.length < 2) {
    console.error("Not enough players to start the game.");
    return;
  }

  gamers.forEach((gamer, index: number) => {
    const playerName = gamer.name;
    const playerWs = players.get(playerName)?.ws;

    if (!playerWs) {
      console.error(`WebSocket for player ${playerName} not found.`);
      return;
    }

    const playerId = index + 1;
    const startGameMessage = JSON.stringify({
      type: "create_game",
      data: JSON.stringify({ idGame, idPlayer: playerId }),
      id: 0,
    });

    playerWs.send(startGameMessage);
  });
}

function broadcastToAllClients(data: string): void {
  const message = data;

  wsServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
