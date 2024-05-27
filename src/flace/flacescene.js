//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

//public static const REDRAW_WHEN_CAM_MOVED:int = 0;
//public static const REDRAW_WHEN_SCENE_CHANGED:int = 1;
//public static const REDRAW_EVERY_FRAME:int = 2;

//public static const REGISTER_MODE_DEFAULT:int = 0;
//public static const REGISTER_MODE_SKYBOX:int = 1;
//public static const REGISTER_MODE_CAMERA:int = 2;
//public static const REGISTER_MODE_LIGHTS:int = 3;
//public static const REGISTER_MODE_2DOVERLAY:int = 4;

import * as CL3D from "../main.js";

/**
 * @type {Boolean}
 * Global flag disabling post effects if hardware or browser is not capable of doing them.
 */
export let Global_PostEffectsDisabled = false;

const GLSL = String.raw;

/**
 * @constructor
 * @class A 3d scene, containing all {@link CL3D.SceneNode}s.
 * The scene holds all {@link CL3D.SceneNode}s and is able to draw and animate them.
 */
export class Scene {
	/** 
	 * Constant for using in {@link Scene.setRedrawMode}, specifying the scene should be redrawn only when the camera changed
	 * @static 
	 * @public
	 */	
	static REDRAW_WHEN_CAM_MOVED = 2;

	/** 
	 * Constant for using in {@link Scene.setRedrawMode}, specifying the scene should be redrawn only when the scene has changed
	 * @static 
	 * @public
	 */	
	static REDRAW_WHEN_SCENE_CHANGED = 1;

	/** 
	 * Constant for using in {@link Scene.setRedrawMode}, specifying the scene should be redrawn every frame.
	 * @static 
	 * @public
	 */	
	static REDRAW_EVERY_FRAME = 2;

	/** 
	 * Constant for using in {@link Scene.registerNodeForRendering}, specifying the render mode of a scene node.
	 * @static 
	 * @public
	 */	
	static RENDER_MODE_SKYBOX = 1;

	/** 
	 * Constant for using in {@link Scene.registerNodeForRendering}, specifying the render mode of a scene node.
	 * @static 
	 * @public
	 */	
	static RENDER_MODE_DEFAULT = 0;

	/** 
	 * Constant for using in {@link Scene.registerNodeForRendering}, specifying the render mode of a scene node.
	 * @static 
	 * @public
	 */	
	static RENDER_MODE_LIGHTS = 2;

	/** 
	 * Constant for using in {@link Scene.registerNodeForRendering}, specifying the render mode of a scene node.
	 * @static 
	 * @public
	 */	
	static RENDER_MODE_CAMERA = 3;

	/** 
	 * Constant for using in {@link Scene.registerNodeForRendering}, specifying the render mode of a scene node.
	 * @static 
	 * @public
	 */	
	static RENDER_MODE_TRANSPARENT = 4;

	/** 
	 * Constant for using in {@link Scene.registerNodeForRendering}, specifying the render mode of a scene node.
	 * @static 
	 * @public
	 */	
	static RENDER_MODE_2DOVERLAY = 5;

	/** 
	 * Constant for using in {@link Scene.registerNodeForRendering}, specifying the render mode of a scene node.
	 * Used by objects in order to render the fully animated scene as separate pass into their 
	 * own render target texture. They can call drawRegistered3DNodes() for this once this pass is called. 
	 * @static 
	 * @public
	 */	
	static RENDER_MODE_RTT_SCENE = 6;

	/** 
	 * Constant for using in {@link Scene.registerNodeForRendering}, specifying the render mode of a scene node.
	 * Used by the scene manager to indicate that the current rendering call is for drawing into a shadow buffer
	 * @static 
	 * @public
	 */	
	static RENDER_MODE_SHADOW_BUFFER = 8;

	/** 
	 * Constant for using in {@link Scene.registerNodeForRendering}, specifying the render mode of a scene node.
	 * @static 
	 * @public
	 */	
	static TRANSPARENT_SOLID_AFTER_ZBUFFER_CLEAR = 9;

	/** 
	 * Constant for using in {@link Scene.registerNodeForRendering}, specifying the render mode of a scene node.
	 * @static 
	 * @public
	 */	
	static RENDER_MODE_TRANSPARENT_AFTER_ZBUFFER_CLEAR = 10;

	/** 
	 * Constant for post effect mode
	 * @static 
	 * @public
	 */	
	static EPOSTEFFECT_BLOOM = 0;

	/** 
	 * Constant for post effect mode
	 * @static 
	 * @public
	 */	
	static EPOSTEFFECT_BLACK_AND_WHITE = 1;

	/** 
	 * Constant for post effect mode
	 * @static 
	 * @public
	 */	
	static EPOSTEFFECT_INVERT = 2;

	/** 
	 * Constant for post effect mode
	 * @static 
	 * @public
	 */	
	static EPOSTEFFECT_BLUR = 3;

	/** 
	 * Constant for post effect mode
	 * @static 
	 * @public
	 */	
	static EPOSTEFFECT_COLORIZE = 4;

	/** 
	 * Constant for post effect mode
	 * @static 
	 * @public
	 */	
	static EPOSTEFFECT_VIGNETTE = 5;

	/** 
	 * Constant for post effect mode
	 * @static 
	 * @public
	 */	
	static EPOSTEFFECT_LIGHT_TRESHOLD = 6;

	/** 
	 * Constant for post effect mode
	 * @static 
	 * @public
	 */	
	static EPOSTEFFECT_BLUR_HORIZONTAL = 7;

	/** 
	 * Constant for post effect mode
	 * @const 
	 * @public
	 */	
	static EPOSTEFFECT_BLUR_VERTICAL = 8;

	/** 
	 * Constant for post effect mode
	 * @const 
	 * @public
	 */	
	static EPOSTEFFECT_COUNT = 9;

	/**
	 * @private
	 */
	TriedShadowInit = false;

	/**
	 * @private
	 * Render target texture for creating shadow maps
	 */
	ShadowBuffer = null;

	/**
	 * @private
	 * Second eender target texture for creating shadow maps, but only used in case CL3D.UseShadowCascade is true
	 */
	ShadowBuffer2 = null;

	/**
	 * @private
	 */
	ShadowDrawMaterialSolid = null;

	/**
	 * @private
	 */
	ShadowDrawMaterialAlphaRef = null;

	/**
	 * @private
	 */
	ShadowMapLightMatrix = null;

	/**
	 * Enable for rendering realtime 3D shadows in this scene. The scene must have a directional light for this.
	 * @public
	 * @type Boolean
	 */
	ShadowMappingEnabled = false;

	/**
	 * Value for influencing which pixels are taken for in shadow and which are not. 
	 * Depends on your scene. Tweak it so that the shadows in your scene look the way you want them to,
	 * values like 0.001, 0.0001 or even 0.00001 are usual.
	 * @public
	 * @type Number
	 */
	ShadowMapBias1 = 0.001; // use a value like 0.000003 for non-orthogonal cameras
	ShadowMapBias2 = 0.0001; // use a value like 0.000003 for non-orthogonal cameras

	/**
	 * Controls the transparency with which the shadows are being drawn.
	 * @public
	 * @type Number
	 */
	ShadowMapOpacity = 0.5;

	/**
	 * Controls shadowmap backface bias. 0.5 culls backfaces for shadows nicely looking, 0 not at all, and 1 culls all shadows away.
	 * @public
	 * @type Number
	 */
	ShadowMapBackfaceBias = 0.5;

	/**
	 * Use orthogonal light for shadows. Usually leave this 'true'.
	 * @public 
	 */
	ShadowMapOrthogonal = true;

	/**
	 * this gives a way to adjust the detail: Between how long are shadows visible in 
	 * the distance and how detailed the shadow map is in close vicinity. Make the value bigger
	 * (like 1.0) for longer viewable shadows but with smaller details, and smaller (like 0.2) 
	 * for detailed shadow which don't have a big view distance.
	 * @public
	 * @type Number
	 */
	ShadowMapCameraViewDetailFactor = 0.2;

	/**
	 * Texture size of the shadow map, usually 1024
	 * @public
	 * @type Number
	 */
	ShadowMapResolution = 1024;

	POSTPROCESS_SHADER_COLORIZE = GLSL`
	//#version 100
	precision mediump float;

	uniform vec4 PARAM_Colorize_Color;
	uniform sampler2D texture1;
	varying vec2 v_texCoord1;

	void main()
	{
		vec4 col = texture2D( texture1, v_texCoord1.xy );
		gl_FragColor = col * PARAM_Colorize_Color;
	}`;

	POSTPROCESS_SHADER_BLUR_HORIZONTAL = GLSL`
	//#version 100
	precision mediump float;

	uniform sampler2D texture1;
	uniform float PARAM_SCREENX;
	varying vec2 v_texCoord1;

	void main()
	{
		const int sampleCount = 4;
		const float sampleFactor = 2.0;
		const float sampleStart = (float(sampleCount)*sampleFactor) / -2.0;
		vec2 halfPixel = vec2(0.5 / PARAM_SCREENX, 0.5 / PARAM_SCREENX);
		vec4 col = vec4(0.0, 0.0, 0.0, 0.0);
		for(int i=0; i<sampleCount; ++i)
		{
			vec2 tcoord = v_texCoord1.xy + vec2((sampleStart + float(i)*sampleFactor) / PARAM_SCREENX, 0.0) + halfPixel;
			col += texture2D( texture1, clamp(tcoord, vec2(0.0, 0.0), vec2(1.0, 1.0) ) );
		}
		col /= float(sampleCount);
		gl_FragColor = col;
	}`;

