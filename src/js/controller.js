import { MAZE_HEIGHT, MAZE_WIDTH } from "./config.js";
import maze from "./maze.js";

///////////////////////////////////////////////////////////////////////////////////////////////

const btn_generate = document.querySelector(".btn__generate");
const btn_solce = document.querySelector(".btn__solve");

///////////////////////////////////////////////////////////////////////////////////////////////

export const sharedBuffer = new SharedArrayBuffer(MAZE_HEIGHT * MAZE_WIDTH);
const canvasWorker = new Worker(new URL("./canvas.js", import.meta.url), {type: "module"});
let initialized = false;
let generated = false;
let solved = false;
let genInterval;
let gen;

function createMaze() {
	if (gen) return;

	if (!initialized) {
		initCanvasWorker();
		maze.init(sharedBuffer);
		initialized = true;
	} else {
		maze.reset();
		canvasWorker.postMessage({ type: "reset" })
	}
	
	const midRow = MAZE_HEIGHT >> 1;
	const midCol = MAZE_WIDTH >> 1;
	const midIndex = ~~(midRow * MAZE_WIDTH) + midCol;
	canvasWorker.postMessage({ type: "seed", idx: midIndex });
	gen = maze.generate(midIndex);
	
	genInterval = setInterval(() => {controlGenerationStep()}, 5);
}

function controlGenerationStep(skipTo) {
	let result = gen.next();
	if (skipTo) {
		while (!result.done && result.value.type !== skipTo) result = gen.next();
	}
	if (result.done) {
		clearInterval(genInterval);
		generated = true;
		gen = null;
		return;
	}
	canvasWorker.postMessage(result.value);
}

btn_generate.addEventListener("click", createMaze);

///////////////////////////////////////////////////////////////////////////////////////////////

function initCanvasWorker() {
	const offScreenCanvas = document.querySelector(".canvas__maze-walls").transferControlToOffscreen();
	
	canvasWorker.postMessage({
		type: "init",
		canvas: offScreenCanvas,
		buffer: sharedBuffer
	}, [offScreenCanvas]);
}