//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "../main.js";

/**
 * A class holding the data of a point light. This is used by the {@link LightSceneNode} to send data to the renderer.
 * @public
 * @constructor
 * @class A class holding the data of a point light.
 */
export class Light {
	/**
	 * 3D Position of the light
	 * @public
	 * @type {CL3D.Vect3d}
	 */
	Position = null;

	/**
	 * Color of the light
	 * @public
	 * @type {CL3D.ColorF}
	 */
	Color = null;

	/**
	 * Attenuation of the light. Default is 1 / 100.
	 * @public
	 * @type Number
	 */
	Attenuation = null;

	/**
	 * Radius of the light. Currently ignored.
	 * @public
	 * @type Number
	 */
	Radius = null;

	/**
	 * Direction of the light. Only used if this is a directional light
	 * @public
	 * @type {CL3D.Vect3d}
	 */
	Direction = null;

	/**
	 * Set this to true to make this a directional light
	 * @public
	 * @type Boolean
	 */
	IsDirectional = false;

	constructor() {
		this.Position = new CL3D.Vect3d(0, 0, 0);
		this.Color = new CL3D.ColorF();

		this.Radius = 100;
		this.Attenuation = 1 / 100.0;
		this.Direction = null;
		this.IsDirectional = false;
	}

	/**
	 * Creates an exact copy of this light data
	 * @public
	 */
	clone() {
		var r = new CL3D.Light();
		r.Position = this.Position.clone();
		r.Color = this.Color.clone();
		r.Radius = this.Radius;
		r.Attenuation = this.Attenuation;
		r.IsDirectional = this.IsDirectional;
		r.Direction = this.Direction != null ? this.Direction.clone() : null;
		return r;
	}
};

/**
 * A class rendering a point light.
 * Lighting works like this: Simply add a light scene node to the scene (as shown in the example below), and
 * set the 'Lighting' flag of the material of the scene nodes you want to be lighted to 'true'. That's it,
 * your scene will now by lit by dynamic light. For changing how the light looks like, change the LightData
 * structure of the light, it holds the attenuation, position, and color of the light. 
 * Example showing how to add this to the current scene:
 * @constructor
 * @extends CL3D.SceneNode 
 * @class class rendering a point light.
 * @example
 * // add a cube to the scene
 * var lightnode = new CL3D.LightSceneNode();
 * scene.getRootSceneNode().addChild(lightnode);
 *
 */
export class LightSceneNode extends CL3D.SceneNode {
	/**
	 * Radius, Position, Color and Attenuation of the light
	 * @public
	 * @type CL3D.Light
	 */
	LightData = null;

	constructor(size) {
		super();

		this.Type = 1751608422;
		this.LightData = new CL3D.Light();
		this.Box = new CL3D.Box3d();
		this.init();
	}

	/**
	 * Returns the type string of the scene node.
	 * Returns 'light' for the light scene node.
	 * @public
	 * @returns {String} type name of the scene node.
	 */
	getType() {
		return 'light';
	}

	/**
	 * @public
	 */
	createClone(newparent, oldNodeId, newNodeId) {
		var c = new CL3D.LightSceneNode();
		this.cloneMembers(c, newparent, oldNodeId, newNodeId);

		c.LightData = this.LightData.clone();
		c.Box = this.Box.clone();

		return c;
	}

	/**
	 * @public
	 */
	OnRegisterSceneNode(mgr) {
		if (this.Visible)
			mgr.registerNodeForRendering(this, CL3D.Scene.RENDER_MODE_LIGHTS);

		CL3D.SceneNode.prototype.OnRegisterSceneNode.call(this, mgr); // register children 

		this.LightData.Position = this.getAbsolutePosition();
	}

	/**
	 * Get the axis aligned, not transformed bounding box of this node.
	 * This means that if this node is an animated 3d character, moving in a room, the bounding box will
	 * always be around the origin. To get the box in real world coordinates, just transform it with the matrix
	 * you receive with {@link getAbsoluteTransformation}() or simply use {@link getTransformedBoundingBox}(), which does the same.
	 * @public
	 * @returns {CL3D.Box3d} Bounding box of this scene node.
	 */
	getBoundingBox() {
		return this.Box;
	}

	/**
	 * @public
	 */
	render(renderer) {
		if (this.LightData.IsDirectional)
			renderer.setDirectionalLight(this.LightData);

		else
			renderer.addDynamicLight(this.LightData);
	}
};
