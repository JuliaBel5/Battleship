import { WebSocketServer } from "ws";
import {
  handleRegistration,
  handleCreateRoom,
  handleAddUserToRoom,
} from "./routes/actions.js";
import { sendError } from "./utils/sendError";
import { handleAddShips, handleAttack } from "./routes/game.js";

export const wsServer = new WebSocketServer({ port: 3000 });

wsServer.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (message) => {
    const decodedMessage = message.toString();
    console.log("Received:", decodedMessage);
    try {
      const data = JSON.parse(decodedMessage);

      switch (data.type) {
        case "reg":
          const registrationData = JSON.parse(data.data || "{}");
          handleRegistration(ws, registrationData);
          break;

        case "create_room":
          handleCreateRoom(ws);
          break;

        case "add_user_to_room":
          const { indexRoom } = JSON.parse(data.data || "{}");
          handleAddUserToRoom(ws, indexRoom);
          break;

        case "add_ships":
          handleAddShips(ws, data); // Use the function from the imported module
          break;

        case "attack":
          handleAttack(ws, data);
          break;

        default:
          console.log("Unknown message type:", data.type);
      }
    } catch (error) {
      console.error("Failed to parse message:", error);
      sendError(ws, "Invalid JSON format");
    }
  });
});
