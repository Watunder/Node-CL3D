// ============================================================================================================================
// ----------------------------------------------------------------------------------------------------------------------------
// Implementation of all the scripting functions
// ----------------------------------------------------------------------------------------------------------------------------
// ============================================================================================================================

import * as CL3D from "../main.js";
import { vector3d } from "../scriptinginterface.js";
import { getSdlInfo } from "../share/getSdlInfo.js";
import { endProgram } from "../share/endProgram.js";

/**
 * @param {Number} id Searches the whole scene graph for a scene node with this 'id'.
 * @returns {CL3D.SceneNode} If it is found, it is returned, otherwise null is returned.
 */
globalThis.ccbGetSceneNodeFromId = (id) => {
	var scene = CL3D.gScriptingInterface.CurrentlyActiveScene;
	if (scene == null)
		return null;

	return scene.getSceneNodeFromId(id);
}

/**
 * Creates a new scene node based on an existing scene node.
 * @param {CL3D.SceneNode} node The parameter 'node' must be an exiting scene node.
 * You can get an existing scene node forexample with {@link ccbGetSceneNodeFromName}
 * @returns {CL3D.SceneNode} The new scene node.
 */
globalThis.ccbCloneSceneNode = (node) => {
	var scene = CL3D.gScriptingInterface.CurrentlyActiveScene;
	if (node == null)
		return null;

	var oldId = node.Id;
	var newId = scene.getUnusedSceneNodeId();

	var cloned = node.createClone(node.Parent, oldId, newId);

	if (cloned != null) {
		cloned.Id = newId;
		scene.replaceAllReferencedNodes(node, cloned);
	}

	// also clone collision detection of the node in the world

	var selector = node.Selector;
	if (selector && scene) {
		var newSelector = selector.createClone(cloned);
		if (newSelector) {
			// set to node

			cloned.Selector = newSelector;

			// also, copy into world

			if (scene.getCollisionGeometry())
				scene.getCollisionGeometry()
				.addSelector(newSelector);
		}
	}

	return cloned;
}

/**
 * @returns {CL3D.CameraSceneNode} the currently active camera of the scene.
 */
globalThis.ccbGetActiveCamera = () => {
	var scene = CL3D.gScriptingInterface.CurrentlyActiveScene;
	if (scene == null)
		return null;

	return scene.getActiveCamera();
}

/**
 * Sets the currently active camera to the scene.
 * @param {CL3D.CameraSceneNode} node The parameter 'node' must be a camera scene node.
 * @returns 
 */
globalThis.ccbSetActiveCamera = (node) => {
	var scene = CL3D.gScriptingInterface.CurrentlyActiveScene;
	if (scene == null)
		return;

	if (node != null && node.getType() == 'camera')
		scene.setActiveCamera(node);
}

/**
 * @param {CL3D.SceneNode} node 
 * @param {Number} childidx ChildIndex must be >= 0 and < {@link ccbGetSceneNodeChildCount}.
 * @returns {CL3D.SceneNode} the child scene node of a parent scene node.
 */
globalThis.ccbGetChildSceneNode = (node, childidx) => {
	if (node == null)
		return -1;

	if (childidx < 0 || childidx >= node.Children.length)
		return null;

	return node.Children[childidx];
}

/**
 * You cannot remove it and it does not make a lot of sense to change its attributes
 * but you can use it as starting point to iterate the whole scene graph.
 * Take a look at {@link ccbGetSceneNodeChildCount} for an example.
 * @returns {CL3D.SceneNode} the root scene node.
 */
globalThis.ccbGetRootSceneNode = () => {
	var scene = CL3D.gScriptingInterface.CurrentlyActiveScene;
	if (scene == null)
		return null;

	return scene.getRootSceneNode();
}

/**
 * @param {CL3D.SceneNode} node 
 * @returns {Number} the amount of children of a scene node.
 */
globalThis.ccbGetSceneNodeChildCount = (node) => {
	if (node == null)
		return 0;

	return node.Children.length;
}

/**
 * @param {String} name Searches the whole scene graph for a scene node with this 'name'.
 * Please note that the name is case sensitive.
 * @returns {CL3D.SceneNode} If it is found, it is returned, otherwise null is returned.
 */
globalThis.ccbGetSceneNodeFromName = (name) => {
	var scene = CL3D.gScriptingInterface.CurrentlyActiveScene;
	if (scene == null)
		return null;

	return scene.getSceneNodeFromName(name);
}

/**
 * @param {CL3D.SceneNode} node Removes the scene node from the scene, deleting it.
 * Doesn't work for the root scene node.
 * @returns 
 */
globalThis.ccbRemoveSceneNode = (node) => {
	var scene = CL3D.gScriptingInterface.CurrentlyActiveScene;
	if (scene == null)
		return;

	scene.addToDeletionQueue(node, 0);
}

/**
 * Sets the parent scene node of a scene node.
 * If this node has already a parent, it will be removed from that parent.
 * Note that by setting a new parent, position, rotation and scale of this node becomes relative to that of the new parent.
 * @param {CL3D.SceneNode} node 
 * @param {CL3D.SceneNode} parent 
 */
globalThis.ccbSetSceneNodeParent = (node, parent) => {
	if (node && parent)
		parent.addChild(node);
}

