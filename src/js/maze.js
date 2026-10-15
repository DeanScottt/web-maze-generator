import { walls, oppositeDir, rowOffset, colOffset, IN_MAZE, WALK_DIR_SHIFT, WALK_DIR_MASK, VISITED_MASK, NORTH, EAST, SOUTH, WEST, toIndex } from "./utils.js"
import { MAZE_HEIGHT, MAZE_WIDTH } from "./config.js";

class VirtualGrid {
	#valueToPosition = new Map();
	#positionToValue = new Map();
	#originalSize;
	size;

	constructor(rows, cols) {
		this.#originalSize = rows * cols;
		this.reset();
	}

	reset() {
		this.size = this.#originalSize;
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
		const lastPos = --this.size;
		const lastVal = this.#getValueAt(lastPos);

		this.#positionToValue.set(pos, lastVal);
		this.#valueToPosition.set(lastVal, pos);

		this.#positionToValue.delete(lastPos);
		this.#valueToPosition.delete(marked);

		return marked;
	}

	getRandom() {
		const rand = ~~(Math.random() * this.size);
		return this.#removeAt(rand);
	}
}

class Maze {
	totalMapped;
	pos;
	rows = MAZE_HEIGHT;
	cols = MAZE_WIDTH;
	totalCells = MAZE_HEIGHT * MAZE_WIDTH;

	debugRender() {
		const WALL = "██";
		const OPEN = "  ";
		const grid = Array.from({length: this.rows * 2 + 1}, () => Array(this.cols * 2 + 1).fill(WALL));

		for (let i = 0; i < this.totalCells; i++) {
			const row = ~~(i / this.cols) * 2 + 1;
			const col = (i % this.cols) * 2 + 1;
			grid[row][col] = "  ";

			for (let dir = 0; dir < 4; dir++) {
				if (this.data[i] & walls[dir]) continue;
				grid[row + rowOffset[dir]][col + colOffset[dir]] = OPEN;
			}
		}

		console.log(grid.map(row => row.join("")).join("\n"));
	}

	debugBinary() {
		const converted = [...this.data].map(cell => cell.toString(2).padStart(8, 0));
		let str = "";
		for (let rowStart = 0; rowStart < this.totalCells; rowStart += this.cols) {
			str += (converted.slice(rowStart, rowStart + this.cols).join("  ")) + "\n";
		}
		console.log(str);
	}

	init(buffer) {
		this.data = new Uint8Array(buffer);
		this.data.fill(0b1111);
		this.totalMapped = 1;
		this.pos = {row: 0, col: 0};
	}

	setPos(idx) {
		this.pos.row = ~~(idx / this.cols);
		this.pos.col = idx % this.cols;
	}

	move(dir) {
		this.pos.row += rowOffset[dir];
		this.pos.col += colOffset[dir];
	}

	inBounds(dir) {
		switch (dir) {
			case NORTH:
				return this.pos.row > 0;
			case EAST:
				return this.pos.col < this.cols - 1;
			case SOUTH:
				return this.pos.row < this.rows - 1;
			case WEST:
				return this.pos.col > 0;
			default:
				throw new Error("Invalid direction value");
		}
	}

	canMove(idx, dir) {
		return !(this.data[idx] & walls[dir]);
	}

	deleteWall(idx, dir) {
		this.data[idx] &= ~(walls[dir]);
	}

	dropBreadCrumb(idx, dir) {
		this.data[idx] &= ~WALK_DIR_MASK;
		this.data[idx] |= (dir << WALK_DIR_SHIFT);
	}

	getBreadCrumb(idx) {
		return (this.data[idx] & ~VISITED_MASK) >> WALK_DIR_SHIFT;
	}

	*createPath() {
		let lastDir = null;

		while (true) {
			// Return when hitting existing maze
			const idx = toIndex(this.pos);
			if (this.data[idx] & IN_MAZE) break;

			// Culling loop
			if (this.data[idx] & VISITED_MASK) {
				const cullData = [];
				const startIdx = idx;
				let i = startIdx;

				do {
					const dir = this.getBreadCrumb(i);
					this.data[i] = this.data[i] & ~(VISITED_MASK | WALK_DIR_MASK);
					cullData.push(i);
					this.move(dir);
					i = toIndex(this.pos);
				} while (i !== startIdx);
				
				yield {type: "cull", indexes: cullData};
				continue;
			}

			// Exploring further
			this.data[idx] |= VISITED_MASK;
			const dirOptions = [];
			for (let dir = 0; dir < 4; dir++) {
				if (this.inBounds(dir) && dir !== lastDir) dirOptions.push(dir);
			}

			const dir = dirOptions[~~(Math.random() * dirOptions.length)];
			this.dropBreadCrumb(idx, dir);
			this.move(dir);
			yield {type: "walk", idx};
		}
	}

	*connectPath(startIdx) {
		const returnData = [startIdx];

		// Set in-maze flag on first cell
		this.setPos(startIdx);
		this.data[startIdx] |= IN_MAZE;
		this.totalMapped++;
		
		// Delete the wall and move to next cell in chain
		let dir = this.getBreadCrumb(startIdx);
		this.deleteWall(startIdx, dir);
		this.move(dir);
		let idx = toIndex(this.pos);

		// Loop until maze is hit, setting flags and clearing walls
		while (!(this.data[idx] & IN_MAZE)) {
			returnData.push(idx);
			this.data[idx] |= IN_MAZE;
			this.totalMapped++;
			this.deleteWall(idx, oppositeDir(dir));
			dir = this.getBreadCrumb(idx);

			this.deleteWall(idx, dir);
			this.move(dir);
			idx = toIndex(this.pos);
		}

		// Delete final wall and yield the chain as a group
		this.deleteWall(idx, oppositeDir(dir));
		yield {type: "connect", indexes: returnData};
	}

	*generate(seedIndex) {
		this.data[seedIndex] |= IN_MAZE;

		for (let idx = 0; idx < this.totalCells; idx++) {
			if (this.totalMapped === this.totalCells) break;
			if (this.data[idx] & IN_MAZE) continue;
			this.setPos(idx);
			yield* this.createPath();
			yield* this.connectPath(idx);
		}
	}
}

export default new Maze();