	POSTPROCESS_SHADER_BLUR_VERTICAL = GLSL`
	//#version 100
	precision mediump float;

	uniform sampler2D texture1;
	uniform float PARAM_SCREENY;
	varying vec2 v_texCoord1;

	void main()
	{
		const int sampleCount = 4;
		const float sampleFactor = 2.0;
		const float sampleStart = (float(sampleCount)*sampleFactor) / -2.0;
		vec2 halfPixel = vec2(0.5 / PARAM_SCREENY, 0.5 / PARAM_SCREENY);
		vec4 col = vec4(0.0, 0.0, 0.0, 0.0);
		for(int i=0; i<sampleCount; ++i)
		{
			vec2 tcoord = v_texCoord1.xy + vec2(0.0, (sampleStart + float(i)*sampleFactor) / PARAM_SCREENY) + halfPixel;
			col += texture2D( texture1, clamp(tcoord, vec2(0.0, 0.0), vec2(1.0, 1.0) ) );
		}
		col /= float(sampleCount);
		gl_FragColor = col;
	}`;

	POSTPROCESS_SHADER_LIGHT_TRESHOLD = GLSL`
	//#version 100
	precision mediump float;

	uniform sampler2D texture1;
	uniform float PARAM_LightTreshold_Treshold;
	varying vec2 v_texCoord1;

	void main()
	{
		vec4 col = texture2D( texture1, v_texCoord1.xy );
		float lum = 0.3*col.r + 0.59*col.g + 0.11*col.b;
		if (lum > PARAM_LightTreshold_Treshold)
			gl_FragColor = col;
		else
			gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
	}`;

	POSTPROCESS_SHADER_BLACK_AND_WHITE = GLSL`
	//#version 100
	precision mediump float;

	uniform sampler2D texture1;
	varying vec2 v_texCoord1;

	void main()
	{
		vec4 col = texture2D( texture1, v_texCoord1.xy );
		float lum = 0.3*col.r + 0.59*col.g + 0.11*col.b;
		gl_FragColor = vec4(lum, lum, lum, 1.0);
	}`;

	POSTPROCESS_SHADER_VIGNETTE = GLSL`
	//#version 100
	precision mediump float;

	uniform float PARAM_Vignette_Intensity;
	uniform float PARAM_Vignette_RadiusA;
	uniform float PARAM_Vignette_RadiusB;
	uniform sampler2D texture1;
	varying vec2 v_texCoord1;

	void main()
	{
		vec4 col = texture2D( texture1, v_texCoord1.xy );
		float e1 =  ( v_texCoord1.x - 0.5 ) / ( PARAM_Vignette_RadiusA );
		float e2 =  ( v_texCoord1.y - 0.5 ) / ( PARAM_Vignette_RadiusB );
		float d  = clamp(2.0 - ((e1 * e1) + (e2 * e2)), 0.0, 1.0);
		gl_FragColor = col * ((1.0 - PARAM_Vignette_Intensity) + (PARAM_Vignette_Intensity * d));
	}`;

	POSTPROCESS_SHADER_INVERT = GLSL`
	//#version 100
	precision mediump float;

	uniform sampler2D texture1;
	varying vec2 v_texCoord1;

	void main()
	{
		vec4 col = texture2D( texture1, v_texCoord1 );
		gl_FragColor = vec4(1.0 - col.rgb, 1.0);
	}`;

	constructor() {
		this.init();
	}

	/**
	 * Initializes the scene node, can be called by scene nodes derived from this class.
	 * @private
	 */
	init() {
		this.RootNode = new CL3D.SceneNode();
		this.RootNode.scene = this;
		this.Name = '';
		this.BackgroundColor = 0;
		this.CollisionWorld = null;

		this.AmbientLight = new CL3D.ColorF();
		this.AmbientLight.R = 0.0;
		this.AmbientLight.G = 0.0;
		this.AmbientLight.B = 0.0;

		this.Gravity = 1.0;

		this.FogEnabled = false;
		this.FogColor = CL3D.createColor(255, 200, 200, 200);
		this.FogDensity = 0.001;

		this.WindSpeed = 1.0;
		this.WindStrength = 4.0;

		this.PostEffectData = new Array();
		for (var ip = 0; ip < 6; ++ip) {
			var peo = new Object();
			peo.Active = false;
			this.PostEffectData.push(peo);
		}

		this.PE_bloomBlurIterations = 1;
		this.PE_bloomTreshold = 0.5;
		this.PE_blurIterations = 1;
		this.PE_colorizeColor = 0xffff0000;
		this.PE_vignetteIntensity = 0.8;
		this.PE_vignetteRadiusA = 0.5;
		this.PE_vignetteRadiusB = 0.5;

		// scene manager related
		this.LastUsedRenderer = null;
		this.StartTime = 0;
		this.ActiveCamera = null;
		this.ForceRedrawThisFrame = false;
		this.LastViewProj = new CL3D.Matrix4();
		this.TheSkyBoxSceneNode = null;
		this.RedrawMode = 2;

		this.CurrentRenderMode = 0;
		this.SceneNodesToRender = new Array();
		this.SceneNodesToRenderTransparent = new Array();
		this.SceneNodesToRenderAfterZClearForFPSCamera = new Array();
		this.SceneNodesToRenderTransparentAfterZClearForFPSCamera = new Array();
		this.LightsToRender = new Array();
		this.RenderToTextureNodes = new Array();
		this.Overlay2DToRender = new Array();
		this.RegisteredSceneNodeAnimatorsForEventsList = new Array();

		this.NodeCountRenderedLastTime = 0;
		this.SkinnedMeshesRenderedLastTime = 0;
		this.UseCulling = false;
		this.CurrentCameraFrustrum = null;

		// runtime
		this.WasAlreadyActivatedOnce = false;
		this.DeletionList = new Array();
		this.LastBulletImpactPosition = new CL3D.Vect3d; // hack for IRR_SCENE_MANAGER_LAST_BULLET_IMPACT_POSITION parameter


		// runtime post processing
		this.RTTSizeWhenStartingPostEffects = null;
		this.CurrentPostProcessRTTTargetIndex = -1;
		this.CurrentPostProcessRTTTargetSizeFactor = 1.0;
		this.PostProcessingVerticesQuadBuffer = new CL3D.MeshBuffer();
		this.PostEffectsInitialized = false;
		this.PostProcessingShaderInstances = [];
	}

	/**
	  * Returns the type string of the current scene.
	  * @private
	*/
	getCurrentCameraFrustrum() {
		return this.CurrentCameraFrustrum;
	}

	/**
	  * Returns the type string of the current scene.
	  * @public
	*/
	getSceneType() {
		return "unknown";
	}

	/**
	  * returns true if rendering needs to be done at all
	  * @private
	*/
	doAnimate(renderer) {
		this.LastUsedRenderer = renderer;

		if (this.StartTime == 0)
			this.StartTime = CL3D.CLTimer.getTime();

		// clear
		this.TheSkyBoxSceneNode = null;

		// animate 
		var sceneChanged = false;

		if (this.clearDeletionList(false))
			sceneChanged = true;

		if (this.RootNode.OnAnimate(this, CL3D.CLTimer.getTime()))
			sceneChanged = true;

		var viewHasChanged = this.HasViewChangedSinceLastRedraw();
		var textureLoadWasFinished = renderer ? renderer.getAndResetTextureWasLoadedFlag() : false;

		// check if we need to redraw at all
		var needToRedraw = this.ForceRedrawThisFrame ||
			(this.RedrawMode == 0 /*REDRAW_WHEN_CAM_MOVED*/ && (viewHasChanged || textureLoadWasFinished)) ||
			(this.RedrawMode == 1 /*REDRAW_WHEN_SCENE_CHANGED*/ && (viewHasChanged || sceneChanged || textureLoadWasFinished)) ||
			(this.RedrawMode == 2 /*REDRAW_EVERY_FRAME*/) ||
			CL3D.ScriptingInterface.getScriptingInterface().needsRedraw();

		if (!needToRedraw) {
			//Debug.print("Don't need to redraw at all.");				
			return false;
		}

		this.ForceRedrawThisFrame = false;
		return true;
	}

	/**
	  * Returns the current mode of rendering, can be for example {@link Scene.RENDER_MODE_TRANSPARENT}.
	  * Is useful for scene nodes which render themselves for example both solid and transparent.
	  * @public
	*/
	getCurrentRenderMode() {
		return this.CurrentRenderMode;
	}

