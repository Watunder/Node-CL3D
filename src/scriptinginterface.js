//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

// ------------------------------------------------------------------------------------------------
// ScriptingInterface
// public API implementation for CopperCube script extensions and generic JavaScript API
// ------------------------------------------------------------------------------------------------


// ------------------------------------------------------------------------------------------------
// simple vector class
// ------------------------------------------------------------------------------------------------

import * as CL3D from "./main.js";

/**
 * @type {CL3D.ScriptingInterface}
 */
let gScriptingInterface = null;

/**
 * @private
 */
class vector3d {
	/**
	 * X coordinate of the vector
	 * @private
	 * @type Number
	 */
	x = 0;

	/**
	 * Y coordinate of the vector
	 * @private
	 * @type Number
	 */
	y = 0;

	/**
	 * Z coordinate of the vector
	 * @private
	 * @type Number
	 */
	z = 0;

	constructor(_x, _y, _z) {
		if (!(_x === null)) {
			this.x = _x;
			this.y = _y;
			this.z = _z;
		}

		else {
			this.x = 0;
			this.y = 0;
			this.z = 0;
		}
	}

	/**
	 * @private
	 */
	add(other) {
		return new vector3d(this.x + other.x, this.y + other.y, this.z + other.z);
	}

	/**
	 * @private
	 */
	substract(other) {
		return new vector3d(this.x - other.x, this.y - other.y, this.z - other.z);
	}

	/**
	 * @private
	 */
	getLength() {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
	}

	/**
	 * @private
	 */
	normalize() {
		var l = this.getLength();
		if (l != 0) {
			l = 1 / l;
			this.x *= l;
			this.y *= l;
			this.z *= l;
		}
	}

	/**
	 * @private
	 */
	toString() {
		return "(" + this.x + ", " + this.y + ", " + this.z + ")";
	}
};

// ------------------------------------------------------------------------------------------------
// ScriptingInterface class
// ------------------------------------------------------------------------------------------------

/**
 * @private
 * @constructor
 * @class
 */
