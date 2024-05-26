// ============================================================================================================================
// ----------------------------------------------------------------------------------------------------------------------------
// Implementation of all the scripting functions
// ----------------------------------------------------------------------------------------------------------------------------
// ============================================================================================================================

import * as CL3D from "../main.js";

/**
 * @ignore
 */
export function ccbGetSceneNodeFromId(id)
{
	var scene = CL3D.gScriptingInterface.CurrentlyActiveScene;
	if (scene == null)
		return null;

	return scene.getSceneNodeFromId(id);
}

/**
 * @ignore
 */
export function ccbCloneSceneNode(node)
{
	var scene = CL3D.gScriptingInterface.CurrentlyActiveScene;
	if (node == null)
		return null;

	var oldId = node.Id;
	var newId = scene.getUnusedSceneNodeId();

	var cloned = node.createClone(node.Parent, oldId, newId);

	if (cloned != null)
	{
		cloned.Id = newId;
		scene.replaceAllReferencedNodes(node, cloned);
	}

	// also clone collision detection of the node in the world

	var selector = node.Selector;
	if (selector && scene)
	{
		var newSelector = selector.createClone(cloned);
		if (newSelector)
		{
			// set to node

			cloned.Selector = newSelector;

			// also, copy into world

			if (scene.getCollisionGeometry())
				scene.getCollisionGeometry().addSelector(newSelector);
		}
	}

	return cloned;
}

/**
 * @ignore
 */
export function ccbGetActiveCamera()
{
	var scene = CL3D.gScriptingInterface.CurrentlyActiveScene;
	if (scene == null)
		return null;

	return scene.getActiveCamera();
}

/**
 * @ignore
 */
export function ccbSetActiveCamera(node)
{
	var scene = CL3D.gScriptingInterface.CurrentlyActiveScene;
	if (scene == null)
		return;

	if (node != null && node.getType() == 'camera')
		scene.setActiveCamera(node);
}

/**
 * @ignore
 */
export function ccbGetChildSceneNode(node, childidx)
{
	if (node == null)
		return -1;

	if (childidx < 0 || childidx >= node.Children.length)
		return null;

	return node.Children[childidx];
}

/**
 * @ignore
 */
export function ccbGetRootSceneNode()
{
	var scene = CL3D.gScriptingInterface.CurrentlyActiveScene;
	if (scene == null)
		return null;

	return scene.getRootSceneNode();
}

/**
 * @ignore
 */
export function ccbGetSceneNodeChildCount(node)
{
	if (node == null)
		return 0;

	return node.Children.length;
}

/**
 * @ignore
 */
export function ccbGetSceneNodeFromName(n)
{
	var scene = CL3D.gScriptingInterface.CurrentlyActiveScene;
	if (scene == null)
		return null;

	return scene.getSceneNodeFromName(n);
}

/**
 * @ignore
 */
export function ccbRemoveSceneNode(node)
{
	var scene = CL3D.gScriptingInterface.CurrentlyActiveScene;
	if (scene == null)
		return;

	scene.addToDeletionQueue(node, 0);
}

/**
 * @ignore
 */
export function ccbSetSceneNodeParent(node, parent)
{
	if (node && parent)
		parent.addChild(node);
}

/**
 * @ignore
 */
export function ccbGetSceneNodeMaterialCount(node)
{
	if (node == null)
		return 0;

	return node.getMaterialCount();
}

/**
 * @ignore
 */
