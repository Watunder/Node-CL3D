//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "../main.js";
import { getDevicePixelRatio } from "../share/getDevicePixelRatio.js";

/**
 * @type {CL3D.CCDocument}
 */
export let gDocument = new CL3D.CCDocument();

/**
 * Creates an instance of the CopperLicht 3D engine by loading the scene from a CopperCube file.
 * @param {String} filetoload a filename such as 'test.ccbjs' or 'test.ccbz' which will be loaded, displayed and animated by the 3d engine.
 * .ccbjs and .ccbz files can be created using {@link http://www.ambiera.com/coppercube/index.html | the CopperCube editor}.
 * @param {HTMLCanvasElement} mainElement The id of the canvas in your html document.
 * @param {String=} loadingScreenText specifying a loadingScreen text. Setting this to a text like "Loading" will cause
 * a loading screen with this text to appear while the file is being loaded.
 * @param {String=} loadingScreenBackgroundColor  specifying a loadingScreen backfround color.
 * @param {String=} noWebGLText specifying a text to show when there is no webgl.
 * @param {Boolean=} fullpage set to true to expand canvas automatically to the full browser size.
 * @public
 * @returns {CL3D.CopperLicht} the instance of the CopperLicht engine
 */
export const startCopperLichtFromFile = function (filetoload, mainElement, loadingScreenText, loadingScreenBackgroundColor, noWebGLText, fullpage) {
	let engine = new CL3D.CopperLicht(mainElement, loadingScreenText, loadingScreenBackgroundColor, noWebGLText, fullpage);
	engine.load(filetoload);
	return engine;
}

/**
 * @description The main class of the CopperLicht 3D engine.
 * You can create an instance of this class using for example {@link startCopperLichtFromFile}, but using
 * code like this will work of course as well:
 * @example
 * var engine = new CL3D.CopperLicht(document.getElementById('yourCanvasID'));
 * engine.load('somefile.ccbz');
 * @class The main class of the CopperLicht engine, representing the 3D engine itself.
 * @constructor
 */
export class CopperLicht {
	/**
	 * Event handler called before animating the scene. You can use this to manipulate the 3d scene every frame.
	 * An example how to use it looks like this:
	 * @example
	 * var engine = startCopperLichtFromFile('test.ccbz', document.getElementById('3darea'));
	 *
	 * engine.OnAnimate = function()
	 * {
	 *   var scene = engine.getScene();
	 *   if (scene)
	 *   {
	 *     // TODO: do your game logic here
	 *   }
	 * };
	 * @public
	 */
	OnAnimate = null;

	/**
	 * Event handler called before sending a received "mouse up" event to the scene graph. You can use this to intercept
	 * mouse events in your game. Return 'true' if you handled the event yourself and don't want the 3D scene to reveive this
	 * event. An example how to use it looks like this:
	 * @example
	 * var engine = startCopperLichtFromFile('test.ccbz', document.getElementById('3darea'));
	 *
	 * engine.OnMouseUp = function()
	 * {
	 *   var scene = engine.getScene();
	 *   if (scene)
	 *   {
	 *     // TODO: do your game logic here
	 *     // return true; // <- return true here if you handled the event yourself
	 *   }
	 *
	 *   return false; // let the engine handle this click
	 * };
	 * @public
	 */
	OnMouseUp = null;

	/**
	 * Event handler called before sending a received "mouse down" event to the scene graph. You can use this to intercept
	 * mouse events in your game. Return 'true' if you handled the event yourself and don't want the 3D scene to reveive this
	 * event. An example how to use it looks like this:
	 * @example
	 * var engine = startCopperLichtFromFile('test.ccbz', document.getElementById('3darea'));
	 *
	 * engine.OnMouseDown = function()
	 * {
	 *   var scene = engine.getScene();
	 *   if (scene)
	 *   {
	 *     // TODO: do your game logic here
	 *     // return true; // <- return true here if you handled the event yourself
	 *   }
	 *
	 *   return false; // let the engine handle this click
	 * };
	 * @public
	 */
	OnMouseDown = null;

	/**
	 * Event handler called after the scene has been completely drawn. You can use this to draw some additional stuff like
	 * 2d overlays or similar. Use it for example like here:
	 * @example
	 * var engine = startCopperLichtFromFile('test.ccbz', document.getElementById('3darea'));
	 *
	 * engine.OnAfterDrawAll = function()
	 * {
	 *   var renderer = engine.getRenderer();
	 *   if (renderer)
	 *   {
	 *     // TODO: draw something additionally here
	 *   }
	 * };
	 * @public
	 */
	OnAfterDrawAll = null;

	/**
	 * Event handler called before the scene will be completely drawn. You can use this to draw some additional stuff like
	 * weapons or similar. Use it for example like here:
	 * @example
	 * var engine = startCopperLichtFromFile('test.ccbz', document.getElementById('3darea'));
	 *
	 * engine.OnBeforeDrawAll = function()
	 * {
	 *   var renderer = engine.getRenderer();
	 *   if (renderer)
	 *   {
	 *     // TODO: draw something here
	 *   }
	 * };
	 * @public
	 */
	OnBeforeDrawAll = null;

	/**
	 * Event handler called after the scene description file has been loaded sucessfully (see {@link CopperLicht.load}().
	 * Can be used to hide a loading screen after loading of the file has been finished. Use it for example like here:
	 * @example
	 * var engine = startCopperLichtFromFile('test.ccbz', document.getElementById('3darea'));
	 *
	 * engine.OnLoadingComplete = function()
	 * {
	 *   // Do something here
	 * };
	 * @public
	 */
	OnLoadingComplete = null;