export class ScriptingInterface {
	constructor() {
		this.nUniqueCounterID = -1;
		this.StoredExtensionScriptActionHandlers = new Array();
		this.IsInDrawCallback = false;
		this.CurrentlyActiveScene = null;
		this.CurrentlyRunningExtensionScriptAnimator = null;
		this.TheTextureManager = null;
		this.TheRenderer = null;
		this.Engine = null;
		this.ccbRegisteredFunctionArray = new Array();
		this.ccbRegisteredHTTPCallbackArray = new Array();
		this.LastHTTPRequestId = 0;

		// shader callback stuff
		this.ShaderCallBackSet = false;
		this.OriginalShaderCallBack = null;
		this.ShaderCallbacks = new Object();
		this.CurrentShaderMaterialType = 0;

		//this.registerScriptingFunctions();
	}
	/**
	 * @private
	 */
	static getScriptingInterface() {
		if (gScriptingInterface == null)
			gScriptingInterface = new CL3D.ScriptingInterface();

		return gScriptingInterface;
	}
	/**
	 * @private
	 */
	static getScriptingInterfaceReadOnly() {
		return gScriptingInterface;
	}
	/**
	 * @private
	 */
	setTextureManager(t) {
		this.TheTextureManager = t;
	}
	/**
	 * @private
	 */
	setEngine(t) {
		this.Engine = t;
	}
	/**
	 * @private
	 */
	needsRedraw() {
		return this.ccbRegisteredFunctionArray.length != 0;
	}
	/**
	 * @private
	 */
	setCurrentlyRunningExtensionScriptAnimator(s) {
		this.CurrentlyRunningExtensionScriptAnimator = s;
	}
	/**
	 * @private
	 */
	setActiveScene(s) {
		this.CurrentlyActiveScene = s;
	}
	/**
	 * @private
	 */
	executeCode(code) {
		try {
			return eval(code);
		}
		catch (err) {
			console.log(err);
		}
	}
	/**
	 * @private
	 */
	importCode(code) {
		try {
			return import("data:text/javascript;charset=utf-8," + encodeURIComponent(code));
		}
		catch (err) {
			console.log(err);
		}
	}
	/**
	 * @private
	 */
	getUniqueCounterID() {
		++this.nUniqueCounterID;
		return this.nUniqueCounterID;
	}
	/**
	 * @private
	 */
	registerExtensionScriptActionHandler(handler) {
		for (var i = 0; i < this.StoredExtensionScriptActionHandlers.length; ++i) {
			var a = this.StoredExtensionScriptActionHandlers[i];
			if (a === handler)
				return i;
		}

		this.StoredExtensionScriptActionHandlers.push(handler);

		var actionid = this.StoredExtensionScriptActionHandlers.length - 1;
		if (this.StoredExtensionScriptActionHandlers[actionid]) {
			var node = gScriptingInterface.CurrentlyActiveScene.getRootSceneNode();

			this.StoredExtensionScriptActionHandlers[actionid].execute(node, null, true);
		}

		return actionid;
	}
	/**
	 * @private
	 */
	runDrawCallbacks(theRenderer, timeMs) {
		this.IsInDrawCallback = true;

		if (this.ccbRegisteredFunctionArray.length != null) {
			this.TheRenderer = theRenderer;

			for (var i = 0; i < this.ccbRegisteredFunctionArray.length; ++i)
				this.ccbRegisteredFunctionArray[i](timeMs);

			this.TheRenderer = null;
		}

		this.IsInDrawCallback = false;
	}
	/**
	 * @private
	 */
	setSceneNodePropertyFromOverlay(overlaynode, propName, arg0, argsAsColor) {
		switch (propName) {
			case 'Position Mode': //    <- relative (percent) | absolute (pixels)
				overlaynode.SizeModeIsAbsolute = (arg0 == 'absolute (pixels)');
				break;
			case 'Pos X (percent)':
				overlaynode.PosRelativeX = arg0 / 100.0; break;
			case 'Pos Y (percent)':
				overlaynode.PosRelativeY = arg0 / 100.0; break;
			case 'Width (percent)':
				overlaynode.SizeRelativeWidth = arg0 / 100.0; break;
			case 'Height (percent)':
				overlaynode.SizeRelativeHeight = arg0 / 100.0; break;
			case 'Pos X (pixels)':
				overlaynode.PosAbsoluteX = arg0; break;
			case 'Pos Y (pixels)':
				overlaynode.PosAbsoluteY = arg0; break;
			case 'Width (pixels)':
				overlaynode.SizeAbsoluteWidth = arg0; break;
			case 'Height (pixels)':
				overlaynode.SizeAbsoluteHeight = arg0; break;
			case 'Alpha':
				overlaynode.BackGroundColor = ((arg0 & 0xff) << 24) | (overlaynode.BackGroundColor & 0x00ffffff);
				break;
			case 'Image':
				{
					var tex = this.TheTextureManager.getTextureFromName(arg0);
					overlaynode.Texture = tex;
				}
				break;
			case 'Background Color':
				overlaynode.BackGroundColor = argsAsColor;
				break;
			case 'Draw Text': // (true/false)
				overlaynode.DrawText = arg0 ? true : false;
				break;
			case 'TextColor':
				overlaynode.TextColor = argsAsColor;
				break;
			case 'Text':
				overlaynode.Text = arg0;
				break;
		}
	}
	/**
	 * @private
	 */
	getSceneNodePropertyFromOverlay(overlaynode, propName) {
		switch (propName) {
			case 'Position Mode': //    <- relative (percent) | absolute (pixels)
				return overlaynode.SizeModeIsAbsolute;
			case 'Pos X (percent)':
				return overlaynode.PosRelativeX * 100.0;
			case 'Pos Y (percent)':
				return overlaynode.PosRelativeY * 100.0;
			case 'Width (percent)':
				return overlaynode.SizeRelativeWidth * 100.0;
			case 'Height (percent)':
				return overlaynode.SizeRelativeHeight * 100.0;
			case 'Pos X (pixels)':
				return overlaynode.PosAbsoluteX;
			case 'Pos Y (pixels)':
				return overlaynode.PosAbsoluteY;
			case 'Width (pixels)':
				return overlaynode.SizeAbsoluteWidth;
			case 'Height (pixels)':
				return overlaynode.SizeAbsoluteHeight;
			case 'Alpha':
				return CL3D.getAlpha(overlaynode.BackGroundColor);
			case 'Image':
				return overlaynode.Texture ? overlaynode.Texture.Name : null;
			case 'Background Color':
				return overlaynode.BackGroundColor;
			case 'Draw Text': // (true/false)
				return overlaynode.DrawText;
			case 'TextColor':
				return overlaynode.TextColor;
			case 'Text':
				return overlaynode.Text;
			case 'Texture Width (percent)':
				return overlaynode.TextureWidth * 100.0;
			case 'Texture Height (percent)':
				return overlaynode.TextureHeight * 100.0;
		}

		return null;
	}
}

// --------------------------------------------------------------
// AnimatorExtensionScript
// --------------------------------------------------------------

/**
 * @private
 */
