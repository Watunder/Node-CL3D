//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "../main.js";

/**
 * @constructor
 * @extends CL3D.Scene
 * @public
 */
export class Free3dScene extends CL3D.Scene {
	constructor() {
		super();

		this.init();
		this.DefaultCameraPos = new CL3D.Vect3d();
		this.DefaultCameraTarget = new CL3D.Vect3d();
	}

	/**
	  * returns the type string of the current scene. For free 3d scenes, this is 'free'.
	  * @public
	*/
	getSceneType() {
		return "free";
	}
};