/**
 * @param {CL3D.SceneNode} node 
 * @returns {Number} the amount of materials of the scene node.
 */
globalThis.ccbGetSceneNodeMaterialCount = (node) => {
	if (node == null)
		return 0;

	return node.getMaterialCount();
}

/**
 * @param {CL3D.SceneNode} node A scene node.
 * @param {Number} matidx The index of the material. Must be a value greater or equal 0 and smaller than {@link ccbGetSceneNodeMaterialCount}.
 * @param {String} propName The propertyName in a material. Can be `Type`, `Texture1`, `Texture2`, `Lighting`, `Backfaceculling`. See {@link ccbSetSceneNodeMaterialProperty} for details.
 * @returns {any} the property of the material of a scene node.
 */
globalThis.ccbGetSceneNodeMaterialProperty = (node, matidx, propName) => {
	if (node == null)
		return null;

	if (matidx < 0 || matidx >= node.getMaterialCount())
		return null;

	var mat = node.getMaterial(matidx);
	if (mat == null)
		return null;

	if (propName == "Type") {
		switch (mat.Type) {
			case 0:
				return 'solid';
			case 2:
				return 'lightmap';
			case 3:
				return 'lightmap_add';
			case 4:
				return 'lightmap_m2';
			case 5:
				return 'lightmap_m4';
			case 11:
				return 'reflection_2layer';
			case 12:
				return 'trans_add';
			case 13:
				return 'trans_alphach';
			case 16:
				return 'trans_reflection_2layer';
		}
	} else
	if (propName == "Texture1")
		return (mat.Tex1 == null) ? "" : mat.Tex1.Name;
	else
	if (propName == "Texture2")
		return (mat.Tex2 == null) ? "" : mat.Tex2.Name;
	else
	if (propName == "Lighting")
		return mat.Lighting;
	else
	if (propName == "Backfaceculling")
		return mat.Backfaceculling;

	return null;
}

/**
 * @ignore
 * Cleans up the current memory usage.
 * Tries to free up as much memory as possible by freeing up unused textures, vertex and index buffers and similar.
 * This is useful for calling it for example after switching scenes to increase performance of the app.
 * May have different effects on different platforms.
 */
globalThis.ccbCleanMemory = () => {
	// not implemented for browser
}

/**
 * @param {CL3D.SceneNode} node A scene node.
 * @param {Number} matidx The index of the material. Must be a value greater or equal 0 and smaller than {@link ccbGetSceneNodeMaterialCount}.
 * @param {String} propName The propertyName in a material. Can be `Type`, `Texture1`, `Texture2`, `Lighting`, `Backfaceculling`.
 * @param {any} arg0 
 * @param {any} arg2 
 * @param {any} arg3 
 * @returns 
 */
globalThis.ccbSetSceneNodeMaterialProperty = (node, matidx, propName, arg0, arg2, arg3) => {
	if (node == null)
		return;

	if (matidx < 0 || matidx >= node.getMaterialCount())
		return;

	var mat = node.getMaterial(matidx);
	if (mat == null)
		return;

	var firstParam = arg0;
	var paramAsString = (typeof arg0 == 'string') ? arg0 : null;
	var tex = null;
	var sc = CL3D.ScriptingInterface.getScriptingInterface();

	if (propName == "Type") {
		if (paramAsString) {
			switch (paramAsString) {
				case 'solid':
					mat.Type = 0;
					break;
				case 'lightmap':
				case 'lightmap_add':
				case 'lightmap_m2':
				case 'lightmap_m4':
					mat.Type = 2;
					break;
				case 'reflection_2layer':
					mat.Type = 11;
					break;
				case 'trans_add':
					mat.Type = 12;
					break;
				case 'trans_alphach':
					mat.Type = 13;
					break;
				case 'trans_reflection_2layer':
					mat.Type = 16;
					break;
			}
		} else {
			// together with ccbCreateMaterial, users are setting an interger parameter sometimes
			var i = parseInt(arg0);
			if (i != NaN)
				mat.Type = i;
		}
	} else
	if (propName == "Texture1") {
		if (paramAsString != null && sc.TheTextureManager != null) {
			tex = sc.TheTextureManager.getTextureFromName(paramAsString);
			if (tex != null)
				mat.Tex1 = tex;
		}
	} else
	if (propName == "Texture2") {
		if (paramAsString != null && sc.TheTextureManager != null) {
			tex = sc.TheTextureManager.getTextureFromName(paramAsString);
			if (tex != null)
				mat.Tex2 = tex;
		}
	} else
	if (propName == "Lighting")
		mat.Lighting = firstParam;
	else
	if (propName == "Backfaceculling")
		mat.Backfaceculling = firstParam;
}

/**
 * Sets the property value of a scene node.
 * @param {CL3D.SceneNode} node 
 * @param {String} propName 
 * @param {any} arg0 
 * @param {any} arg1 
 * @param {any} arg2 
 * @returns 
 */
