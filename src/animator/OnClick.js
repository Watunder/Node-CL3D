//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "../main.js";

/**
 * Scene node animator which invokes a callback function when the scene node has been clicked.
 * <b>Note</b>: In this version, only bounding box checks are working, this will change in one of the next releases.
 * It works like in this example:
 * @example
 * var yourFunction = function(){ alert('your scene node has been clicked!'); }
 * var animator = new CL3D.AnimatorOnClick(engine.getScene(), engine, yourFunction);
 * yourSceneNode.addAnimator(animator);
 * @constructor
 * @public
 * @extends CL3D.Animator
 * @class  Scene node animator which invokes a callback function when the scene node has been clicked.
 * @param scene {CL3D.Scene} The scene of the animator.
 * @param engine {CL3D.CopperLicht} an instance of the 3d engine
 * @param functionToCall {function} a function which should be called when the scene node has been clicked
 * @param register {Boolean} (optional) set to true to prevent registering at the scene using registerSceneNodeAnimatorForEvents
 */
export class AnimatorOnClick extends CL3D.Animator {
	constructor(scene, engine, functionToCall, donotregister) {
		super();

		this.engine = engine;
		this.TimeLastClicked = 0;
		this.Registered = false;
		this.LastUsedSceneNode = null;
		this.SMGr = scene;
		this.FunctionToCall = functionToCall;
		this.LastTimeDoneSomething = false;
		this.BoundingBoxTestOnly = true;
		this.CollidesWithWorld = false;
		this.TheActionHandler = null;
		this.World = null;
		this.TheObject = null;

		if (!(donotregister == true))
			scene.registerSceneNodeAnimatorForEvents(this);
	}

	/**
	 * Returns the type of the animator.
	 * For the AnimatorOnClick, this will return 'onclick'.
	 * @public
	 */
	getType() {
		return 'onclick';
	}

	/**
	 * @private
	 */
	createClone(node, newManager, oldNodeId, newNodeId) {
		var a = new CL3D.AnimatorOnClick(this.SMGr, this.engine);
		a.BoundingBoxTestOnly = this.BoundingBoxTestOnly;
		a.CollidesWithWorld = this.CollidesWithWorld;
		a.TheActionHandler = this.TheActionHandler ? this.TheActionHandler.createClone(oldNodeId, newNodeId) : null;
		a.World = this.World;
		return a;
	}

	/**
	 * Animates the scene node it is attached to and returns true if scene node was modified.
	 * @public
	 * @param {CL3D.SceneNode} n The Scene node which needs to be animated this frame.
	 * @param {Integer} timeMs The time in milliseconds since the start of the scene.
	 */
	animateNode(n, timeMs) {
		this.TheObject = n;
		var done = this.LastTimeDoneSomething;
		this.LastTimeDoneSomething = false;
		return done;
	}

	/**
	 * @private
	 */
	onMouseDown(event) {
		var n = this.TheObject;
		if (!n)
			return false;

		if (!(n.scene === this.SMGr))
			return false;

		if (event.button == 2) {
			return false;
		}

		var now = CL3D.CLTimer.getTime();

		if (now - this.engine.LastCameraDragTime < 250)
			return false;

		var x = this.engine.getMousePosXFromEvent(event);
		var y = this.engine.getMousePosYFromEvent(event);

		if (this.engine.isInPointerLockMode()) {
			var renderer = this.SMGr.getLastUsedRenderer();
			if (!renderer)
				return false;
			x = renderer.getWidth() / 2;
			y = renderer.getHeight() / 2;
		}

		if (this.TheObject.Parent == null) {
			// object seems to be deleted 
			this.TheObject = null;
			return false;
		}

		if (n.isActuallyVisible() &&
			this.isOverNode(n, x, y)) {
			this.LastTimeDoneSomething = true;

			if (this.FunctionToCall)
				this.FunctionToCall();

			this.SMGr.forceRedrawNextFrame(); // the animate might not be recalled after this element has been made invisible in this invokeAction()
			return true;
		}
	}

	/**
	 * @private
	 */
	onMouseUp(event) {
		var n = this.TheObject;
		if (!n)
			return false;

		if (!(n.scene === this.SMGr))
			return false;

		if (event.button == 2) {
			return false;
		}

		var now = CL3D.CLTimer.getTime();

		if (now - this.engine.LastCameraDragTime < 250)
			return false;

		var x = this.engine.getMousePosXFromEvent(event);
		var y = this.engine.getMousePosYFromEvent(event);

		if (this.engine.isInPointerLockMode()) {
			var renderer = this.SMGr.getLastUsedRenderer();
			if (!renderer)
				return false;
			x = renderer.getWidth() / 2;
			y = renderer.getHeight() / 2;
		}

		if (this.TheObject.Parent == null) {
			// object seems to be deleted 
			this.TheObject = null;
			return false;
		}

		if (n.isActuallyVisible() &&
			this.isOverNode(n, x, y)) {
			this.LastTimeDoneSomething = true;

			this.invokeAction(n);

			this.SMGr.forceRedrawNextFrame(); // the animate might not be recalled after this element has been made invisible in this invokeAction()
			return true;
		}
	}

	/**
	 * @private
	 */
	invokeAction(node) {
		if (this.TheActionHandler)
			this.TheActionHandler.execute(node);
	}

