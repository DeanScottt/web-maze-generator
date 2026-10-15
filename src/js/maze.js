import { MAZE_HEIGHT, MAZE_WIDTH, walls, oppositeDir, rowOffset, colOffset, IN_MAZE, WALK_DIR_SHIFT, WALK_DIR_MASK, NORTH, EAST, SOUTH, WEST } from "./config.js";
import { sharedBuffer } from "./controller.js";

class Maze {
	totalMapped;
	pos = {row: 0, col: 0};

	constructor(rows, cols) {
		this.rows = rows;
		this.cols = cols;
		this.totalCells = rows * cols;
		this.data = new Uint8Array(sharedBuffer);
	}

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

	reset() {
		this.data.fill(0b1111);
		this.totalMapped = 1;
	}

	setPos(idx) {
		this.pos.row = ~~(idx / this.cols);
		this.pos.col = idx % this.cols;
	}

	move(dir) {
		this.pos.row += rowOffset[dir];
		this.pos.col += colOffset[dir];
	}

	toIndex(pos) {
		return ~~(pos.row * this.cols) + pos.col;
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
		return this.data[idx] >> WALK_DIR_SHIFT;
	}

	createPath() {
		while (true) {
			const idx = this.toIndex(this.pos);
			if (this.data[idx] & IN_MAZE) return;

			let dir = null;
			do {dir = ~~(Math.random() * 4)} while (!this.inBounds(dir));

			this.dropBreadCrumb(idx, dir);
			this.move(dir);
		}
	}

	connectPath(startIdx) {
		this.setPos(startIdx);
		this.data[startIdx] |= IN_MAZE;
		this.totalMapped++;
		
		let dir = this.getBreadCrumb(startIdx);
		this.deleteWall(startIdx, dir);
		this.move(dir);
		let idx = this.toIndex(this.pos);

		while (!(this.data[idx] & IN_MAZE)) {
			this.data[idx] |= IN_MAZE;
			this.totalMapped++;
			this.deleteWall(idx, oppositeDir(dir));
			dir = this.getBreadCrumb(idx);

			this.deleteWall(idx, dir);
			this.move(dir);
			idx = this.toIndex(this.pos);
		}

		this.deleteWall(idx, oppositeDir(dir));
	}

	generate() {
		const midRow = this.rows >> 1;
		const midCol = this.cols >> 1;
		const midIndex = this.toIndex({row: midRow, col: midCol});
		this.data[midIndex] |= IN_MAZE;

		for (let idx = 0; idx < this.totalCells; idx++) {
			if (this.totalMapped === this.totalCells) break;
			if (this.data[idx] & IN_MAZE) continue;
			this.setPos(idx);
			this.createPath();
			this.connectPath(idx);
		}
	}
}

export default Maze;