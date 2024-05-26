//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

/**
 * A class rendering a reflective water surface.
 * @constructor
 * @extends CL3D.MeshSceneNode 
 * @class A class rendering a reflective water surface.
 */
CL3D.WaterSurfaceSceneNode = function()
{
	// settings
	
	this.Details = 0;
	this.WaterFlowDirection = new CL3D.Vect2d(1.0, 1.0);
	this.WaveLength = 0.5;
	this.WaveHeight = 0.5;
	this.WaterColor = CL3D.createColor(190,255,255,255);
	this.ColorWhenUnderwater = true;
	this.UnderWaterColor = CL3D.createColor(190,0,100,0);
	
	this.DrawDebugTexture = false;
	
	// runtime
	
	this.LastRTTUpdateTime = 0;
	this.LastRTTUpdateViewMatrix = new CL3D.Matrix4();
	this.CurrentlyRenderingIntoRTT = false;
	
	this.Mat = new CL3D.Material();
	this.Mat.Lighting = false;
	this.Mat.Type = -1;
	this.Mat.BackfaceCulling = false;
	
	this.RTTexture = null;
	this.FrustumCullingProjection = null;
}
CL3D.WaterSurfaceSceneNode.prototype = new CL3D.MeshSceneNode();


/** 
 * Returns the type string of the scene node.
 * Returns 'water' for the water scene node.
 * @public
 * @returns {String} type name of the scene node.
 */
CL3D.WaterSurfaceSceneNode.prototype.getType = function()
{
	return 'water';
}

	
/**
 * @private
 */
CL3D.WaterSurfaceSceneNode.prototype.OnRegisterSceneNode = function(mgr)
{
	if (this.Visible)
	{
		mgr.registerNodeForRendering(this, CL3D.Scene.RENDER_MODE_TRANSPARENT);
		CL3D.SceneNode.prototype.OnRegisterSceneNode.call(this, mgr); 
		
		// also, register for RTT rendering, so we can update our render texture. But only
		// do this every few frames, if possible

		var cam = mgr.getActiveCamera();
		var now = CL3D.CLTimer.getTime();

		var bNeedsRTTUpdate = false;		

		if (!this.LastRTTUpdateTime)
			bNeedsRTTUpdate = true;
		else
		{
			var updateEveryMs = 100;

			if (cam)
			{
				// based on distance from camera, update not that often

				var camWorldPos = cam.getAbsolutePosition();
				var waterSize = this.getBoundingBox().getExtent().getLength();				
				var pos = this.getAbsolutePosition();
				var centerDistanceFromCamera = pos.getDistanceTo(camWorldPos);

				if (centerDistanceFromCamera > waterSize)
					updateEveryMs *= (centerDistanceFromCamera / waterSize);

				if (updateEveryMs > 1000)
					updateEveryMs = 1000;

				// also, update if camera position / rotation changed a lot 
			
				if (!cam.ViewMatrix.equals(this.LastRTTUpdateViewMatrix))
					updateEveryMs = 10;

				this.LastRTTUpdateViewMatrix = cam.ViewMatrix.clone();
			}

			bNeedsRTTUpdate = this.LastRTTUpdateTime + updateEveryMs < now;
		}

		if (bNeedsRTTUpdate)
		{
			this.LastRTTUpdateTime = now;
			mgr.registerNodeForRendering(this, CL3D.Scene.RENDER_MODE_RTT_SCENE);
		}

		// register for water color if camera is below water surface
		
		if (this.DrawDebugTexture)
			mgr.registerNodeForRendering(this, CL3D.Scene.RENDER_MODE_2DOVERLAY); 
		else
		if (cam)
		{
			var camPos = cam.getAbsolutePosition();
			var waterPos = this.getAbsolutePosition();
			if (camPos.Y < waterPos.Y)
			{
				var box = this.getTransformedBoundingBox();
				if (camPos.X >= box.MinEdge.X && camPos.X <= box.MaxEdge.X &&
					camPos.Z >= box.MinEdge.Z && camPos.Z <= box.MaxEdge.Z)
				{
					mgr.registerNodeForRendering(this, CL3D.Scene.RENDER_MODE_2DOVERLAY);
				}
			}
		}
	}
}

