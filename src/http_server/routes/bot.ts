import { placeRandomShips } from "../utils/createShipsForBot";
import { games, players, rooms, RoomUser } from "../utils/dataBase";
import { sendError } from "../utils/sendError";
import { updateRooms } from "./actions";
import WebSocket from "ws";
import { initializePlayer } from "./game";
import { getPlayerName } from "../utils/getPlayerName";
import { v4 as uuidv4 } from "uuid";

let bootsGameIds = 0;

export function handleGameWithBot(ws: WebSocket) {
  const name = "Bot";
  const password = "password";

  players.set(name, { name, password, wins: 0, ws: null });
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
  const name = getPlayerName(ws) || "";

  const currentRoom = Array.from(rooms.values()).find((room) =>
    room.roomUsers.some((user) => user.name === name)
  );

  if (currentRoom) {
    rooms.delete(currentRoom.roomId);
  }

  const roomId = bootsGameIds;
  bootsGameIds += 1;
  const roomUsers: RoomUser[] = [
    { name, index: 2 },
    { name: "Bot", index: 1 },
  ];

  if (games[roomId]) {
    delete games[roomId];
  }
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
      isBotGame: true,
    };
  }

  if (!games[roomId].players[1]) {
    initializePlayer(roomId, 1, ws);
  }

  updateRooms(ws);
  placeRandomShips(roomId, 1);
  ws.send(
    JSON.stringify({
      type: "create_game",
      data: JSON.stringify({ idGame: roomId, idPlayer: 2 }),
      id: 0,
    })
  );
}
