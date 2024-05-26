//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt


/**
 * A class holding the data of a point light. This is used by the {@link CL3D.LightSceneNode} to send data to the renderer.
 * @public
 * @constructor
 * @class A class holding the data of a point light.
 */
CL3D.Light = function()
{
	this.Position = new CL3D.Vect3d(0,0,0); 
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
CL3D.Light.prototype.clone = function()
{
	var r = new CL3D.Light();
	r.Position = this.Position.clone();
	r.Color = this.Color.clone();
	r.Radius = this.Radius;
	r.Attenuation = this.Attenuation;
	r.IsDirectional = this.IsDirectional;
	r.Direction = this.Direction != null ? this.Direction.clone() : null;
	return r;
}

/**
 * 3D Position of the light
 * @public
 * @type Vect3d
 */
CL3D.Light.prototype.Position = null;

/**
 * Color of the light
 * @public
 * @type ColorF
 */
CL3D.Light.prototype.Color = null;

/**
 * Attenuation of the light. Default is 1 / 100.
 * @public
 * @type Number
 */
CL3D.Light.prototype.Attenuation = null;

/**
 * Radius of the light. Currently ignored.
 * @public
 * @type Number
 */
CL3D.Light.prototype.Radius = null;

/**
 * Direction of the light. Only used if this is a directional light
 * @public
 * @type Vect3d
 */
CL3D.Light.prototype.Direction = null;

/**
 * Set this to true to make this a directional light
 * @public
 * @type Boolean
 */
CL3D.Light.prototype.IsDirectional = false;

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
CL3D.LightSceneNode = function(size)
{
	this.LightData = new CL3D.Light();	
	this.Box = new CL3D.Box3d();
	this.init();
}
CL3D.LightSceneNode.prototype = new CL3D.SceneNode();

/** 
 * Returns the type string of the scene node.
 * Returns 'light' for the light scene node.
 * @public
 * @returns {String} type name of the scene node.
 */
CL3D.LightSceneNode.prototype.getType = function()
{
	return 'light';
}

/**
 * Radius, Position, Color and Attenuation of the light
 * @public
 * @type CL3D.Light
 */
CL3D.LightSceneNode.prototype.LightData = null;

	
/**
 * @private
 */
CL3D.LightSceneNode.prototype.createClone = function(newparent, oldNodeId, newNodeId)
{
	var c = new CL3D.LightSceneNode();
	this.cloneMembers(c, newparent, oldNodeId, newNodeId);
		
	c.LightData = this.LightData.clone();
	c.Box = this.Box.clone();
	
	return c;
}


/**
 * @private
 */
CL3D.LightSceneNode.prototype.OnRegisterSceneNode = function(mgr)
{
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
CL3D.LightSceneNode.prototype.getBoundingBox = function()
{
	return this.Box;
}


/**
 * @private
 */
CL3D.LightSceneNode.prototype.render = function(renderer)
{
	if (this.LightData.IsDirectional)
		renderer.setDirectionalLight(this.LightData);
	else
		renderer.addDynamicLight(this.LightData);		
}