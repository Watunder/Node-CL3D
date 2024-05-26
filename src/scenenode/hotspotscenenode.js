//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

// -------------------------------------------------------------------
// Hotspot scene node: this one is actually not used anymore
// -------------------------------------------------------------------
/**
 * @constructor
 * @extends CL3D.SceneNode
 */
CL3D.HotspotSceneNode = function()
{
	this.Box = new CL3D.Box3d();
	this.Width = 0;
	this.Height = 0;
	
}
CL3D.HotspotSceneNode.prototype = new CL3D.SceneNode();

// -------------------------------------------------------------------
// Dummy scene node
// -------------------------------------------------------------------
/**
 * @constructor
 * @extends CL3D.SceneNode
 * @private
 */
CL3D.DummyTransformationSceneNode = function()
{
	this.init();
	
	this.Box = new CL3D.Box3d();
	this.RelativeTransformationMatrix = new CL3D.Matrix4();	
}
CL3D.DummyTransformationSceneNode.prototype = new CL3D.SceneNode();

/**
 * @private
 */
CL3D.DummyTransformationSceneNode.prototype.createClone = function(newparent, oldNodeId, newNodeId)
{
	var c = new CL3D.DummyTransformationSceneNode();
	this.cloneMembers(c, newparent, oldNodeId, newNodeId);
		
	if (this.Box)
		c.Box = this.Box.clone();
		
	if (this.RelativeTransformationMatrix)
		c.RelativeTransformationMatrix = this.RelativeTransformationMatrix;
	
	return c;
}

/** 
 * @private
 */
CL3D.DummyTransformationSceneNode.prototype.getRelativeTransformation = function()
{
	return this.RelativeTransformationMatrix;
}

/** 
 * @private
 * @returns {String} type name of the scene node.
 */
CL3D.DummyTransformationSceneNode.prototype.getType = function()
{
	return 'dummytrans';
}



// -------------------------------------------------------------------
// Terrain scene node: Also does basically nothing, 
// mostly everything is set up in the scene graph by the editor
// -------------------------------------------------------------------

/**
 * @constructor
 * @extends CL3D.SceneNode
 */
CL3D.TerrainSceneNode = function()
{
	this.init();	
	this.Box = new CL3D.Box3d();
}
CL3D.TerrainSceneNode.prototype = new CL3D.SceneNode();

CL3D.TerrainSceneNode.prototype.getType = function()
{
	return 'terrain';
}