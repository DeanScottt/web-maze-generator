export const MAZE_WIDTH = 5;
export const MAZE_HEIGHT = 5;

export const walls = [0b0001, 0b0010, 0b0100, 0b1000];
export const oppositeDir = (n) => n ^ 2;
export const rowOffset = [-1, 0, 1, 0];
export const colOffset = [0, 1, 0, -1];

export const IN_MAZE = 0b00010000;
export const WALK_DIR_SHIFT = 5;
export const WALK_DIR_MASK = 0b11 << WALK_DIR_SHIFT;

export const NORTH = 0b00;
export const EAST = 0b01;
export const SOUTH = 0b10;
export const WEST = 0b11;

export const CELL_SIZE_RATIO = 10;