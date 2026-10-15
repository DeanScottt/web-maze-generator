import { MAZE_HEIGHT, MAZE_WIDTH, CELL_SIZE_RATIO } from "./config.js";
import { walls, oppositeDir, rowOffset, colOffset, IN_MAZE, WALK_DIR_SHIFT, WALK_DIR_MASK, NORTH, EAST, SOUTH, WEST } from "./utils.js"

let pathLayerCanvas
let wallLayerCanvas;
let pathLayer;
let wallLayer;
let sharedData;

let pathWidth;
let wallWidth;

self.onmessage = (message) => {
	switch (message.data.type) {
		case "init":
			return init(message.data);
		case "seed":
			return createCell(...message.data.pos);
	}
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

	clearMaze();
}

const cellOriginInset = (idx) => idx * (wallWidth + pathWidth) + wallWidth;

function clearMaze() {
	wallLayer.fillStyle = "#FFF";
	wallLayer.fillRect(0, 0, wallLayerCanvas.width, wallLayerCanvas.height);
}

function createCell(row, col) {
	const y = cellOriginInset(row);
	const x = cellOriginInset(col);
	wallLayer.clearRect(x, y, pathWidth, pathWidth);
}

function debugGrid() {
	wallLayer.fillStyle = "#FFF";
	for (let i = 0; i <= MAZE_WIDTH; i++) {
		const inset = i * (wallWidth + pathWidth);
		wallLayer.fillRect(inset, 0, wallWidth, wallLayerCanvas.height);
		wallLayer.fillRect(0, inset, wallLayerCanvas.height, wallWidth);
	}
}