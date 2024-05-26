//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

/**
 * A scene node displaying an animated Mesh, usually a skeletal animated character.
 * @class A scene node displaying an animated Mesh, usually a skeletal animated character.
 * @constructor
 * @extends CL3D.SceneNode
 */
CL3D.AnimatedMeshSceneNode = function()
{
	this.init();
	
	this.Box = new CL3D.Box3d();
	this.DoesCollision = false;
	this.Mesh = null;
	this.Selector = null;
	
	this.LastLODSkinnedAnimationTime = 0;
	this.Materials = new Array();
	this.FramesPerSecond = 25.0/100.0;
	this.BeginFrameTime = CL3D.CLTimer.getTime();
	this.FrameWhenCurrentMeshWasGenerated = 0.0;
	
	this.StartFrame = 0;
	this.EndFrame = 0;
	this.Looping = false;
	this.CurrentFrameNr = 0;
	
	this.BlendTimeMs = 250;
	this.AnimationBlendingEnabled = true;
	this.CurrentlyBlendingAnimation = false;
	this.JointStatesBeforeBlendingBegin = new Array();
	this.BeginBlendTime = 0;
	this.WasAnimatedBefore = false;
	
	this.MinimalUpdateDelay = 20;
	
	this.AnimatedDummySceneNodes = new Array(); // list of items of type SAnimatedDummySceneNodeChild to be attached to an animated joint.
}
CL3D.AnimatedMeshSceneNode.prototype = new CL3D.SceneNode();

/**
 * Structure storing data about scene nodes attached to a joint of this item
 * @private
 */
CL3D.SAnimatedDummySceneNodeChild = function()
{
	this.Node = null; // child node to be animated by joint
	this.JointIdx = -1; // index of the joint to be used
	this.NodeIDToLink = -1; // only used for linking the children after the serialization process
}

/**
 * Get the axis aligned, not transformed bounding box of this node.
 * This means that if this node is an animated 3d character, moving in a room, the bounding box will 
 * always be around the origin. To get the box in real world coordinates, just transform it with the matrix 
 * you receive with {@link getAbsoluteTransformation}() or simply use {@link getTransformedBoundingBox}(), which does the same.
 * @public
 * @returns {CL3D.Box3d} Bounding box of this scene node.
 */
CL3D.AnimatedMeshSceneNode.prototype.getBoundingBox = function()
{
	return this.Box;
}

/**
 * Returns the amount of named animations in the animated mesh.
 * @public
 * @returns {Integer} Amount of named animations.
 */
CL3D.AnimatedMeshSceneNode.prototype.getNamedAnimationCount = function()
{
	if (this.Mesh && this.Mesh.NamedAnimationRanges)
		return this.Mesh.NamedAnimationRanges.length;
	return 0;
}

/**
 * Returns information about a named animation in the animated mesh by index
 * @public
 * @param {Integer} idx index of the animation. Must be a value >=0 and <getNamedAnimationCount().
 * @returns {Object} returns an object with info about the animation or null if there is no such animation. The object
 * will have the members .Name for the animation name, .Begin for the begin frame, .End for the end frame and
 * .FPS for the frames per second.
 */
CL3D.AnimatedMeshSceneNode.prototype.getNamedAnimationInfo = function(idx)
{
	var len = this.getNamedAnimationCount();
	
	if (idx >=0 && idx < len)
		return this.Mesh.NamedAnimationRanges[idx];
		
	return null;
}

/**
 * Sets the animation to a new one by name.
 * @public
 * @returns {Boolean} True if successful, false if not
 */
CL3D.AnimatedMeshSceneNode.prototype.setAnimation = function(name)
{
	if (!this.Mesh)
		return false;
		
	var animinfo = this.Mesh.getNamedAnimationRangeByName(name);
	if (!animinfo)
		return false;
		
	this.setFrameLoop(animinfo.Begin, animinfo.End);
	this.setAnimationSpeed(animinfo.FPS);
	return true;
}


/**
 * Enables or disables animation blending. 
 * When playing new animations, they are automatically blended when this is enabled (it is by default).
 * @public
 * @param {Boolean} enable true to enable, false for not enabling
 * @param {int} blendtime milliseconds needed for blending one animation into the next one. Default is 250.
 */
CL3D.AnimatedMeshSceneNode.prototype.setAnimationBlending = function(enable, blendtime)
{
	this.BlendTimeMs = blendtime == null ? 250 : blendtime;
	this.AnimationBlendingEnabled = enable;
}



