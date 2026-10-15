import { MAZE_HEIGHT, MAZE_WIDTH } from "./config.js";
import { walls, oppositeDir, rowOffset, colOffset, IN_MAZE, WALK_DIR_SHIFT, WALK_DIR_MASK, NORTH, EAST, SOUTH, WEST } from "./utils.js"
import maze from "./maze.js";

export const sharedBuffer = new SharedArrayBuffer(MAZE_HEIGHT * MAZE_WIDTH);
const sharedState = new Uint8Array(sharedBuffer);
const canvasWorker = new Worker(new URL("./canvas.js", import.meta.url), {type: "module"});
let gen;

function createMaze() {
	maze.init(sharedBuffer);
	const midRow = MAZE_HEIGHT >> 1;
	const midCol = MAZE_WIDTH >> 1;
	const midIndex = ~~(midRow * MAZE_WIDTH) + midCol;

	canvasWorker.postMessage({
		type: "seed",
		idx: midIndex
	});

	gen = maze.generate(midIndex);
	maze.debugRender();
	document.addEventListener("keydown", (event) => {
		if (event.key === " ") renderMazeGeneration();
	});
}

function renderMazeGeneration() {
	let result = gen.next();
	while (!result.done && result.value.type !== "connect") result = gen.next();
	if (result.done) return console.log("DONE");
	canvasWorker.postMessage(result.value);
	console.clear();
	maze.debugRender();
}

///////////////////////////////////////////////////////////////////////////////////////////////

function init() {
	const offScreenCanvasPaths = document.querySelector(".canvas__maze-paths").transferControlToOffscreen();
	const offScreenCanvasWalls = document.querySelector(".canvas__maze-walls").transferControlToOffscreen();
	
	canvasWorker.postMessage({
		type: "init",
		pathLayer: offScreenCanvasPaths,
		wallLayer: offScreenCanvasWalls,
		buffer: sharedBuffer
	}, [offScreenCanvasPaths, offScreenCanvasWalls]);
	
	createMaze();
}

init();