import { placeRandomShips } from "../createShipsForBot";
import { games, players, rooms, RoomUser } from "../utils/dataBase";
import { sendError } from "../utils/sendError";
import {
  gameIdCounter,
  sendWinnersList,
  startGame,
  updateRooms,
} from "./actions";
import WebSocket from "ws";
import { initializePlayer } from "./game";

export function handleGameWithBot(ws: WebSocket) {
  const name = "Bot";
  const password = "password";

  players.set(name, { name, password, wins: 0, ws });
  handleCreateRoomForBot(ws);
}

export function handleCreateRoomForBot(ws: WebSocket): void {
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

  const roomId = 1232132;
  const roomUsers: RoomUser[] = [
    { name, index: 1 },
    { name: "Bot", index: 2 },
  ];
  rooms.set(roomId, { roomId, roomUsers });

  ws.send(
    JSON.stringify({
      type: "room_created",
      data: JSON.stringify({
        roomId,
        users: roomUsers,
      }),
      id: 1,
    })
  );

  if (!games[roomId]) {
    games[roomId] = {
      players: {},
      shipsReadyCount: 0,
      indexPlayer: 2,
    };
  }

  if (!games[roomId].players[2]) {
    initializePlayer(roomId, 2, ws);
  }

  updateRooms(ws);
  startGame(roomId);
  placeRandomShips(1232132, 2);
}