	/**
	 * @param {HTMLCanvasElement} mainElement id of the canvas element embedded in the html, used to draw 3d graphics.
	 * @param {String=} loadingScreenText optional parameter specifying a loadingScreen text. Setting this to a text like "Loading" will cause
	 * a loading screen with this text to appear while the file is being loaded.
	 * @param {String=} loadingScreenBackgroundColor
	 * @param {String=} noWebGLText optional parameter specifying a text to show when there is no webgl.
	 * @param {Boolean=} fullpage optional parameter, set to true to expand canvas automatically to the full browser size.
	 * @param {Boolean=} pointerLockForFPSCameras optional parameter, set to true to automatically use pointer lock for FPS cameras
	 */
	constructor(mainElement, loadingScreenText, loadingScreenBackgroundColor, noWebGLText, fullpage, pointerLockForFPSCameras) {
		//
		this.FPS = 60;
		this.DPR = getDevicePixelRatio();

		//
		this.MainElement = mainElement;
		this.TheRenderer = null;
		this.IsBrowser = this.MainElement ? true : false;
		this.IsPaused = false;
		this.NextCameraToSetActive = null;
		this.TheTextureManager = new CL3D.TextureManager();
		this.TheMeshCache = new CL3D.MeshCache();
		this.LoadingAFile = false;
		this.WaitingForTexturesToBeLoaded = false;
		this.LoadingAnimationCounter = 0;
		this.OnAnimate = null;
		this.OnBeforeDrawAll = null;
		this.OnAfterDrawAll = null;
		this.OnLoadingComplete = null;
		this.requestPointerLockAfterFullscreen = false;
		this.pointerIsCurrentlyLocked = false;
		this.playingVideoStreams = new Array();
		this.pointerLockForFPSCameras = pointerLockForFPSCameras;

		//
		this.RegisteredAnimatorsForKeyUp = new Array();
		this.RegisteredAnimatorsForKeyDown = new Array();

		this.MouseIsDown = false;
		this.MouseX = 0;
		this.MouseY = 0;
		this.MouseMoveX = 0;
		this.MouseMoveY = 0;
		this.MouseDownX = 0;
		this.MouseDownY = 0;
		this.MouseIsInside = true;
		this.IsTouchPinching = false;
		this.StartTouchPinchDistance = 0;

		this.LastCameraDragTime = 0; // flag to disable AnimatorOnClick actions when an AnimatorCameraFPS is currently dragging the camera

		if (noWebGLText == null)
			this.NoWebGLText = "Error: This browser does not support WebGL (or it is disabled).<br/>See <a href=\"www.ambiera.com/copperlicht/browsersupport.html\">here</a> for details.";
		else
			this.NoWebGLText = noWebGLText;

		this.fullpage = fullpage ? true : false;
		if (this.fullpage)
			this.initMakeWholePageSize();

		this.LoadingDialog = null;
		if (loadingScreenText != null)
			this.createTextDialog(true, loadingScreenText, loadingScreenBackgroundColor);

		this.updateCanvasTopLeftPosition();

		// redraw loading animator every few seconds
		const me = this;
		setInterval(() => { me.loadingUpdateIntervalHandler(); }, 500);

		// init scripting
		CL3D.ScriptingInterface.getScriptingInterface().setEngine(this);
	}

	mainLoop() {
		// redraw every few seconds
		const me = this;
		const interval = 1000.0 / this.FPS;

		if (typeof globalThis.requestAnimationFrame == 'undefined' || process.env.RAUB_ENV) {
			setInterval(() => { me.draw3DIntervalHandler(interval); }, interval);
			if (process.env.RAUB_ENV) {
				setInterval(() => { this.TheRenderer.glfw.pollEvents(); }, 0);
			}
		}
		else {
			let lastUpdate = CL3D.CLTimer.getTime();
			const running = (now) => {
				let elapsed = now - lastUpdate;
				globalThis.requestAnimationFrame(running);

				if (elapsed >= interval) {
					me.draw3DIntervalHandler(now);

					lastUpdate = now - (elapsed % interval);
					// also adjusts for your interval not being
					// a multiple of requestAnimationFrame's interval (usually 16.7ms)
				}
			};
			globalThis.requestAnimationFrame(running);
		}
	}

	/**
	 * Initializes the renderer, you need to call this if you create the engine yourself without
	 * using one of the startup functions like {@link startCopperLichtFromFile}.
	 * @public
	 * @param {Number} width the width of the rendering surface in pixels.
	 * @param {Number} height the height of the rendering surface in pixels.
	 * @param {WebGLContextAttributes} options
	 * @param {HTMLCanvasElement=} canvas
	 * @return returns true if successful and false if not (if the browser does not support webgl,
	 * for example).
	 */
	initRenderer(width, height, options, canvas) {
		return this.createRenderer(width, height, options, canvas);
	}

	/**
	 * return a reference to the currently used {@link Renderer}.
	 * @public
	 */
	getRenderer() {
		return this.TheRenderer;
	}

	/**
	 * return a reference to the currently active {@link Scene}.
	 * @public
	 * @return {CL3D.Scene}
	 */
	getScene() {
		return gDocument.getCurrentScene();
	}

	/**
	 * @public
	 */
	registerEventHandlers() {
		if (this.IsBrowser) {
			// key evt receiver
			const me = this;
			document.onkeydown = (evt) => { me.handleKeyDown(evt); };
			document.onkeyup = (evt) => { me.handleKeyUp(evt); };

			const canvas = this.MainElement;
			if (canvas != null) {
				canvas.onmousemove = (evt) => { me.handleMouseMove(evt); };
				canvas.onmousedown = (evt) => { me.handleMouseDown(evt); };
				canvas.onmouseup = (evt) => { me.handleMouseUp(evt); };

				canvas.onmouseover = (evt) => { me.MouseIsInside = true; };
				canvas.onmouseout = (evt) => { me.MouseIsInside = false; };

				this.setupEventHandlersForFullscreenChange();

				try {
					const w = (evt) => { me.handleMouseWheel(evt); };
					canvas.addEventListener('mousewheel', w, false);
					canvas.addEventListener('DOMMouseScroll', w, false);
				} catch (e) {
					console.log(e);
				}

				// additionally, add touch support
				try {
					const touchstart = (evt) => {
						// detect pinch start
						if (evt.touches != null) {
							me.IsTouchPinching = evt.touches.length == 2;
							if (me.IsTouchPinching)
								me.StartTouchPinchDistance = me.getPinchDistance(evt);
						}

						// emulate normal mouse down
						if (me.handleMouseDown(evt.changedTouches[0]))
							me.handleEventPropagation(evt, true);
					};
					const touchend = (evt) => {
						me.IsTouchPinching = false;

						// emulate normal mouse up
						if (me.handleMouseUp(evt.changedTouches[0]))
							me.handleEventPropagation(evt, true);
					};
					const touchmove = (evt) => {
						if (me.IsTouchPinching && evt.touches != null && evt.touches.length >= 2) {
							// emulate mouse wheel, user it pinching
							let dist = me.getPinchDistance(evt);
							let delta = dist - me.StartTouchPinchDistance;
							me.StartTouchPinchDistance = dist;
							me.sendMouseWheelEvent(delta);
						}

						else {
							// emular normal mouse move
							if (me.handleMouseMove(evt.changedTouches[0]))
								me.handleEventPropagation(evt, true);
						}
					};

					canvas.addEventListener("touchstart", touchstart, false);
					canvas.addEventListener("touchend", touchend, false);
					canvas.addEventListener("touchcancel", touchend, false);
					canvas.addEventListener("touchleave", touchend, false);
					canvas.addEventListener("touchmove", touchmove, false);
				} catch (e) {
					console.log(e);
				}
			}
		}
		else {

		}
	}

