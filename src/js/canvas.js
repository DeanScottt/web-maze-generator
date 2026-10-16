import { MAZE_HEIGHT, MAZE_WIDTH, CELL_SIZE_RATIO, COLOR_WALL, COLOR_PATH, COLOR_EXPLORE, COLOR_SEARCH, COLOR_SOLVED } from "./config.js";
import { WALK_DIR_SHIFT, NORTH, EAST, SOUTH, WEST, toCoord } from "./utils.js"

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
			return createCell(message.data.idx, COLOR_PATH);

		case "walk":
			for (const idx of message.data.indexes) createCell(idx, COLOR_EXPLORE);
			return;

		case "cull":
			for (const idx of message.data.indexes) createCell(idx, COLOR_WALL);
			return;

		case "connect":
			return connect(message.data.indexes, COLOR_PATH);

		case "search":
			return connect(message.data.indexes, COLOR_SEARCH);

		case "solve":
			return connect(message.data.indexes, COLOR_SOLVED);
	}
}

function init(data) {
	sharedData = new Uint8Array(data.buffer);
	canvas = data.canvas;
	ctx = canvas.getContext("2d");

	wallWidth = canvas.height / (CELL_SIZE_RATIO * MAZE_HEIGHT + (MAZE_HEIGHT + 1));
	pathWidth = wallWidth * CELL_SIZE_RATIO;
	wallWidth |= 1;
	pathWidth |= 1;

	const newCanvasHeight = MAZE_HEIGHT * pathWidth + (MAZE_HEIGHT + 1) * wallWidth;
	const newCanvasWidth = MAZE_WIDTH * pathWidth + (MAZE_WIDTH + 1) * wallWidth;
	canvas.height = newCanvasHeight;
	canvas.width = newCanvasWidth;

	clearMaze();
}

const cellOriginInset = (idx) => idx * (wallWidth + pathWidth) + wallWidth;

function clearMaze() {
	ctx.fillStyle = COLOR_WALL;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function createCell(idx, color) {
	ctx.fillStyle = color;
	const { row, col } = toCoord(idx);
	const y = cellOriginInset(row);
	const x = cellOriginInset(col);
	ctx.fillRect(x, y, pathWidth, pathWidth);
}

function connect(indexes, color) {
	ctx.fillStyle = color;
	for (let i = 0; i < indexes.length; i++) {
		const { row, col } = toCoord(indexes[i]);
		let x = cellOriginInset(col);
		let y = cellOriginInset(row);
		let width = pathWidth;
		let height = pathWidth;

		const dir = sharedData[indexes[i]] >> WALK_DIR_SHIFT;
		
		if (dir === EAST || dir === WEST) width += wallWidth;
		if (dir === NORTH || dir === SOUTH) height += wallWidth;
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