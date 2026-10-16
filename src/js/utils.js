import { MAZE_WIDTH } from "./config.js";

export const walls = [0b0001, 0b0010, 0b0100, 0b1000];

export const FLAG_IN_MAZE = 0b00010000;
export const FLAG_VISITED = 1 << 5;
export const WALK_DIR_SHIFT = 6;
export const WALK_DIR_MASK = 0b11 << WALK_DIR_SHIFT;

export const NORTH = 0b00;
export const EAST = 0b01;
export const SOUTH = 0b10;
export const WEST = 0b11;

export const oppositeDir = (dir) => dir ^ 2;
export function toCoord(idx) {
	const row = ~~(idx / MAZE_WIDTH);
	const col = idx % MAZE_WIDTH;
	return { row, col };
}