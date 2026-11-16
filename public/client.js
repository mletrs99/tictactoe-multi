/* Emelly Torres
   Project 4: Multiplayer Tic Tac Toe
   Web Development */
   
 // DOM ELEMENTS
const boardCanvas = document.getElementById("board");
const ctx = boardCanvas.getContext("2d");
const statusElement = document.getElementById("status");
const roleElement = document.getElementById("role");
const resetBtn = document.getElementById("resetBtn");
const joinBtn = document.getElementById("joinBtn");
const nameInput = document.getElementById("nameInput");
const passwordInput = document.getElementById("passwordInput");

const CELL_SIZE = 200;
// const ws = new WebSocket(`ws://${window.location.host}`); // WEBSOCKET CONNECTION

const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const ws = new WebSocket(`${protocol}//${window.location.host}`); // WEBSOCKET CONNECTION

let gameState = null; // Current game state
let role = "spectator"; // Player role


// Event Listener to place a game piece on board
boardCanvas.addEventListener("click", event => {
    if (role !== "X" && role !== "O") {
        return;
    }

    const rect = boardCanvas.getBoundingClientRect();

    //find where user clicked on the board
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    //adjust coordinates based on displayed board size
    const col = Math.floor(x / rect.width * 3);
    const row = Math.floor(y / rect.height * 3);

    const index = row * 3 + col;

    ws.send(JSON.stringify({ type: "place", index }));

}); // End of board click event listener


// DRAW BOARD
function drawBoard() {
    ctx.clearRect(0, 0, 600, 600);

    drawGrid(); // Draw grid, use function from Project 3

    // Draw pieces
    gameState.board.forEach((value, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        const x = col * CELL_SIZE;
        const y = row * CELL_SIZE;

        if (value === "X") {
            drawX(x, y); // Use function from Project 3
        } else if (value === "O") {
            drawO(x, y); // Use function from Project 3
        }
    });

    if (gameState.winner) {
        statusElement.textContent = `Winner: ${gameState.winner}`;
    } else {
        statusElement.textContent = `Turn: ${gameState.currentPlayer}`;
    }

} // End of drawBoard()


// Receive server messages via WebSocket
ws.onmessage = event => {
    const data = JSON.parse(event.data);

    // Updated game state
    if (data.type === "state") {
        gameState = data.gameState;
        drawBoard();
    }

    // Role assignment
    if (data.type === "role") {
        role = data.role;
        roleElement.textContent = `Logged in as ${data.name} (${role})`;
    }

    // Error messages
    if (data.type === "error") {
        alert(data.message);
    }

}; // End of ws.onmessage


// Join Game Event Listener
joinBtn.addEventListener("click", () => {
    ws.send(JSON.stringify({
        type: "login",
        name: nameInput.value.trim(),
        password: passwordInput.value
    }));
}); // End of Join Game Event Listener


// Reset Game Event Listener
resetBtn.addEventListener("click", () => {
    ws.send(JSON.stringify({ type: "reset" }));
}); // End of Reset Game Event Listener


// DRAW GRID - From original Project 3
function drawGrid() {
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#A8B58A";
    ctx.beginPath();

    ctx.moveTo(200, 0);
    ctx.lineTo(200, 600);

    ctx.moveTo(400, 0);
    ctx.lineTo(400, 600);

    ctx.moveTo(0, 200);
    ctx.lineTo(600, 200);

    ctx.moveTo(0, 400);
    ctx.lineTo(600, 400);

    ctx.stroke();
}


// DRAW X - From original Project 3
function drawX(x, y) {
    ctx.strokeStyle = "#d77c7c";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();

    ctx.moveTo(x + 30, y + 30);
    ctx.lineTo(x + 170, y + 170);

    ctx.moveTo(x + 170, y + 30);
    ctx.lineTo(x + 30, y + 170);

    ctx.stroke();
}


// DRAW O - From original Project 3
function drawO(x, y) {
    ctx.strokeStyle = "#a34a4a";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();

    ctx.arc(x + 100, y + 100, 70, 0, Math.PI * 2);

    ctx.stroke();
}

