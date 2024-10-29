import { placeRandomShips } from "../utils/createShipsForBot";
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
    rooms.delete(currentRoom.roomId);
  }

  const roomId = 1232132;
  const roomUsers: RoomUser[] = [
    { name, index: 2 },
    { name: "Bot", index: 1 },
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
      indexPlayer: 1,
    };
  }

  if (!games[roomId].players[1]) {
    initializePlayer(roomId, 1, ws);
  }

  updateRooms(ws);
  placeRandomShips(1232132, 1);
  ws.send(
    JSON.stringify({
      type: "create_game",
      data: JSON.stringify({ idGame: roomId, idPlayer: 2 }),
      id: 0,
    })
  );
}