CL3D.WaterSurfaceSceneNode.prototype.OnAnimate = function(scene, timeMs)
{
	CL3D.MeshSceneNode.prototype.OnAnimate.call(this, scene, timeMs); 
	return true; // water is animated, so force redraw
}

/**
 * @private
 */
CL3D.WaterSurfaceSceneNode.prototype.render = function(renderer)
{
	var cam = this.scene.getActiveCamera();
	if (!cam || !this.OwnedMesh)
		return;
		
	// skip if the mesh isn't visible in the frustum
	
	var frustrum = this.scene.getCurrentCameraFrustrum();
	if (frustrum && this.scene.CurrentRenderMode != CL3D.Scene.RENDER_MODE_2DOVERLAY) // always render underwater stuff
	{
		if (!frustrum.isBoxInside(this.getTransformedBoundingBox()))
			return;
	}
	
	// draw
	
	if (this.scene.CurrentRenderMode == CL3D.Scene.RENDER_MODE_TRANSPARENT)
	{
		if (this.Mat.Type == -1 || this.RTTexture == null)
			return;
			
		// render normally

		if (!this.CurrentlyRenderingIntoRTT)
		{
			renderer.setWorld(this.AbsoluteTransformation);
			
			var mesh = this.OwnedMesh;
			if (!mesh)
				return;

			this.Box = mesh.Box;
			this.Mat.Tex1 = this.RTTexture;

			if (mesh && mesh.MeshBuffers && mesh.MeshBuffers.length > 0)
				this.Mat.Tex2 = mesh.MeshBuffers[0].Mat.Tex1;
			
			for (var i=0; i<mesh.MeshBuffers.length; ++i)
			{
				var mb = mesh.MeshBuffers[i];
				if (mb)
				{
					renderer.setMaterial(this.Mat);
					renderer.drawMeshBuffer(mb);
				}
			}
		}
	}
	else
	if (this.scene.CurrentRenderMode == CL3D.Scene.RENDER_MODE_RTT_SCENE)
	{
		// render scene into our RTT

		if (!this.prepareForRendering(renderer))
			return;

		var oldRenderTarget = renderer.getRenderTarget();

		renderer.setInvertedDepthTest(true);

		if (renderer.setRenderTarget(this.RTTexture, true, true, this.scene.getBackgroundColor()))
		{
			this.CurrentlyRenderingIntoRTT = true;

			// set reflection and culling matrices

			var cam = this.scene.getActiveCamera();
			var origProjection = cam.Projection;
			var origView = cam.ViewMatrix;
			var origUpVector = cam.UpVector;
			var origTarget = cam.Target;
			var origPosition = cam.Pos;
			var origBinding = cam.TargetAndRotationAreBound;
			var origByUser = cam.ViewMatrixIsSetByUser;

			cam.ViewMatrixIsSetByUser = true;
			cam.TargetAndRotationAreBound = false;

			var planeY = this.getAbsolutePosition().Y;
		
			var reflTarget = origTarget.clone();
			var reflPosition = origPosition.clone();

			reflPosition.Y = -origPosition.Y + 2 * planeY; //position of the water
			cam.Pos = reflPosition;

			reflTarget.Y = -origTarget.Y + 2 * planeY;
			cam.Target = reflTarget;
			
			var viewMatrixRefl = new CL3D.Matrix4();
			viewMatrixRefl.buildCameraLookAtMatrixLH(reflPosition, reflTarget, new CL3D.Vect3d(0.0, 1.0,0.0));
			cam.ViewMatrix = viewMatrixRefl;

			
			// cull by plane

			var reflectionPlane = new CL3D.Plane3d();
			reflectionPlane.setPlane(new CL3D.Vect3d(0,planeY,0), new CL3D.Vect3d(0,1.0,0));

			var reflectionPlaneInCameraSpace = reflectionPlane.clone();
			viewMatrixRefl.transformPlane(reflectionPlaneInCameraSpace);
			
			var culledProjection = new CL3D.Matrix4();
			culledProjection = origProjection.clone();
			
			{
				var m = culledProjection;
				var x = CL3D.sgn(reflectionPlaneInCameraSpace.Normal.X + m.m08) / m.m00;
				var y = CL3D.sgn(reflectionPlaneInCameraSpace.Normal.Y + m.m09) / m.m05;
				var z = -1.0;
				var w = (1.0 + m.m10) / m.m14;

				var dotproduct = -2.0 / (x * reflectionPlaneInCameraSpace.Normal.X +
						  y * reflectionPlaneInCameraSpace.Normal.Y + 
						  z * reflectionPlaneInCameraSpace.Normal.Z +
						  w * reflectionPlaneInCameraSpace.D);					

				m.m02 = reflectionPlaneInCameraSpace.Normal.X * dotproduct;
				m.m06 = reflectionPlaneInCameraSpace.Normal.Y * dotproduct;
				m.m10 = (reflectionPlaneInCameraSpace.Normal.Z * dotproduct) + 1.0;
				m.m14 = reflectionPlaneInCameraSpace.D * dotproduct;
			}			
			
			this.FrustumCullingProjection = culledProjection;				


			// draw everything

			this.scene.drawRegistered3DNodes(renderer, this);	

			// reset old view and settings

			cam.ViewMatrixIsSetByUser = origByUser;
			cam.Projection = origProjection;
			cam.ViewMatrix = origView;
			cam.Target = origTarget;
			cam.Pos =  origPosition;
			cam.UpVector = origUpVector;
			cam.TargetAndRotationAreBound = origBinding;
			
			renderer.setInvertedDepthTest(false);
			renderer.setRenderTarget(oldRenderTarget, false, true);

			this.CurrentlyRenderingIntoRTT = false;
		} 

		renderer.setInvertedDepthTest(false); // set back
	}		
	else
	if (this.scene.CurrentRenderMode == CL3D.Scene.RENDER_MODE_2DOVERLAY && !this.CurrentlyRenderingIntoRTT)
	{
		if (this.ColorWhenUnderwater && !this.DrawDebugTexture)
			renderer.draw2DRectangle(0, 0, renderer.getWidth(), renderer.getHeight(), this.UnderWaterColor, true);
			
		if (this.DrawDebugTexture)
			renderer.draw2DImage(10, 10, 250, 200, this.RTTexture, false);
	}
}

