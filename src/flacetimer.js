//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

/**
 * A simple class for receiving the current time in milliseconds. Used by the animators for example.
 * @constructor
 * @private
 */
export class CLTimer {
	constructor() {
	}
	/**
		 * Returns the current time in milliseconds.
		 * @public
		 */
	static getTime() {
		//var d = new Date();
		//return d.getTime();
		return performance.now();
	}
}