globalThis.ccbSetSceneNodeProperty = (node, propName, arg0, arg1, arg2) => {
	if (node == null)
		return;

	// get vector if possible

	var firstParam = arg0;
	var x = 0.0;
	var y = 0.0;
	var z = 0.0;

	var argsAsColor = 0;
	if (arg0 != null)
		argsAsColor = arg0;

	if (arg1 == null && firstParam != null && typeof firstParam.x != 'undefined') {
		x = firstParam.x;
		y = firstParam.y;
		z = firstParam.z;
	}

	if (arg1 != null && arg2 != null) {
		x = arg0;
		y = arg1;
		z = arg2;

		argsAsColor = CL3D.createColor(255, Math.floor(arg0), Math.floor(arg1), Math.floor(arg2));
	}

	// get type

	var cam = null;
	var animnode = null;
	var lightnode = null;
	var overlaynode = null;
	var type = node.getType();

	if (type == 'camera')
		cam = node;
	else
	if (type == 'animatedmesh')
		animnode = node;
	else
	if (type == 'light')
		lightnode = node;
	else
	if (type == '2doverlay')
		overlaynode = node;

	// set property

	if (propName == "Visible")
		node.Visible = firstParam;
	else
	if (propName == "Position") {
		node.Pos.X = x;
		node.Pos.Y = y;
		node.Pos.Z = z;
	} else
	if (propName == "Rotation") {
		node.Rot.X = x;
		node.Rot.Y = y;
		node.Rot.Z = z;
	} else
	if (propName == "Scale") {
		node.Scale.X = x;
		node.Scale.Y = y;
		node.Scale.Z = z;
	} else
	if (propName == "Target") {
		if (cam != null)
			cam.setTarget(new CL3D.Vect3d(x, y, z));
	} else
	if (propName == "UpVector") {
		if (cam != null)
			cam.UpVector = new CL3D.Vect3d(x, y, z);
	} else
	if (propName == "FieldOfView_Degrees") {
		if (cam != null)
			cam.setFov(CL3D.degToRad(firstParam));
	} else
	if (propName == "AspectRatio") {
		if (cam != null)
			cam.setAspectRatio(firstParam);
	} else
	if (propName == "Animation") {
		if (animnode != null)
			animnode.setAnimationByEditorName(firstParam, animnode.Looping);
	} else
	if (propName == "Looping") {
		if (animnode != null)
			animnode.setLoopMode(firstParam);
	} else
	if (propName == "FramesPerSecond") {
		if (animnode != null)
			animnode.setAnimationSpeed(firstParam * 0.001);
	} else
	if (propName == "AnimationBlending") {
		if (animnode != null)
			animnode.AnimationBlendingEnabled = firstParam;
	} else
	if (propName == "BlendTimeMs") {
		if (animnode != null)
			animnode.BlendTimeMs = firstParam;
	} else
	if (propName == "Radius") {
		if (lightnode != null)
			lightnode.LightData.Radius = firstParam;
	} else
	if (propName == "Color") {
		if (lightnode != null)
			lightnode.LightData.Color = CL3D.createColorF(argsAsColor);
	} else
	if (propName == "Direction") {
		if (lightnode != null) {
			lightnode.LightData.Direction = new CL3D.Vect3d(x, y, z);
			lightnode.LightData.Direction.normalize();
		}
	} else
	if (propName == "FogColor") {
		CL3D.gScriptingInterface.CurrentlyActiveScene.FogColor = argsAsColor;
	} else
	if (propName == "Realtime Shadows" && node === ccbGetRootSceneNode()) {
		CL3D.gScriptingInterface.CurrentlyActiveScene.ShadowMappingEnabled = arg0 == true;
	} else
	if (propName == "BackgroundColor" && node === ccbGetRootSceneNode()) {
		CL3D.gScriptingInterface.CurrentlyActiveScene.BackgroundColor = argsAsColor;
	} else
	if (propName == "AmbientLight") {
		CL3D.gScriptingInterface.CurrentlyActiveScene.AmbientLight = CL3D.createColorF(argsAsColor);
	} else
	if (propName == "Bloom") {
		CL3D.gScriptingInterface.CurrentlyActiveScene.PostEffectData[CL3D.Scene.EPOSTEFFECT_BLOOM].Active = arg0 == true;
	} else
	if (propName == "Black and White") {
		CL3D.gScriptingInterface.CurrentlyActiveScene.PostEffectData[CL3D.Scene.EPOSTEFFECT_BLACK_AND_WHITE].Active = arg0 == true;
	} else
	if (propName == "Invert") {
		CL3D.gScriptingInterface.CurrentlyActiveScene.PostEffectData[CL3D.Scene.EPOSTEFFECT_INVERT].Active = arg0 == true;
	} else
	if (propName == "Blur") {
		CL3D.gScriptingInterface.CurrentlyActiveScene.PostEffectData[CL3D.Scene.EPOSTEFFECT_BLUR].Active = arg0 == true;
	} else
	if (propName == "Colorize") {
		CL3D.gScriptingInterface.CurrentlyActiveScene.PostEffectData[CL3D.Scene.EPOSTEFFECT_COLORIZE].Active = arg0 == true;
	} else
	if (propName == "Vignette") {
		CL3D.gScriptingInterface.CurrentlyActiveScene.PostEffectData[CL3D.Scene.EPOSTEFFECT_VIGNETTE].Active = arg0 == true;
	} else
	if (propName == "Bloom_BlurIterations") {
		CL3D.gScriptingInterface.CurrentlyActiveScene.PE_bloomBlurIterations = firstParam >> 0;
	} else
	if (propName == "Bloom_Treshold") {
		CL3D.gScriptingInterface.CurrentlyActiveScene.PE_bloomTreshold = firstParam;
	} else
	if (propName == "Blur_Iterations") {
		CL3D.gScriptingInterface.CurrentlyActiveScene.PE_blurIterations = firstParam >> 0;
	} else
	if (propName == "Colorize_Color") {
		CL3D.gScriptingInterface.CurrentlyActiveScene.PE_colorizeColor = firstParam;
	} else
	if (propName == "Vignette_Intensity") {
		CL3D.gScriptingInterface.CurrentlyActiveScene.PE_vignetteIntensity = firstParam >> 0;
	} else
	if (propName == "Vignette_RadiusA") {
		CL3D.gScriptingInterface.CurrentlyActiveScene.PE_vignetteRadiusA = firstParam >> 0;
	} else
	if (propName == "Vignette_RadiusB") {
		CL3D.gScriptingInterface.CurrentlyActiveScene.PE_vignetteRadiusB = firstParam >> 0;
	} else
	if (propName == "Name") {
		node.Name = firstParam;
	} else
	if (overlaynode != null) {
		CL3D.ScriptingInterface.getScriptingInterface()
			.setSceneNodePropertyFromOverlay(overlaynode, propName, arg0, argsAsColor);
	}
}

