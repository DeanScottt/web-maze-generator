import { MAZE_HEIGHT, MAZE_WIDTH, walls, oppositeDir, rowOffset, colOffset, IN_MAZE, WALK_DIR_SHIFT, WALK_DIR_MASK, NORTH, EAST, SOUTH, WEST } from "./config";

let canvas;
let ctx;
let sharedData;

this.onmessage = (message) => {
	if (message.data.type === "init") return init(message.data);
}

function init(data) {
	sharedData = new Uint8Array(data.buffer);
	canvas = data.canvas;
	ctx = canvas.getContext("2d");
}

function drawWalls() {
	ctx.fillStyle = "#FFF";

	
}