	initShadowMapRendering(renderer) {
		if (this.ShadowBuffer)
			return true;

		if (this.TriedShadowInit)
			return false;

		this.TriedShadowInit = true;

		if (!this.ShadowBuffer) {
			// create RTT
			var bufferSize = this.ShadowMapResolution;
			var useFloatingPointTexture = !renderer.ShadowMapUsesRGBPacking;

			this.ShadowBuffer = renderer.addRenderTargetTexture(
				bufferSize, bufferSize, useFloatingPointTexture);

			if (!this.ShadowBuffer)
				return false;

			// if using a shadow cascade, create a second buffer for that
			if (CL3D.UseShadowCascade) {
				var tSize2 = bufferSize;
				if (tSize2 > 1000) tSize2 = tSize2 / 2;

				this.ShadowBuffer2 = renderer.addRenderTargetTexture(
					tSize2, tSize2, useFloatingPointTexture);

				if (!this.ShadowBuffer2) {
					this.ShadowBuffer = null;
					return false;
				}
			}

			// create shader for rendering into shadow map
			this.ShadowDrawMaterialSolid = new CL3D.Material();
			this.ShadowDrawMaterialAlphaRef = new CL3D.Material();
			this.ShadowDrawMaterialAlphaRefMovingGrass = new CL3D.Material();

			var newMaterialTypeSolid = renderer.createMaterialType(
				renderer.vs_shader_normaltransform_for_shadowmap,
				useFloatingPointTexture ? renderer.fs_shader_draw_depth_shadowmap_depth :
					renderer.fs_shader_draw_depth_shadowmap_rgbapack
			);


			var newMaterialTypeAlphaRef = renderer.createMaterialType(
				renderer.vs_shader_normaltransform_alpharef_for_shadowmap,
				renderer.fs_shader_alpharef_draw_depth_shadowmap_depth
			);

			var newMaterialTypeAlphaRefMovingGrass = renderer.createMaterialType(
				renderer.vs_shader_normaltransform_alpharef_moving_grass_for_shadowmap,
				renderer.fs_shader_alpharef_draw_depth_shadowmap_depth
			);


			if (newMaterialTypeSolid == -1 ||
				newMaterialTypeAlphaRef == -1 ||
				newMaterialTypeAlphaRefMovingGrass == -1) {
				this.ShadowBuffer = null;
				this.ShadowBuffer2 = null;
				return false;
			}

			this.ShadowDrawMaterialSolid.Type = newMaterialTypeSolid;
			this.ShadowDrawMaterialAlphaRef.Type = newMaterialTypeAlphaRef;
			this.ShadowDrawMaterialAlphaRefMovingGrass.Type = newMaterialTypeAlphaRefMovingGrass;
		}

		return true;
	}

	renderShadowMap(renderer) {
		// The code in this method is unfinished for now and only creates shadow map renderings for
		// the internal test cases. It will be extended in future updates.
		if (!initShadowMapRendering(renderer))
			return false;

		// find directional light
		var lightDirection = null;

		for (var i = 0; i < this.LightsToRender.length; ++i) {
			var lnode = this.LightsToRender[i];

			if (lnode.LightData && lnode.LightData.IsDirectional) {
				lightDirection = lnode.LightData.Direction.clone();
				break;
			}
		}

		if (!lightDirection)
			return false; // we only support shadow maps from directional light for now

		// go through everything and draw it using shadow buffer from light
		// setup camera
		var cam = this.getActiveCamera();
		var origProjection = cam.Projection.clone();
		var origView = cam.ViewMatrix.clone();
		var origUpVector = cam.UpVector.clone();
		var origTarget = cam.Target.clone();
		var origPosition = cam.Pos.clone();
		var origBinding = cam.TargetAndRotationAreBound;
		var origByUser = cam.ViewMatrixIsSetByUser;

		cam.ViewMatrixIsSetByUser = true;
		cam.TargetAndRotationAreBound = false;

		// calculate positions
		// calculate BBox around visible objects
		// This will simply include all objects. Which means if the scene gets too big,
		// the shadow map will not be detailed enough.
		var bbBox = new CL3D.Box3d();
		var boxesAdded = 0;

		for (var i = 0; i < this.SceneNodesToRender.length; ++i) {
			var s = this.SceneNodesToRender[i];
			var transformedBox = s.getTransformedBoundingBox();

			if (boxesAdded == 0)
				bbBox = transformedBox;

			else
				bbBox.addInternalBox(transformedBox);

			++boxesAdded;
		}

		// set target
		var oldRenderTarget = renderer.getRenderTarget();

		for (var pass = 0; pass < (CL3D.UseShadowCascade ? 2 : 1); ++pass) {
			if (!renderer.setRenderTarget(pass == 0 ? this.ShadowBuffer : this.ShadowBuffer2, true, true))
				break;

			// find a good position for directional light so that all shadows are in the light/camera frustrum:
			// frustrum should be minimal (to keep resolution high) and contain all objects. 
			// Best approach would be like this:
			// 	- calculate BBox around visible objects
			//	- transform the corners of the box light space (using light view matrix)
			//  - calculate BBox (ideally an obb) of this transformed box
			//  - use that oriented bounding box as the orthographic frustrum
			var lightpos = new CL3D.Vect3d(40, 100, 40);
			var lightTarget = new CL3D.Vect3d(0, 0, 0);

			var orthoViewWidth = 120;

			// get light position and target from box
			var frustrumLength = bbBox.getExtent().getLength();
			var center = bbBox.getCenter();

			if (pass == 0) {
				// follow camera with shadow camera and keep frustrum small
				var camVector = origTarget.substract(origPosition);
				camVector.setLength(orthoViewWidth);
				center = origPosition.add(camVector);

				orthoViewWidth = frustrumLength * this.ShadowMapCameraViewDetailFactor;
			}

			else {
				// make frustrum contain basically everything
				orthoViewWidth = frustrumLength * 0.9;
			}

			var lightdir = lightDirection.clone();
			lightdir.setLength(frustrumLength * 1.0);
			lightpos = center.substract(lightdir);
			lightdir.setLength(frustrumLength * -1.0);
			lightTarget = center.substract(lightdir);

			// set matrix for directional light
			var upVector = new CL3D.Vect3d(0.0, 1.0, 0.0);

			// move upvector a bit if it is perpendicular to the light direction
			var dot = lightTarget.substract(lightpos).getNormalized().dotProduct(upVector);
			if (dot == -1)
				upVector.X += 0.01;

			cam.ViewMatrix.buildCameraLookAtMatrixLH(lightpos, lightTarget, upVector);

			var zNear = 1.0; // cam.ZNear default is 0.1, but it works much better with 1.0
			var zFar = Math.max(100.0, frustrumLength) * 2.0; //cam.ZFar; 

			if (this.ShadowMapOrthogonal)
				cam.Projection.buildProjectionMatrixPerspectiveOrthoLH(orthoViewWidth, orthoViewWidth, zNear, zFar);

			else
				cam.Projection.buildProjectionMatrixPerspectiveFovLH(CL3D.PI / 3.5, 4.0 / 3.0, zNear, zFar);

			var smatrix = new CL3D.Matrix4();
			smatrix = smatrix.multiply(cam.Projection);
			smatrix = smatrix.multiply(cam.ViewMatrix);

			if (pass == 0)
				this.ShadowMapLightMatrix = smatrix;

			else
				this.ShadowMapLightMatrix2 = smatrix;


			// render geometry similar to in drawRegistered3DNodes()
			// camera
			// active camera
			this.CurrentRenderMode = CL3D.Scene.RENDER_MODE_CAMERA;
			if (this.ActiveCamera) {
				//this.ActiveCamera.render(renderer);
				renderer.setProjection(cam.Projection);
				renderer.setView(cam.ViewMatrix);
			}

			// Calculate culling 
			var cullingBox = this.getCullingBBoxAndStoreCameraFrustrum(renderer,
				renderer.getProjection(), renderer.getView(), lightpos);

			// draw everything with custom shader into shadow buffer
			this.CurrentRenderMode = CL3D.Scene.RENDER_MODE_SHADOW_BUFFER; // CL3D.Scene.RENDER_MODE_DEFAULT;

			for (var i = 0; i < this.SceneNodesToRender.length; ++i) {
				var s = this.SceneNodesToRender[i];
				var type = s.getType();

				var isStaticMesh = type == 'mesh';
				var isAnimated = type == 'animatedmesh';

				if (isStaticMesh || isAnimated) // only for static meshes for now
				{
					if (cullingBox == null || cullingBox.intersectsWithBox(s.getTransformedBoundingBox())) {
						if (isStaticMesh) {
							if (!s.OccludesLight)
								continue;

							renderer.setWorld(s.AbsoluteTransformation);

							for (var b = 0; b < s.OwnedMesh.MeshBuffers.length; ++b) {
								var buf = s.OwnedMesh.MeshBuffers[b];
								var matType = buf.Mat.Type;

								if (matType == CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL_REF) {
									this.ShadowDrawMaterialAlphaRef.Tex1 = buf.Mat.Tex1;
									renderer.setMaterial(this.ShadowDrawMaterialAlphaRef);
									renderer.drawMeshBuffer(buf);
								}

								else if (matType == CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL_REF_MOVING_GRASS) {
									this.ShadowDrawMaterialAlphaRefMovingGrass.Tex1 = buf.Mat.Tex1;
									renderer.setMaterial(this.ShadowDrawMaterialAlphaRefMovingGrass);
									renderer.drawMeshBuffer(buf);
								}

								else if (!buf.Mat.isTransparent()) {
									renderer.setMaterial(this.ShadowDrawMaterialSolid);
									renderer.drawMeshBuffer(buf);
								}
							}
						}

						else if (isAnimated) {
							s.render(renderer);
						}
					}
				}
			}

		} // end for all passes

		renderer.setRenderTarget(oldRenderTarget, false, true);

		// reset old view and settings
		cam.ViewMatrixIsSetByUser = origByUser;
		cam.Projection = origProjection;
		cam.ViewMatrix = origView;
		cam.Target = origTarget;
		cam.Pos = origPosition;
		cam.UpVector = origUpVector;
		cam.TargetAndRotationAreBound = origBinding;


		return true;
	}