export function ccbGetSceneNodeMaterialProperty(node, matidx, propName)
{
	if (node == null)
		return null;

	if (matidx < 0 || matidx >= node.getMaterialCount())
		return null;

	var mat = node.getMaterial(matidx);
	if (mat == null)
		return null;

	if (propName == "Type")
	{
		switch(mat.Type)
		{
		case 0: return 'solid';
		case 2: return 'lightmap';
		case 3: return 'lightmap_add';
		case 4: return 'lightmap_m2';
		case 5: return 'lightmap_m4';
		case 11: return 'reflection_2layer';
		case 12: return 'trans_add';
		case 13: return 'trans_alphach';
		case 16: return 'trans_reflection_2layer';
		}
	}
	else
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
 */
export function ccbCleanMemory()
{
	// not implemented for WebGL
}

/**
 * @ignore
 */
export function ccbSetSceneNodeMaterialProperty(node, matidx, propName, arg0, arg2, arg3)
{
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

	if (propName == "Type")
	{
		if (paramAsString)
		{
			switch(paramAsString)
			{
			case 'solid':
				mat.Type = 0; break;
			case 'lightmap':
			case 'lightmap_add':
			case 'lightmap_m2':
			case 'lightmap_m4':
				mat.Type = 2; break;
			case 'reflection_2layer':
				mat.Type = 11; break;
			case 'trans_add':
				mat.Type = 12; break;
			case 'trans_alphach':
				mat.Type = 13; break;
			case 'trans_reflection_2layer':
				mat.Type = 16; break;
			}
		}
		else
		{
			// together with ccbCreateMaterial, users are setting an interger parameter sometimes
			var i = parseInt(arg0);
			if (i != NaN)
				mat.Type = i;
		}
	}
	else
	if (propName == "Texture1")
	{
		if (paramAsString != null && sc.TheTextureManager != null)
		{
			tex = sc.TheTextureManager.getTextureFromName(paramAsString);
			if (tex != null)
				mat.Tex1 = tex;
		}
	}
	else
	if (propName == "Texture2")
	{
		if (paramAsString != null && sc.TheTextureManager != null)
		{
			tex = sc.TheTextureManager.getTextureFromName(paramAsString);
			if (tex != null)
				mat.Tex2 = tex;
		}
	}
	else
	if (propName == "Lighting")
		mat.Lighting = firstParam;
	else
	if (propName == "Backfaceculling")
		mat.Backfaceculling = firstParam;
}

/**
 * @ignore
 */
export function ccbSetSceneNodeProperty( node, propName, arg0, arg1, arg2 )
{
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

	if (arg1 == null && firstParam != null && typeof firstParam.x != 'undefined')
	{
		x = firstParam.x;
		y = firstParam.y;
		z = firstParam.z;
	}

	if (arg1 != null && arg2 != null)
	{
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
	if (propName == "Position")
	{
		node.Pos.X = x;
		node.Pos.Y = y;
		node.Pos.Z = z;
	}
	else
	if (propName == "Rotation")
	{
		node.Rot.X = x;
		node.Rot.Y = y;
		node.Rot.Z = z;
	}
	else
	if (propName == "Scale")
	{
		node.Scale.X = x;
		node.Scale.Y = y;
		node.Scale.Z = z;
	}
	else
	if (propName == "Target")
	{
		if (cam != null)
			cam.setTarget(new CL3D.Vect3d(x,y,z));
	}
	else
	if (propName == "UpVector")
	{
		if (cam != null)
			cam.UpVector = new CL3D.Vect3d(x,y,z);
	}
	else
	if (propName == "FieldOfView_Degrees")
	{
		if (cam != null)
			cam.setFov(CL3D.degToRad(firstParam));
	}
	else
	if (propName == "AspectRatio")
	{
		if (cam != null)
			cam.setAspectRatio(firstParam);
	}
	else
	if (propName == "Animation")
	{
		if (animnode != null)
			animnode.setAnimationByEditorName(firstParam, animnode.Looping);
	}
	else
	if (propName == "Looping")
	{
		if (animnode != null)
			animnode.setLoopMode(firstParam);
	}
	else
	if (propName == "FramesPerSecond")
	{
		if (animnode != null)
			animnode.setAnimationSpeed(firstParam * 0.001);
	}
	else
	if (propName == "AnimationBlending")
	{
		if (animnode != null)
			animnode.AnimationBlendingEnabled = firstParam;
	}
	else
	if (propName == "BlendTimeMs")
	{
		if (animnode != null)
			animnode.BlendTimeMs = firstParam;
	}
	else
	if (propName == "Radius")
	{
		if (lightnode != null)
			lightnode.LightData.Radius = firstParam;
	}
	else
	if (propName == "Color")
	{
		if (lightnode != null)
			lightnode.LightData.Color = CL3D.createColorF(argsAsColor);
	}
	else
	if (propName == "Direction")
	{
		if (lightnode != null)
		{
			lightnode.LightData.Direction = new CL3D.Vect3d(x,y,z);
			lightnode.LightData.Direction.normalize();
		}
	}
	else
	if (propName == "FogColor")
	{
		CL3D.gScriptingInterface.CurrentlyActiveScene.FogColor = argsAsColor;
	}
	else
	if (propName == "Realtime Shadows" && node === ccbGetRootSceneNode())
	{
		CL3D.gScriptingInterface.CurrentlyActiveScene.ShadowMappingEnabled = arg0 == true;
	}
	else
	if (propName == "BackgroundColor" && node === ccbGetRootSceneNode())
	{
		CL3D.gScriptingInterface.CurrentlyActiveScene.BackgroundColor = argsAsColor;
	}
	else
	if (propName == "AmbientLight")
	{
		CL3D.gScriptingInterface.CurrentlyActiveScene.AmbientLight =  CL3D.createColorF(argsAsColor);
	}
	else
	if (propName == "Bloom")
	{
		CL3D.gScriptingInterface.CurrentlyActiveScene.PostEffectData[CL3D.Scene.EPOSTEFFECT_BLOOM].Active = arg0 == true;
	}
	else
	if (propName == "Black and White")
	{
		CL3D.gScriptingInterface.CurrentlyActiveScene.PostEffectData[CL3D.Scene.EPOSTEFFECT_BLACK_AND_WHITE].Active = arg0 == true;
	}
	else
	if (propName == "Invert")
	{
		CL3D.gScriptingInterface.CurrentlyActiveScene.PostEffectData[CL3D.Scene.EPOSTEFFECT_INVERT].Active = arg0 == true;
	}
	else
	if (propName == "Blur")
	{
		CL3D.gScriptingInterface.CurrentlyActiveScene.PostEffectData[CL3D.Scene.EPOSTEFFECT_BLUR].Active = arg0 == true;
	}
	else
	if (propName == "Colorize")
	{
		CL3D.gScriptingInterface.CurrentlyActiveScene.PostEffectData[CL3D.Scene.EPOSTEFFECT_COLORIZE].Active = arg0 == true;
	}
	else
	if (propName == "Vignette")
	{
		CL3D.gScriptingInterface.CurrentlyActiveScene.PostEffectData[CL3D.Scene.EPOSTEFFECT_VIGNETTE].Active = arg0 == true;
	}
	else
	if (propName == "Bloom_BlurIterations")
	{
		CL3D.gScriptingInterface.CurrentlyActiveScene.PE_bloomBlurIterations = firstParam >> 0;
	}
	else
	if (propName == "Bloom_Treshold")
	{
		CL3D.gScriptingInterface.CurrentlyActiveScene.PE_bloomTreshold = firstParam;
	}
	else
	if (propName == "Blur_Iterations")
	{
		CL3D.gScriptingInterface.CurrentlyActiveScene.PE_blurIterations = firstParam >> 0;
	}
	else
	if (propName == "Colorize_Color")
	{
		CL3D.gScriptingInterface.CurrentlyActiveScene.PE_colorizeColor = firstParam;
	}
	else
	if (propName == "Vignette_Intensity")
	{
		CL3D.gScriptingInterface.CurrentlyActiveScene.PE_vignetteIntensity = firstParam >> 0;
	}
	else
	if (propName == "Vignette_RadiusA")
	{
		CL3D.gScriptingInterface.CurrentlyActiveScene.PE_vignetteRadiusA = firstParam >> 0;
	}
	else
	if (propName == "Vignette_RadiusB")
	{
		CL3D.gScriptingInterface.CurrentlyActiveScene.PE_vignetteRadiusB = firstParam >> 0;
	}
	else
	if (propName == "Name")
	{
		node.Name = firstParam;
	}
	else
	if (overlaynode != null)
	{
		CL3D.ScriptingInterface.getScriptingInterface().setSceneNodePropertyFromOverlay(overlaynode, propName, arg0, argsAsColor);
	}
}

/**
 * @ignore
 */
export function ccbGetSceneNodeProperty( node, propName )
{
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
	if (propName == "PositionAbs")
	{
		var abspos = node.getAbsolutePosition();
		return new vector3d(abspos.X, abspos.Y, abspos.Z);
	}
	else
	if (propName == "Rotation")
		return new vector3d(node.Rot.X, node.Rot.Y, node.Rot.Z);
	else
	if (propName == "Scale")
		return new vector3d(node.Scale.X, node.Scale.Y, node.Scale.Z);
	else
	if (propName == "Target")
	{
		if (cam != null)
			return new vector3d(cam.Target.X, cam.Target.Y, cam.Target.Z);
	}
	else
	if (propName == "UpVector")
	{
		if (cam != null)
			return new vector3d(cam.UpVector.X, cam.UpVector.Y, cam.UpVector.Z);
	}
	else
	if (propName == "FieldOfView_Degrees")
	{
		if (cam != null)
			return CL3D.radToDeg(cam.Fovy);
	}
	else
	if (propName == "AspectRatio")
	{
		if (cam != null)
			return cam.Aspect;
	}
	else
	if (propName == "Animation")
		return ""; // not implemented yet
	else
	if (propName == "Looping")
	{
		if (animnode != null)
			return animnode.Looping;
	}
	else
	if (propName == "FramesPerSecond")
	{
		if (animnode != null)
			return animnode.FramesPerSecond * 1000.0;
	}
	else
	if (propName == "AnimationBlending")
	{
		if (animnode != null)
			return animnode.AnimationBlendingEnabled;
	}
	else
	if (propName == "BlendTimeMs")
	{
		if (animnode != null)
			return animnode.BlendTimeMs;
	}
	else
	if (propName == "Radius")
	{
		if (lightnode != null)
			return lightnode.LightData.Radius;
	}
	else
	if (propName == "Color")
	{
		if (lightnode != null)
			return CL3D.createColor(255, lightnode.LightData.Color.R * 255, lightnode.LightData.Color.G * 255, lightnode.LightData.Color.B * 255);
	}
	else
	if (propName == "Direction")
	{
		if (lightnode != null)
			return lightnode.LightData.Direction;
	}
	else
	if (propName == "Name")
	{
		return node.Name;
	}
	else
	if (propName == "Type")
	{
		return node.getType();
	}
	else
	if (propName == "FogColor")
	{
		return CL3D.gScriptingInterface.CurrentlyActiveScene.FogColor;
	}
	else
	if (propName == "Realtime Shadows" && node === ccbGetRootSceneNode())
	{
		return CL3D.gScriptingInterface.CurrentlyActiveScene.ShadowMappingEnabled;
	}
	else
	if (propName == "BackgroundColor" && node === ccbGetRootSceneNode())
	{
		return CL3D.gScriptingInterface.CurrentlyActiveScene.BackgroundColor;
	}
	else
	if (overlaynode != null)
		return CL3D.ScriptingInterface.getScriptingInterface().getSceneNodePropertyFromOverlay(overlaynode, propName);

	return null;
}

/**
 * @ignore
 */
export function ccbSetSceneNodePositionWithoutCollision(node, x, y, z)
{
	if (node == null)
		return;

	node.Pos.X = x;
	node.Pos.Y = y;
	node.Pos.Z = z;

	for (var ai=0; ai<node.Animators.length; ++ai)
	{
		var a = node.Animators[ai];
		if (a != null && a.getType() == 'collisionresponse')
			a.reset();
	}
}

/**
 * @ignore
 */
export function ccbRegisterOnFrameEvent(fobj)
{
	var engine = CL3D.ScriptingInterface.getScriptingInterface();
	engine.ccbRegisteredFunctionArray.push(fobj);
}

/**
 * @ignore
 */
export function ccbUnregisterOnFrameEvent(fobj)
{
	var engine = CL3D.ScriptingInterface.getScriptingInterface();
	var pos = engine.ccbRegisteredFunctionArray.indexOf(fobj);

	if (pos == -1)
		return;

	engine.ccbRegisteredFunctionArray.splice(pos, 1);
}

/**
 * @ignore
 */
export function ccbDrawColoredRectangle(c, x, y, x2, y2)
{
	var engine = CL3D.ScriptingInterface.getScriptingInterface();
	if (!engine.IsInDrawCallback || engine.TheRenderer == null)
		return;

	engine.TheRenderer.draw2DRectangle(x, y, x2-x, y2-y, c, true);
}

/**
 * @ignore
 */
export function ccbDrawTextureRectangle(f, x, y, x2, y2)
{
	var engine = CL3D.ScriptingInterface.getScriptingInterface();
	if (!engine.IsInDrawCallback || engine.TheRenderer == null)
		return;

	// TODO: implement
	engine.TheRenderer.draw2DRectangle(x, y, x2-x, y2-y, 0xff000000, true);
}

/**
 * @ignore
 */
export function ccbDrawTextureRectangleWithAlpha(f, x, y, x2, y2)
{
	var engine = CL3D.ScriptingInterface.getScriptingInterface();
	if (!engine.IsInDrawCallback || engine.TheRenderer == null)
		return;

	// TODO: implement
	engine.TheRenderer.draw2DRectangle(x, y, x2-x, y2-y, 0xff000000, true);
}

/**
 * @ignore
 */
export function ccbGet3DPosFrom2DPos(x, y)
{
	var engine = CL3D.ScriptingInterface.getScriptingInterface().Engine;
	var ret = engine.get3DPositionFrom2DPosition(x,y);

	if (ret != null )
		return new vector3d(ret.X, ret.Y, ret.Z);

	return null;
}

/**
 * @ignore
 */
export function ccbGet2DPosFrom3DPos(x, y, z)
{
	var engine = CL3D.ScriptingInterface.getScriptingInterface().Engine;
	var ret = engine.get2DPositionFrom3DPosition(new CL3D.Vect3d(x,y,z));
	return new vector3d(ret.X, ret.Y, 0);

}

/**
 * @ignore
 */
export function ccbGetCollisionPointOfWorldWithLine(startX, startY, startZ,
										  endX, endY, endZ)
{
	var ray = new CL3D.Line3d();
	ray.Start = new CL3D.Vect3d(startX,startY,startZ);
	ray.End = new CL3D.Vect3d(endX,endY,endZ);
	var scene = CL3D.gScriptingInterface.CurrentlyActiveScene;

	var len = CL3D.AnimatorOnClick.prototype.static_getDistanceToNearestCollisionPointWithWorld(
		scene, ray.Start, ray.End, scene.CollisionWorld, true);

	if (len < 999999999)
	{
		// shorten our ray because it collides with a world wall

		var vect2 = ray.getVector();
		vect2.setLength(len);
		var pos = ray.Start.add(vect2);
		return new vector3d(pos.X, pos.Y, pos.Z);
	}

	return null;
}

/**
 * @ignore
 */
export function ccbDoesLineCollideWithBoundingBoxOfSceneNode(node, startX, startY, startZ,
												   endX, endY, endZ)
{
	if (node == null)
		return false;

	if (node.AbsoluteTransformation == null)
		return false;

	var lineStart = new CL3D.Vect3d(startX, startY, startZ);
	var lineEnd = new CL3D.Vect3d(endX, endY, endZ);

	return node.getTransformedBoundingBox().intersectsWithLine(lineStart, lineEnd);
}

/**
 * @ignore
 */
export function ccbEndProgram()
{
	window.close();
}

/**
 * @ignore
 */
export function ccbSetPhysicsVelocity(nodeid, x, y, z)
{
	// ignore
}


/**
 * @ignore
 */
export function ccbUpdatePhysicsGeometry(nodeid, x, y, z)
{
	// ignore
}


/**
 * @ignore
 */
export function ccbLoadTexture(texstring)
{
	var sc = CL3D.ScriptingInterface.getScriptingInterface();
	var tex = sc.TheTextureManager.getTexture(texstring, true); // start loading

	if (tex != null)
		return tex.Name;

	return null;
}

/**
 * @ignore
 */
export function ccbGetMousePosX()
{
	var engine = CL3D.ScriptingInterface.getScriptingInterface().Engine;
	if (engine)
		return engine.getMouseX();

	return 0;
}

/**
 * @ignore
 */
export function ccbGetMousePosY()
{
	var engine = CL3D.ScriptingInterface.getScriptingInterface().Engine;
	if (engine)
		return engine.getMouseY();

	return 0;
}

/**
 * @ignore
 */
export function ccbGetScreenWidth()
{
	var engine = CL3D.ScriptingInterface.getScriptingInterface().Engine;
	if (engine != null && engine.getRenderer())
		return engine.getRenderer().getWidth();

	return 0;
}

/**
 * @ignore
 */
export function ccbGetScreenHeight()
{
	var engine = CL3D.ScriptingInterface.getScriptingInterface().Engine;
	if (engine != null && engine.getRenderer())
		return engine.getRenderer().getHeight();

	return 0;
}

/**
 * @ignore
 */
export function ccbSetCloseOnEscapePressed()
{
	// not used
}

/**
 * @ignore
 */
export function ccbSetCursorVisible()
{
	// not used
}

/**
 * @ignore
 */
export function ccbSwitchToScene(name)
{
	var engine = CL3D.ScriptingInterface.getScriptingInterface().Engine;
	if (engine != null)
		return engine.gotoSceneByName(name, true);

	return false;
}

/**
 * @ignore
 */
export function ccbPlaySound(name)
{
	var sndmgr = CL3D.gSoundManager;
	//var snd = sndmgr.getSoundFromName(name);
	var snd = sndmgr.getSoundFromSoundName(name, true);
	if (snd != null)
		sndmgr.play2D(snd, false, 1.0);
}

/**
 * @ignore
 */
export function ccbGetSoundDuration(name)
{
	if (name == "")
		return 0;

	var sndmgr = CL3D.gSoundManager;
	var snd = sndmgr.getSoundFromSoundName(name, true);

	if (snd.audioElem.duration)
		return snd.audioElem.duration * 1000;

	return 1000;
}

/**
 * @ignore
 */
export function ccbStopSound(name)
{
	CL3D.gSoundManager.stopSpecificPlayingSound(name);
}

/**
 * @ignore
 */
export function ccbGetCopperCubeVariable(varname)
{
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
 * @ignore
 */
export function ccbSetCopperCubeVariable(varname, value)
{
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
 * @ignore
 */
export function ccbSwitchToFullscreen(enablePointerLock, elementToSwitchToFullscreen)
{
	var engine = CL3D.ScriptingInterface.getScriptingInterface().Engine;
	if (engine)
		engine.switchToFullscreen(enablePointerLock, elementToSwitchToFullscreen);
}

/**
 * @ignore
 */
export function ccbReadFileContent(filename)
{
	// not possible
	return null;
}

/**
 * @ignore
 */
export function ccbWriteFileContent(filename, content)
{
	// not possible
}

/**
 * @ignore
 */
export function ccbGetPlatform()
{
	return "webgl";
}

/**
 * @ignore
 */
export function ccbInvokeAction(actionid, node)
{
	var scene = CL3D.gScriptingInterface.CurrentlyActiveScene;
	if (scene == null)
		return;

	if (node == null)
		node = scene.getRootSceneNode();

	if (actionid >= 0 && actionid < CL3D.gScriptingInterface.StoredExtensionScriptActionHandlers.length)
	{
		var a = CL3D.gScriptingInterface.StoredExtensionScriptActionHandlers[actionid];
		if (a != null)
			a.execute(node);
	}
}

/**
 * @ignore
 */
export function ccbCallAction(actionid, value, node)
{
	var scene = CL3D.gScriptingInterface.CurrentlyActiveScene;
	if (scene == null)
		return;

	if (node == null)
		node = scene.getRootSceneNode();

	if (actionid >= 0 && actionid < CL3D.gScriptingInterface.StoredExtensionScriptActionHandlers.length)
	{
		var node = scene.getRootSceneNode();
		var a = CL3D.gScriptingInterface.StoredExtensionScriptActionHandlers[actionid];

		if (a == null)
			return;

		var _a = a.findAction("ExtensionScript");
		for (var i = 0; i < _a.Properties.length; ++i)
		{
			if (_a.Properties[i].Name == "Event")
			{
				_a.Properties[i].StringValue = value;
			}
		}
		a.execute(node);
	}
}

/**
 * @ignore
 */
function print(s)
{
	CL3D.gCCDebugOutput.jsConsolePrint(s);
}

/**
 * @ignore
 */
function system(s)
{
	// not used
}

/**
 * @ignore
 */
export function ccbRegisterBehaviorEventReceiver(bForMouse, bForKeyboard)
{
	if (CL3D.gScriptingInterface.CurrentlyRunningExtensionScriptAnimator != null)
	{
		CL3D.gScriptingInterface.CurrentlyRunningExtensionScriptAnimator.setAcceptsEvents(bForMouse, bForKeyboard);
	}
}

/**
 * @ignore
 */
export function ccbDoHTTPRequest(url, fobj)
{
	++CL3D.gScriptingInterface.LastHTTPRequestId;
	var id = CL3D.gScriptingInterface.LastHTTPRequestId;

	var loader = new CL3D.CCFileLoader(url);

	var itemarray = CL3D.gScriptingInterface.ccbRegisteredHTTPCallbackArray;
	var f = new Object();
	f.loader = loader;
	f.id = id;
	itemarray.push(f);

	var myCallback = function(p)
	{
		if (fobj)
			fobj(p);

		for (var i=0; i<itemarray.length; ++i)
			if (itemarray[i].id == id)
			{
				itemarray.splice(i, 1);
				break;
			}
	}

	loader.load(myCallback);
	return id;
}

/**
 * @ignore
 */
export function ccbCancelHTTPRequest(id)
{
	var itemarray = CL3D.gScriptingInterface.ccbRegisteredHTTPCallbackArray;

	for (var i=0; i<itemarray.length; ++i)
		if (itemarray[i].id == id)
		{
			itemarray[i].loader.abort();
			itemarray.splice(i, 1);
			break;
		}
}

/**
 * @ignore
 */
export function ccbCreateMaterial(vertexShader, fragmentShader, baseMaterialType, shaderCallback)
{
	var scripting = CL3D.ScriptingInterface.getScriptingInterface();
	var engine = scripting.Engine;
	var renderer = engine.getRenderer();
	if (renderer == null)
		return -1;

	var basemat = renderer.MaterialPrograms[baseMaterialType];

	var matid = renderer.createMaterialType(vertexShader, fragmentShader, basemat.blendenabled, basemat.blendsfactor, basemat.blenddfactor);
	if (matid != -1)
	{
		if (shaderCallback != null)
			scripting.ShaderCallbacks["_" + matid] = shaderCallback;

		if (!scripting.ShaderCallBackSet)
		{
			scripting.ShaderCallBackSet = true;
			scripting.OriginalShaderCallBack = renderer.OnChangeMaterial;

			renderer.OnChangeMaterial = function(mattype)
			{
				if (scripting.OriginalShaderCallBack)
					scripting.OriginalShaderCallBack();

				var c = scripting.ShaderCallbacks["_" + mattype];
				if (c != null)
				{
					scripting.CurrentShaderMaterialType = mattype;
					c();
				}
			}
		}
	}

	return matid;
}

/**
 * @ignore
 */
export function ccbSetShaderConstant(name, value1, value2, value3, value4)
{
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


CL3D.gCurrentJScriptNode = null;

/**
 * @ignore
 */
export function ccbGetCurrentNode()
{
	return CL3D.gCurrentJScriptNode;
}

/**
 * @ignore
 */
export function ccbAICommand(node, command, param)
{
	if (!node)
		return;

	var gameai = node.getAnimatorOfType('gameai');
	if (!gameai)
		return;

	if (command == 'cancel')
		gameai.aiCommandCancel(node);
	else
	if (command == 'moveto')
	{
		var v = new CL3D.Vect3d(0,0,0);
		if (param != null && typeof param.x != 'undefined')
		{
			v.X = param.x;
			v.Y = param.y;
			v.Z = param.z;
		}

		gameai.moveToTarget(node, v, node.getAbsolutePosition(), CL3D.CLTimer.getTime());
	}
	else
	if (command == 'attack')
	{
		gameai.attackTarget(node, param, param.getAbsolutePosition(), node.getAbsolutePosition(), CL3D.CLTimer.getTime());
	}
}