/**
 * Gets the property value of a scene node.
 * @param {CL3D.SceneNode} node 
 * @param {String} propName 
 * @returns {vector3d}
 */
globalThis.ccbGetSceneNodeProperty = (node, propName) => {
	if (node == null)
		return null;

	// get type

	var cam = null;
	var animnode = null;
	var lightnode = null;
	var overlaynode = null;
	var type = node.getType();

	if (type == 'camera')
		cam = node;
	else
	if (type == 'animatedmesh')
		animnode = node;
	else
	if (type == 'light')
		lightnode = node;
	else
	if (type == '2doverlay')
		overlaynode = node;


	if (propName == "Visible")
		return node.Visible;
	else
	if (propName == "Position")
		return new vector3d(node.Pos.X, node.Pos.Y, node.Pos.Z);
	else
	if (propName == "PositionAbs") {
		var abspos = node.getAbsolutePosition();
		return new vector3d(abspos.X, abspos.Y, abspos.Z);
	} else
	if (propName == "Rotation")
		return new vector3d(node.Rot.X, node.Rot.Y, node.Rot.Z);
	else
	if (propName == "Scale")
		return new vector3d(node.Scale.X, node.Scale.Y, node.Scale.Z);
	else
	if (propName == "Target") {
		if (cam != null)
			return new vector3d(cam.Target.X, cam.Target.Y, cam.Target.Z);
	} else
	if (propName == "UpVector") {
		if (cam != null)
			return new vector3d(cam.UpVector.X, cam.UpVector.Y, cam.UpVector.Z);
	} else
	if (propName == "FieldOfView_Degrees") {
		if (cam != null)
			return CL3D.radToDeg(cam.Fovy);
	} else
	if (propName == "AspectRatio") {
		if (cam != null)
			return cam.Aspect;
	} else
	if (propName == "Animation")
		return ""; // not implemented yet
	else
	if (propName == "Looping") {
		if (animnode != null)
			return animnode.Looping;
	} else
	if (propName == "FramesPerSecond") {
		if (animnode != null)
			return animnode.FramesPerSecond * 1000.0;
	} else
	if (propName == "AnimationBlending") {
		if (animnode != null)
			return animnode.AnimationBlendingEnabled;
	} else
	if (propName == "BlendTimeMs") {
		if (animnode != null)
			return animnode.BlendTimeMs;
	} else
	if (propName == "Radius") {
		if (lightnode != null)
			return lightnode.LightData.Radius;
	} else
	if (propName == "Color") {
		if (lightnode != null)
			return CL3D.createColor(255, lightnode.LightData.Color.R * 255, lightnode.LightData.Color.G * 255, lightnode.LightData.Color.B * 255);
	} else
	if (propName == "Direction") {
		if (lightnode != null)
			return lightnode.LightData.Direction;
	} else
	if (propName == "Name") {
		return node.Name;
	} else
	if (propName == "Type") {
		return node.getType();
	} else
	if (propName == "FogColor") {
		return CL3D.gScriptingInterface.CurrentlyActiveScene.FogColor;
	} else
	if (propName == "Realtime Shadows" && node === ccbGetRootSceneNode()) {
		return CL3D.gScriptingInterface.CurrentlyActiveScene.ShadowMappingEnabled;
	} else
	if (propName == "BackgroundColor" && node === ccbGetRootSceneNode()) {
		return CL3D.gScriptingInterface.CurrentlyActiveScene.BackgroundColor;
	} else
	if (overlaynode != null)
		return CL3D.ScriptingInterface.getScriptingInterface()
			.getSceneNodePropertyFromOverlay(overlaynode, propName);

	return null;
}

