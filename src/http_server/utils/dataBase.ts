import { ShipPosition, Winner } from "./types";
import type { WebSocket } from "ws";

export interface Player {
  name: string;
  password: string;
  wins: number;
  ws: WebSocket | null;
}

export interface RoomUser {
  name: string;
  index: number;
}

export interface Room {
  roomId: number;
  roomUsers: RoomUser[];
}

export type GameBoard = Array<
  Array<{ hasShip: boolean; shot: boolean; length: number; killed?: boolean }>
>;

export interface GameCell {
  hasShip: boolean;
  shot: boolean;
  length: number;
  killed?: boolean;
}

export interface PlayerData {
  board: GameBoard;
  ships: ShipPosition[];
  ws: WebSocket | null;
}

export interface GameData {
  players: { [id: number | string]: PlayerData };
  shipsReadyCount: number;
  indexPlayer: number | string;
  isBotGame?: boolean;
}

export interface Games {
  [key: string]: GameData;
}

export const games: Games = {};
export const players = new Map<string, Player>();
export const rooms = new Map<number, Room>();
export const winners: Winner[] = [];
