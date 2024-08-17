///////////////////////////////////////////////////////////////////////////
// Line3D
///////////////////////////////////////////////////////////////////////////

import * as CL3D from "./main.js";

/**
 * 3d line class, decribing a line between two 3d points
 * @class 3d line class, decribing a line between two 3d points
 * @public
 * @constructor
 */
export class Line3d {
    /**
     * Start point of the line
     * @public
     * @type {CL3D.Vect3d}
     */
    Start = null;

    /**
     * End point of the line
     * @public
     * @type {CL3D.Vect3d}
     */
    End = null;
    
    constructor() {
        this.Start = new CL3D.Vect3d();
        this.End = new CL3D.Vect3d();
    }

    /**
     * Returns the vector representing the line
     * @public
     * @returns {CL3D.Vect3d} center
     */
    getVector() {
        return this.End.substract(this.Start);
    }

    /**
     * Returns the length of the line
     * @public
     * @returns {Number} center
     */
    getLength() {
        return this.getVector().getLength();
    }
};
