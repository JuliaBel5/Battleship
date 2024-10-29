# WebSocket Battleship Server

## Assignment

Implement a backend for a battleship game using WebSocket technology.

## Description

Your task is to create a battleship game backend capable of handling player interactions and game state management via WebSocket connections. Players can register, create or join rooms, and engage in battles with each other.

## Requirements

- **Start WebSocket Server**
- **Handle WebSocket Connections**
- **Manage Player Requests**
- **Manage Room Requests**
- **Manage Ships Requests**
- **Manage Game Requests**
- **(Optional) Create Single Play Bot**

## Technical Requirements

- Implement the task in **JavaScript or TypeScript**.
- Use **Node.js version 22.x.x** (22.9.0 or higher).
- The backend should support JSON string requests and responses.

# RSSchool NodeJS websocket task template

> Static http server and base task packages.
> By default WebSocket client tries to connect to the 3000 port.

## Installation

1. Clone/download repo
2. `npm install`

## Usage

**Development**

`npm run start:dev`

- App served @ `http://localhost:8181` with nodemon

**Production**

`npm run start`

- App served @ `http://localhost:8181` without nodemon

---

**All commands**

| Command             | Description                                          |
| ------------------- | ---------------------------------------------------- |
| `npm run start:dev` | App served @ `http://localhost:8181` with nodemon    |
| `npm run start`     | App served @ `http://localhost:8181` without nodemon |

**Note**: replace `npm` with `yarn` in `package.json` if you use yarn.
