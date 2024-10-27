import { rooms, players } from "../data/storage.js";

export function startGame(roomId) {
  const idGame = roomId;
  const gamers = rooms.get(roomId)?.roomUsers;

  if (!gamers || gamers.length < 2) {
    console.error("Not enough players to start the game.");
    return;
  }

  gamers.forEach((gamer, index) => {
    const playerWs = players.get(gamer.name)?.ws;
    if (!playerWs)
      return console.error(`WebSocket for player ${gamer.name} not found.`);

    const playerId = index + 1;
    const startGameMessage = JSON.stringify({
      type: "create_game",
      data: JSON.stringify({ idGame, idPlayer: playerId }),
      id: 0,
    });

    playerWs.send(startGameMessage);
  });
}