export class AnimatorExtensionScript extends CL3D.Animator {
	constructor(scenemanager) {
		this.JsClassName = null;
		this.Properties = new Array();
		this.bAcceptsMouseEvents = false;
		this.bAcceptsKeyboardEvents = false;
		this.ScriptIndex = -1;
		this.bIsAttachedToCamera = false;
		this.SMGr = scenemanager;

		this.firstTime = true;
	}

	/**
	 * @private
	 */
	setAcceptsEvents(bForMouse, bForKeyboard) {
		this.bAcceptsMouseEvents = bForMouse;
		this.bAcceptsKeyboardEvents = bForKeyboard;

		if (!this.bIsAttachedToCamera && this.SMGr) {
			var engine = CL3D.ScriptingInterface.getScriptingInterface().Engine;
			if (bForKeyboard) {
				engine.registerAnimatorForKeyUp(this);
				engine.registerAnimatorForKeyDown(this);
			}

			this.SMGr.registerSceneNodeAnimatorForEvents(this);
		}
	}

	/**
	 * @private
	 */
	getType() {
		return 'extensionscript';
	}

	/**
	 * @private
	 */
	createClone(node, newManager, oldNodeId, newNodeId) {
		var a = new CL3D.AnimatorExtensionScript(newManager);

		a.JsClassName = this.JsClassName;

		for (var i = 0; i < this.Properties.length; ++i) {
			var prop = this.Properties[i];

			if (prop != null)
				a.Properties.push(prop.createClone(oldNodeId, newNodeId));

			else
				a.Properties.push(null);
		}

		return a;
	}

	/**
	 * @private
	 */
	animateNode(n, timeMs) {
		if (n == null)
			return false;

		if (this.JsClassName == null || this.JsClassName.length == 0)
			return false;

		var engine = CL3D.ScriptingInterface.getScriptingInterface();

		engine.setCurrentlyRunningExtensionScriptAnimator(this);

		if (this.ScriptIndex == -1)
			this.initScript(n, engine);

		if (this.ScriptIndex != -1) {
			if (this.firstTime) {
				this.initScript(n, engine, true);
				this.firstTime = false;
			}

			// run script like this:
			// _ccbScriptCache[0].onAnimate(ccbGetSceneNodeFromId(thescenenodeid), timeMs);
			try {
				// _ccbScriptCache[this.ScriptIndex].onAnimate( n, timeMs );
				_ccbScriptCache[this.ScriptIndex]['onAnimate'](n, timeMs); // <-- closure working function call (won't get obfuscated)
			}
			catch (e) {
				console.log(this.JsClassName + ": " + e);
			}
		}

		engine.setCurrentlyRunningExtensionScriptAnimator(null);

		return true;
	}

	/**
	 * @private
	 */
	initScript(n, engine, isCache) {
		if (engine.executeCode("typeof " + this.JsClassName + "== 'undefined'"))
			return;

		var executeCode = "";

		// need to initialize script
		// call something to register in global scriptCache:
		// if (typeof _ccbScriptCache == 'undefined') _ccbScriptCache = new Array();
		// _ccbScriptCache[0] = new behavior_MoveForward();
		var ccbScriptName = "";

		if (isCache) {
			ccbScriptName = "_ccb_" + this.JsClassName;
			executeCode += ccbScriptName + " = ";
			executeCode += this.JsClassName;
		}

		else {
			this.ScriptIndex = engine.getUniqueCounterID();

			ccbScriptName = "_ccbScriptCache" + "[" + this.ScriptIndex + "]";
			executeCode += "if (typeof _ccbScriptCache == 'undefined') _ccbScriptCache = new Array(); ";
			executeCode += ccbScriptName;
			executeCode += " = new " + this.JsClassName;
			executeCode += "();";
		}

		engine.executeCode(executeCode);

		// also, we need to init the instance with the properties the user set for this extension
		// like here:
		// _ccbScriptCache[0].PropName = 23;
		// var objPrefix = "_ccbScriptCache[";
		// objPrefix += this.ScriptIndex;
		// objPrefix += "].";
		var objPrefix = "this.";

		executeCode = "try {";
		executeCode += this.JsClassName + ".prototype._init = function() {";
		executeCode += CL3D.ExtensionScriptProperty.generateInitJavaScriptCode(objPrefix, this.Properties);
		executeCode += "};";
		executeCode += "} catch(e) { }";

		engine.executeCode(executeCode);

		// and lastly, we need to register for getting events if the script has this feature
		var bNodeIsCamera = false;

		var fcam = null;
		if (n.getType() == 'camera') {
			fcam = n;
			bNodeIsCamera = true;
		}

		this.bIsAttachedToCamera = bNodeIsCamera;

		// call something like
		// try {
		//   ccbRegisterBehaviorEventReceiver(typeof _ccbScriptCache[0].onMouseEvent != 'undefined',
		//          typeof _ccbScriptCache[0].onKeyEvent != 'undefined');
		// } catch(e) {}
		executeCode = "try {";
		executeCode += ccbScriptName + "._init();";
		executeCode += "ccbRegisterBehaviorEventReceiver(typeof ";
		executeCode += ccbScriptName;
		executeCode += ".onMouseEvent != 'undefined', typeof ";
		executeCode += ccbScriptName;
		executeCode += ".onKeyEvent != 'undefined'); } catch(e) { }";

		engine.executeCode(executeCode);
	}