	/**
	 * Draws and animates the whole 3D scene. Not necessary to call usually, CopperLicht is doing this
	 * itself by default.
	 * @param {CL3D.Renderer} renderer used for drawing.
	 */
	drawAll(renderer) {
		// register for rendering
		this.SceneNodesToRender = new Array();
		this.SceneNodesToRenderTransparent = new Array();
		this.SceneNodesToRenderAfterZClearForFPSCamera = new Array();
		this.SceneNodesToRenderTransparentAfterZClearForFPSCamera = new Array();
		this.LightsToRender = new Array();
		this.RenderToTextureNodes = new Array();
		this.Overlay2DToRender = new Array();

		this.RootNode.OnRegisterSceneNode(this);

		this.CurrentCameraFrustrum = null;
		this.SkinnedMeshesRenderedLastTime = 0;

		// use post effects if enabled
		var bUsingPostEffects = false;
		var prePostEffectRenderTarget = renderer.getRenderTarget();
		var prePostEffectsViewPort = renderer.getRenderTargetSize();

		if (this.isAnyPostEffectActive()) {
			if (!this.PostEffectsInitialized)
				this.initPostProcessingEffects();

			this.initPostProcessingQuad();

			var rctViewPort = renderer.getRenderTargetSize();
			this.RTTSizeWhenStartingPostEffects = rctViewPort;

			var postEffectRTT = this.createOrGetPostEffectRTT(0, true);
			this.CurrentPostProcessRTTTargetIndex = 0;
			this.CurrentPostProcessRTTTargetSizeFactor = 1.0;

			if (postEffectRTT) {
				if (renderer.setRenderTarget(postEffectRTT, true, true, this.BackgroundColor)) {
					//irr::core::dimension2di rttSz = postEffectRTT->getSize();
					//renderer.setViewPort(irr::core::rect<irr::s32>(0, 0, rttSz.Width, rttSz.Height));
					bUsingPostEffects = true;
				}
			}
		}

		// draw everything into shadow map if enabled
		if (this.ShadowMappingEnabled &&
			this.renderShadowMap(renderer)) {
			renderer.enableShadowMap(true, this.ShadowBuffer, this.ShadowMapLightMatrix,
				this.ShadowBuffer2, this.ShadowMapLightMatrix2);

			renderer.ShadowMapBias1 = this.ShadowMapBias1;
			renderer.ShadowMapBias2 = this.ShadowMapBias2;
			renderer.ShadowMapOpacity = this.ShadowMapOpacity;
			renderer.ShadowMapBackfaceBias = this.ShadowMapBackfaceBias;
		}

		// now do normal drawing
		var i = 0;

		// draws all render to texture passes of the scene
		for (i = 0; i < this.RenderToTextureNodes.length; ++i) {
			this.CurrentRenderMode = CL3D.Scene.RENDER_MODE_RTT_SCENE; // note: this is done inside the loop because calling the 'render'

			// method might likely cause this object to render the scene into
			// a RTT, and then this gets set to something differently 
			// before the next RTT, so we set it back
			this.RenderToTextureNodes[i].render(renderer);
		}

		this.drawRegistered3DNodes(renderer);

		this.StoreViewMatrixForRedrawCheck();

		// disable shadow map drawing again
		if (this.ShadowMappingEnabled)
			renderer.enableShadowMap(false, null, null);

		// disable post effect drawing again
		if (bUsingPostEffects) {
			// process post effects
			this.processPostEffects();

			// set old render target and viewport
			renderer.setRenderTarget(prePostEffectRenderTarget, false, false);

			//renderer.setViewPort(prePostEffectsViewPort);
			// present post processed image on screen
			var postEffectRTT = this.createOrGetPostEffectRTT(this.CurrentPostProcessRTTTargetIndex, false, this.CurrentPostProcessRTTTargetSizeFactor);
			if (postEffectRTT) {
				var matWorld = renderer.getWorld().clone();
				var matView = renderer.getView().clone();
				var matProj = renderer.getProjection().clone();

				var mat = new CL3D.Matrix4();
				renderer.setWorld(mat);
				renderer.setView(mat);
				renderer.setProjection(mat);

				this.PostProcessingVerticesQuadBuffer.Mat.Type = CL3D.Material.EMT_SOLID;
				this.PostProcessingVerticesQuadBuffer.Mat.Tex1 = postEffectRTT;
				this.drawPostprocessingQuad();

				renderer.setWorld(matWorld);
				renderer.setView(matView);
				renderer.setProjection(matProj);

				// renderer.setViewPort(prePostEffectsViewPort);
				// debug post effects
				if (CL3D.DebugPostEffects) {
					var rttidx = 0;
					for (var ti = 0; ti < renderer.TheTextureManager.getTextureCount(); ++ti) {
						var tex = renderer.TheTextureManager.Textures[ti];
						if (tex && tex.RTTFrameBuffer) {
							var rttw = 100;

							renderer.draw2DImage(10 + (rttw * rttidx), 10, rttw, rttw, tex, false);

							++rttidx;
						}
					}
				}
			}
		}

		// draw effect
		// if (CL3D.engine.OnEffekseerDraw)
		// 	CL3D.engine.OnEffekseerDraw();

		// draw overlays
		this.CurrentRenderMode = CL3D.Scene.RENDER_MODE_2DOVERLAY;
		for (i = 0; i < this.Overlay2DToRender.length; ++i) {
			this.Overlay2DToRender[i].render(renderer);
		}
	}

	getCullingBBoxAndStoreCameraFrustrum(renderer, projectionMatrix, viewMatrix, camPos, alwaysReturnBox) {
		var cullingBox = null;

		{
			var frustrum = null;
			var proj = projectionMatrix;
			var view = viewMatrix;

			if (proj != null && view != null && camPos != null) {
				frustrum = new CL3D.ViewFrustrum();
				frustrum.setFrom(proj.multiply(view)); // calculate view frustum planes

				if (this.UseCulling || alwaysReturnBox)
					cullingBox = frustrum.getBoundingBox(camPos);
			}

			this.CurrentCameraFrustrum = frustrum;
		}

		return cullingBox;
	}

