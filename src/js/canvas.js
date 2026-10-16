import { MAZE_HEIGHT, MAZE_WIDTH, CELL_SIZE_RATIO, COLOR_WALL, COLOR_PATH, COLOR_EXPLORE, COLOR_SEARCH, COLOR_SOLVED } from "./config.js";
import { walls, oppositeDir, rowOffset, colOffset, IN_MAZE, WALK_DIR_SHIFT, WALK_DIR_MASK, NORTH, EAST, SOUTH, WEST, toCoord } from "./utils.js"

let canvas;
let ctx;
let sharedData;

let pathWidth;
let wallWidth;

self.onmessage = (message) => {
	switch (message.data.type) {
		case "init":
			return init(message.data);
		case "reset":
			return clearMaze();
		case "seed":
			return createCell(message.data.idx);
		case "walk":
			return walk(message.data.idx);
		case "cull":
			return cull(message.data.indexes);
		case "connect":
			return connect(message.data.indexes);
	}
}

function init(data) {
	sharedData = new Uint8Array(data.buffer);
	canvas = data.canvas;
	ctx = canvas.getContext("2d");

	const wallNum = MAZE_WIDTH + 1;
	wallWidth = canvas.height / (CELL_SIZE_RATIO * MAZE_WIDTH + wallNum);
	pathWidth = wallWidth * CELL_SIZE_RATIO;
	wallWidth |= 1;
	pathWidth |= 1;

	const newCanvasWidth = MAZE_WIDTH * pathWidth + wallNum * wallWidth;
	canvas.width = canvas.height = newCanvasWidth;
	
	clearMaze();
}

const cellOriginInset = (idx) => idx * (wallWidth + pathWidth) + wallWidth;

function clearMaze() {
	ctx.fillStyle = COLOR_WALL;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function createCell(idx) {
	ctx.fillStyle = COLOR_PATH;
	const { row, col } = toCoord(idx);
	const y = cellOriginInset(row);
	const x = cellOriginInset(col);
	ctx.fillRect(x, y, pathWidth, pathWidth);
}

function walk(idx) {
	ctx.fillStyle = COLOR_EXPLORE;
	const { row, col } = toCoord(idx);
	let x = cellOriginInset(col);
	let y = cellOriginInset(row);
	ctx.fillRect(x, y, pathWidth, pathWidth);
}

function cull(indexes) {
	ctx.fillStyle = COLOR_WALL;
	for (let i = 0; i < indexes.length; i++) {
		const { row, col } = toCoord(indexes[i]);
		let x = cellOriginInset(col);
		let y = cellOriginInset(row);
		ctx.fillRect(x, y, pathWidth, pathWidth);
	}
}

function connect(indexes) {
	ctx.fillStyle = COLOR_PATH;
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

		ctx.fillRect(x, y, width, height);
	}
}

function debugGrid() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = COLOR_WALL;
	for (let i = 0; i <= MAZE_WIDTH; i++) {
		const inset = i * (wallWidth + pathWidth);
		ctx.fillRect(inset, 0, wallWidth, canvas.height);
		ctx.fillRect(0, inset, canvas.height, wallWidth);
	}
}