/**
 * @private
 */
CL3D.WaterSurfaceSceneNode.prototype.createClone = function(newparent, oldNodeId, newNodeId)
{
	var c = new CL3D.WaterSurfaceSceneNode();
	this.cloneMembers(c, newparent, oldNodeId, newNodeId);
		
	if (this.OwnedMesh)
		c.OwnedMesh = this.OwnedMesh.clone();
		
	c.ReadonlyMaterials = this.ReadonlyMaterials;
	c.DoesCollision = this.DoesCollision;
			
	if (this.Box)
		c.Box = this.Box.clone();
	
	return c;
}

/**
 * @private
 */
CL3D.WaterSurfaceSceneNode.prototype.prepareForRendering = function(renderer)
{
	if (this.PreparedForRendering)
		return this.RTTexture != null;

	this.PreparedForRendering = true;
	
	this.initRTT(renderer);
	
	if (!this.RTTexture)
		return false;
		
	var me = this;
	 var gl = renderer.getWebGL();
	 
	this.Mat.Type = renderer.createMaterialType(
		this.vs_shader_water, 
		this.fs_shader_water, 
		true, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, 
		function(){me.setShaderConstants(renderer);});
		
	return true;
}

// simple normal 3d world 3d transformation shader
CL3D.WaterSurfaceSceneNode.prototype.vs_shader_water = "		\
	uniform mat4 worldviewproj;									\
	uniform float mWaveLength;									\
	uniform vec2 mWaveMovement;									\
																\
	attribute vec4 vPosition;									\
    attribute vec4 vNormal;										\
	attribute vec4 vColor;										\
    attribute vec2 vTexCoord1;									\
	attribute vec2 vTexCoord2;									\
																\
	varying vec2 WavesTexCoord;									\
	varying vec3 TexCoord;										\
																\
    void main()													\
    {															\
		vec4 pos = worldviewproj * vPosition;					\
        gl_Position = pos;										\
		WavesTexCoord = (vPosition.xz / mWaveLength) + mWaveMovement;	\
		TexCoord.x = 0.5 * (pos.w + pos.x);						\
		TexCoord.y = 0.5 * (pos.w + pos.y);						\
		TexCoord.z = pos.w;										\
    }															\
	";
	
