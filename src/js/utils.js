import { MAZE_WIDTH } from "./config.js";

export const walls = [0b0001, 0b0010, 0b0100, 0b1000];
export const rowOffset = [-1, 0, 1, 0];
export const colOffset = [0, 1, 0, -1];

export const IN_MAZE = 0b00010000;
export const WALK_DIR_SHIFT = 5;
export const WALK_DIR_MASK = 0b11 << WALK_DIR_SHIFT;
export const VISITED_MASK = 1 << 7;

export const NORTH = 0b00;
export const EAST = 0b01;
export const SOUTH = 0b10;
export const WEST = 0b11;

export const oppositeDir = (n) => n ^ 2;
export const toIndex = (pos) => ~~(pos.row * MAZE_WIDTH) + pos.col;
export function toCoord(idx) {
	const row = ~~(idx / MAZE_WIDTH);
	const col = idx % MAZE_WIDTH;
	return { row, col };
}

//* reorder bit flags so i don't have to mask the visited flag to check path