	/**
	 * @public
	 */
	getPinchDistance(evt) {
		var t = evt.touches;
		if (t[0].pageX == null)
			return 0;

		return Math.sqrt((t[0].pageX - t[1].pageX) * (t[0].pageX - t[1].pageX) + (t[0].pageY - t[1].pageY) * (t[0].pageY - t[1].pageY));
	}

	/**
	 * Loads a the scene from a <a href="http://www.ambiera.com/coppercube/index.html" target="_blank">CopperCube</a> file and displays it.
	 * This will also initialize the renderer if this has not been done before. You can also use the event handler {@link CopperLicht.OnLoadingComplete} to
	 * check if the loading of the file has completed.
	 * @param filetoload a filename such as 'test.ccbjs' or 'test.ccbz' which will be loaded, displayed and animated by the 3d engine.
	 * .ccbjs and .ccbz files can be created using the <a href="http://www.ambiera.com/coppercube/index.html" target="_blank">CopperCube editor</a>,
	 * it is free to use for 21 days.
	 * @param importIntoExistingDocument if set to true, this will load all scenes into the existing document. It won't replace the current
	 * loaded data with the data from that file, but append it. This means that the scenes in the .ccbjs or .ccbz file will be added to the list of
	 * existing scenes, instead of replacing them.
	 * @param functionToCallWhenLoaded (optional) a function to call when the file has been loaded
	*/
	load(filetoload, importIntoExistingDocument, functionToCallWhenLoaded) {
		if (this.MainElement) {
			if (!this.createRenderer(this.MainElement.width, this.MainElement.height, { alpha: false }, this.MainElement)) {
				this.createTextDialog(false, this.NoWebGLText);
				return false;
			}
		}

		var me = this;
		this.LoadingAFile = true;
		var l = new CL3D.CCFileLoader(filetoload, filetoload.indexOf('.ccbz') != -1 || filetoload.indexOf('.ccp') != -1, this.IsBrowser);
		l.load(async (p) => { await me.parseFile(p, filetoload, importIntoExistingDocument); if (functionToCallWhenLoaded) functionToCallWhenLoaded(); });

		return true;
	}

	/**
	 * @public
	 */
	createRenderer(width, height, options, canvas) {
		if (this.TheRenderer != null)
			return true;

		this.TheRenderer = new CL3D.Renderer(this.TheTextureManager);
		this.TheRenderer.init(width, height, options, canvas);

		if (this.TheTextureManager)
			this.TheTextureManager.TheRenderer = this.TheRenderer;

		this.registerEventHandlers();

		this.mainLoop();

		return true;
	}

	/**
	 * @public
	 */
	initMakeWholePageSize() {
		document.body.style.margin = "0";
		document.body.style.padding = "0";
		document.body.style.overflow = 'hidden';
	}

	/**
	 * @public
	 */
	makeWholePageSize() {
		if (this.tmpWidth != globalThis.innerWidth || this.tmpHeight != globalThis.innerHeight) {
			this.tmpWidth = globalThis.innerWidth;
			this.tmpHeight = globalThis.innerHeight;
	
			this.MainElement.style.width = this.tmpWidth + "px";
			this.MainElement.style.height = this.tmpHeight + "px";
	
			this.DPR = getDevicePixelRatio();
	
			this.MainElement.setAttribute("width", String(Math.floor(this.tmpWidth * this.DPR)));
			this.MainElement.setAttribute("height", String(Math.floor(this.tmpHeight * this.DPR)));
		}
	}

	/**
	 * @public
	 */
	makeWholeCanvasSize() {
		if (this.MainElement && (this.tmpWidth != this.MainElement.width || this.tmpHeight != this.MainElement.height)) {
			var w = this.MainElement.width;
			var h = this.MainElement.height;
	
			this.MainElement.style.width = w + "px";
			this.MainElement.style.height = h + "px";
	
			this.DPR = getDevicePixelRatio();

			this.tmpWidth = Math.floor(w * this.DPR);
			this.tmpHeight = Math.floor(h * this.DPR);
	
			this.MainElement.setAttribute("width",  String(this.tmpWidth));
			this.MainElement.setAttribute("height", String(this.tmpHeight));
		}
	}

	/**
	 * @public
	 */
	draw3DIntervalHandler(timeMs) {
		// resize
		if (this.fullpage)
			this.makeWholePageSize();
		else
			this.makeWholeCanvasSize();

		// draw
		this.draw3dScene(timeMs);
	}

	/**
	 * @public
	 */
	loadingUpdateIntervalHandler() {
		if (this.LoadingDialog != null)
			this.updateLoadingDialog();

		if (!CL3D.gCCDebugInfoEnabled)
			return;

		++this.LoadingAnimationCounter;
		var texturesToLoad = 0;
		var totalTextureCount = 0;

		if (this.TheTextureManager) {
			texturesToLoad = this.TheTextureManager.getCountOfTexturesToLoad();
			totalTextureCount = this.TheTextureManager.getTextureCount();
		}

		if (this.WaitingForTexturesToBeLoaded && texturesToLoad == 0) {
			this.WaitingForTexturesToBeLoaded = false;
			this.startFirstSceneAfterEverythingLoaded();
		}

		if (this.LoadingAFile || texturesToLoad) {
			var txt = 'Loading';
			if (texturesToLoad > 0)
				txt = 'Textures loaded: ' + (totalTextureCount - texturesToLoad) + '/' + totalTextureCount;

			switch (this.LoadingAnimationCounter % 4) {
				case 0: txt += ('   '); break;
				case 1: txt += ('.  '); break;
				case 2: txt += ('.. '); break;
				case 3: txt += ('...'); break;
			}

			/// TODO
		}

		else {
			/// TODO
		}
	}

	/**
	 * Returns true of CopperLicht is currently loading a scene file
	 * @public
	 */
	isLoading() {
		return this.LoadingAFile || this.WaitingForTexturesToBeLoaded;
	}