/**
 * Sets a new position of a scene node, even if the scene node has a 'collide with walls' behavior attached to it. So it it possible to move such a scene node through walls.
 * Note that you have to ensure that the new position of the scene node is not inside a wall, otherwise the node will be stuck.
 * @param {CL3D.SceneNode} node 
 * @param {Number} x 
 * @param {Number} y 
 * @param {Number} z 
 * @returns 
 */
globalThis.ccbSetSceneNodePositionWithoutCollision = (node, x, y, z) => {
	if (node == null)
		return;

	node.Pos.X = x;
	node.Pos.Y = y;
	node.Pos.Z = z;

	for (var ai = 0; ai < node.Animators.length; ++ai) {
		var a = node.Animators[ai];
		if (a != null && a.getType() == 'collisionresponse')
			a.reset();
	}
}

/**
 * registers a function for receiving a 'on frame' event, an event which is called every frame the screen drawn.
 * @param {function} fobj The function registered must take no parameters.
 * Inside this function, it is possible to draw own, custom things like user interfaces.
 * After you no longer need events, call {@link ccbUnregisterOnFrameEvent} to unregister your function.
 */
globalThis.ccbRegisterOnFrameEvent = (fobj) => {
	var engine = CL3D.ScriptingInterface.getScriptingInterface();
	engine.ccbRegisteredFunctionArray.push(fobj);
}

/**
 * unregisters a function from a 'on frame' event.
 * @param {function} fobj The function registered
 * @returns 
 */
globalThis.ccbUnregisterOnFrameEvent = (fobj) => {
	var engine = CL3D.ScriptingInterface.getScriptingInterface();
	var pos = engine.ccbRegisteredFunctionArray.indexOf(fobj);

	if (pos == -1)
		return;

	engine.ccbRegisteredFunctionArray.splice(pos, 1);
}

/**
 * Draws a colored rectangle. This function can only be used inside a frame event function which must have been registered with {@link ccbRegisterOnFrameEvent}.
 * @param {Number} c The color is a 32 bit value with alpha `0xaarrggbb`
 * @param {Number} x 
 * @param {Number} y 
 * @param {Number} x2 
 * @param {Number} y2 
 * @returns 
 */
globalThis.ccbDrawColoredRectangle = (c, x, y, x2, y2) => {
	var engine = CL3D.ScriptingInterface.getScriptingInterface();
	if (!engine.IsInDrawCallback || engine.TheRenderer == null)
		return;

	engine.TheRenderer.draw2DRectangle(x, y, x2 - x, y2 - y, c, true);
}

/**
 * @ignore
 * Draws a textured rectangle. This function can only be used inside a frame event function which must have been registered with {@link ccbRegisterOnFrameEvent}.
 * This function will ignore the alpha channel of the texture. Use {@link ccbDrawTextureRectangleWithAlpha} if you want the alpha channel to be taken into account as well.
 * @param {*} f 
 * @param {*} x 
 * @param {*} y 
 * @param {*} x2 
 * @param {*} y2 
 * @returns 
 */
globalThis.ccbDrawTextureRectangle = (f, x, y, x2, y2) => {
	var engine = CL3D.ScriptingInterface.getScriptingInterface();
	if (!engine.IsInDrawCallback || engine.TheRenderer == null)
		return;

	// TODO: implement
	engine.TheRenderer.draw2DRectangle(x, y, x2 - x, y2 - y, 0xff000000, true);
}

/**
 * @ignore
 * Draws a textured rectangle with alpha channel. This function can only be used inside a frame event function which must have been registered with {@link ccbRegisterOnFrameEvent}.
 * @param {*} f 
 * @param {*} x 
 * @param {*} y 
 * @param {*} x2 
 * @param {*} y2 
 * @returns 
 */
globalThis.ccbDrawTextureRectangleWithAlpha = (f, x, y, x2, y2) => {
	var engine = CL3D.ScriptingInterface.getScriptingInterface();
	if (!engine.IsInDrawCallback || engine.TheRenderer == null)
		return;

	// TODO: implement
	engine.TheRenderer.draw2DRectangle(x, y, x2 - x, y2 - y, 0xff000000, true);
}

/**
 * @param {Number} x 
 * @param {Number} y 
 * @returns {vector3d} the 3d position of a 2d position on the screen.
 * Note: A 2d position on the screen does not represent one single 3d point, but a actually a 3d line.
 * So in order to get this line, use the 3d point returned by this function and the position of the current camera to form this line.
 */
globalThis.ccbGet3DPosFrom2DPos = (x, y) => {
	var engine = CL3D.ScriptingInterface.getScriptingInterface()
		.Engine;
	var ret = engine.get3DPositionFrom2DPosition(x, y);

	if (ret != null)
		return new vector3d(ret.X, ret.Y, ret.Z);

	return null;
}

/**
 * @param {Number} x
 * @param {Number} y 
 * @param {Number} z 
 * @returns {vector3d} the 2D position of a 3D position or nothing if the position would not be on the screen (for example behind the camera).
 */
globalThis.ccbGet2DPosFrom3DPos = (x, y, z) => {
	var engine = CL3D.ScriptingInterface.getScriptingInterface()
		.Engine;
	var ret = engine.get2DPositionFrom3DPosition(new CL3D.Vect3d(x, y, z));
	return new vector3d(ret.X, ret.Y, 0);

}