	/**
	 * @private
	 */
	sendMouseEvent(mouseEvtId, wheelDelta) {
		if (this.bAcceptsMouseEvents)
			// the following line would work, but not with the closure compiler
			//_ccbScriptCache[this.ScriptIndex].onMouseEvent(mouseEvtId);
			//CL3D.ScriptingInterface.getScriptingInterface().executeCode('_ccbScriptCache[' + this.ScriptIndex + '].onMouseEvent(' + mouseEvtId + ');');
			_ccbScriptCache[this.ScriptIndex]['onMouseEvent'](mouseEvtId, wheelDelta); // <-- closure working function call (won't get obfuscated)
	}

	/**
	 * @private
	 */
	sendKeyEvent(keycode, pressed) {
		if (this.bAcceptsKeyboardEvents)
			// the following line would work, but not with the closure compiler
			//_ccbScriptCache[this.ScriptIndex].onKeyEvent(keycode, pressed);
			//CL3D.ScriptingInterface.getScriptingInterface().executeCode('_ccbScriptCache[' + this.ScriptIndex + '].onKeyEvent(' + keycode + ',' + pressed + ');');
			_ccbScriptCache[this.ScriptIndex]['onKeyEvent'](keycode, pressed); // <-- closure working function call (won't get obfuscated)
	}

	/**
	 * @private
	 */
	onMouseUp(event) {
		var wasRightButton = false;
		if (event && event.button == 2) //2: Secondary button pressed, usually the right button
			wasRightButton = true;

		this.sendMouseEvent(wasRightButton ? 4 : 2, 0);
	}
	
	/**
	 * @private
	 */
	onMouseWheel(delta) {
		this.sendMouseEvent(1, delta);
	}

	/**
	 * @private
	 */
	onMouseDown(event) {
		var wasRightButton = false;
		if (event && event.button == 2) //2: Secondary button pressed, usually the right button
			wasRightButton = true;

		this.sendMouseEvent(wasRightButton ? 5 : 3, 0);
	}

	/**
	 * @private
	 */
	onMouseMove(event) {
		this.sendMouseEvent(0, 0);
	}
	
	/**
	 * @private
	 */
	onKeyDown(evt) {
		this.sendKeyEvent(evt.keyCode, true);
	}

	/**
	 * @private
	 */
	onKeyUp(evt) {
		this.sendKeyEvent(evt.keyCode, false);
	}
};

// --------------------------------------------------------------
// ExtensionScriptProperty
// --------------------------------------------------------------

/**
 * @private
 * @constructor
 * @class
 */
export class ExtensionScriptProperty {
	constructor() {
		this.Type = -1;
		this.Name = null;

		this.StringValue = null;
		this.VectorValue = null;
		this.FloatValue = 0.0;
		this.IntValue = 0;
		this.ActionHandlerValue = null;
		this.TextureValue = null;
	}

	/**
	 * @private
	 */
	static stringReplace(source, find, replacement) {
		return source.split(find).join(replacement);
	}