/**
 * Sets the animation to a new one by name, also includes 'none' and 'all' as parameters
 * @private
 * @returns {Boolean} True if successful, false if not
 */
CL3D.AnimatedMeshSceneNode.prototype.setAnimationByEditorName = function(name, loop)
{
	if (!this.Mesh)
		return false;
				
	var smesh = this.Mesh; // as SkinnedMesh;
	if (!smesh)
		return false;
		
	var range = smesh.getNamedAnimationRangeByName(name);
	
	if (range)
	{
		this.setFrameLoop(range.Begin, range.End);
		if (range.FPS != 0)
			this.setAnimationSpeed(range.FPS);
		this.setLoopMode(loop);
	}
	else
	if (name)
	{
		// set 'all' or 'none' animation
		
		var lwrAnimName = name.toLowerCase();
		if (lwrAnimName == "all")
		{
			this.setFrameLoop(0, smesh.getFrameCount());
			if (smesh.DefaultFPS != 0)
				this.setAnimationSpeed(smesh.DefaultFPS);
			this.setLoopMode(loop);
		}
		else
		if (lwrAnimName == "none")
		{
			this.setFrameLoop(0, 0);
			this.setLoopMode(loop);
		}
	}
	
	return true;
}

/**
 * @private
 */
CL3D.AnimatedMeshSceneNode.prototype.setMesh = function(m)
{
	if (!m)
		return;
		
	this.Mesh = m;		
	
	this.Box = m.getBoundingBox();
	
	// copy materials here. HERE: ignored, animated meshes don't store materials here
	this.setFrameLoop(0, m.getFrameCount());
}

/** 
 * Returns the type string of the scene node.
 * Returns 'animatedmesh' for the mesh scene node.
 * @public
 * @returns {String} type name of the scene node.
 */
CL3D.AnimatedMeshSceneNode.prototype.getType = function()
{
	return 'animatedmesh';
}

/**
 * @private
 */
