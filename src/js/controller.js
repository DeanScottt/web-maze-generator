import { MAZE_HEIGHT, MAZE_WIDTH, INTERVAL_WALK, INTERVAL_SEARCH, SKIP_WALKING_ANIMATION } from "./config.js";
import { NORTH, EAST, SOUTH, WEST, walls } from "./utils.js";
import maze from "./maze.js";

///////////////////////////////////////////////////////////////////////////////////////////////

const btn_generate = document.querySelector(".btn__generate");
const btn_solve = document.querySelector(".btn__solve");

///////////////////////////////////////////////////////////////////////////////////////////////

export const sharedBuffer = new SharedArrayBuffer(MAZE_HEIGHT * MAZE_WIDTH);
const canvasWorker = new Worker(new URL("./canvas.js", import.meta.url), {type: "module"});
const state = {
	initialized: false,
	generated: false,
	solved: false,
	genInterval: null,
	gen: null
}

//* ---------------------------------
//* -------- Generate Logic ---------
//* ---------------------------------

function handleGenerate() {
	if (state.gen) return;
	if (!state.initialized) {
		initCanvasWorker();
		maze.init(sharedBuffer);
		state.initialized = true;
	} else {
		maze.reset();
		canvasWorker.postMessage({ type: "reset" });
	}
	
	const midRow = MAZE_HEIGHT >> 1;
	const midCol = MAZE_WIDTH >> 1;
	const midIndex = (midRow * MAZE_WIDTH) + midCol;
	canvasWorker.postMessage({ type: "seed", idx: midIndex });
	
	state.generated = false;
	state.solved = false;
	state.gen = maze.generate(midIndex);
	state.genInterval = setInterval(controlGenerationStep, INTERVAL_WALK);
}

function controlGenerationStep() {
	let output = state.gen.next();

	if (SKIP_WALKING_ANIMATION) {
		while (!output.done && output.value.type !== "connect") output = state.gen.next();
	}
	if (!output.done) return canvasWorker.postMessage(output.value);

	clearInterval(state.genInterval);
	state.genInterval = null;
	state.gen = null;
	state.generated = true;
}

//* ---------------------------------
//* ---------- Solve Logic ----------
//* ---------------------------------

function handleSolve() {
	if (state.solved || !state.generated || state.gen) return;
	state.gen = maze.solve();
	state.genInterval = setInterval(controlSearchStep, INTERVAL_SEARCH);
}

function controlSearchStep() {
	const output = state.gen.next();

	if (!output.done) return canvasWorker.postMessage(output.value);

	clearInterval(state.genInterval);
	state.genInterval = null;
	state.gen = null;
	state.solved = true;

	const path = maze.traceSolution();
	canvasWorker.postMessage({ type: "solve", indexes: path });
}

///////////////////////////////////////////////////////////////////////////////////////////////

btn_generate.addEventListener("click", handleGenerate);
btn_solve.addEventListener("click", handleSolve);

///////////////////////////////////////////////////////////////////////////////////////////////

function initCanvasWorker() {
	const offScreenCanvas = document.querySelector(".canvas__maze-walls").transferControlToOffscreen();
	
	canvasWorker.postMessage({
		type: "init",
		canvas: offScreenCanvas,
		buffer: sharedBuffer
	}, [offScreenCanvas]);
}


function getWalls(row, col) {
	const idx = (row * MAZE_WIDTH) + col;
	const output = {
		North: (maze.data[idx] & walls[NORTH] ? true : false),
		East: (maze.data[idx] & walls[EAST] ? true : false),
		South: (maze.data[idx] & walls[SOUTH] ? true : false),
		West: (maze.data[idx] & walls[WEST] ? true : false)
	}
	return output;
}

function getAllWalls() {
	const grid = Array.from(
		{length: MAZE_HEIGHT}, (_, row) => Array(MAZE_WIDTH)
			.fill(0)
			.map((_, col) => getWalls(row, col)));

	return grid;
}