	/**
	 * @public
	 */
	async parseFile(filecontent, filename, importIntoExistingDocument, copyRootNodeChildren, newRootNodeChildrenParent) {
		this.LoadingAFile = false;

		var loader = new CL3D.FlaceLoader();
		var doc = await loader.loadFile(filecontent, filename, this.TheTextureManager, this.TheMeshCache, this, copyRootNodeChildren, newRootNodeChildrenParent);
		if (doc != null) {
			// var docJSON = JSON.stringify(JSON.decycle(doc));
			// var blob = new Blob([docJSON], {type: "text/plain;charset=utf-8"});
			// saveAs(blob, "doc.json");
			if (!importIntoExistingDocument ||
				gDocument == null ||
				(gDocument != null && gDocument.Scenes.length == 0)) {
				// default behavior, load document and replace all data.
				// Also, this is forced to do if there isn't a current document or scene.
				gDocument = doc;

				// store fileconent for later possible reload (RestartSceneAction)
				if (loader.LoadedAReloadAction) {
					this.LastLoadedFileContent = loader.StoredFileContent;
					this.LastLoadedFilename = filename;
				}

				if (!doc.WaitUntilTexturesLoaded) {
					this.startFirstSceneAfterEverythingLoaded();
				}

				else
					this.WaitingForTexturesToBeLoaded = true;
			}

			else {
				// import all scenes loaded into this current, already existing document.
				if (!copyRootNodeChildren || !newRootNodeChildrenParent) {
					for (var sceneNr = 0; sceneNr < doc.Scenes.length; ++sceneNr) {
						// console.log("imported scene " + doc.Scenes[sceneNr].Name);
						gDocument.addScene(doc.Scenes[sceneNr]);
					}

				}
			}
		}
	}

	/**
	 * @public
	 */
	startFirstSceneAfterEverythingLoaded() {
		// set active scene
		this.gotoScene(gDocument.getCurrentScene());

		// draw
		this.draw3dScene();

		// notify loading complete handler
		if (this.OnLoadingComplete != null)
			this.OnLoadingComplete();
	}

	/**
	 * Draws and animates the 3d scene.
	 * To be called if you are using your own rendering loop, usually this has not to be called at all.
	 * This will also call {@link OnAnimate}() before starting to draw anything, and call {@link OnAfterDrawAll}() after everything
	 * has been drawn.
	 * @public
	 */
	draw3dScene(timeMs) {
		if (gDocument == null || this.TheRenderer == null)
			return;


		if (this.isLoading())
			return;

		this.updateCanvasTopLeftPosition();

		this.internalOnBeforeRendering();
		var renderScene = gDocument.getCurrentScene();

		if (!this.IsPaused && renderScene) {
			if (this.updateAllVideoStreams()) // at least one video is playing if it returns true
				renderScene.forceRedrawNextFrame();

			if (this.OnAnimate)
				this.OnAnimate();

			this.TheRenderer.registerFrame();

			if (renderScene.doAnimate(this.TheRenderer)) {
				this.TheRenderer.beginScene(renderScene.BackgroundColor);

				if (this.OnBeforeDrawAll)
					this.OnBeforeDrawAll();

				// draw scene
				renderScene.drawAll(this.TheRenderer);

				// callback
				if (this.OnAfterDrawAll)
					this.OnAfterDrawAll();

				// scripting frame
				var sc = CL3D.ScriptingInterface.getScriptingInterfaceReadOnly();
				if (sc != null)
					sc.runDrawCallbacks(this.TheRenderer, timeMs);

				// finished
				this.TheRenderer.endScene();
			}
		}

		this.internalOnAfterRendering();
	}

	/**
	 * @public
	 */
	internalOnAfterRendering() {
		this.setNextCameraActiveIfNeeded();
	}

	/**
	 * @public
	 */
	internalOnBeforeRendering() {
		this.setNextCameraActiveIfNeeded();
	}

	/**
	 * Returns all available scenes.
	 * Returns an array containing all {@link Scene}s.
	 * @public
	 */
	getScenes() {
		if (gDocument)
			return gDocument.Scenes;

		return 0;
	}

	/**
	 * Adds a new CL3D.Scene
	 * @public
	 */
	addScene(scene) {
		if (gDocument) {
			gDocument.Scenes.push(scene);
			if (gDocument.Scenes.length == 1)
				gDocument.setCurrentScene(scene);
		}
	}

	/**
	 * Switches the current scene to a new CL3D.Scene by scene name.
	 * @param scene {String} The name of the new CL3D.Scene to be activated.
	 * @param ignorecase {Boolean} set to true to ignore the case of the name
	 * @public
	 */
	gotoSceneByName(scenename, ignorecase) {
		if (!gDocument)
			return false;

		var scenes = gDocument.Scenes;
		var name = scenename;
		if (ignorecase)
			name = name.toLowerCase();

		for (var i = 0; i < scenes.length; ++i) {
			var sname = scenes[i].Name;
			if (ignorecase)
				sname = sname.toLowerCase();

			if (name == sname) {
				this.gotoScene(scenes[i]);
				return true;
			}
		}

		return false;
	}