/**
 * @param {Number} startX 
 * @param {Number} startY 
 * @param {Number} startZ 
 * @param {Number} endX 
 * @param {Number} endY 
 * @param {Number} endZ 
 * @returns {vector3d} the collision point with a line and the world. Returns null if there is no collision.
 */
globalThis.ccbGetCollisionPointOfWorldWithLine = (startX, startY, startZ,
	endX, endY, endZ) => {
	var ray = new CL3D.Line3d();
	ray.Start = new CL3D.Vect3d(startX, startY, startZ);
	ray.End = new CL3D.Vect3d(endX, endY, endZ);
	var scene = CL3D.gScriptingInterface.CurrentlyActiveScene;

	var len = CL3D.AnimatorOnClick.prototype.static_getDistanceToNearestCollisionPointWithWorld(
		scene, ray.Start, ray.End, scene.CollisionWorld, true);

	if (len < 999999999) {
		// shorten our ray because it collides with a world wall

		var vect2 = ray.getVector();
		vect2.setLength(len);
		var pos = ray.Start.add(vect2);
		return new vector3d(pos.X, pos.Y, pos.Z);
	}

	return null;
}

/**
 * @param {CL3D.SceneNode} node 
 * @param {Number} startX 
 * @param {Number} startY 
 * @param {Number} startZ 
 * @param {Number} endX 
 * @param {Number} endY 
 * @param {Number} endZ 
 * @returns {vector3d} if the bounding box of the given scene node collides with the line between two given points.
 */
globalThis.ccbDoesLineCollideWithBoundingBoxOfSceneNode = (node, startX, startY, startZ,
	endX, endY, endZ) => {
	if (node == null)
		return false;

	if (node.AbsoluteTransformation == null)
		return false;

	var lineStart = new CL3D.Vect3d(startX, startY, startZ);
	var lineEnd = new CL3D.Vect3d(endX, endY, endZ);

	return node.getTransformedBoundingBox()
		.intersectsWithLine(lineStart, lineEnd);
}

/**
 * @returns {Sdl.Info}
 */
globalThis.ccbGetSdlInfo = () => {
	return getSdlInfo();
}

/**
 * Closes the window.
 */
globalThis.ccbEndProgram = () => {
	endProgram();
}

/**
 * @ignore
 * Sets the linear velocity of an object simulated by the physics engine.
 * This only works when physics simulation is turned on and available for the current platform.
 * @param {*} nodeid 
 * @param {*} x 
 * @param {*} y 
 * @param {*} z 
 */
globalThis.ccbSetPhysicsVelocity = (nodeid, x, y, z) => {
	// ignore
}

/**
 * @ignore
 * Updates the collision geometry of the physics simulation. Call this when you modified the static geometry of the world and want the physics simulation to respect that.
 * This only works when physics simulation is turned on and available for the current platform.
 * @ignore
 * @param {*} nodeid 
 * @param {*} x 
 * @param {*} y 
 * @param {*} z 
 */
globalThis.ccbUpdatePhysicsGeometry = (nodeid, x, y, z) => {
	// ignore
}

/**
 * Loads a texture into the texture cache.
 * @param {String} filename Name of the texture to load.
 * @returns the texture object if sucessful, which then can be used for example in {@link ccbSetSceneNodeMaterialProperty} calls with the texture parameter.
 * Note that the texture is only loaded once. You can call this multiple times with the same texture file
 * but CopperCube won't try to load it multiple times if it has been loaded once already.
 */
globalThis.ccbLoadTexture = (filename) => {
	var sc = CL3D.ScriptingInterface.getScriptingInterface();
	var tex = sc.TheTextureManager.getTexture(filename, true); // start loading

	if (tex != null)
		return tex.Name;

	return null;
}

/**
 * @returns the current X position of the mouse cursor in pixels.
 */
globalThis.ccbGetMousePosX = () => {
	var engine = CL3D.ScriptingInterface.getScriptingInterface().Engine;
	if (engine)
		return engine.getMouseX();

	return 0;
}

/**
 * @returns the current Y position of the mouse cursor in pixels.
 */
globalThis.ccbGetMousePosY = () => {
	var engine = CL3D.ScriptingInterface.getScriptingInterface().Engine;
	if (engine)
		return engine.getMouseY();

	return 0;
}

/**
 * @returns the current with of the screen in pixels.
 */
globalThis.ccbGetScreenWidth = () => {
	var engine = CL3D.ScriptingInterface.getScriptingInterface().Engine;
	if (engine != null && engine.getRenderer())
		return engine.getRenderer().getWidth();

	return 0;
}

/**
 * @returns the current height of the screen in pixels.
 */
globalThis.ccbGetScreenHeight = () => {
	var engine = CL3D.ScriptingInterface.getScriptingInterface().Engine;
	if (engine != null && engine.getRenderer())
		return engine.getRenderer().getHeight();

	return 0;
}

/**
 * @ignore
 */
globalThis.ccbSetCloseOnEscapePressed = () => {
	// not used
}

/**
 * @ignore
 */
globalThis.ccbSetCursorVisible = () => {
	// not used
}

/**
 * Switch to the scene with the specified name.
 * @example
 * ccbSwitchToScene("my scene") //will switch to a scene named "my scene" if there is one.
 * @param {String} name The name is case sensitive.
 * @returns {Boolean}
 */
