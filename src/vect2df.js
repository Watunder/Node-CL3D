//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "./main.js";

/**
 * 2d vector class, used for example for texture coordinates.
 * @class 2d vector class, used for example for texture coordinates.
 * @constructor
 * @param {Number} x x coordinate. Can be null.
 * @param {Number} y y coordinate.
 */
export class Vect2d {
	/**
	 * X coordinate of the vector
	 * @public
	 * @type Number
	 */
	X = 0;

	/**
	 * Y coordinate of the vector
	 * @public
	 * @type Number 
	 */
	Y = 0;

	constructor(x, y) {
		if (x == null) {
			this.X = 0;
			this.Y = 0;
		}

		else {
			this.X = x;
			this.Y = y;
		}
	}
	/**
	 * Sets all 2 coordinates to new values
	 * @private
	 */
	set(x, y) {
		this.X = x;
		this.Y = y;
	}
	/**
	 * Creates a copy of this vector and returns it
	 * @public
	 * @type Vect2d
	 */
	clone() {
		return new CL3D.Vect2d(this.X, this.Y);
	}
}