	/**
	 * Switches the current scene to a new CL3D.Scene.
	 * @param {CL3D.Free3dScene} scene The new CL3D.Scene to be activated.
	 * @public
	 */
	gotoScene(scene) {
		if (!scene)
			return false;

		// set active camera
		// TODO: handle panorama scenes later
		//var panoScene = typeof scene == FlacePanoramaScene;
		var isPanoScene = scene.getSceneType() == 'panorama';
		var isFree3dScene = scene.getSceneType() == 'free';

		var activeCamera = null;

		gDocument.setCurrentScene(scene);

		// make sprites of old scene invisible
		//if (CurrentActiveScene)
		//	CurrentActiveScene.setSpriteChildrenVisible(false);
		// init cameras and create default ones if there is none yet
		if (scene.WasAlreadyActivatedOnce) {
			activeCamera = scene.getActiveCamera();
			//scene.setSpriteChildrenVisible(true);
		}

		else {
			scene.WasAlreadyActivatedOnce = true;

			//setActionHandlerForHotspots(scene.RootNode);
			var foundActiveCamera = false;
			var cameras = scene.getAllSceneNodesOfType('camera');
			if (cameras) {
				//console.log("Found " + cameras.length + " cameras!");
				for (var i = 0; i < cameras.length; ++i) {
					var fcam = cameras[i];
					if (fcam && fcam.Active) {
						// found a camera to activate
						activeCamera = fcam;
						foundActiveCamera = true;

						activeCamera.setAutoAspectIfNoFixedSet(this.TheRenderer.width, this.TheRenderer.height);
						//console.log("activated camera from file:" + fcam.Name);
						break;
					}
				}
			}

			if (!foundActiveCamera) {
				var aspect = 4.0 / 3.0;
				if (this.TheRenderer.width && this.TheRenderer.height)
					aspect = this.TheRenderer.width / this.TheRenderer.height;

				activeCamera = new CL3D.CameraSceneNode();
				activeCamera.setAspectRatio(aspect);
				scene.RootNode.addChild(activeCamera);

				// create camera for scene if there is no active camera yet
				var interfaceTexture = null;
				var createdAnimator = null;

				if (!isPanoScene) {
					createdAnimator = new CL3D.AnimatorCameraFPS(activeCamera, this);
					activeCamera.addAnimator(createdAnimator);
				}
				//else
				//{
				//interfaceTexture = panoScene.InterfaceTexture;
				//createdAnimator = new CL3D.AnimatorCameraPano(activeCamera, this, interfaceTexture);
				//activeCamera.addAnimator(createdAnimator);
				//}
				if (isFree3dScene) {
					if (scene.DefaultCameraPos != null)
						activeCamera.Pos = scene.DefaultCameraPos.clone();

					if (scene.DefaultCameraTarget != null) {
						if (createdAnimator != null)
							createdAnimator.lookAt(scene.DefaultCameraTarget);

						else
							activeCamera.setTarget(scene.DefaultCameraTarget);
					}
				}

				if (createdAnimator)
					createdAnimator.setMayMove(!isPanoScene);
			}

			scene.setActiveCamera(activeCamera);

			// create collision geometry
			scene.CollisionWorld = scene.createCollisionGeometry(true);
			CL3D.Extensions.setWorld(scene.CollisionWorld);
			this.setCollisionWorldForAllSceneNodes(scene.getRootSceneNode(), scene.CollisionWorld);
		}

		// let scripting manager know about this
		CL3D.ScriptingInterface.getScriptingInterface().setActiveScene(scene);

		// set upate mode
		scene.setRedrawMode(gDocument.UpdateMode);
		scene.forceRedrawNextFrame();

		// done
		//console.log("Scene ready.");
		return true;
	}

	/**
	 * @public
	 */
	setNextCameraActiveIfNeeded() {
		if (this.NextCameraToSetActive == null)
			return;

		var scene = gDocument.getCurrentScene();
		if (scene == null)
			return;

		if (this.NextCameraToSetActive.scene === scene) {
			if (this.TheRenderer)
				this.NextCameraToSetActive.setAutoAspectIfNoFixedSet(this.TheRenderer.getWidth(), this.TheRenderer.getHeight());

			scene.setActiveCamera(this.NextCameraToSetActive);
			this.NextCameraToSetActive = null;
		}
	}

	/**
	 * When CopperLicht is created, it will register the document.onkeydown event with this function.
	 * If you need to handle it yourself, you should call this function with the event parameter so
	 * that all animators still work correctly.
	 * @public
	 */
	handleKeyDown(evt) {
		var scene = this.getScene();
		if (scene == null)
			return false;

		var usedToDoAction = false;

		var cam = scene.getActiveCamera();
		if (cam != null)
			usedToDoAction = cam.onKeyDown(evt);

		for (var i = 0; i < this.RegisteredAnimatorsForKeyDown.length; ++i)
			if (this.RegisteredAnimatorsForKeyDown[i].onKeyDown(evt))
				usedToDoAction = true;

		return this.handleEventPropagation(evt, usedToDoAction);
	}

	/**
	 * When CopperLicht is created, it will register the document.onkeyup event with this function.
	 * If you need to handle it yourself, you should call this function with the event parameter so
	 * that all animators still work correctly.
	 * @public
	 */
	handleKeyUp(evt) {
		var scene = this.getScene();
		if (scene == null)
			return false;

		var usedToDoAction = false;

		var cam = scene.getActiveCamera();
		if (cam != null)
			usedToDoAction = cam.onKeyUp(evt);

		for (var i = 0; i < this.RegisteredAnimatorsForKeyUp.length; ++i)
			if (this.RegisteredAnimatorsForKeyUp[i].onKeyUp(evt))
				usedToDoAction = true;

		return this.handleEventPropagation(evt, usedToDoAction);
	}

	/**
	 * Causes a key event to stop propagating if it has been used inside an animator
	 * @public
	 */
	handleEventPropagation(evt, usedToDoAction) {
		if (this.IsBrowser && usedToDoAction) {
			try {
				evt.preventDefault();
			}
			catch (e) {
				console.log(e);
			}

			return true;
		}

		return false;
	}

	/**
	 * @public
	 */
	registerAnimatorForKeyUp(an) {
		if (an != null)
			this.RegisteredAnimatorsForKeyUp.push(an);
	}

	/**
	 * @public
	 */
	registerAnimatorForKeyDown(an) {
		if (an != null)
			this.RegisteredAnimatorsForKeyDown.push(an);
	}

	/**
	 * @public
	 */
	updateCanvasTopLeftPosition(e) {
		var x = 0;
		var y = 0;

		var obj = this.MainElement;

		while (obj != null) {
			x += obj.offsetLeft;
			y += obj.offsetTop;
			// @ts-ignore
			obj = obj.offsetParent;
		}

		this.CanvasTopLeftX = x;
		this.CanvasTopLeftY = y;
	}

	/**
	 * @public
	 * @description Returns true if the current document has the mouse pointer locked or not. Useful for first person shooters
	 */
	isInPointerLockMode() {
		return this.pointerIsCurrentlyLocked;
	}

	/**
	 * @public
	 */
	getMousePosXFromEvent(evt) {
		if (this.isInPointerLockMode()) {
			var w = this.TheRenderer.getWidth();
			return (w / 2.0);
		}

		if (this.IsBrowser) {
			if (evt.pageX)
				return evt.pageX - this.CanvasTopLeftX;
			else
				return evt.clientX - this.MainElement.offsetLeft + document.body.scrollLeft;
		}
		else {
			return evt.x;
		}
	}

	/**
	 * @public
	 */
	getMousePosYFromEvent(evt) {
		if (this.isInPointerLockMode()) {
			var h = this.TheRenderer.getHeight();
			return (h / 2.0);
		}

		if (this.IsBrowser) {
			if (evt.pageY)
				return evt.pageY - this.CanvasTopLeftY;
			else
				return evt.clientY - this.MainElement.offsetTop + document.body.scrollTop;
		}
		else {
			return evt.y;
		}
	}