	/**
	 * @private
	 */
	static generateInitJavaScriptCode(objPrefix, properties) {
		var executeCode = "";

		for (var i = 0; i < properties.length; ++i) {
			var prop = properties[i];
			if (prop == null)
				continue;

			executeCode += objPrefix;
			executeCode += prop.Name;
			executeCode += " = ";

			switch (prop.Type) {
				case 1: //irr::scene::EESAT_FLOAT:
					executeCode += prop.FloatValue;
					executeCode += "; ";
					break;
				case 2: //irr::scene::EESAT_STRING:
					{
						executeCode += "\"";
						var escapedString = CL3D.ExtensionScriptProperty.stringReplace(prop.StringValue, "\"", "\\\"");
						executeCode += escapedString;
						executeCode += "\"; ";
					}
					break;
				case 3: //irr::scene::EESAT_BOOL:
					executeCode += prop.IntValue ? "true" : "false";
					executeCode += "; ";
					break;
				case 6: //irr::scene::EESAT_VECTOR3D:
					executeCode += "new vector3d(";
					executeCode += prop.VectorValue.X;
					executeCode += ", ";
					executeCode += prop.VectorValue.Y;
					executeCode += ", ";
					executeCode += prop.VectorValue.Z;
					executeCode += "); ";
					break;
				case 7: //irr::scene::EESAT_TEXTURE:
					executeCode += "\"";
					executeCode += prop.TextureValue ? prop.TextureValue.Name : "";
					executeCode += "\"; ";
					break;
				case 8: //irr::scene::EESAT_SCENE_NODE_ID:
					executeCode += "ccbGetSceneNodeFromId(";
					executeCode += prop.IntValue;
					executeCode += "); ";
					break;
				case 9: //irr::scene::EESAT_ACTION_REFERENCE:
					{
						var id = CL3D.ScriptingInterface.getScriptingInterface().registerExtensionScriptActionHandler(prop.ActionHandlerValue);

						executeCode += id;
						executeCode += "; ";
					}
					break;
				case 0: //irr::scene::EESAT_INT:
				case 5: //irr::scene::EESAT_COLOR:
				case 4: //irr::scene::EESAT_ENUM:
				default:
					executeCode += prop.IntValue;
					executeCode += "; ";
					break;
			}
		}

		return executeCode;
	}

	/**
	 * @private
	 */
	createClone(oldNodeId, newNodeId) {
		var c = new CL3D.ExtensionScriptProperty();

		c.Type = this.Type;
		c.Name = this.Name;

		c.StringValue = this.StringValue;
		c.VectorValue = this.VectorValue ? this.VectorValue.clone() : null;
		c.FloatValue = this.FloatValue;
		c.IntValue = this.IntValue;

		if (this.ActionHandlerValue)
			c.ActionHandlerValue = this.ActionHandlerValue.createClone(oldNodeId, newNodeId);

		c.TextureValue = this.TextureValue;

		return c;
	}
}

// --------------------------------------------------------------
// ActionExtensionScript
// --------------------------------------------------------------

/**
 * @private
 * @constructor
 * @class
 */
export class ActionExtensionScript extends CL3D.Action {
	constructor() {
		this.Type = 'ExtensionScript';
		this.Properties = new Array();
		this.JsClassName = null;
	}

	/**
	 * @private
	 */
	createClone(oldNodeId, newNodeId) {
		var a = new CL3D.Action.ActionExtensionScript();

		a.JsClassName = this.JsClassName;

		for (var i = 0; i < this.Properties.length; ++i) {
			var prop = this.Properties[i];

			if (prop != null)
				a.Properties.push(prop.createClone(oldNodeId, newNodeId));

			else
				a.Properties.push(null);
		}

		return a;
	}

	/**
	 * @private
	 */
	execute(currentNode, sceneManager, isCache) {
		if (this.JsClassName == null || this.JsClassName.length == 0 || currentNode == null)
			return;

		var engine = CL3D.ScriptingInterface.getScriptingInterface();

		if (engine.executeCode("typeof " + this.JsClassName + "== 'undefined'"))
			return;

		var executeCode = "";

		// need to initialize script
		// call something to register in global scriptCache:
		// _ccbScriptTmp = new action_MakeInvisible();
		var ccbScriptName = "";

		if (isCache) {
			ccbScriptName = "_ccb_" + this.JsClassName;
			executeCode += ccbScriptName + " = ";
			executeCode += this.JsClassName;
		}

		else {
			ccbScriptName = "_ccbScriptTmp";
			executeCode += ccbScriptName + " = new ";
			executeCode += this.JsClassName;
			executeCode += "();";
		}

		engine.executeCode(executeCode);

		// also, we need to init the instance with the properties the user set for this extension
		// like here:
		// _ccbScriptTmp.PropName = 23;
		var objPrefix = "this.";

		executeCode = "try { ";
		executeCode += this.JsClassName + ".prototype._init = function() {";
		executeCode += CL3D.ExtensionScriptProperty.generateInitJavaScriptCode(objPrefix, this.Properties);
		executeCode += "};";
		executeCode += "} catch(e) { }";

		engine.executeCode(executeCode);

		// run script like this:
		// _ccbScriptTmp.execute(ccbGetSceneNodeFromId(currentNodeId));
		executeCode = "try { ";
		executeCode += ccbScriptName + "._init();";
		executeCode += ccbScriptName + ".execute(ccbGetSceneNodeFromId(";
		executeCode += currentNode.Id;
		executeCode += ")); } catch(e) { }";

		engine.executeCode(executeCode);
	}
};
