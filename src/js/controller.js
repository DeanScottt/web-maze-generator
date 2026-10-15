import { MAZE_HEIGHT, MAZE_WIDTH, walls, oppositeDir, rowOffset, colOffset, IN_MAZE, WALK_DIR_SHIFT, WALK_DIR_MASK, NORTH, EAST, SOUTH, WEST } from "./config.js";
import Maze from "./maze.js";

export const sharedBuffer = new SharedArrayBuffer(MAZE_HEIGHT * MAZE_WIDTH);
const sharedState = new Uint8Array(sharedBuffer);
const canvasWorker = new Worker(new URL("./canvas.js", import.meta.url), {type: "module"});
const maze = new Maze(MAZE_HEIGHT, MAZE_WIDTH);











function init() {
	const offScreenCanvasPaths = document.querySelector(".canvas__maze-paths").transferControlToOffscreen();
	const offScreenCanvasWalls = document.querySelector(".canvas__maze-walls").transferControlToOffscreen();
	
	canvasWorker.postMessage({
		type: "init",
		pathLayer: offScreenCanvasPaths,
		wallLayer: offScreenCanvasWalls,
		buffer: sharedBuffer
	}, [offScreenCanvasPaths, offScreenCanvasWalls]);
	
	maze.reset();
	maze.generate();
	maze.debugRender();
}

init();