	/**
	 * When CopperLicht is created, it will register the onmousedown event of the canvas with this function.
	 * If you need to handle it yourself, you should call this function with the event parameter so
	 * that all animators still work correctly.
	 * @public
	 */
	handleMouseDown(evt) {
		this.MouseIsDown = true;
		this.MouseIsInside = true;

		if (evt) //  && !this.isInPointerLockMode())
		{
			this.MouseDownX = this.getMousePosXFromEvent(evt);
			this.MouseDownY = this.getMousePosYFromEvent(evt);

			this.MouseX = this.MouseDownX;
			this.MouseY = this.MouseDownY;
		}

		//console.log("MouseDown " + this.MouseDownX + " " + this.MouseDownY);
		//console.log("e.offsetX:" + evt.offsetX + " e.layerX:" + evt.layerX + " e.clientX:" + evt.clientX);
		var scene = this.getScene();
		if (scene == null)
			return false;

		var handledByUser = false;
		if (this.OnMouseDown)
			handledByUser = this.OnMouseDown();

		if (!handledByUser) {
			var cam = scene.getActiveCamera();
			if (cam != null)
				cam.onMouseDown(evt);

			scene.postMouseDownToAnimators(evt);
		}

		return this.handleEventPropagation(evt, true);
	}

	/**
	 * Returns if the mouse is overt the canvas at all
	 * @public
	 */
	isMouseOverCanvas() {
		return this.MouseIsInside;
	}

	/**
	 * Returns the last X movement coordinate when in pointer lock mode
	 * @public
	 */
	getMouseMoveX() {
		return this.MouseMoveX;
	}

	/**
	 * Returns the last Y movement coordinate when in pointer lock mode
	 * @public
	 */
	getMouseMoveY() {
		return this.MouseMoveY;
	}

	/**
	 * Returns the last X coordinate in pixels of the cursor over the canvas, relative to the canvas.
	 * see also {@link CopperLicht.OnMouseDown} and {@link CopperLicht.OnMouseUp}.
	 * @public
	 */
	getMouseX() {
		return this.MouseX;
	}

	/**
	 * Returns the last Y coordinate in pixels of the cursor over the canvas, relative to the canvas.
	 * see also {@link CopperLicht.OnMouseDown} and {@link CopperLicht.OnMouseUp}.
	 * @public
	 */
	getMouseY() {
		return this.MouseY;
	}

	/**
	 * Returns if the mouse is currently pressed over the canvas.
	 * @public
	 */
	isMouseDown() {
		return this.MouseIsDown;
	}

	/**
	 * Returns the last X coordinate where the mouse was pressed over the canvas.
	 * see also {@link CopperLicht.OnMouseDown} and {@link CopperLicht.OnMouseUp}.
	 * @public
	 */
	getMouseDownX() {
		return this.MouseDownX;
	}

	/**
	 * Returns the last Y coordinate where the mouse was pressed over the canvas.
	 * see also {@link CopperLicht.OnMouseDown} and {@link CopperLicht.OnMouseUp}.
	 * @public
	 */
	getMouseDownY() {
		return this.MouseDownY;
	}

	/**
	 * @public
	 */
	setMouseDownWhereMouseIsNow() {
		if (this.isInPointerLockMode()) {
			this.MouseMoveX = 0;
			this.MouseMoveY = 0;
		}

		else {
			this.MouseDownX = this.MouseX;
			this.MouseDownY = this.MouseY;
		}
	}

	/**
	 * When CopperLicht is created, it will register the onmouseup event of the canvas with this function.
	 * If you need to handle it yourself, you should call this function with the event parameter so
	 * that all animators still work correctly.
	 * @public
	 */
	handleMouseUp(evt) {
		this.MouseIsDown = false;

		var scene = this.getScene();
		if (scene == null)
			return false;

		if (evt) {
			this.MouseX = this.getMousePosXFromEvent(evt);
			this.MouseY = this.getMousePosYFromEvent(evt);
		}

		var handledByUser = false;
		if (this.OnMouseUp)
			handledByUser = this.OnMouseUp();

		if (!handledByUser) {
			var cam = scene.getActiveCamera();
			if (cam != null)
				cam.onMouseUp(evt);

			//console.log("MouseUp " + this.MouseDownX + " " + this.MouseDownY);
			scene.postMouseUpToAnimators(evt);
		}

		return this.handleEventPropagation(evt, true);
	}
	sendMouseWheelEvent(delta) {
		var scene = this.getScene();
		if (scene == null)
			return;

		var cam = scene.getActiveCamera();
		if (cam != null)
			cam.onMouseWheel(delta);

		scene.postMouseWheelToAnimators(delta);
	}
	handleMouseWheel(evt) {
		if (!evt) evt = event;
		if (!evt) return;
		var delta = (evt.detail < 0 || evt.wheelDelta > 0) ? 1 : -1;

		this.sendMouseWheelEvent(delta);
	}

	/**
	 * When CopperLicht is created, it will register the onmousemove event of the canvas with this function.
	 * If you need to handle it yourself, you should call this function with the event parameter so
	 * that all animators still work correctly.
	 * @public
	 */
	handleMouseMove(evt) {
		if (this.isInPointerLockMode()) {
			this.MouseMoveX = (evt['movementX'] || evt['mozMovementX'] || evt['webkitMovementX'] || 0);
			this.MouseMoveY = (evt['movementY'] || evt['mozMovementY'] || evt['webkitMovementY'] || 0);
		}

		if (evt) {
			this.MouseX = this.getMousePosXFromEvent(evt);
			this.MouseY = this.getMousePosYFromEvent(evt);
		}

		var scene = this.getScene();
		if (scene == null)
			return false;

		//console.log("MouseMove " + this.MouseX + " " + this.MouseY);
		var cam = scene.getActiveCamera();
		if (cam != null)
			cam.onMouseMove(evt);

		scene.postMouseMoveToAnimators(evt);

		return this.handleEventPropagation(evt, true);
	}

