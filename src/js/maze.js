import { walls, oppositeDir, FLAG_IN_MAZE, FLAG_VISITED, WALK_DIR_SHIFT, WALK_DIR_MASK, NORTH, EAST, SOUTH, WEST, toCoord } from "./utils.js"
import { MAZE_HEIGHT, MAZE_WIDTH, STEPS_PER_FRAME_WALK } from "./config.js";

class VirtualGrid {
	#valueToPosition = new Map();
	#positionToValue = new Map();
	#originalSize;
	remaining;

	constructor(rows, cols) {
		this.#originalSize = rows * cols;
		this.reset();
	}

	reset() {
		this.remaining = this.#originalSize;
		this.#valueToPosition.clear();
		this.#positionToValue.clear();
	}

	#getValueAt(pos) {
		return this.#positionToValue.get(pos) ?? pos;
	}

	#getPositionOf(val) {
		return this.#valueToPosition.get(val) ?? val;
	}

	markCell(idx) {
		const pos = this.#getPositionOf(idx);
		this.#removeAt(pos);
	}

	#removeAt(pos) {
		const marked = this.#getValueAt(pos);
		const lastPos = --this.remaining;
		const lastVal = this.#getValueAt(lastPos);

		this.#positionToValue.set(pos, lastVal);
		this.#valueToPosition.set(lastVal, pos);

		this.#positionToValue.delete(lastPos);
		this.#valueToPosition.delete(marked);

		return marked;
	}

	getRandom() {
		const rand = ~~(Math.random() * this.remaining);
		return this.#removeAt(rand);
	}
}

class Maze {
	totalCells = MAZE_HEIGHT * MAZE_WIDTH;
	target = this.totalCells - 1;
	grid = new VirtualGrid(MAZE_HEIGHT, MAZE_WIDTH);
	idx = 0;

	debugBinary() {
		const converted = [...this.data].map(cell => cell.toString(2).padStart(8, 0));
		let str = "";
		for (let rowStart = 0; rowStart < this.totalCells; rowStart += MAZE_WIDTH) {
			str += (converted.slice(rowStart, rowStart + MAZE_WIDTH).join("  ")) + "\n";
		}
		console.log(str);
	}

	init(buffer) {
		this.data = new Uint8Array(buffer);
		this.reset();
	}

	reset() {
		this.data.fill(0b1111);
		this.grid.reset();
	}

	move(dir) {
		switch (dir) {
			case NORTH:
				return this.idx -= MAZE_WIDTH;
			case EAST:
				return ++this.idx;
			case SOUTH:
				return this.idx += MAZE_WIDTH;
			case WEST:
				return --this.idx;
			default:
				throw new Error("Invalid direction argument");
		}
	}

	inBounds(dir) {
		switch (dir) {
			case NORTH:
				return this.idx >= MAZE_WIDTH;
			case EAST:
				return (this.idx + 1) % MAZE_WIDTH > 0;
			case SOUTH:
				return this.idx < this.totalCells - MAZE_WIDTH;
			case WEST:
				return this.idx % MAZE_WIDTH > 0;
			default:
				throw new Error("Invalid direction argument");
		}
	}

	canMove(dir) {
		return !(this.data[this.idx] & walls[dir]);
	}

	deleteWall(dir) {
		this.data[this.idx] &= ~(walls[dir]);
	}

	dropBreadCrumb(dir) {
		this.data[this.idx] &= ~WALK_DIR_MASK;
		this.data[this.idx] |= (dir << WALK_DIR_SHIFT);
	}

	getBreadCrumb() {
		return this.data[this.idx] >> WALK_DIR_SHIFT;
	}

	*createPath() {
		let walkData = [];
		let lastDir = null;
		while (true) {
			// Return when hitting existing maze
			if (this.data[this.idx] & FLAG_IN_MAZE) break;

			// Culling loop
			if (this.data[this.idx] & FLAG_VISITED) {
				const cullData = [];
				const startIdx = this.idx;

				do {
					const dir = this.getBreadCrumb();
					this.data[this.idx] &= ~(FLAG_VISITED | WALK_DIR_MASK);
					cullData.push(this.idx);
					this.move(dir);

				} while (this.idx !== startIdx);
				
				while (cullData.length && walkData.length) {
					cullData.pop();
					walkData.pop();
				}

				if (cullData.length) yield {type: "cull", indexes: cullData};
				continue;
			}

			// Exploring further
			walkData.push(this.idx);
			this.data[this.idx] |= FLAG_VISITED;
			const dirOptions = [NORTH, EAST, SOUTH, WEST].filter(dir => this.inBounds(dir) && dir !== oppositeDir(lastDir));
			const dir = dirOptions[~~(Math.random() * dirOptions.length)];
			lastDir = dir;

			this.dropBreadCrumb(dir);
			this.move(dir);
			if (walkData.length === STEPS_PER_FRAME_WALK) yield {type: "walk", indexes: walkData.splice(0)};
		}

		if (walkData.length) yield {type: "walk", indexes: walkData};
	}

	*connectPath() {
		const returnData = [this.idx];

		// Update flags
		this.data[this.idx] |= FLAG_IN_MAZE;
		this.data[this.idx] &= ~(FLAG_VISITED);
		
		// Delete the wall and move to next cell in chain
		let dir = this.getBreadCrumb();
		this.deleteWall(dir);
		this.move(dir);

		// Loop until maze is hit, setting flags and clearing walls
		while (!(this.data[this.idx] & FLAG_IN_MAZE)) {
			returnData.push(this.idx);
			this.grid.markCell(this.idx);
			this.data[this.idx] |= FLAG_IN_MAZE;
			this.data[this.idx] &= ~(FLAG_VISITED);
			this.deleteWall(oppositeDir(dir));
			dir = this.getBreadCrumb();
			
			this.deleteWall(dir);
			this.move(dir);
		}

		// Delete final wall and yield the chain as a group
		this.data[this.idx] &= ~(FLAG_VISITED);
		this.deleteWall(oppositeDir(dir));
		yield {type: "connect", indexes: returnData};
	}

	*generate(seedIndex) {
		this.data[seedIndex] |= FLAG_IN_MAZE;
		this.grid.markCell(seedIndex);

		while (this.grid.remaining) {
			const startIdx = this.grid.getRandom();
			this.idx = startIdx;
			yield* this.createPath();
			this.idx = startIdx;
			yield* this.connectPath();
		}
	}

	*solve() {
		this.idx = 0;
	}
}

export default new Maze();