	/**
	 * /implementation part of drawAll(), which usually gets called during drawAll() for drawing the reigered 3d nodes.
	 * can be called separately by special nodes like water or reflections, which needs to render everything a bit differently
	 * into a RTT
	 * @param {CL3D.Renderer} renderer used for drawing.
	 */
	drawRegistered3DNodes(renderer, callbackForOnAfterSkyboxRendering) {
		// active camera
		this.CurrentRenderMode = CL3D.Scene.RENDER_MODE_CAMERA;
		var camPos = null;
		if (this.ActiveCamera) {
			camPos = this.ActiveCamera.getAbsolutePosition();
			this.ActiveCamera.render(renderer);
		}

		// skybox 
		this.CurrentRenderMode = CL3D.Scene.RENDER_MODE_SKYBOX;
		if (this.SkyBoxSceneNode)
			this.SkyBoxSceneNode.render(renderer);

		renderer.clearDynamicLights();
		renderer.AmbientLight = this.AmbientLight.clone();
		renderer.FogEnabled = this.FogEnabled;
		renderer.FogColor.A = 1.0;
		renderer.FogColor.R = CL3D.getRed(this.FogColor) / 255.0;
		renderer.FogColor.G = CL3D.getGreen(this.FogColor) / 255.0;
		renderer.FogColor.B = CL3D.getBlue(this.FogColor) / 255.0;
		renderer.FogDensity = this.FogEnabled ? this.FogDensity : 0.0;
		renderer.WindSpeed = this.WindSpeed;
		renderer.WindStrength = this.WindStrength;

		var i; // i
		var nodesRendered = 0;

		// draw lights	
		// sort lights
		if (camPos != null && this.LightsToRender.length > 0) {
			this.LightsToRender.sort(function (a, b) {
				var distance1 = camPos.getDistanceFromSQ(a.getAbsolutePosition());
				var distance2 = camPos.getDistanceFromSQ(b.getAbsolutePosition());
				if (distance1 > distance2)
					return 1;
				if (distance1 < distance2)
					return -1;
				return 0;
			});
		}

		this.CurrentRenderMode = CL3D.Scene.RENDER_MODE_LIGHTS;

		for (i = 0; i < this.LightsToRender.length; ++i)
			this.LightsToRender[i].render(renderer);

		nodesRendered += this.LightsToRender.length;

		// call callback
		if (callbackForOnAfterSkyboxRendering)
			callbackForOnAfterSkyboxRendering.OnAfterDrawSkyboxes(renderer);

		// prepare for frustrum culling
		var cullingBox = this.getCullingBBoxAndStoreCameraFrustrum(renderer, renderer.getProjection(), renderer.getView(), camPos);

		// draw nodes
		this.CurrentRenderMode = CL3D.Scene.RENDER_MODE_DEFAULT;

		for (i = 0; i < this.SceneNodesToRender.length; ++i) {
			var s = this.SceneNodesToRender[i];
			if (cullingBox == null || cullingBox.intersectsWithBox(s.getTransformedBoundingBox())) {
				s.render(renderer);
				nodesRendered += 1;
			}
		}

		// draw transparent nodes
		this.CurrentRenderMode = CL3D.Scene.RENDER_MODE_TRANSPARENT;

		// sort transparent nodes
		var sortfunc = function (a, b) {
			var distance1 = camPos.getDistanceFromSQ(a.getAbsolutePosition());
			var distance2 = camPos.getDistanceFromSQ(b.getAbsolutePosition());
			if (distance1 < distance2)
				return 1;
			if (distance1 > distance2)
				return -1;
			return 0;
		};

		if (camPos != null && this.SceneNodesToRenderTransparent.length > 0) {
			this.SceneNodesToRenderTransparent.sort(sortfunc);
		}

		// draw them
		for (i = 0; i < this.SceneNodesToRenderTransparent.length; ++i) {
			var s = this.SceneNodesToRenderTransparent[i];
			if (cullingBox == null || cullingBox.intersectsWithBox(s.getTransformedBoundingBox())) {
				s.render(renderer);
				nodesRendered += 1;
			}
		}

		// now for objects with SolidNodeListAfterZClearForFPSCamera and TransparentNodeListAfterZClearForFPSCamera
		if (this.SceneNodesToRenderAfterZClearForFPSCamera.length ||
			this.SceneNodesToRenderTransparentAfterZClearForFPSCamera.length) {
			renderer.clearZBuffer();

			this.CurrentRenderMode = CL3D.Scene.RENDER_MODE_DEFAULT;

			for (i = 0; i < this.SceneNodesToRenderAfterZClearForFPSCamera.length; ++i) {
				var s = this.SceneNodesToRenderAfterZClearForFPSCamera[i];
				if (cullingBox == null || cullingBox.intersectsWithBox(s.getTransformedBoundingBox())) {
					s.render(renderer);
					nodesRendered += 1;
				}
			}

			this.CurrentRenderMode = CL3D.Scene.RENDER_MODE_TRANSPARENT;

			if (camPos != null && this.SceneNodesToRenderTransparentAfterZClearForFPSCamera.length > 0) {
				this.SceneNodesToRenderTransparentAfterZClearForFPSCamera.sort(sortfunc);

				for (i = 0; i < this.SceneNodesToRenderTransparentAfterZClearForFPSCamera.length; ++i) {
					var s = this.SceneNodesToRenderTransparentAfterZClearForFPSCamera[i];
					if (cullingBox == null || cullingBox.intersectsWithBox(s.getTransformedBoundingBox())) {
						s.render(renderer);
						nodesRendered += 1;
					}
				}
			}
		}

		// stats
		this.NodeCountRenderedLastTime = nodesRendered;
	}

	/**
	 * @private
	 */
	HasViewChangedSinceLastRedraw() {
		if (!this.ActiveCamera)
			return true;

		var mat = new CL3D.Matrix4(false);
		this.ActiveCamera.Projection.copyTo(mat);
		mat = mat.multiply(this.ActiveCamera.ViewMatrix);

		return !mat.equals(this.LastViewProj);
	}

	/**
	 * @private
	 */
	StoreViewMatrixForRedrawCheck() {
		if (!this.ActiveCamera)
			return;

		this.ActiveCamera.Projection.copyTo(this.LastViewProj);
		this.LastViewProj = this.LastViewProj.multiply(this.ActiveCamera.ViewMatrix);
	}

	/**
	 * @private
	 */
	getLastUsedRenderer() {
		return this.LastUsedRenderer;
	}

	/**
	 * Sets the background color for the scene
	 * @param clr {Number} New color. See {@link CL3D.createColor} on how to create such a color value.
	 * @public
	 */
	setBackgroundColor(clr) {
		this.BackgroundColor = clr;
	}

	/**
	 * Gets the background color of the scene
	 * @returns {Number} Background color. See {@link CL3D.createColor} on how to create such a color value.
	 * @public
	 */
	getBackgroundColor() {
		return this.BackgroundColor;
	}

	/**
	 * Returns the name of the scene
	 * @public
	 */
	getName() {
		return this.Name;
	}

	/**
	 * Sets the name of the scene
	 * @public
	 */
	setName(name) {
		this.Name = name;
	}

	/**
	 * Specifies when the scene should be redrawn.
	 * @param mode Possible values are {@link CL3D.Scene.REDRAW_WHEN_CAM_MOVED},
	 * {@link CL3D.Scene.REDRAW_WHEN_SCENE_CHANGED} and {@link CL3D.Scene.REDRAW_EVERY_FRAME}.
	 * @public
	 */
	setRedrawMode(mode) {
		this.RedrawMode = mode;
	}

	/**
	 * Sets the currently active {CL3D.CameraSceneNode} in the scene.
	 * @param {CL3D.CameraSceneNode} activeCamera The new active camera
	 * @public
	 */
	setActiveCamera(activeCamera) {
		this.ActiveCamera = activeCamera;
	}

	/**
	 * Returns the currently active {CL3D.CameraSceneNode} in the scene.
	 * @returns {CL3D.CameraSceneNode} active camera
	 * @public
	 */
	getActiveCamera() {
		return this.ActiveCamera;
	}

	/**
	 * Forces the renderer to redraw this scene the next frame, independent of the currently used redraw mode.
	 * @public
	 */
	forceRedrawNextFrame() {
		this.ForceRedrawThisFrame = true;
	}

	/**
	 * Returns the start time in milliseconds of this scene. Useful for {@link Animators}.
	 * @public
	 */
	getStartTime() {
		return this.StartTime;
	}

	/**
	 * Used for Scene nodes to register themselves for rendering
	 * When called {@link SceneNode.OnRegisterSceneNode}, a scene node should call
	 * this method to register itself for rendering if it decides that it wants to be rendered.
	 * In this way, scene nodes can be rendered in the optimal order.
	 * @param {CL3D.SceneNode} s Node which registers itself for rendering
	 * @param {Integer} mode render mode the scene node wishes to register itself. Usually, use {@link CL3D.Scene.RENDER_MODE_DEFAULT}. For
	 * transparent nodes, {@link CL3D.Scene.RENDER_MODE_TRANSPARENT} is ideal.
	 * @public
	 */
	registerNodeForRendering(s, mode) {
		if (mode == null)
			mode = CL3D.Scene.RENDER_MODE_DEFAULT;

		switch (mode) {
			case CL3D.Scene.RENDER_MODE_SKYBOX:
				this.SkyBoxSceneNode = s;
				break;
			case CL3D.Scene.RENDER_MODE_DEFAULT:
				this.SceneNodesToRender.push(s);
				break;
			case CL3D.Scene.RENDER_MODE_LIGHTS:
				this.LightsToRender.push(s);
				break;
			case CL3D.Scene.TRANSPARENT_SOLID_AFTER_ZBUFFER_CLEAR:
				this.SceneNodesToRenderAfterZClearForFPSCamera.push(s);
				break;
			case CL3D.Scene.RENDER_MODE_TRANSPARENT_AFTER_ZBUFFER_CLEAR:
				this.SceneNodesToRenderTransparentAfterZClearForFPSCamera.push(s);
				break;
			case CL3D.Scene.RENDER_MODE_CAMERA:
				// ignore for now
				break;
			case CL3D.Scene.RENDER_MODE_TRANSPARENT:
				this.SceneNodesToRenderTransparent.push(s);
				break;
			case CL3D.Scene.RENDER_MODE_2DOVERLAY:
				this.Overlay2DToRender.push(s);
				break;
			case CL3D.Scene.RENDER_MODE_RTT_SCENE:
				this.RenderToTextureNodes.push(s);
				break;
		}
	}

	/**
	 * Returns all scene nodes in this scene with the specified type {@link SceneNode}s.
	 * @public
	 * @param type {String} type name of the {@link SceneNode}. See {@link SceneNode}.getType().
	 * @returns {Array} array with all scene nodes found with this type.
	 */
	getAllSceneNodesOfType(type) {
		if (this.RootNode == null)
			return null;

		var ar = new Array();
		this.getAllSceneNodesOfTypeImpl(this.RootNode, type, ar);
		return ar;
	}