	/**
	 * @private
	 */
	isOverNode(node, positionX, positionY) {
		if (node == null)
			return false;

		positionX *= this.engine.DPR;
		positionY *= this.engine.DPR;

		if (node.getType() == '2doverlay') {
			var r = node.getScreenCoordinatesRect(false, this.engine.getRenderer());
			if (r.x <= positionX && r.y <= positionY &&
				r.x + r.w >= positionX &&
				r.y + r.h >= positionY) {
				return true;
			}
		}

		var posRayEnd = this.engine.get3DPositionFrom2DPosition(positionX, positionY);
		if (posRayEnd == null)
			return false;

		var cam = this.SMGr.getActiveCamera();
		if (cam == null)
			return false;

		var campos = cam.getAbsolutePosition();

		var ray = new CL3D.Line3d();
		ray.Start = campos;
		ray.End = posRayEnd;

		return this.static_getCollisionDistanceWithNode(this.SMGr, node, ray, this.BoundingBoxTestOnly, this.CollidesWithWorld, this.World, null);
	}

	/**
	 * @private
	 */
	static_getDistanceToNearestCollisionPointWithWorld(smgr, begin, end, world, ignoreInvisibleItems) {
		var maxdist = 999999999999.0;

		if (!world || !smgr)
			return maxdist;

		var collisionPoint = world.getCollisionPointWithLine(begin, end, true, null, ignoreInvisibleItems);
		if (collisionPoint) {
			return begin.getDistanceTo(collisionPoint);
		}

		return maxdist;
	}

	/**
	 * @private
	 */
	getDistanceToNearestCollisionPointWithWorld(begin, end) {
		return this.static_getDistanceToNearestCollisionPointWithWorld(this.SMGr, begin, end, this.World, true);
	}
	
	/**
	 * @private
	 * returns true if collides (and no wall between), false if not
	 */
	static_getCollisionDistanceWithNode(smgr, node, ray, bBoundingBoxTestOnly, collidesWithWorld,
		world, outDistance) {
		var box = node.getBoundingBox();
		var distance = 0; // temporary variable

		var mat = new CL3D.Matrix4(false);
		if (node.AbsoluteTransformation.getInverse(mat)) {
			if (box.intersectsWithLine(mat.getTransformedVect(ray.Start), mat.getTransformedVect(ray.End))) {
				// the click was inside the bounding box 
				//Debug.print("Click was in BB!");
				var meshSceneNode = null;
				if (node.getMesh && node.OwnedMesh) meshSceneNode = node; // instead of checking for the type, we are checking for the method, that should be enough

				var bDoBoundingBoxTestOnly = (meshSceneNode == null) || bBoundingBoxTestOnly;

				if (!bDoBoundingBoxTestOnly) {
					var selector = meshSceneNode.Selector;

					if (selector == null) {
						// create and cache triangle selector
						if (meshSceneNode.OwnedMesh && meshSceneNode.OwnedMesh.GetPolyCount() > 100)
							selector = new CL3D.OctTreeTriangleSelector(meshSceneNode.OwnedMesh, meshSceneNode, 0);

						else
							selector = new CL3D.MeshTriangleSelector(meshSceneNode.OwnedMesh, meshSceneNode);

						meshSceneNode.Selector = selector;
					}

					if (selector) {
						var collisionPoint = selector.getCollisionPointWithLine(ray.Start, ray.End, true, null, true);

						if (collisionPoint != null) {
							// collision found!
							if (collidesWithWorld) {
								// test if there is a wall of the world between us and the collision point
								distance = this.static_getDistanceToNearestCollisionPointWithWorld(smgr, ray.Start, collisionPoint, world, true);
								var collisionDistance = collisionPoint.getDistanceTo(ray.Start);

								if (distance + CL3D.TOLERANCE < collisionDistance) {
									return false; // a wall was between us 
								}

								else {
									if (outDistance != null)
										outDistance.N = collisionPoint.getDistanceTo(ray.Start);

									return true; // no wall between us, collision ok
								}
							}

							else {
								// no world collision wanted, we are done here
								if (outDistance != null)
									outDistance.N = ray.Start.getDistanceTo(node.getTransformedBoundingBox().getCenter());

								return true;
							}
						}
						//else
						//	Debug.print("no colluided with geometry!");
					}

					else {
						// no selector possible, but it collided with the bounding box.
						// so check below for collision with world before this one.
						bDoBoundingBoxTestOnly = true;
					}

				}


				if (bDoBoundingBoxTestOnly) {
					if (!collidesWithWorld) {
						// no world collision wanted, we are done here
						if (outDistance != null)
							outDistance.N = ray.Start.getDistanceTo(node.getTransformedBoundingBox().getCenter());

						return true;
					}

					else {
						// test if there is a wall of the world between us and the collision point on the
						// bounding box
						var rayworldteststart = ray.Start.clone();
						box = node.getTransformedBoundingBox();
						var extend = box.getExtent();
						extend.multiplyThisWithScal(0.5);

						var maxradius = CL3D.max3(extend.X, extend.Y, extend.Z);
						maxradius = Math.sqrt((maxradius * maxradius) + (maxradius * maxradius));

						var rayworldtestend = node.getTransformedBoundingBox().getCenter();

						distance = this.static_getDistanceToNearestCollisionPointWithWorld(smgr, rayworldteststart, rayworldtestend, world, true);
						var raytestlen = rayworldtestend.getDistanceTo(rayworldteststart) - maxradius;

						if (distance < raytestlen)
							return false; // a wall was between us 

						else {
							if (outDistance != null)
								outDistance.N = raytestlen;

							return true; // no wall between us, collision ok
						}
					}
				}
			}
		}

		return false;
	}

	/**
	 * @private
	 */
	findActionByType(type) {
		if (this.TheActionHandler)
			return this.TheActionHandler.findAction(type);

		return null;
	}
};