CL3D.AnimatedMeshSceneNode.prototype.OnRegisterSceneNode = function(mgr)
{
	if (this.Visible && this.Mesh)
	{
		var mats = this.Materials;
		
		var hasTransparentMaterials = false;
		var hasSolidMaterials = false;
		if (mats != null)
		{
			for (var i=0; i<mats.length; ++i)
			{
				if ( mats[i].isTransparent() )
					hasTransparentMaterials = true;
				else
					hasSolidMaterials = true;
			}
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
CL3D.AnimatedMeshSceneNode.prototype.getMaterialCount = function()
{
	if (this.Materials != null)
		return this.Materials.length;
		
	if (this.OwnedMesh)
		return this.OwnedMesh.MeshBuffers.length;
		
	return 0;
}

/**
 * @private
 */
CL3D.AnimatedMeshSceneNode.prototype.getMaterial = function(i)
{
	if (this.Materials)
	{
		if (i>=0 && i<this.Materials.length)
		{
			return this.Materials[i];
		}
		else
		{
			if (this.Mesh && this.Mesh.AnimatedMeshesToLink &&
				(i >= 0) && (this.Materials.length == i) && (i < 256) )
			{
				// the mesh has not yet been loaded, add this as a new CL3D.Material and return it.
				// we assume this material is in there
				var newMat = new CL3D.Material();
				this.Materials.push(newMat);
				return newMat;
			}					
		}
	}
	return null;
}

/**
 * @public
 */
CL3D.AnimatedMeshSceneNode.prototype.createClone = function(newparent, oldNodeId, newNodeId)
{
	var c = new CL3D.AnimatedMeshSceneNode();
	this.cloneMembers(c, newparent, oldNodeId, newNodeId);
		
	c.Mesh = this.Mesh;
					
	if (this.Box)
		c.Box = this.Box.clone();
		
	c.DoesCollision = this.DoesCollision;
	c.Selector = this.Selector;
	
	c.LastLODSkinnedAnimationTime = this.LastLODSkinnedAnimationTime;
	c.Materials = new Array();
	
	for (var i=0; i<this.Materials.length; ++i)
		c.Materials.push(this.Materials[i].clone());
		
	c.FramesPerSecond = this.FramesPerSecond;
	c.BeginFrameTime = this.BeginFrameTime;
	c.FrameWhenCurrentMeshWasGenerated = this.FrameWhenCurrentMeshWasGenerated;
	
	c.StartFrame = this.StartFrame;
	c.EndFrame = this.EndFrame;
	c.Looping = this.Looping;
	c.CurrentFrameNr = this.CurrentFrameNr;
	
	c.MinimalUpdateDelay = this.MinimalUpdateDelay;
	
	c.BlendTimeMs = this.BlendTimeMs;
	c.AnimationBlendingEnabled = this.AnimationBlendingEnabled;
	c.CurrentlyBlendingAnimation = false;
	c.JointStatesBeforeBlendingBegin = new Array();
	c.BeginBlendTime = 0;
	
	for (var i=0; i<this.AnimatedDummySceneNodes.length; ++i)
	{
		var h = new CL3D.SAnimatedDummySceneNodeChild();
		h.Node = this.AnimatedDummySceneNodes[i].Node; // will be replaced with the correct cloned item later in replaceAllReferencedNodes
		h.JointIdx = this.AnimatedDummySceneNodes[i].JointIdx;
		h.NodeIDToLink = this.AnimatedDummySceneNodes[i].NodeIDToLink;
		
		c.AnimatedDummySceneNodes.push(h);
	}
	
	return c;
}

/**
 * Sets the speed of the animation
 * @public
 * @param {Float} speed a floating point value specifying the frames per second to display
 */
CL3D.AnimatedMeshSceneNode.prototype.setAnimationSpeed = function(speed)
{
	this.FramesPerSecond = speed;
}

/**
 * Sets if the animation should be playbed back looped
 * @public
 * @param {Boolean} loop true to loop, false if not
 */
CL3D.AnimatedMeshSceneNode.prototype.setLoopMode = function(loop)
{
	this.Looping = loop;
}

/**
 * Sets the begin and end frame for a looped animation
 * @public
 * @param {Integer} begin start frame of the loop
 * @param {Integer} end end frame of the loop
 */
CL3D.AnimatedMeshSceneNode.prototype.setFrameLoop = function(begin, end)
{
	if (!this.Mesh)
		return false;

	var maxFrameCount = this.Mesh.getFrameCount() - 1;
	var oldStart = this.StartFrame;
	var oldEnd = this.EndFrame;
	
	if ( end < begin )
	{
		this.StartFrame = CL3D.clamp(end, 0, maxFrameCount);
		this.EndFrame = CL3D.clamp(begin, this.StartFrame, maxFrameCount);
	}
	else
	{
		this.StartFrame = CL3D.clamp(begin, 0, maxFrameCount);
		this.EndFrame = CL3D.clamp(end, this.StartFrame, maxFrameCount);
	}
	
	if (oldStart != this.StartFrame || oldEnd != this.EndFrame)
		this.setCurrentFrame ( this.StartFrame );

	return true;
}

/**
 * Sets the current frame to display
 * @public
 * @param {Float} frame current frame to display
 */
CL3D.AnimatedMeshSceneNode.prototype.setCurrentFrame = function(frame)
{
	var oldFrameNumber = this.CurrentFrameNr;
	
	this.CurrentFrameNr = CL3D.clamp( frame, this.StartFrame, this.EndFrame );
	this.BeginFrameTime = CL3D.CLTimer.getTime() - Math.floor((this.CurrentFrameNr - this.StartFrame) / this.FramesPerSecond);
	
	if (this.AnimationBlendingEnabled && this.BlendTimeMs)
		this.startAnimationBlending(oldFrameNumber);
}

/**
 * @private
 */
CL3D.AnimatedMeshSceneNode.prototype.buildFrameNr = function(timeMs)
{			
	var deltaFrame = 0; //:Number;
	
	if (this.StartFrame == this.EndFrame)
		return this.StartFrame; //Support for non animated meshes
		
	if (this.FramesPerSecond == 0.0)
		return this.StartFrame;
		
	var valueToReturn = 0;

	if (this.Looping)
	{
		// play animation looped
		var restartedLoop = false;

		var lenInMs = Math.abs(Math.floor( (this.EndFrame - this.StartFrame) / this.FramesPerSecond));
		if (this.FramesPerSecond > 0.0) // forwards
		{
			valueToReturn = this.StartFrame + ( (timeMs - this.BeginFrameTime) % lenInMs) * this.FramesPerSecond;
			
			restartedLoop = valueToReturn < this.CurrentFrameNr;
		}
		else // backwards
		{
			valueToReturn = this.EndFrame - ( (timeMs - this.BeginFrameTime) % lenInMs)* - this.FramesPerSecond;
			
			restartedLoop = valueToReturn > this.CurrentFrameNr;
		}
		
		if (restartedLoop && this.AnimationBlendingEnabled) // blend animations on loop end
			this.startAnimationBlending(this.CurrentFrameNr);
	}
	else
	{
		// play animation non looped

		if (this.FramesPerSecond > 0.0) // forwards
		{
			deltaFrame = ( timeMs - this.BeginFrameTime ) * this.FramesPerSecond;

			valueToReturn = this.StartFrame + deltaFrame;

			if (valueToReturn > this.EndFrame)
			{
				valueToReturn = this.EndFrame;
				
				//if (LoopCallBack)
				//	LoopCallBack.OnAnimationEnd(this);
			}
		}
		else // backwards
		{
			deltaFrame = ( timeMs - this.BeginFrameTime ) * (- this.FramesPerSecond);

			valueToReturn = this.EndFrame - deltaFrame;

			if (valueToReturn < this.StartFrame)
			{
				valueToReturn = this.StartFrame;
				
				//if (LoopCallBack)
				//	LoopCallBack.OnAnimationEnd(this);
			}

		}
	}
	
	return valueToReturn;
}


/**
 * Returns the currently displayed frame number.
 * @public
 */
CL3D.AnimatedMeshSceneNode.prototype.getFrameNr = function() //:Number
{
	return this.CurrentFrameNr;
}

/**
 * @private
 */
CL3D.AnimatedMeshSceneNode.prototype.hasDynamicLightedMaterials = function() 
{
	for (var i=0; i<this.Materials.length; ++i)
		if (this.Materials[i].Lighting)
			return true;
			
	return false;
}


/**
 * @private
 */
CL3D.AnimatedMeshSceneNode.prototype.calculateMeshForCurrentFrame = function() //:void
{
	// As multiple scene nodes may be sharing the same skinned mesh, we have to
	// re-animated it every frame to ensure that this node gets the mesh that it needs.

	var skinnedMesh = this.Mesh; // as SkinnedMesh;
	if (!skinnedMesh)
		return;

	var animationChanged = false;
	
	animationChanged = this.animateJointsWithCurrentBlendingSettings(this.getFrameNr());
			
	// Update the skinned mesh for the current joint transforms.
	if (animationChanged || skinnedMesh.skinDoesNotMatchJointPositions)
	{
		skinnedMesh.skinMesh(this.hasDynamicLightedMaterials());
		skinnedMesh.updateBoundingBox();
		this.Box = skinnedMesh.getBoundingBox().clone();
		
		// update all changed buffers
		for (var i=0; i<skinnedMesh.LocalBuffers.length; ++i)
		{
			var buf = skinnedMesh.LocalBuffers[i]; // as MeshBuffer;	
			buf.update(true);
		}
	}

	this.FrameWhenCurrentMeshWasGenerated = this.CurrentFrameNr;
}

/**
 * Sets the minimal update delay. The animated mesh is only updated every few milliseconds, in order to increase
 * performance. The default value is 60 milli seconds (= 16 frames per second). Set it to 0 to enable instant updates.
 * @public
 * @param {Float} frame current frame to display
 */
CL3D.AnimatedMeshSceneNode.prototype.setMinimalUpdateDelay = function(delayMs)
{
	this.MinimalUpdateDelay = delayMs;
}

/**
 * @private
 */
CL3D.AnimatedMeshSceneNode.prototype.OnAnimate = function(mgr, timeMs) //:Boolean
{
	var framechanged = false;
	var now = CL3D.CLTimer.getTime();
	
	if (this.LastLODSkinnedAnimationTime == 0 ||
		now - this.LastLODSkinnedAnimationTime > this.MinimalUpdateDelay)
	{
		var newFrameNr = this.buildFrameNr ( timeMs );
		framechanged = this.CurrentFrameNr != newFrameNr;
		this.CurrentFrameNr = newFrameNr;
		this.LastLODSkinnedAnimationTime = now;
	}
	
	//return super.OnAnimate(mgr, timeMs) || framechanged;
	var changed = CL3D.SceneNode.prototype.OnAnimate.call(this, mgr, timeMs);
	
	if (this.AnimatedDummySceneNodes.length != 0)
		this.updatePositionsOfAttachedNodes();
		
	return changed;
}	

/**
 * @private
 */
CL3D.AnimatedMeshSceneNode.prototype.render = function(renderer) //:void
{
	// skip if the mesh isn't visible in the frustum
	
	var frustrum = this.scene.getCurrentCameraFrustrum();
	if (frustrum)
	{
		if (!frustrum.isBoxInside(this.getTransformedBoundingBox()))
			return;
	}
	
	//this.scene.SkinnedMeshesRenderedLastTime += 1;
		
	// go drawing
	
	var skinnedMesh = this.Mesh; // as SkinnedMesh;
	if (skinnedMesh)
	{
		renderer.setWorld(this.AbsoluteTransformation);
		
		// calculate skin
		
		if (!skinnedMesh.isStatic())
			this.calculateMeshForCurrentFrame();
		
		this.WasAnimatedBefore = true;
				
		var isForShadowBuffer = this.scene.getCurrentRenderMode() == CL3D.Scene.RENDER_MODE_SHADOW_BUFFER;
		
		var bShadowMapEnabled = renderer.isShadowMapEnabled();
						
		// draw all buffers of the skinned mesh
		
		for (var i=0; i<skinnedMesh.LocalBuffers.length; ++i)
		{
			var buf = skinnedMesh.LocalBuffers[i]; // as MeshBuffer;			
			if (i<this.Materials.length)
				buf.Mat = this.Materials[i];
				
			if (isForShadowBuffer ||
			    buf.Mat.isTransparent() == (this.scene.getCurrentRenderMode() == CL3D.Scene.RENDER_MODE_TRANSPARENT))
			{				
				if (buf.Transformation != null)
					renderer.setWorld(this.AbsoluteTransformation.multiply(buf.Transformation)); // rigid transformation of the whole buffer
				
				if (!isForShadowBuffer)
				{
					if (!buf.Mat.Lighting && bShadowMapEnabled)
						renderer.quicklyEnableShadowMap(false);
				
					renderer.setMaterial(buf.Mat);	
				}
				else
				{
					var matType = buf.Mat.Type;
					if ( matType == CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL_REF_MOVING_GRASS)
					{
						this.scene.ShadowDrawMaterialAlphaRefMovingGrass.Tex1 = buf.Mat.Tex1;
						renderer.setMaterial(this.scene.ShadowDrawMaterialAlphaRefMovingGrass);	
					}
					else
					if (matType == CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL_REF)
					{
						this.scene.ShadowDrawMaterialAlphaRef.Tex1 = buf.Mat.Tex1;
						renderer.setMaterial(this.scene.ShadowDrawMaterialAlphaRef);	
					}
					else
						renderer.setMaterial(this.scene.ShadowDrawMaterialSolid);	
				}
					
				renderer.drawMeshBuffer(buf);
				
				if (buf.Transformation != null)
					renderer.setWorld(this.AbsoluteTransformation); // set back old transformation
			}
		}	
		
		if (bShadowMapEnabled)
			renderer.quicklyEnableShadowMap(true);
	}
}

/**
 * @private
 */
CL3D.AnimatedMeshSceneNode.prototype.ensureJointCopyArrayHasCorrectSize = function(joints)
{	
	var sz1 = joints.length;
	if (sz1 > this.JointStatesBeforeBlendingBegin.length)
	{
		while(this.JointStatesBeforeBlendingBegin.length < sz1)
		{
			var o = new Object();
			o.Animatedposition = new CL3D.Vect3d(0,0,0);
			o.Animatedscale = new CL3D.Vect3d(1,1,1);
			o.Animatedrotation = new CL3D.Quaternion();
			this.JointStatesBeforeBlendingBegin.push(o);
		}
	}	
}

/**
 * @private
 */
CL3D.AnimatedMeshSceneNode.prototype.startAnimationBlending = function(frameNumberBeforeAnimationChange)
{
	if (!this.WasAnimatedBefore)
		return;
		
	var skinnedMesh = this.Mesh; // as SkinnedMesh;
	if (!skinnedMesh)
		return;
		
	// be sure joints have animations stored before animation was switched

	this.animateJointsWithCurrentBlendingSettings(frameNumberBeforeAnimationChange);

	// change blending settings

	this.BeginBlendTime = CL3D.CLTimer.getTime();
	this.CurrentlyBlendingAnimation = true;

	// copy current joints

	this.ensureJointCopyArrayHasCorrectSize(skinnedMesh.AllJoints);

	for (var i=0; i<skinnedMesh.AllJoints.length; ++i)
	{
		var rState = this.JointStatesBeforeBlendingBegin[i];
		var j = skinnedMesh.AllJoints[i];
		
		rState.Animatedposition = j.Animatedposition.clone();
		rState.Animatedscale = j.Animatedscale.clone();
		rState.Animatedrotation = j.Animatedrotation.clone();
	}
}


/**
 * @private
 */
CL3D.AnimatedMeshSceneNode.prototype.animateJointsWithCurrentBlendingSettings = function(framenumber)
{
	var skinnedMesh = this.Mesh; // as SkinnedMesh;
	if (!skinnedMesh)
		return;

	var blendFactor = 1.0;

	if (this.CurrentlyBlendingAnimation)
	{
		var now = CL3D.CLTimer.getTime();
		if ((now - this.BeginBlendTime) > this.BlendTimeMs)
			this.CurrentlyBlendingAnimation = false;
		else
		{
			blendFactor = (now - this.BeginBlendTime) / this.BlendTimeMs;

			// copy our saved joint positions so the skinned mesh can interpolate between them

			this.ensureJointCopyArrayHasCorrectSize(skinnedMesh.AllJoints);

			for (var i=0; i<skinnedMesh.AllJoints.length; ++i)
			{
				var rState = this.JointStatesBeforeBlendingBegin[i];
				var j = skinnedMesh.AllJoints[i];
				
				j.Animatedposition = rState.Animatedposition.clone();
				j.Animatedscale = rState.Animatedscale.clone();
				j.Animatedrotation = rState.Animatedrotation.clone();
			}
		}
	}

	// animate with the current frame number

	return skinnedMesh.animateMesh(framenumber, blendFactor);
}

/** 
 * Called after the deserialization process. Internal method used so that linked nodes link them with the deserialized other nodes.
 * @private
 */
CL3D.AnimatedMeshSceneNode.prototype.onDeserializedWithChildren = function()
{
	if (this.scene == null)
		return;
		
	for (var i=0; i<this.AnimatedDummySceneNodes.length;)
	{
		var node = 0;
		var id = this.AnimatedDummySceneNodes[i].NodeIDToLink;

		if (id != -1)
			node = this.scene.getSceneNodeFromIdImpl(this, id);

		if (node && node.getType() == 'dummytrans')
		{
			this.AnimatedDummySceneNodes[i].Node = node;
			++i;
		}
		else
			this.AnimatedDummySceneNodes.splice(i, 1);
	}	
}


/** 
 * Called after the deserialization process. Internal method used so that linked nodes link them with the deserialized other nodes.
 * @private
 */
CL3D.AnimatedMeshSceneNode.prototype.updatePositionsOfAttachedNodes = function()
{
	var skinnedMesh = this.Mesh; // as SkinnedMesh;
	if (!skinnedMesh || skinnedMesh.isStatic())
		return;
		
	this.animateJointsWithCurrentBlendingSettings(this.getFrameNr());
	skinnedMesh.buildAll_GlobalAnimatedMatrices(null, null);

	var joints = skinnedMesh.AllJoints;

	for (var i=0; i<this.AnimatedDummySceneNodes.length; ++i)
	{
		var rEntry = this.AnimatedDummySceneNodes[i];
		
		if (rEntry.JointIdx >= 0 && rEntry.JointIdx < joints.length && rEntry.Node != null)
		{
			var pJoint = joints[rEntry.JointIdx];
			if (pJoint)
			{
				rEntry.Node.RelativeTransformationMatrix = pJoint.GlobalAnimatedMatrix.clone();			
			}
		}
	}
}

/** 
 * replaces all referenced ids of referenced nodes when the referenced node was a child and was cloned
 * @private
 */
CL3D.AnimatedMeshSceneNode.prototype.replaceAllReferencedNodes = function(nodeChildOld, nodeChildNew)
{
	for (var i=0; i<this.AnimatedDummySceneNodes.length; ++i)
	{
		if (this.AnimatedDummySceneNodes[i].Node == nodeChildOld)
		{
			if (nodeChildNew && nodeChildNew.getType() == 'dummytrans')
				this.AnimatedDummySceneNodes[i].Node = nodeChildNew;
			else
				this.AnimatedDummySceneNodes[i].Node = null;
		}
	}
}
