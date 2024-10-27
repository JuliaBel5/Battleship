import { sendError } from "../utils/sendError";
import { wsServer } from "../wsServer";

// Определяем интерфейсы для игроков и комнат
interface Player {
  name: string;
  password: string;
  wins: number;
  ws: WebSocket;
}

interface RoomUser {
  name: string;
  index: number;
}

interface Room {
  roomId: number;
  roomUsers: RoomUser[];
}

interface Winner {
  name: string;
  wins: number;
}

// Инициализируем коллекции и переменные
export const players = new Map<string, Player>();
export const rooms = new Map<number, Room>();
export let gameIdCounter = 0;
export const winners: Winner[] = [];

// Обработка регистрации игрока
export function handleRegistration(
  ws: WebSocket,
  data: { name: string; password: string }
): void {
  const { name, password } = data;
  if (!name || !password) {
    sendError(ws, "Name and password are required");
    return;
  }
  if (players.has(name)) {
    sendError(ws, "Player already exists");
  } else {
    players.set(name, { name, password, wins: 0, ws });
    ws.send(
      JSON.stringify({
        type: "reg",
        data: JSON.stringify({ name, index: name, error: false }),
        id: 0,
      })
    );
    sendWinnersList(ws);
    updateRooms(ws);
  }
}

// Обработка создания комнаты
export function handleCreateRoom(ws: WebSocket, name: string): void {
  console.log(name, 123);
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

// Обработка добавления пользователя в комнату
export function handleAddUserToRoom(
  ws: WebSocket,
  indexRoom: number,
  playerName: string
): void {
  console.log("функция вызвалась");
  if (!rooms.has(indexRoom)) {
    console.log("error 1");
    sendError(ws, "Room does not exist");
    return;
  }
  if (typeof indexRoom === "undefined") {
    console.log("error 2");
    sendError(ws, "Invalid data format for adding user to room");
    return;
  }

  const room = rooms.get(indexRoom);
  console.log(room, "room");

  if (room && room.roomUsers.length >= 2) {
    sendError(ws, "Room is already full");
    return;
  }

  room?.roomUsers.push({ name: playerName, index: 2 });
  console.log("here");
  updateRooms(ws);
  startGame(indexRoom);
}

// Обновление списка победителей
export function updateWinners(
  ws: WebSocket,
  winnerData: { name: string; wins: number }
): void {
  const { name, wins } = winnerData || {};

  if (name && wins) {
    const existingWinner = winners.find((winner) => winner.name === name);
    if (existingWinner) {
      existingWinner.wins += 1;
    } else {
      winners.push({ name, wins: 1 });
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

// Запуск игры
export function startGame(roomId: number): void {
  const idGame = roomId;
  const gamers = rooms.get(roomId)?.roomUsers;

  if (!gamers || gamers.length < 2) {
    console.error("Not enough players to start the game.");
    return;
  }

  gamers.forEach((gamer, index) => {
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

// Рассылка сообщений всем клиентам
function broadcastToAllClients(data: string): void {
  const message = data;

  wsServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