globalThis.ccbSwitchToScene = (name) => {
	var engine = CL3D.ScriptingInterface.getScriptingInterface().Engine;
	if (engine != null)
		return engine.gotoSceneByName(name, true);

	return false;
}

/**
 * Will play a sound or music file.
 * @param {String} name 
 */
globalThis.ccbPlaySound = (name) => {
	var sndmgr = CL3D.gSoundManager;
	//var snd = sndmgr.getSoundFromName(name);
	var snd = sndmgr.getSoundFromSoundName(name, true);
	if (snd != null)
		sndmgr.play2D(snd, false, 1.0);
}

/**
 * Will get the duration of a music file.
 * @param {String} name 
 * @returns 
 */
globalThis.ccbGetSoundDuration = (name) => {
	if (name == "")
		return 0;

	var sndmgr = CL3D.gSoundManager;
	var snd = sndmgr.getSoundFromSoundName(name, true);

	if (snd.audioElem.duration)
		return snd.audioElem.duration * 1000;

	return 1000;
}

/**
 * Will stop a sound or music, which has been started either by {@link ccbPlaySound} or the "Play Sound" action.
 * @param {String} name 
 */
globalThis.ccbStopSound = (name) => {
	CL3D.gSoundManager.stopSpecificPlayingSound(name);
}

/**
 * Will get the value of a CopperCube variable.
 * @param {String} varname 
 * @returns 
 */
globalThis.ccbGetCopperCubeVariable = (varname) => {
	var scene = CL3D.gScriptingInterface.CurrentlyActiveScene;

	var var1 = CL3D.CopperCubeVariable.getVariable(varname, true, scene);

	if (var1 == null)
		return null;

	if (var1.isString())
		return var1.getValueAsString();

	if (var1.isInt())
		return var1.getValueAsInt();

	if (var1.isFloat())
		return var1.getValueAsFloat();

	return null;
}

/**
 * Will set a CopperCube variable to a certain value.
 * @param {String} varname 
 * @param {any} value 
 * @returns 
 */
globalThis.ccbSetCopperCubeVariable = (varname, value) => {
	var scene = CL3D.gScriptingInterface.CurrentlyActiveScene;

	var var1 = CL3D.CopperCubeVariable.getVariable(varname, true, scene);
	if (var1 == null)
		return;

	if (typeof value == 'number')
		var1.setValueAsFloat(value);
	else
		var1.setValueAsString(value);

	// also, save if it was a temporary variable
	CL3D.CopperCubeVariable.saveContentOfPotentialTemporaryVariableIntoSource(var1, scene);
}

/**
 * Switches the window to fullscreen, and also enables pointer lock.
 * @param {Boolean} enablePointerLock 
 * @param {Canvas} elementToSwitchToFullscreen 
 */
globalThis.ccbSwitchToFullscreen = (enablePointerLock, elementToSwitchToFullscreen) => {
	var engine = CL3D.ScriptingInterface.getScriptingInterface()
		.Engine;
	if (engine)
		engine.switchToFullscreen(enablePointerLock, elementToSwitchToFullscreen);
}

/**
 * @ignore
 * @param {String} filename 
 * @returns 
 */
globalThis.ccbReadFileContent = (filename) => {
	// not possible for browser
	return null;
}

/**
 * @ignore
 * @param {String} filename 
 * @param {String} content 
 */
globalThis.ccbWriteFileContent = (filename, content) => {
	// not possible for browser
}

/**
 * @returns a string identifying the system the CopperCube app is running on.
 */
globalThis.ccbGetPlatform = () => {
	return "webgl";
}

/**
 * Starts a CopperCube action.
 * @param {Number} actionid The id of the action to be run. Is stored by the coppercube runtime in the property with the type 'action'.
 * @param {CL3D.SceneNode=} node Optional reference to the 'current scene node'. Actions which which are set to use the 'current' scene node will then use this scene node as current one.
 * @returns 
 */
globalThis.ccbInvokeAction = (actionid, node) => {
	var scene = CL3D.gScriptingInterface.CurrentlyActiveScene;
	if (scene == null)
		return;

	if (node == null)
		node = scene.getRootSceneNode();

	if (actionid >= 0 && actionid < CL3D.gScriptingInterface.StoredExtensionScriptActionHandlers.length) {
		var a = CL3D.gScriptingInterface.StoredExtensionScriptActionHandlers[actionid];
		if (a != null)
			a.execute(node);
	}
}

/**
 * @param {Boolean} bForMouse 
 * @param {Boolean} bForKeyboard 
 */
globalThis.ccbRegisterBehaviorEventReceiver = (bForMouse, bForKeyboard) => {
	if (CL3D.gScriptingInterface.CurrentlyRunningExtensionScriptAnimator != null) {
		CL3D.gScriptingInterface.CurrentlyRunningExtensionScriptAnimator.setAcceptsEvents(bForMouse, bForKeyboard);
	}
}

/**
 * makes a GET network request via HTTP to any web server, and {@link ccbCancelHTTPRequest} can cancel this request while it is running.
 * @param {string} url  set it an URL to request, like {@link http://www.example.com} or similar.
 * @param {function} fobj A callback function which will be called with the received data once the request is finished. This will also be called if the request ailed, with an empty string as parameter.
 * @returns {Number} The function returns an unique Id, for identifying this request.
 */
