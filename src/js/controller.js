import { MAZE_HEIGHT, MAZE_WIDTH } from "./config.js";
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
	solving: false,
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
		canvasWorker.postMessage({ type: "reset" })
	}
	
	const midRow = MAZE_HEIGHT >> 1;
	const midCol = MAZE_WIDTH >> 1;
	const midIndex = ~~(midRow * MAZE_WIDTH) + midCol;
	canvasWorker.postMessage({ type: "seed", idx: midIndex });
	state.gen = maze.generate(midIndex);
	
	state.genInterval = setInterval(() => {controlGenerationStep()}, 5);
}

function controlGenerationStep(skipTo) {
	let result = state.gen.next();

	if (skipTo) {
		while (!result.done && result.value.type !== skipTo) result = state.gen.next();
	}

	if (!result.done) return canvasWorker.postMessage(result.value);

	clearInterval(state.genInterval);
	state.genInterval = null;
	state.generated = true;
	state.gen = null;
}

//* ---------------------------------
//* ---------- Solve Logic ----------
//* ---------------------------------

function handleSolve() {
	console.log("test");
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