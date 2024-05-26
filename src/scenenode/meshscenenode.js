//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

/**
 * A scene node displaying a static {@link Mesh}.
 * @class A scene node displaying a static {@link Mesh}.
 * @constructor
 * @extends CL3D.SceneNode
 */
CL3D.MeshSceneNode = function()
{
	this.init();
	
	this.Box = new CL3D.Box3d();
	this.DoesCollision = false;
	this.OwnedMesh = null;
	this.ReadOnlyMaterials = true;
	this.Selector = null;
	this.OccludesLight = true;
	this.ReceivesStaticShadows = false;
}
CL3D.MeshSceneNode.prototype = new CL3D.SceneNode();

/**
 * Get the axis aligned, not transformed bounding box of this node.
 * This means that if this node is an animated 3d character, moving in a room, the bounding box will 
 * always be around the origin. To get the box in real world coordinates, just transform it with the matrix 
 * you receive with {@link getAbsoluteTransformation}() or simply use {@link getTransformedBoundingBox}(), which does the same.
 * @public
 * @returns {CL3D.Box3d} Bounding box of this scene node.
 */
CL3D.MeshSceneNode.prototype.getBoundingBox = function()
{
	if (this.OwnedMesh)
		return this.OwnedMesh.Box;
	return this.Box;
}

/**
 * Returns the {@link Mesh} drawn by this scene node.
 * @public
 * @returns {CL3D.Mesh} the 3d mesh of this scene node
 */
CL3D.MeshSceneNode.prototype.getMesh = function()
{
	return this.OwnedMesh;
}


/**
 * Sets the {@link Mesh} which should be drawn by this scene node.
 * @public
 * @param {CL3D.Mesh} m the mesh to draw from now on
 */
CL3D.MeshSceneNode.prototype.setMesh = function(m)
{
	this.OwnedMesh = m;
}

/** 
 * Returns the type string of the scene node.
 * Returns 'mesh' for the mesh scene node.
 * @public
 * @returns {String} type name of the scene node.
 */
CL3D.MeshSceneNode.prototype.getType = function()
{
	return 'mesh';
}

/**
 * @private
 */
CL3D.MeshSceneNode.prototype.OnRegisterSceneNode = function(mgr)
{
	var mesh = this.OwnedMesh;
	
	if (this.Visible && mesh)
	{
		var hasTransparentMaterials = false;
		var hasSolidMaterials = false;
		
		for (var i=0; i<mesh.MeshBuffers.length; ++i)
		{
			var buf = mesh.MeshBuffers[i];	
			if ( buf.Mat.isTransparent() )
				hasTransparentMaterials = true;
			else
				hasSolidMaterials = true;
		}
		
		if (hasTransparentMaterials)
		{
			if (this.isParentActiveFPSCameraToRenderChildrenWithoutZBuffer())
				mgr.registerNodeForRendering(this, CL3D.Scene.RENDER_MODE_TRANSPARENT_AFTER_ZBUFFER_CLEAR);
			else
				mgr.registerNodeForRendering(this, CL3D.Scene.RENDER_MODE_TRANSPARENT);
		}
			
		if (hasSolidMaterials)
		{
			if (this.isParentActiveFPSCameraToRenderChildrenWithoutZBuffer())
				mgr.registerNodeForRendering(this, CL3D.Scene.TRANSPARENT_SOLID_AFTER_ZBUFFER_CLEAR);
			else
				mgr.registerNodeForRendering(this, CL3D.Scene.RENDER_MODE_DEFAULT);
		}
			
		CL3D.SceneNode.prototype.OnRegisterSceneNode.call(this, mgr); 
	}
}

/**
 * @private
 */
CL3D.MeshSceneNode.prototype.render = function(renderer)
{
	renderer.setWorld(this.AbsoluteTransformation);
	
	var bShadowMapEnabled = renderer.isShadowMapEnabled();
	
	for (var i=0; i<this.OwnedMesh.MeshBuffers.length; ++i)
	{
		var buf = this.OwnedMesh.MeshBuffers[i];

		if (buf.Mat.isTransparent() == (this.scene.getCurrentRenderMode() == CL3D.Scene.RENDER_MODE_TRANSPARENT))
		{
			if (this.ReceivesStaticShadows || !buf.Mat.Lighting)
				renderer.quicklyEnableShadowMap(false);
			
			renderer.setMaterial(buf.Mat);		
			renderer.drawMeshBuffer(buf);
		}
	}	
	
	// reset shadow map to previous setting

	if (bShadowMapEnabled)
		renderer.quicklyEnableShadowMap(true);
}

/**
 * @private
 */
CL3D.MeshSceneNode.prototype.getMaterialCount = function()
{
	if (this.OwnedMesh)
		return this.OwnedMesh.MeshBuffers.length;
		
	return 0;
}

/**
 * @private
 */
CL3D.MeshSceneNode.prototype.getMaterial = function(i)
{
	if (this.OwnedMesh != null)
	{
		if (i>=0 && i<this.OwnedMesh.MeshBuffers.length)
		{
			var buf = this.OwnedMesh.MeshBuffers[i];
			return buf.Mat;
		}
	}
	return null;
}

/**
 * @public
 */
CL3D.MeshSceneNode.prototype.createClone = function(newparent, oldNodeId, newNodeId)
{
	var c = new CL3D.MeshSceneNode();
	this.cloneMembers(c, newparent, oldNodeId, newNodeId);
		
	if (this.OwnedMesh)
		c.OwnedMesh = this.OwnedMesh.createClone();
	//c.OwnedMesh = this.OwnedMesh;
		
	c.ReadonlyMaterials = this.ReadonlyMaterials;
	c.DoesCollision = this.DoesCollision;
			
	if (this.Box)
		c.Box = this.Box.clone();
	
	return c;
}