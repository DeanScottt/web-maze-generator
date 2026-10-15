import { MAZE_HEIGHT, MAZE_WIDTH, walls, oppositeDir, rowOffset, colOffset, IN_MAZE, WALK_DIR_SHIFT, WALK_DIR_MASK, NORTH, EAST, SOUTH, WEST, CELL_SIZE_RATIO } from "./config.js";

let pathLayerCanvas
let wallLayerCanvas;
let pathLayer;
let wallLayer;
let sharedData;

let pathWidth;
let wallWidth;

self.onmessage = (message) => {
	if (message.data.type === "init") return init(message.data);
}

function init(data) {
	sharedData = new Uint8Array(data.buffer);
	pathLayerCanvas = data.pathLayer;
	wallLayerCanvas = data.wallLayer;
	pathLayer = pathLayerCanvas.getContext("2d");
	wallLayer = wallLayerCanvas.getContext("2d");

	const wallNum = MAZE_WIDTH + 1;
	wallWidth = wallLayerCanvas.height / (CELL_SIZE_RATIO * MAZE_WIDTH + wallNum);
	pathWidth = wallWidth * CELL_SIZE_RATIO;
	wallWidth |= 1;
	pathWidth |= 1;
	const newCanvasWidth = MAZE_WIDTH * pathWidth + wallNum * wallWidth;
	pathLayerCanvas.width = newCanvasWidth;
	pathLayerCanvas.height = newCanvasWidth;
	wallLayerCanvas.width = newCanvasWidth;
	wallLayerCanvas.height = newCanvasWidth;

	drawWalls();
}

function drawWalls() {
	for (let i = 0; i < sharedData.length; i++) {
		const color = "#" + Array.from({length: 3}, () => (Math.ceil(Math.random() * 255)).toString(16).padStart(2, 0)).join("");
		console.log(color);
		wallLayer.fillStyle = color;
		const row = ~~(i / MAZE_WIDTH);
		const col = i % MAZE_WIDTH;

		const xCenter = (col + 1) * wallWidth + (col * pathWidth) + (pathWidth >> 1) + 1;
		const yCenter = (row + 1) * wallWidth + (row * pathWidth) + (pathWidth >> 1) + 1;
		
		wallLayer.fillRect(xCenter, yCenter, 5, 5);
		wallLayer.fillRect(xCenter - (pathWidth >> 1) - wallWidth, yCenter - (pathWidth >> 1) - wallWidth, wallWidth, pathWidth + (wallWidth << 1));
	}
}