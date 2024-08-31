//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "../main.js";

// -------------------------------------------------------------------
// Hotspot scene node: this one is actually not used anymore
// -------------------------------------------------------------------
/**
 * @constructor
 * @extends CL3D.SceneNode
 */
export class HotspotSceneNode extends CL3D.SceneNode {
	constructor(engine, scene) {
		super();

		this.Type = 1953526632;
		this.Box = new CL3D.Box3d();
		this.Width = 0;
		this.Height = 0;
	}
};

// -------------------------------------------------------------------
// Dummy scene node
// -------------------------------------------------------------------
/**
 * @constructor
 * @extends CL3D.SceneNode
 * @public
 */
export class DummyTransformationSceneNode extends CL3D.SceneNode {
	constructor() {
		super();

		this.init();

		this.Type = 1954112614;
		this.Box = new CL3D.Box3d();
		this.RelativeTransformationMatrix = new CL3D.Matrix4();
	}

	/**
	 * @public
	 */
	createClone(newparent, oldNodeId, newNodeId) {
		var c = new CL3D.DummyTransformationSceneNode();
		this.cloneMembers(c, newparent, oldNodeId, newNodeId);

		if (this.Box)
			c.Box = this.Box.clone();

		if (this.RelativeTransformationMatrix)
			c.RelativeTransformationMatrix = this.RelativeTransformationMatrix;

		return c;
	}

	/**
	 * @public
	 */
	getRelativeTransformation() {
		return this.RelativeTransformationMatrix;
	}

	/**
	 * @public
	 * @returns {String} type name of the scene node.
	 */
	getType() {
		return 'dummytrans';
	}
};

// -------------------------------------------------------------------
// Terrain scene node: Also does basically nothing, 
// mostly everything is set up in the scene graph by the editor
// -------------------------------------------------------------------

/**
 * @constructor
 * @extends CL3D.SceneNode
 */
export class TerrainSceneNode extends CL3D.SceneNode {
	constructor() {
		super();

		this.init();
		this.Box = new CL3D.Box3d();
	}

	getType() {
		return 'terrain';
	}
};