	/**
	 * @private
	 */
	getAllSceneNodesOfTypeImpl(n, c, a) {
		if (n.getType() == c)
			a.push(n);

		for (var i = 0; i < n.Children.length; ++i) {
			var child = n.Children[i];
			this.getAllSceneNodesOfTypeImpl(child, c, a);
		}
	}

	/**
	 * Returns all scene nodes in this scene with the specified animator type {@link SceneNode}s.
	 * @private
	 * @param type {String} type name of the animator
	 * @returns {Array} array with all scene nodes found with this type.
	 */
	getAllSceneNodesWithAnimator(type) {
		if (this.RootNode == null)
			return null;

		var ar = new Array();
		this.getAllSceneNodesWithAnimatorImpl(this.RootNode, type, ar);
		return ar;
	}

	/**
	 * @private
	 */
	getAllSceneNodesWithAnimatorImpl(n, t, a) {
		if (n.getAnimatorOfType(t) != null)
			a.push(n);

		for (var i = 0; i < n.Children.length; ++i) {
			var child = n.Children[i];
			this.getAllSceneNodesWithAnimatorImpl(child, t, a);
		}
	}

	/**
	 * Returns the first {@link SceneNode} in this scene with the specified name.
	 * @public
	 * @param name {String} name of the {@link SceneNode}. See {@link SceneNode}.getName().
	 * @returns {CL3D.SceneNode} the found scene node or null if not found.
	 */
	getSceneNodeFromName(name) {
		if (this.RootNode == null)
			return null;

		return this.getSceneNodeFromNameImpl(this.RootNode, name);
	}

	/**
	 * @private
	 */
	getSceneNodeFromNameImpl(n, name) {
		if (n.Name == name)
			return n;

		for (var i = 0; i < n.Children.length; ++i) {
			var child = n.Children[i];
			var s = this.getSceneNodeFromNameImpl(child, name);
			if (s)
				return s;
		}

		return null;
	}

	/**
	 * Returns the first {@link SceneNode} in this scene with the specified id.
	 * @public
	 * @param id {Number} name of the {@link SceneNode}. See {@link SceneNode}.getId().
	 * @returns {CL3D.SceneNode} the found scene node or null if not found.
	 */
	getSceneNodeFromId(id) {
		if (this.RootNode == null)
			return null;

		return this.getSceneNodeFromIdImpl(this.RootNode, id);
	}

	/**
	 * @private
	 */
	getSceneNodeFromIdImpl(n, id) {
		if (n.Id == id)
			return n;

		for (var i = 0; i < n.Children.length; ++i) {
			var child = n.Children[i];
			var s = this.getSceneNodeFromIdImpl(child, id);
			if (s)
				return s;
		}

		return null;
	}

	/**
	 * Returns the root {@link SceneNode}, the root of the whole scene graph.
	 * @public
	 * @returns {CL3D.SceneNode} The root scene node.
	 */
	getRootSceneNode() {
		return this.RootNode;
	}

	/**
	 * @private
	 */
	registerSceneNodeAnimatorForEvents(a) {
		if (a == null)
			return;

		for (var i = 0; i < this.RegisteredSceneNodeAnimatorsForEventsList.length; ++i) {
			var s = this.RegisteredSceneNodeAnimatorsForEventsList[i];
			if (s === a)
				return;
		}

		this.RegisteredSceneNodeAnimatorsForEventsList.push(a);
	}

	/**
	 * @private
	 */
	unregisterSceneNodeAnimatorForEvents(a) {
		if (a == null)
			return;

		for (var i = 0; i < this.RegisteredSceneNodeAnimatorsForEventsList.length; ++i) {
			var s = this.RegisteredSceneNodeAnimatorsForEventsList[i];
			if (s === a) {
				this.RegisteredSceneNodeAnimatorsForEventsList.splice(i, 1);
				return;
			}
		}
	}

	/**
	 * @private
	 */
	postMouseWheelToAnimators(delta) {
		for (var i = 0; i < this.RegisteredSceneNodeAnimatorsForEventsList.length; ++i) {
			var s = this.RegisteredSceneNodeAnimatorsForEventsList[i];
			s.onMouseWheel(delta);
		}
	}

	/**
	 * @private
	 */
	postMouseDownToAnimators(event) {
		for (var i = 0; i < this.RegisteredSceneNodeAnimatorsForEventsList.length; ++i) {
			var s = this.RegisteredSceneNodeAnimatorsForEventsList[i];
			s.onMouseDown(event);
		}
	}

	/**
	 * @private
	 */
	postMouseUpToAnimators(event) {
		for (var i = 0; i < this.RegisteredSceneNodeAnimatorsForEventsList.length; ++i) {
			var s = this.RegisteredSceneNodeAnimatorsForEventsList[i];
			s.onMouseUp(event);
		}
	}

	/**
	 * @private
	 */
	postMouseMoveToAnimators(event) {
		for (var i = 0; i < this.RegisteredSceneNodeAnimatorsForEventsList.length; ++i) {
			var s = this.RegisteredSceneNodeAnimatorsForEventsList[i];
			s.onMouseMove(event);
		}
	}

	/**
	 * Returns the automatically generated collision geometry containing all scene nodes with had the collision flag set to true
	 * in the editor.
	 * @returns Returns a {@link MetaTriangleSelector} providing access to all to collision geomertry in this scene.
	 */
	getCollisionGeometry() {
		return this.CollisionWorld;
	}

	/**
	 * @private
	 * @param storeInNodes: Boolean, if set to true the selector for each node is stored in the scene nodes
	 * @param selectorToReuse: Metatriangle selector, can be null. If not null, will be cleared and used to be filled with geometry
	 * @returns Returns a meta triangle selector with the collision geomertry
	 */
	createCollisionGeometry(storeInNodes, selectorToReuse) {
		var ar = this.getAllSceneNodesOfType('mesh');
		if (ar == null)
			return null;

		var metaselector = null;
		if (selectorToReuse) {
			selectorToReuse.clear();
			metaselector = selectorToReuse;
		}

		else {
			metaselector = new CL3D.MetaTriangleSelector();
		}

		// static meshes 
		for (var i = 0; i < ar.length; ++i) {
			var fnode = ar[i];

			if (fnode && fnode.DoesCollision) {
				var selector = null;

				if (fnode.Selector)
					selector = fnode.Selector;

				else {
					var materialTypeToIgnore = null;
					var materialTypeToIgnore2 = null;
					if (fnode.Parent && fnode.Parent.getType() == 'terrain') {
						materialTypeToIgnore = CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL_REF;
						materialTypeToIgnore2 = CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL_REF_MOVING_GRASS;
					}

					if (fnode.OwnedMesh && fnode.OwnedMesh.GetPolyCount() > 100)
						selector = new CL3D.OctTreeTriangleSelector(fnode.OwnedMesh, fnode, 64, materialTypeToIgnore, materialTypeToIgnore2);

					else
						selector = new CL3D.MeshTriangleSelector(fnode.OwnedMesh, fnode, materialTypeToIgnore, materialTypeToIgnore2);
				}

				if (storeInNodes && fnode.Selector == null)
					fnode.Selector = selector;

				metaselector.addSelector(selector);
			}
		}

		// static animated meshes
		ar = this.getAllSceneNodesOfType('animatedmesh');

		for (var i = 0; i < ar.length; ++i) {
			var fanimnode = ar[i];

			if (fanimnode && fanimnode.Mesh && fanimnode.Mesh.isStatic() &&
				fanimnode.Mesh.StaticCollisionBoundingBox &&
				!fanimnode.Mesh.StaticCollisionBoundingBox.isEmpty()) {
				var selector = null;

				if (fanimnode.Selector)
					selector = fanimnode.Selector;

				else
					selector = new CL3D.BoundingBoxTriangleSelector(fanimnode.Mesh.StaticCollisionBoundingBox, fanimnode);

				if (storeInNodes && fanimnode.Selector == null)
					fanimnode.Selector = selector;

				metaselector.addSelector(selector);
			}
		}

		return metaselector;
	}

	/**
	 @private
	*/
	addToDeletionQueue(node, afterTimeMs) {
		var e = new Object();
		e.node = node;
		e.timeAfterToDelete = afterTimeMs + CL3D.CLTimer.getTime();

		this.DeletionList.push(e);
	}

	/**
	 @private
	*/
	clearDeletionList(deleteAll) {
		if (this.DeletionList.length == 0)
			return false;

		var now = CL3D.CLTimer.getTime();
		var ret = false;

		for (var i = 0; i < this.DeletionList.length;) {
			var e = this.DeletionList[i];

			if (deleteAll || e.timeAfterToDelete < now) {
				if (e.node.Parent)
					e.node.Parent.removeChild(e.node);
				this.DeletionList.splice(i, 1);
				ret = true;

				if (this.CollisionWorld && e.node.Selector)
					this.CollisionWorld.removeSelector(e.node.Selector);
			}

			else
				++i;
		}

		return ret;
	}

	/**
	 @private
	*/
	isCoordOver2DOverlayNode(x, y, onlyThoseWhoBlockCameraInput) {
		if (this.RootNode == null || this.LastUsedRenderer == null)
			return null;

		return this.isCoordOver2DOverlayNodeImpl(this.RootNode, x, y, onlyThoseWhoBlockCameraInput);
	}

