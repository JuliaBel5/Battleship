import { players, rooms, RoomUser, winners } from "../utils/dataBase";
import { getPlayerName } from "../utils/getPlayerName";
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
  console.log(`Player "${name}" registered successfully`);

  sendWinnersList(ws);
  console.log(`Winners list sent to player "${name}"`);

  updateRooms(ws);
  console.log(`Rooms list updated for player "${name}"`);
}

export function handleCreateRoom(ws: WebSocket): void {
  const name = getPlayerName(ws);

  if (!name) {
    sendError(ws, "Player not found");
    return;
  }

  const currentRoom = Array.from(rooms.values()).find((room) =>
    room.roomUsers.some((user) => user.name === name)
  );

  if (currentRoom) {
    rooms.delete(currentRoom.roomId);
  }

  const roomId = gameIdCounter++;
  const roomUsers: RoomUser[] = [{ name, index: 1 }];
  rooms.set(roomId, { roomId, roomUsers });
  console.log(`Room created: Room ID = ${roomId}, Created by = ${name}`);
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

  const playerName = getPlayerName(ws);
  if (!playerName) {
    sendError(ws, "Player not found");
    return;
  }

  const currentRoom = Array.from(rooms.values()).find((room) =>
    room.roomUsers.some((user) => user.name === playerName)
  );

  if (currentRoom) {
    if (currentRoom.roomId === indexRoom) {
      return;
    } else {
      rooms.delete(currentRoom.roomId);
    }
  }

  const room = rooms.get(indexRoom);

  if (room && room.roomUsers.length >= 2) {
    sendError(ws, "Room is already full");
    return;
  }

  room?.roomUsers.push({ name: playerName, index: room.roomUsers.length + 1 });
  console.log(
    `User added to room: Player = ${playerName}, Room ID = ${indexRoom}`
  );
  updateRooms(ws);
  startGame(indexRoom);
}

export function updateWinners(winnerData: Winner): void {
  const { name, wins } = winnerData || {};

  if (name && wins) {
    const existingWinner = winners.find((winner) => winner.name === name);
    if (existingWinner) {
      existingWinner.wins += 1;
    } else {
      winners.push({ name, wins: 1 });
    }
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
    console.log(
      `Game started in room: Room ID = ${roomId}, Game ID = ${idGame}`
    );
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
