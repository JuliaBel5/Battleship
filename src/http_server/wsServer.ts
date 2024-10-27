import WebSocket, { WebSocketServer } from "ws";
import {
  handleRegistration,
  handleCreateRoom,
  handleAddUserToRoom,
} from "./routes/actions.js";
import { sendError } from "./utils/sendError";

export const wsServer = new WebSocketServer({ port: 3000 });
export let name = "";

wsServer.on("connection", (ws: WebSocket) => {
  console.log("New client connected");

  ws.on("message", (message) => {
    const decodedMessage = message.toString();
    console.log("Received:", decodedMessage);

    try {
      const data = JSON.parse(decodedMessage);
      if (data.type === "reg") {
        const registrationData = JSON.parse(data.data || "{}");
        name = registrationData.name;
        handleRegistration(ws as any, registrationData);
      } else if (data.type === "create_room") {
        handleCreateRoom(ws as any, name);
      } else if (data.type === "add_user_to_room") {
        const { indexRoom } = JSON.parse(data.data || "{}");
        console.log("indexRoom", indexRoom, name);
        handleAddUserToRoom(ws as any, indexRoom, name);
      }
    } catch (error) {
      console.error("Failed to parse message:", error);
      sendError(ws as any, "Invalid JSON format");
    }
  });
});