	/**
	 @private
	*/
	isCoordOver2DOverlayNodeImpl(n, x, y, onlyThoseWhoBlockCameraInput) {
		if (n && n.Visible && (n.getType() == '2doverlay' || n.getType() == 'mobile2dinput')) {
			if (!onlyThoseWhoBlockCameraInput || (onlyThoseWhoBlockCameraInput && n.blocksCameraInput())) {
				var r = n.getScreenCoordinatesRect(true, this.LastUsedRenderer);
				if (r.x <= x && r.y <= y &&
					r.x + r.w >= x &&
					r.y + r.h >= y) {
					return n;
				}
			}
		}

		for (var i = 0; i < n.Children.length; ++i) {
			var child = n.Children[i];
			var s = this.isCoordOver2DOverlayNodeImpl(child, x, y, onlyThoseWhoBlockCameraInput);
			if (s)
				return s;
		}

		return null;
	}

	/**
	 @private
	*/
	getUnusedSceneNodeId() {
		for (var tries = 0; tries < 1000; ++tries) {
			var testId = Math.round((Math.random() * 10000) + 10);

			if (this.getSceneNodeFromId(testId) == null)
				return testId;
		}

		return -1;
	}

	/**
	 @private
	*/
	replaceAllReferencedNodes(nold, nnew) {
		if (!nold || !nnew)
			return;

		for (var i = 0; i < nold.getChildren().length && i < nnew.getChildren().length; ++i) {
			var cold = nold.getChildren()[i];
			var cnew = nnew.getChildren()[i];

			if (cold && cnew && cold.getType() == cnew.getType()) {
				nnew.replaceAllReferencedNodes(cold, cnew);
			}
		}

		return -1;
	}

	/**
	  * Enables/disables fog for this whole scene and changes its color and density
	  * @public
	  * @example
	  * scene.setFog(true, CL3D.createColor(1, 100, 100, 100), 0.1);
	  * @param enabled {Boolean} (optional) set to true to enable fog and false not to enable
	  * @param color {Number} Fog color. See {@link CL3D.createColor} on how to create such a color value.
	  * @param density {Number} Density of the fog. A value like 0.001 is default.
	*/
	setFog(enabled, color, density) {
		this.FogEnabled = enabled;

		if (!(color == null))
			this.FogColor = color;

		if (!(density == null))
			this.FogDensity = density;
	}

	/**
	 @private
	*/
	isAnyPostEffectActive() {
		if (Global_PostEffectsDisabled)
			return false;

		if (this.isAnyPostEffectEnabledByUser())
			return true;

		return false;
	}

	/**
	 @private
	*/
	isAnyPostEffectEnabledByUser() {
		for (var ip = 0; ip < this.PostEffectData.length; ++ip) {
			if (this.PostEffectData[ip].Active)
				return true;
		}

		return false;
	}

	/**
	 @private
	*/
	initPostProcessingQuad() {
		var currentResolution = this.LastUsedRenderer.getRenderTargetSize();

		var shiftX = 0.0;
		var shiftY = 0.0;

		var clr = CL3D.createColor(255, 64, 64, 64);

		if (this.PostProcessingVerticesQuadBuffer.Vertices == null ||
			this.PostProcessingVerticesQuadBuffer.Vertices.length == 0) {
			this.PostProcessingVerticesQuadBuffer.Vertices = [];
			this.PostProcessingVerticesQuadBuffer.Vertices.push(null);
			this.PostProcessingVerticesQuadBuffer.Vertices.push(null);
			this.PostProcessingVerticesQuadBuffer.Vertices.push(null);
			this.PostProcessingVerticesQuadBuffer.Vertices.push(null);
		}

		this.PostProcessingVerticesQuadBuffer.Vertices[0] = CL3D.createVertex(
			-1.0, -1.0, 0.0, 0.0, 0.0, -1.0, clr,
			shiftX, shiftY,
			shiftX, shiftY);

		this.PostProcessingVerticesQuadBuffer.Vertices[1] = CL3D.createVertex(
			1.0, -1.0, 0.0, 0.0, 0.0, -1.0, clr,
			1.0 + shiftX, shiftY,
			1.0 + shiftX, shiftY);

		this.PostProcessingVerticesQuadBuffer.Vertices[2] = CL3D.createVertex(
			-1.0, 1.0, 0.0, 0.0, 0.0, -1.0, clr,
			shiftX, 1 + shiftY,
			shiftX, 1 + shiftY);

		this.PostProcessingVerticesQuadBuffer.Vertices[3] = CL3D.createVertex(
			1.0, 1.0, 0.0, 0.0, 0.0, -1.0, clr,
			1.0 + shiftX, 1 + shiftY,
			1.0 + shiftX, 1 + shiftY);
	}

	/**
	 @private
	*/
	getNextPowerOfTwo(aSize) {
		return Math.pow(2, Math.ceil(Math.log(aSize) / Math.log(2)));

		// nearest would work like this:
		// return Math.pow( 2, Math.round( Math.log( aSize ) / Math.log( 2 ) ) ); 
	}
	
	/**
	 @private
	*/
	createOrGetPostEffectRTT(nCopyNumber, bCreateIfNotExisting, sizeFactor) {
		if (sizeFactor == null)
			sizeFactor = 1.0;

		var rttSizeNeeded = new CL3D.Vect2d(
			(this.RTTSizeWhenStartingPostEffects.X * sizeFactor) >> 0,
			(this.RTTSizeWhenStartingPostEffects.Y * sizeFactor) >> 0);

		if (!this.LastUsedRenderer.UsesWebGL2) {
			// webgl 1 can only use power of two RTT because of the needed mipmaps, so round up
			rttSizeNeeded.X = this.getNextPowerOfTwo(rttSizeNeeded.X);
			rttSizeNeeded.Y = this.getNextPowerOfTwo(rttSizeNeeded.Y);
		}

		var bufName = "postEffectRTT";
		bufName += nCopyNumber;
		bufName += "s" + sizeFactor; // prevents deleting textures too often, which causes some browser to lose the D3D context sometimes. 

		var tex = this.LastUsedRenderer.findTexture(bufName);

		if (!bCreateIfNotExisting)
			return tex;

		if (!tex || tex.OriginalWidth != rttSizeNeeded.X || tex.OriginalHeight != rttSizeNeeded.Y) {
			if (tex) {
				this.LastUsedRenderer.deleteTexture(tex);
			}

			tex = this.LastUsedRenderer.addRenderTargetTexture(rttSizeNeeded.X, rttSizeNeeded.Y, false, false, bufName);
		}

		return tex;
	}

	/**
	 @private
	*/
	processPostEffects() {
		if (!this.PostEffectsInitialized)
			this.initPostProcessingEffects();

		var renderer = this.LastUsedRenderer;

		// save matrices
		var matWorld = renderer.getWorld().clone();
		var matView = renderer.getView().clone();
		var matProj = renderer.getProjection().clone();

		// set to units
		var mat = new CL3D.Matrix4();
		renderer.setWorld(mat);
		renderer.setView(mat);
		renderer.setProjection(mat);

		// run
		for (var i = 0; i < this.PostEffectData.length; ++i) {
			var bActive = this.PostEffectData[i].Active;

			if (bActive)
				this.runPostProcessEffect(i, 1.0);
		}

		// set back matrices
		renderer.setWorld(matWorld);
		renderer.setView(matView);
		renderer.setProjection(matProj);
	}

