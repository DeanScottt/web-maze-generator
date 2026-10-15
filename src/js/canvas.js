import { MAZE_HEIGHT, MAZE_WIDTH, CELL_SIZE_RATIO } from "./config.js";
import { walls, oppositeDir, rowOffset, colOffset, IN_MAZE, WALK_DIR_SHIFT, WALK_DIR_MASK, NORTH, EAST, SOUTH, WEST, toCoord } from "./utils.js"

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
			return createCell(message.data.idx);
		case "walk":
			return walk(message.data.idx);
		case "connect":
			return connect(message.data.indexes);
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
	pathLayerCanvas.width = pathLayerCanvas.height = newCanvasWidth;
	wallLayerCanvas.width = wallLayerCanvas.height = newCanvasWidth;

	clearMaze();
}

const cellOriginInset = (idx) => idx * (wallWidth + pathWidth) + wallWidth;

function clearMaze() {
	wallLayer.fillStyle = "#FFF";
	wallLayer.fillRect(0, 0, wallLayerCanvas.width, wallLayerCanvas.height);
}

function createCell(idx) {
	const { row, col } = toCoord(idx);
	const y = cellOriginInset(row);
	const x = cellOriginInset(col);
	wallLayer.clearRect(x, y, pathWidth, pathWidth);
}

function walk(idx) {
	return; //! implement
}

function connect(indexes) {
	for (let i = 0; i < indexes.length; i++) {
		const { row, col } = toCoord(indexes[i]);
		let x = cellOriginInset(col);
		let y = cellOriginInset(row);
		let width = pathWidth;
		let height = pathWidth;

		const dir = (sharedData[indexes[i]] & WALK_DIR_MASK) >> WALK_DIR_SHIFT;
		if (dir === EAST || dir === WEST) width += wallWidth;
		else height += wallWidth;
		if (dir === NORTH) y -= wallWidth;
		if (dir === WEST) x -= wallWidth;

		wallLayer.clearRect(x, y, width, height);
	}
}

function debugGrid() {
	wallLayer.clearRect(0, 0, wallLayerCanvas.width, wallLayerCanvas.height);
	wallLayer.fillStyle = "#FFF";
	for (let i = 0; i <= MAZE_WIDTH; i++) {
		const inset = i * (wallWidth + pathWidth);
		wallLayer.fillRect(inset, 0, wallWidth, wallLayerCanvas.height);
		wallLayer.fillRect(0, inset, wallLayerCanvas.height, wallWidth);
	}
}