	/**
	 * Returns a 3D point from a 2D pixel coordinate on the screen. Note: A 2D position on the screen does not represent one
	 * single 3D point, but a actually a 3d line. So in order to get this line, use the 3d point returned by this function and the position
	 * of the current camera to form this line.
	 * @param x {Number} x coordinate on the canvas. You can use {@link CopperLicht.getMouseX} for the current mouse cursor position.
	 * @param y {Number} y coordinate on the canvas. You can use {@link CopperLicht.getMouseY} for the current mouse cursor position.
	 * @returns {CL3D.Vect3d} returns a 3d vector as described above, or null if not possible to do this calculation (for example if the browser
	 * does not support WebGL).
	 * @public
	 */
	get3DPositionFrom2DPosition(x, y) {
		var r = this.TheRenderer;
		if (r == null)
			return null;

		var proj = r.getProjection();
		var view = r.getView();

		if (proj == null || view == null)
			return null;

		var viewProjection = proj.multiply(view);
		var frustrum = new CL3D.ViewFrustrum();
		frustrum.setFrom(viewProjection); // calculate view frustum planes

		var farLeftUp = frustrum.getFarLeftUp();
		var lefttoright = frustrum.getFarRightUp().substract(farLeftUp);
		var uptodown = frustrum.getFarLeftDown().substract(farLeftUp);

		var w = r.getWidth();
		var h = r.getHeight();

		var dx = x / w;
		var dy = y / h;

		var ret = farLeftUp.add(lefttoright.multiplyWithScal(dx)).add(uptodown.multiplyWithScal(dy));
		return ret;
	}

	/**
	 * Returns the 2D pixel position on the screen from a 3D position. Uses the current projection and view matrices stored in the renderer,
	 * so the 3d scene should have been rendered at least once before to return a correct result.
	 * @public
	 * @param {CL3D.Vect3d} pos3d 3d position as {@link Vect3d}.
	 * @return {CL3D.Vect2d} returns a 2d position as {@link Vect2d} if a 2d pixel position can be found, and null if not (if the pixel would be behind the screen, for example).
	 */
	get2DPositionFrom3DPosition(pos3d) {
		var mat = new CL3D.Matrix4(false);
		var r = this.TheRenderer;
		if (!r.Projection)
			return null;

		r.Projection.copyTo(mat);
		mat = mat.multiply(r.View);
		//mat = mat.multiply(World);
		var hWidth = r.getWidth() / 2;
		var hHeight = r.getHeight() / 2;
		var render2DTranslationX = hWidth;
		var render2DTranslationY = hHeight;

		if (hHeight == 0 || hWidth == 0)
			return null;

		var v4df = new CL3D.Vect3d(pos3d.X, pos3d.Y, pos3d.Z);
		v4df['W'] = 1;

		mat.multiplyWith1x4Matrix(v4df);
		var zDiv = v4df['W'] == 0.0 ? 1.0 : (1.0 / v4df['W']);

		if (v4df.Z < 0)
			return null;

		var ret = new CL3D.Vect2d();

		ret.X = hWidth * (v4df.X * zDiv) + render2DTranslationX;
		ret.Y = render2DTranslationY - (hHeight * (v4df.Y * zDiv));

		return ret;
	}

	/**
	 * @public
	 */
	setActiveCameraNextFrame(cam) {
		if (cam == null)
			return;

		this.NextCameraToSetActive = cam;
	}

	/**
	 * Returns the {@link TextureManager} used to load textures.
	 * @public
	 * @returns {CL3D.TextureManager} returns the reference to the used texture manager.
	 */
	getTextureManager() {
		return this.TheTextureManager;
	}

	/**
	 * @public
	 * @param n: Current scene node
	 * @param {CL3D.TriangleSelector} world: TriangleSelector
	 */
	setCollisionWorldForAllSceneNodes(n, world) {
		if (!n)
			return;

		for (var ai = 0; ai < n.Animators.length; ++ai) {
			var coll = n.Animators[ai];
			if (coll) {
				if (coll.getType() == 'collisionresponse')
					coll.setWorld(world);

				else {
					if (coll.getType() == 'onclick' || coll.getType() == 'onmove')
						coll.World = world;

					else if (coll.getType() == 'gameai')
						coll.World = world;

					else if (coll.getType() == '3rdpersoncamera')
						coll.World = world;
				}
			}
		}

		for (var i = 0; i < n.Children.length; ++i) {
			var c = n.Children[i];
			if (c)
				this.setCollisionWorldForAllSceneNodes(c, world);
		}
	}

	/**
	 * Reloads a scene, triggered only by the CopperCube Action 'RestartScene'
	 * @param {String} sceneName The new CL3D.Scene to be reloaded.
	 * @public
	 */
	reloadScene(sceneName) {
		if (!sceneName || !gDocument)
			return false;

		if (this.LastLoadedFileContent == null)
			return false;

		var scene = null;
		var sceneidx = -1;

		for (var i = 0; i < gDocument.Scenes.length; ++i) {
			if (sceneName == gDocument.Scenes[i].Name) {
				sceneidx = i;
				scene = gDocument.Scenes[i];
				break;
			}
		}

		if (sceneidx == -1)
			return false;

		var loader = new CL3D.FlaceLoader();
		var newscene = loader.reloadScene(this.LastLoadedFileContent, scene, sceneidx,
			this.LastLoadedFilename, this.TheTextureManager, this.TheMeshCache, this);

		if (newscene != null) {
			var currentlyActive = gDocument.getCurrentScene() == scene;

			// replace old scene with new scene
			gDocument.Scenes[sceneidx] = newscene;

			// restart the scene if it is currently active
			if (currentlyActive)
				this.gotoScene(newscene);
		}

		return true;
	}

	/**
	 * @public
	 * Updates the loading dialog if it is existing
	 */
	updateLoadingDialog() {
		if (!this.LoadingAFile && !this.WaitingForTexturesToBeLoaded) {
			this.LoadingDialog.style.display = 'none';
			this.LoadingDialog = null;
		}
	}