	/**
	 @private
	*/
	runPostProcessEffect(type, rttSizeFactor) {
		var renderer = this.LastUsedRenderer;

		switch (type) {
			case CL3D.Scene.EPOSTEFFECT_BLOOM:
				{
					// create a copy of the current world image
					var texWhereCurrentWorldWasRendered = this.createOrGetPostEffectRTT(this.CurrentPostProcessRTTTargetIndex, false, this.CurrentPostProcessRTTTargetSizeFactor);
					var copyWorld = this.createOrGetPostEffectRTT(3, true, rttSizeFactor);

					this.copyPostProcessingTexture(texWhereCurrentWorldWasRendered, copyWorld);

					// create light treshold image
					this.runPostProcessEffect(CL3D.Scene.EPOSTEFFECT_LIGHT_TRESHOLD, rttSizeFactor);

					// blur light treshold image
					for (var i = 0; i < this.PE_bloomBlurIterations; ++i) {
						// use bilinear filtering to use higher gaussian blur by scaling texture by half:
						this.runPostProcessEffect(CL3D.Scene.EPOSTEFFECT_BLUR_HORIZONTAL, 0.25);
						this.runPostProcessEffect(CL3D.Scene.EPOSTEFFECT_BLUR_VERTICAL, 0.25);

						// run in normal size again to make it look nicer
						this.runPostProcessEffect(CL3D.Scene.EPOSTEFFECT_BLUR_HORIZONTAL, 1.0);
						this.runPostProcessEffect(CL3D.Scene.EPOSTEFFECT_BLUR_VERTICAL, 1.0);
					}

					// add as bloom to original image
					var texWithBurredTresholdImage = this.createOrGetPostEffectRTT(this.CurrentPostProcessRTTTargetIndex, false, this.CurrentPostProcessRTTTargetSizeFactor);

					renderer.setRenderTarget(copyWorld, false, false);

					this.PostProcessingVerticesQuadBuffer.Mat.Type = CL3D.Material.EMT_TRANSPARENT_ADD_COLOR;
					this.PostProcessingVerticesQuadBuffer.Mat.Tex1 = texWithBurredTresholdImage;
					this.drawPostprocessingQuad();

					// pesent on final rendering target
					if (!CL3D.equals(this.CurrentPostProcessRTTTargetSizeFactor, 1.0)) {
						// be sure last iteration is full size
						this.CurrentPostProcessRTTTargetIndex = (this.CurrentPostProcessRTTTargetIndex + 1) % 2;
						this.CurrentPostProcessRTTTargetSizeFactor = rttSizeFactor;
						this.createOrGetPostEffectRTT(this.CurrentPostProcessRTTTargetIndex, true, rttSizeFactor);
					}

					this.copyPostProcessingTexture(copyWorld, this.createOrGetPostEffectRTT(this.CurrentPostProcessRTTTargetIndex, false, this.CurrentPostProcessRTTTargetSizeFactor));
				}
				break;
			case CL3D.Scene.EPOSTEFFECT_BLUR:
				{
					var iterations = this.PE_blurIterations;
					iterations = CL3D.clamp(iterations, 1, 100);

					for (var i = 0; i < iterations; ++i) {
						this.runPostProcessEffect(CL3D.Scene.EPOSTEFFECT_BLUR_HORIZONTAL, rttSizeFactor);
						this.runPostProcessEffect(CL3D.Scene.EPOSTEFFECT_BLUR_VERTICAL, rttSizeFactor);
					}
				}
				break;
			default:
				{
					if (type < this.PostProcessingShaderInstances.length && this.PostProcessingShaderInstances[type] != -1) {
						// select source and target texture
						var texWhereCurrentWorldWasRendered = this.createOrGetPostEffectRTT(this.CurrentPostProcessRTTTargetIndex, false, this.CurrentPostProcessRTTTargetSizeFactor);
						if (!texWhereCurrentWorldWasRendered)
							return;

						this.CurrentPostProcessRTTTargetIndex = (this.CurrentPostProcessRTTTargetIndex + 1) % 2;
						this.CurrentPostProcessRTTTargetSizeFactor = rttSizeFactor;

						var texWhereWeAreRenderingTo = this.createOrGetPostEffectRTT(this.CurrentPostProcessRTTTargetIndex, true, rttSizeFactor);
						if (!texWhereWeAreRenderingTo)
							return;

						renderer.setRenderTarget(texWhereWeAreRenderingTo, false, false);

						// draw quad with our shader
						this.PostProcessingVerticesQuadBuffer.Mat.Type = this.PostProcessingShaderInstances[type];
						this.PostProcessingVerticesQuadBuffer.Mat.Tex1 = texWhereCurrentWorldWasRendered;
						this.drawPostprocessingQuad();
					}
				}
				break;
		}
	}

	/**
	 @private
	*/
	initPostProcessingEffects() {
		if (this.PostEffectsInitialized)
			return;

		this.PostEffectsInitialized = true;

		var renderer = this.LastUsedRenderer;
		var gl = renderer.getWebGL();
		var me = this;

		// quad data
		this.PostProcessingVerticesQuadBuffer.Mat.Lighting = false;
		this.PostProcessingVerticesQuadBuffer.Mat.ZReadEnabled = false;
		this.PostProcessingVerticesQuadBuffer.Mat.ZWriteEnabled = false;
		this.PostProcessingVerticesQuadBuffer.Mat.BackfaceCulling = false;

		this.initPostProcessingQuad();

		this.PostProcessingVerticesQuadBuffer.Indices.push(0);
		this.PostProcessingVerticesQuadBuffer.Indices.push(1);
		this.PostProcessingVerticesQuadBuffer.Indices.push(2);
		this.PostProcessingVerticesQuadBuffer.Indices.push(3);
		this.PostProcessingVerticesQuadBuffer.Indices.push(1);
		this.PostProcessingVerticesQuadBuffer.Indices.push(2);

		// create shaders
		for (var i = 0; i < CL3D.Scene.EPOSTEFFECT_COUNT; ++i) {
			var nMatBase = CL3D.Material.EMT_SOLID;
			var shadercontent = '';
			var nPostProcessingShader = -1;
			var shaderCallBack = null;

			switch (i) {
				case CL3D.Scene.EPOSTEFFECT_BLOOM:
					// special type, will call EPOSTEFFECT_LIGHT_TRESHOLD, EPOSTEFFECT_BLUR_HORIZONTAL and EPOSTEFFECT_BLUR_VERTICAL in iterations
					break;

				case CL3D.Scene.EPOSTEFFECT_INVERT:
					shadercontent = this.POSTPROCESS_SHADER_INVERT;
					break;

				case CL3D.Scene.EPOSTEFFECT_COLORIZE:
					shadercontent = this.POSTPROCESS_SHADER_COLORIZE;
					shaderCallBack = function () {
						var loc = gl.getUniformLocation(renderer.currentGLProgram, "PARAM_Colorize_Color");
						gl.uniform4f(loc, CL3D.getRed(me.PE_colorizeColor) / 255.0, CL3D.getGreen(me.PE_colorizeColor) / 255.0, CL3D.getBlue(me.PE_colorizeColor) / 255.0, 1.0);
					};
					break;

				case CL3D.Scene.EPOSTEFFECT_BLUR:
					// special type, will call EPOSTEFFECT_BLUR_HORIZONTAL and EPOSTEFFECT_BLUR_VERTICAL in iterations
					break;

				case CL3D.Scene.EPOSTEFFECT_BLUR_HORIZONTAL:
					shadercontent = this.POSTPROCESS_SHADER_BLUR_HORIZONTAL;
					shaderCallBack = function () {
						var loc = gl.getUniformLocation(renderer.currentGLProgram, "PARAM_SCREENX");
						gl.uniform1f(loc, renderer.getRenderTargetSize().X);
					};
					break;

				case CL3D.Scene.EPOSTEFFECT_BLUR_VERTICAL:
					shadercontent = this.POSTPROCESS_SHADER_BLUR_VERTICAL;
					shaderCallBack = function () {
						var loc = gl.getUniformLocation(renderer.currentGLProgram, "PARAM_SCREENY");
						gl.uniform1f(loc, renderer.getRenderTargetSize().Y);
					};
					break;

				case CL3D.Scene.EPOSTEFFECT_LIGHT_TRESHOLD:
					shadercontent = this.POSTPROCESS_SHADER_LIGHT_TRESHOLD;
					shaderCallBack = function () {
						var loc = gl.getUniformLocation(renderer.currentGLProgram, "PARAM_LightTreshold_Treshold");
						gl.uniform1f(loc, me.PE_bloomTreshold);
					};
					break;

				case CL3D.Scene.EPOSTEFFECT_BLACK_AND_WHITE:
					shadercontent = this.POSTPROCESS_SHADER_BLACK_AND_WHITE;
					break;

				case CL3D.Scene.EPOSTEFFECT_VIGNETTE:
					shadercontent = this.POSTPROCESS_SHADER_VIGNETTE;
					shaderCallBack = function () {
						var loc = gl.getUniformLocation(renderer.currentGLProgram, "PARAM_Vignette_Intensity");
						gl.uniform1f(loc, me.PE_vignetteIntensity);

						loc = gl.getUniformLocation(renderer.currentGLProgram, "PARAM_Vignette_RadiusA");
						gl.uniform1f(loc, me.PE_vignetteRadiusA);

						loc = gl.getUniformLocation(renderer.currentGLProgram, "PARAM_Vignette_RadiusB");
						gl.uniform1f(loc, me.PE_vignetteRadiusB);
					};
					break;
			}

			if (shadercontent != '') {
				// create shader 
				nPostProcessingShader = renderer.createMaterialType(renderer.vs_shader_normaltransform, shadercontent, null, null, null, shaderCallBack);

				if (nPostProcessingShader == -1)
					Global_PostEffectsDisabled = true;
			}

			this.PostProcessingShaderInstances.push(nPostProcessingShader);
		}
	}

	/**
	 @private
	*/
	drawPostprocessingQuad() {
		var renderer = this.LastUsedRenderer;

		renderer.setMaterial(this.PostProcessingVerticesQuadBuffer.Mat);
		renderer.drawMeshBuffer(this.PostProcessingVerticesQuadBuffer);
	}

	/**
	 @private
	*/
	copyPostProcessingTexture(source, target) {
		var renderer = this.LastUsedRenderer;

		renderer.setRenderTarget(target, false, false);

		this.PostProcessingVerticesQuadBuffer.Mat.Type = CL3D.Material.EMT_SOLID;
		this.PostProcessingVerticesQuadBuffer.Mat.Tex1 = source;

		this.drawPostprocessingQuad();
	}
};
