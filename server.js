/* Emelly Torres
   Project 4: Multiplayer Tic Tac Toe
   Web Development */
   
const express = require("express"); // Import the Express framework
const http = require("http"); // Import HTTP module for Express and WebSockets
const WebSocket = require("ws"); // WebSocket library for real-time communication

const app = express(); // Create Express application
const server = http.createServer(app); // Create HTTP server
const wss = new WebSocket.Server({ server }); // Create WebSocket server

app.use(express.static("public")); // Serve everything inside the public folder

const GAME_PASSWORD = "secret123"; // Password required to join the game

// GAME STATE
let gameState = {
    board: Array(9).fill(""),
    currentPlayer: "X",
    winner: null
};

// Track the two active players
let players = {
    X: null,
    O: null
};

// SEND GAME STATE TO EVERYONE
function broadcastState() {
    const payload = JSON.stringify({
        type: "state",
        gameState
    });

    // Loop through clients using a lambda expression with each client
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}

// CHECK FOR WINNER
function checkWinner(board) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    for (const [a, b, c] of lines) {
        if (
            board[a] &&
            board[a] === board[b] &&
            board[a] === board[c]
        ) {
            return board[a];
        }
    }

    return null;
}

// Connection Event Handler
wss.on("connection", ws => {

    // Declare and init variables to store information about this connection
    ws.playerName = "";
    ws.role = "spectator";
    ws.authenticated = false;

    // Send current game state immediately
    ws.send(JSON.stringify({ type: "state", gameState }));

    // RECEIVE MESSAGE
    ws.on("message", message => {
        const data = JSON.parse(message);

        // If message type was login, verify password and process a login
        if (data.type === "login") {
            if (data.password !== GAME_PASSWORD) {
                ws.send(JSON.stringify({
                    type: "error",
                    message: "Invalid password"
                }));
                return;
            }

            // If password verified, save user information
            ws.playerName = data.name;
            ws.authenticated = true;

            if (!players.X) {
                players.X = ws;
                ws.role = "X";
            } else if (!players.O) {
                players.O = ws;
                ws.role = "O";
            } else {
                ws.role = "spectator";
            }

            // Inform client of assigned role
            ws.send(
                JSON.stringify({
                    type: "role",
                    role: ws.role,
                    name: ws.playerName
                })
            );

            return;
        } // End of data.type === "login"

        // Ignore everything until authenticated
        if (!ws.authenticated) {
            return;
        }

        // PLACE PIECE
        if (data.type === "place") {
            const index = data.index;

            // Must be X or O
            if (ws.role !== "X" && ws.role !== "O") {
                return;
            }

            // Must be player's turn
            if (ws.role !== gameState.currentPlayer) {
                return;
            }

            // Game already finished
            if (gameState.winner) {
                return;
            }

            // Cell already occupied
            if (gameState.board[index] !== "") {
                return;
            }

            // Place move
            gameState.board[index] = gameState.currentPlayer;

            const winner = checkWinner(gameState.board);

            if (winner) {
                gameState.winner = winner;
            } else {
                gameState.currentPlayer =
                    gameState.currentPlayer === "X" ? "O" : "X";
            }

            broadcastState();

        } // End of data.type === "place"

        // RESET
        if (data.type === "reset") {
            gameState = {
                board: Array(9).fill(""),
                currentPlayer: "X",
                winner: null
            };

            broadcastState();
        }

    }); // End of ws.on("message")

    // CLIENT DISCONNECTS
    ws.on("close", () => {
        if (players.X === ws) {
            players.X = null;
        }

        if (players.O === ws) {
            players.O = null;
        }
    });

}); // End of wss.on("connection")

//START SERVER

// server.listen(3000, () => {
//     console.log("Server running on port 3000");
// });

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {console.log(`Server running on port ${PORT}`);} );