	/**
	 * @public
	 * Creates a nicely looking loading dialog, with the specified loading text
	 */
	createTextDialog(forLoadingDlg, text, loadingScreenBackgroundColor) {
		if (this.MainElement == null)
			return;

		if (this.fullpage) {
			this.MainElement.setAttribute("width", String(globalThis.innerWidth));
			this.MainElement.setAttribute("height", String(globalThis.innerHeight));
		}

		var dlg_div = document.createElement("div");
		this.MainElement.parentNode.appendChild(dlg_div);

		var dlg = document.createElement("div");

		this.updateCanvasTopLeftPosition();
		var w = 200;
		var h = forLoadingDlg ? 23 : 100;
		var paddingleft = forLoadingDlg ? 30 : 0;
		var x = this.CanvasTopLeftX + ((this.MainElement.width - w) / 2);
		var y = this.CanvasTopLeftY + (this.MainElement.height / 2);

		if (!forLoadingDlg)
			y += 30;

		var containsLogo = forLoadingDlg && text.indexOf('<img') != -1;

		text = text.replace('$PROGRESS$', '');

		var content = '';

		if (containsLogo) {
			// force preload image
			var li = new Image();
			this.LoadingImage = li;
			var imgsrcPos = text.indexOf('src="');
			var imgurl = text.substring(imgsrcPos + 5, text.indexOf('"', imgsrcPos + 5));
			li.src = imgurl;

			// loading screen with logo image
			var bgColor = "#000000";
			if (typeof loadingScreenBackgroundColor !== "undefined")
				bgColor = loadingScreenBackgroundColor;

			dlg.style.cssText = "position: absolute; left:" + this.CanvasTopLeftX + "px; top:" + this.CanvasTopLeftY + "px; color:#ffffff; padding:5px; height:" + this.MainElement.height + "px; width:" + this.MainElement.width + "px; background-color:" + bgColor + ";";

			content = "<div style=\"position: relative; top: 50%;  transform: translateY(-50%);\">" + text + "</div>";
		}

		else {
			// normal dialog
			dlg.style.cssText = "position: absolute; left:" + x + "px; top:" + y + "px; color:#ffffff; padding:5px; background-color:#000000; height:" + h + "px; width:" + w + "px; border-radius:5px; border:1px solid #777777;  opacity:0.5;";

			content = "<p style=\"margin:0; padding-left:" + paddingleft + "px; padding-bottom:5px;\">" + text + "</p> ";

			if (forLoadingDlg && !containsLogo)
				content += "<img style=\"position:absolute; left:5px; top:3px;\" src=\"scenes/copperlichtdata/loading.gif\" />";
		}

		dlg.innerHTML = content;

		dlg_div.appendChild(dlg);

		if (forLoadingDlg)
			this.LoadingDialog = dlg_div;
	}

	/**
	 * @public
	 * Enables pointer lock after fullscreen change, if whished
	 */
	onFullscreenChanged() {
		// request pointer lock
		if (this.requestPointerLockAfterFullscreen) {
			this.requestPointerLock();
		}
	}

	/**
	 * @public
	 * Notifies the engine if a pointer lock was used
	 */
	requestPointerLock() {
		const canvas = this.MainElement;

		if (canvas) {
			canvas.requestPointerLock =
				canvas['requestPointerLock'] ||
				canvas['mozRequestPointerLock'] ||
				canvas['webkitRequestPointerLock'];

			canvas.requestPointerLock();
		}
	}

	/**
	 * @public
	 * Notifies the engine if a pointer lock was used
	 */
	onPointerLockChanged() {
		const canvas = this.MainElement;

		if (document['PointerLockElement'] === canvas ||
			document['pointerLockElement'] === canvas ||
			document['mozPointerLockElement'] === canvas ||
			document['webkitPointerLockElement'] === canvas) {
			// pointer locked
			this.pointerIsCurrentlyLocked = true;
		}

		else {
			// pointer lock lost
			this.pointerIsCurrentlyLocked = false;
		}
	}

	/**
	 * @public
	 * Handlers for pointer lock and fullscreen change
	 */
	setupEventHandlersForFullscreenChange() {
		const me = this;
		const fullscreenChange = () => { me.onFullscreenChanged(); };
		const pointerLockChange = () => { me.onPointerLockChanged(); };

		document.addEventListener('fullscreenchange', fullscreenChange, false);
		document.addEventListener('mozfullscreenchange', fullscreenChange, false);
		document.addEventListener('webkitfullscreenchange', fullscreenChange, false);

		document.addEventListener('pointerlockchange', pointerLockChange, false);
		document.addEventListener('mozpointerlockchange', pointerLockChange, false);
		document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
	}

	/**
	 * Switches to fullscreen and locks the pointer if wanted. Note: This function must be called in reaction of a user interaction,
	 * otherwise the browser will ignore this. The best is to call it from the event handler of for example an onClick even of a button.
	 * @public
	 * @param withPointerLock If set to 'true', the mouse pointer will be locked, otherwise the app only switches to full screen.
	 * @param elementToSetToFullsceen the element which should be fullscreen. Set this to null to make the canvas fullscreen. But you can also
	 * set it to - for example - the parent of the canvas for showing some more info.
	 */
	switchToFullscreen(withPointerLock, elementToSetToFullsceen) {
		if (elementToSetToFullsceen == null)
			elementToSetToFullsceen = this.MainElement;

		this.requestPointerLockAfterFullscreen = withPointerLock;

		elementToSetToFullsceen.requestFullscreen = elementToSetToFullsceen.requestFullscreen ||
			elementToSetToFullsceen.mozRequestFullscreen ||
			elementToSetToFullsceen.mozRequestFullScreen || // Older API upper case 'S'.
			elementToSetToFullsceen.msRequestFullscreen ||
			elementToSetToFullsceen.webkitRequestFullscreen;
		elementToSetToFullsceen.requestFullscreen();
	}

	/**
	 * @public
	 * Internal video playback handler
	 */
	getOrCreateVideoStream(filename, createIfNotFound, handlerOnVideoEnded, handlerOnVideoFailed) {
		for (var i = 0; i < this.playingVideoStreams.length; ++i) {
			var v = this.playingVideoStreams[i];
			if (v.filename == filename)
				return v;
		}

		if (createIfNotFound) {
			var nv = new CL3D.VideoStream(filename, this.TheRenderer);
			nv.handlerOnVideoEnded = handlerOnVideoEnded;
			nv.handlerOnVideoFailed = handlerOnVideoFailed;

			this.playingVideoStreams.push(nv);

			return nv;
		}

		return null;
	}

	/**
	 * @public
	 * update all video streams
	 */
	updateAllVideoStreams() {
		var aVideoIsPlaying = false;

		for (var i = 0; i < this.playingVideoStreams.length; ++i) {
			var v = this.playingVideoStreams[i];

			// update
			v.updateVideoTexture();

			// execute action on end if ended
			if (v.hasPlayBackEnded()) {
				if (v.handlerOnVideoEnded != null && !v.isError) {
					var s = this.getScene();
					v.handlerOnVideoEnded.execute(s.getRootSceneNode(), s);
					v.handlerOnVideoEnded = null;
				}

				if (v.handlerOnVideoFailed != null && v.isError) {
					var s = this.getScene();
					v.handlerOnVideoFailed.execute(s.getRootSceneNode(), s);
					v.handlerOnVideoFailed = null;
				}

				// remove
				this.playingVideoStreams.splice(i, 1);
				--i;
			}

			else
				aVideoIsPlaying = true;
		}

		return aVideoIsPlaying;
	}
};
