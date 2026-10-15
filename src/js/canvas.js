import { MAZE_HEIGHT, MAZE_WIDTH, walls, oppositeDir, rowOffset, colOffset, IN_MAZE, WALK_DIR_SHIFT, WALK_DIR_MASK, NORTH, EAST, SOUTH, WEST, CELL_SIZE_RATIO } from "./config.js";

let canvas;
let ctx;
let sharedData;

let cellWidth;
let wallWidth;

self.onmessage = (message) => {
	if (message.data.type === "init") return init(message.data);
}

function init(data) {
	sharedData = new Uint8Array(data.buffer);
	canvas = data.canvas;
	ctx = canvas.getContext("2d");

	const wallNum = MAZE_WIDTH + 1;
	wallWidth = canvas.width / (CELL_SIZE_RATIO * MAZE_WIDTH + wallNum);
	cellWidth = wallWidth * CELL_SIZE_RATIO;
}

function drawWalls() {
	ctx.fillStyle = "#FFF";

	
}