export enum MessageType {
  RegisterRequest = "register_request",
  RegisterResponse = "register_response",
  UpdateWinners = "update_winners",
  CreateRoom = "create_room",
  AddUserToRoom = "add_user_to_room",
  CreateGame = "create_game",
  UpdateRoom = "update_room",
  AddShips = "add_ships",
  StartGame = "start_game",
  Attack = "attack",
  AttackFeedback = "attack_feedback",
  RandomAttack = "random_attack",
  TurnInfo = "turn_info",
  FinishGame = "finish",
}

export interface Message<T> {
  type: string;
  data: T;
  id: number;
}

// Player messages
export interface RegisterRequest {
  name: string;
  password: string;
}

export interface RegisterResponse {
  name: string;
  index: number | string;
  error: boolean;
  errorText: string;
}

export type RegisterMessage = Message<RegisterRequest>;
export type RegisterResponseMessage = Message<RegisterResponse>;

export interface Winner {
  name: string;
  wins: number;
}

export type UpdateWinnersMessage = Message<Winner[]>;

export interface CreateRoomRequest {
  // Additional data can be added if needed
}

export interface AddUserToRoomRequest {
  indexRoom: number | string;
}

export interface CreateGameResponse {
  idGame: number | string;
  idPlayer: number | string; // Unique ID for each player in the game session
}

export type CreateRoomMessage = Message<CreateRoomRequest>;
export type AddUserToRoomMessage = Message<AddUserToRoomRequest>;
export type CreateGameMessage = Message<CreateGameResponse>;

export interface RoomUser {
  name: string;
  index: number | string;
}

export interface UpdateRoomState {
  roomId: number | string;
  roomUsers: RoomUser[];
}

export type UpdateRoomMessage = Message<UpdateRoomState[]>;

export interface ShipPosition {
  position: {
    x: number;
    y: number;
  };
  direction: boolean;
  length: number;
  type: "small" | "medium" | "large" | "huge";
}

export interface AddShipsRequest {
  gameId: number | string;
  ships: ShipPosition[];
  indexPlayer: number | string;
}

export type AddShipsMessage = Message<AddShipsRequest>;

export interface StartGameRequest {
  ships: ShipPosition[]; // Player's ships, not enemy's
  currentPlayerIndex: number | string; // ID of the player in the current game session
}

export type StartGameMessage = Message<StartGameRequest>;

export interface AttackRequest {
  gameId: number | string;
  x: number;
  y: number;
  indexPlayer: number | string; // ID of the player in the current game session
}

export interface AttackResult {
  shot: boolean;
  shipId?: number;
  killed?: boolean;
  message?: string;
}
export interface AttackFeedback {
  position: {
    x: number;
    y: number;
  };
  currentPlayer: number | string; // ID of the player in the current game session
  status: "miss" | "killed" | "shot";
}

export interface RandomAttackRequest {
  gameId: number | string;
  indexPlayer: number | string; // ID of the player in the current game session
}

export interface TurnInfo {
  currentPlayer: number | string; // ID of the player in the current game session
}

export interface FinishGame {
  winPlayer: number | string; // ID of the player in the current game session
}

export type AttackFeedbackMessage = Message<AttackFeedback>;

export type TurnInfoMessage = Message<TurnInfo>;
export type FinishGameMessage = Message<FinishGame>;

export interface RandomAttackMessage {
  type: "randomAttack";
  data: {
    gameId: number | string;
    indexPlayer: number | string;
  };
  id: number;
}

export interface AttackMessage {
  type: "attack";
  data: {
    gameId: number | string;
    x: number;
    y: number;
    indexPlayer: number | string;
  };
  id: number;
}