globalThis.ccbDoHTTPRequest = (url, fobj) => {
	++CL3D.gScriptingInterface.LastHTTPRequestId;
	var id = CL3D.gScriptingInterface.LastHTTPRequestId;

	var loader = new CL3D.CCFileLoader(url);

	var itemarray = CL3D.gScriptingInterface.ccbRegisteredHTTPCallbackArray;
	var f = new Object();
	f.loader = loader;
	f.id = id;
	itemarray.push(f);

	var myCallback = function(p) {
		if (fobj)
			fobj(p);

		for (var i = 0; i < itemarray.length; ++i)
			if (itemarray[i].id == id) {
				itemarray.splice(i, 1);
				break;
			}
	}

	loader.load(myCallback);
	return id;
}

/**
 * Cancel the running request, if it takes too long for example.
 * @param {Number} id 
 */
globalThis.ccbCancelHTTPRequest = (id) => {
	var itemarray = CL3D.gScriptingInterface.ccbRegisteredHTTPCallbackArray;

	for (var i = 0; i < itemarray.length; ++i)
		if (itemarray[i].id == id) {
			itemarray[i].loader.abort();
			itemarray.splice(i, 1);
			break;
		}
}

/**
 * creates a new material based on vertex and pixel shaders.
 * @param {String} vertexShader code of the vertex shader, or an empty string "".
 * @param {String} fragmentShader code of the vertex shader, or an empty string "".
 * @param {Number} baseMaterialType usually 0 for the solid material. (2 for lightmap, 12 for additive transparency).
 * @param {function} shaderCallback a function to be called before the material is used. In the function, call {@link ccbSetShaderConstant} to set your shader constants.
 * @returns an unique material id, which you can use to set the material type of any node to your new material using {@link ccbSetSceneNodeMaterialProperty}. It returns -1 if an error happened.
 */
globalThis.ccbCreateMaterial = (vertexShader, fragmentShader, baseMaterialType, shaderCallback) => {
	var scripting = CL3D.ScriptingInterface.getScriptingInterface();
	var engine = scripting.Engine;
	var renderer = engine.getRenderer();
	if (renderer == null)
		return -1;

	var basemat = renderer.MaterialPrograms[baseMaterialType];

	var matid = renderer.createMaterialType(vertexShader, fragmentShader, basemat.blendenabled, basemat.blendsfactor, basemat.blenddfactor);
	if (matid != -1) {
		if (shaderCallback != null)
			scripting.ShaderCallbacks["_" + matid] = shaderCallback;

		if (!scripting.ShaderCallBackSet) {
			scripting.ShaderCallBackSet = true;
			scripting.OriginalShaderCallBack = renderer.OnChangeMaterial;

			renderer.OnChangeMaterial = function(mattype) {
				if (scripting.OriginalShaderCallBack)
					scripting.OriginalShaderCallBack();

				var c = scripting.ShaderCallbacks["_" + mattype];
				if (c != null) {
					scripting.CurrentShaderMaterialType = mattype;
					c();
				}
			}
		}
	}

	return matid;
}

/**
 * may only be called during the material callback
 * @param {String} name name of the variable to set
 * @param {any} value1 
 * @param {any} value2 
 * @param {any} value3 
 * @param {any} value4 
 * @returns 
 */
globalThis.ccbSetShaderConstant = (name, value1, value2, value3, value4) => {
	var scripting = CL3D.ScriptingInterface.getScriptingInterface();
	var engine = scripting.Engine;
	var renderer = engine.getRenderer();
	if (renderer == null)
		return;

	var gl = renderer.getWebGL();

	var program = renderer.getGLProgramFromMaterialType(scripting.CurrentShaderMaterialType);
	var variableLocation = gl.getUniformLocation(program, name);
	gl.uniform4f(variableLocation, value1, value2, value3, value4);
}

/**
 * @returns the current scene node.
 * When running some JavaScript code via an 'execute JavaScript' action, there is always a "current node" set, usually the node in which the action is being run.
 */
globalThis.ccbGetCurrentNode = () => {
	return CL3D.gCurrentJScriptNode;
}

/**
 * 
 * @param {CL3D.SceneNode} node Node where this is applied to. The node has to have a Game Actor with Health behavior attached to it.
 * @param {String} command 
 * @param {any} param 
 * @returns 
 */
globalThis.ccbAICommand = (node, command, param) => {
	if (!node)
		return;

	var gameai = node.getAnimatorOfType('gameai');
	if (!gameai)
		return;

	if (command == 'cancel')
		gameai.aiCommandCancel(node);
	else
	if (command == 'moveto') {
		var v = new CL3D.Vect3d(0, 0, 0);
		if (param != null && typeof param.x != 'undefined') {
			v.X = param.x;
			v.Y = param.y;
			v.Z = param.z;
		}

		gameai.moveToTarget(node, v, node.getAbsolutePosition(), CL3D.CLTimer.getTime());
	} else
	if (command == 'attack') {
		gameai.attackTarget(node, param, param.getAbsolutePosition(), node.getAbsolutePosition(), CL3D.CLTimer.getTime());
	}
}