CL3D.WaterSurfaceSceneNode.prototype.fs_shader_water = "		\
	uniform sampler2D texture1;									\
	uniform sampler2D texture2;									\
	uniform float		mWaveHeight;							\
	uniform vec4		mWaterColor;							\
																\
    varying vec2 WavesTexCoord;									\
	varying vec3 TexCoord;										\
																\
    void main()													\
    {															\
		vec4 normalClr = texture2D(texture2, WavesTexCoord.xy);	\
		vec2 waveMovement = mWaveHeight * (normalClr.xy - 0.5);	\
																\
		vec2 projTexCoord = clamp((TexCoord.xy / TexCoord.z) + waveMovement, 0.0, 1.0);		\
		vec4 reflectiveColor = texture2D(texture1, vec2(projTexCoord.x, -projTexCoord.y) );	\
																\
		gl_FragColor = mWaterColor * reflectiveColor;			\
		gl_FragColor.a = mWaterColor.a;							\
    }															\
	";		

/**
 * @private
 */
CL3D.WaterSurfaceSceneNode.prototype.setShaderConstants = function(renderer)
{
	 var gl = renderer.getWebGL();
	 
	 var program = renderer.getGLProgramFromMaterialType(this.Mat.Type);
	 if (!program)
		return;
		
	var locWaterColor = gl.getUniformLocation(program, "mWaterColor");
	gl.uniform4f(locWaterColor, 
		CL3D.getRed(this.WaterColor)   / 255.0, 
		CL3D.getGreen(this.WaterColor) / 255.0,
		CL3D.getBlue(this.WaterColor)  / 255.0,
		CL3D.getAlpha(this.WaterColor) / 255.0);
		
	var currentTime = (CL3D.CLTimer.getTime() / 1000.0) % 1000.0; 
		
	var locmWaveMovement = gl.getUniformLocation(program, "mWaveMovement");
	gl.uniform2f(locmWaveMovement,
		this.WaterFlowDirection.X * currentTime, 
		this.WaterFlowDirection.Y * currentTime);
		
	var locmWaveLength = gl.getUniformLocation(program, "mWaveLength");
	gl.uniform1f(locmWaveLength, this.WaveLength * 100.0);
	
	var locmWaveHeight = gl.getUniformLocation(program, "mWaveHeight");
	gl.uniform1f(locmWaveHeight, this.WaveHeight);
}

/**
 * @private
 */
CL3D.WaterSurfaceSceneNode.prototype.initRTT = function(renderer)
{
	if (renderer == null)
		return;

	var sx = renderer.getWidth();
	var sy = renderer.getHeight();
	var rttX = 512;
	var rttY = 512;

	switch(this.Details)
	{
	case 0: // high
		rttX = sx / 2; rttY = sy / 2;
		break;
	case 1: // middle
		rttX = sx / 3; rttY = sy / 3;
		break;
	case 2: // low
		rttX = sx / 4; rttY = sy / 4;
		break;
	};
	
	rttX = renderer.nextHighestPowerOfTwo(rttX);
	rttY = renderer.nextHighestPowerOfTwo(rttY);
	
	rttX = Math.min(rttX, rttY);
	rttY = Math.min(rttX, rttY);

	if (rttX < 64) rttX = 64;
	if (rttY < 64) rttY = 64;

	this.RTTexture = renderer.addRenderTargetTexture(rttX, rttY);
}

/*
 * @private
 */
CL3D.WaterSurfaceSceneNode.prototype.OnAfterDrawSkyboxes = function(renderer)
{
	renderer.setProjection(this.FrustumCullingProjection);
}