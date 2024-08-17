//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "../main.js";

/**
 * The scene is usually rendered from the currently active camera. Some cameras have an {@link Animator} attached to
 * them which controlls the position and look target of the camera, for example a {@link AnimatorCameraFPS}. You can 
 * get access to this animator using camera.getAnimatorOfType('camerafps');. 
 * @class Scene Node which is a (controlable) camera.
 * @constructor
 * @extends CL3D.SceneNode
 * @public
 */
export class CameraSceneNode extends CL3D.SceneNode {
	constructor() {
		super();

		this.init();

		this.Box = new CL3D.Box3d();
		this.DoesCollision = false;
		this.Active = false;

		this.Target = new CL3D.Vect3d(0, 0, 10);
		this.UpVector = new CL3D.Vect3d(0, 1, 0);
		this.Projection = new CL3D.Matrix4();
		this.ViewMatrix = new CL3D.Matrix4();

		this.Fovy = CL3D.PI / 2.5; // Field of view, in radians. 
		this.Aspect = 4.0 / 3.0; // Aspect ratio. 
		this.ZNear = 0.1; // value of the near view-plane. 
		this.ZFar = 3000; // Z-value of the far view-plane.
		this.TargetAndRotationAreBound = true;
		this.AutoAdjustAspectratio = true;
		this.ViewMatrixIsSetByUser = false;

		//this.recalculateProjectionMatrix();
		//this.recalculateViewArea();
	}
	/**
	 * @public
	 */
	recalculateProjectionMatrix() {
		this.Projection.buildProjectionMatrixPerspectiveFovLH(this.Fovy, this.Aspect, this.ZNear, this.ZFar);
		// TODO: 0.05?
		// this.viewVolume = screen.width / globalThis.innerWidth * 0.05;
		// this.Projection.buildProjectionMatrixPerspectiveOrthoLH(globalThis.innerWidth * this.viewVolume, globalThis.innerHeight * this.viewVolume, this.ZNear, this.ZFar);
	}
	/**
	 * Returns the type string of the scene node.
	 * Returns 'camera' for the camera scene node.
	 * @public
	 * @returns {String} type name of the scene node.
	 */
	getType() {
		return 'camera';
	}
	/**
	 * Sets the aspect ratio of the camera. The default is 4 / 3
	 * @public
	 */
	setAspectRatio(a) {
		if (!CL3D.equals(this.Aspect, a)) {
			this.AutoAdjustAspectratio = false;
			this.Aspect = a;
			this.recalculateProjectionMatrix();
		}
	}
	/**
	 * Gets the aspect ratio of the camera. The default is 4 / 3
	 * @public
	 */
	getAspectRatio() {
		return this.Aspect;
	}
	/**
	 * Gets the field of view of the camera. Field of view is measured in radians.
	 * @public
	 */
	getFov() {
		return this.Fovy;
	}
	/**
	 * Sets the field of view of the camera. Field of view is measured in radians.
	 * @public
	 */
	setFov(fov) {
		if (!CL3D.equals(this.Fovy, fov)) {
			if (isNaN(fov))
				return;

			this.Fovy = fov;
			this.recalculateProjectionMatrix();
		}
	}
	/**
	 * Sets target position of the camera.
	 * @param {CL3D.Vect3d} target new target position of the camera.
	 * @public
	 */
	setTarget(target) {
		if (target) {
			this.Target = target.clone();

			if (this.TargetAndRotationAreBound) {
				this.updateAbsolutePosition(); // if we don't update the absolute position before, children attached to the camera won't move correctly
				this.Rot = target.substract(this.getAbsolutePosition()).getHorizontalAngle();
			}
		}
	}
	/**
	 * Sets target position of the camera.
	 * @returns {CL3D.Vect3d} Target position of the camera.
	 * @public
	 */
	getTarget() {
		return this.Target;
	}
	/**
	 * Returns the up vector of the camera. The default is (0,1,0), pointing up.
	 * @returns {CL3D.Vect3d} Up vector of the camera.
	 * @public
	 */
	getUpVector() {
		return this.UpVector;
	}
	/**
	 * Sets up vector of the camera, a direction pointing to where 'up' is. Default is (0,1,0)
	 * @param {CL3D.Vect3d} upvector new up vector of the camera.
	 * @public
	 */
	setUpVector(upvector) {
		if (upvector)
			this.UpVector = upvector.clone();
	}
	/**
	 * Gets the value of the near plane of the camera. All geometry before this plane is clipped away.
	 * @default 0.1
	 * @public
	 */
	getNearValue() {
		return this.ZNear;
	}
	/**
	 * Sets the value of the near plane of the camera. All geometry before this plane is clipped away.
	 * @default 0.1
	 * @public
	 */
	setNearValue(nv) {
		if (!CL3D.equals(this.ZNear, nv)) {
			this.ZNear = nv;
			this.recalculateProjectionMatrix();
		}
	}
	/**
	 * Gets the value of the far plane of the camera. All geometry behind this plane is clipped away.
	 * @default 3000
	 * @public
	 */
	getFarValue() {
		return this.ZFar;
	}
	/**
	 * Sets the value of the far plane of the camera. All geometry behind this plane is clipped away.
	 * @default 3000
	 * @public
	 */
	setFarValue(nv) {
		if (!CL3D.equals(this.ZFar, nv)) {
			this.ZFar = nv;
			this.recalculateProjectionMatrix();
		}
	}
	/**
	 * @public
	 */
	recalculateViewArea() {
		// TODO: implement
	}
	/**
	 * @public
	 */
	OnAnimate(mgr, timeMs) {
		// old, simple version:
		//var ret:Boolean = super.OnAnimate(mgr, timeMs);
		//ViewMatrix.buildCameraLookAtMatrixLH(Pos, Target, UpVector);
		//recalculateViewArea();
		//return ret;
		// new, more valid version
		//var ret = super.OnAnimate(mgr, timeMs);
		var ret = CL3D.SceneNode.prototype.OnAnimate.call(this, mgr, timeMs);

		if (!this.ViewMatrixIsSetByUser)
			this.calculateViewMatrix();

		return ret;
	}
	/**
	 * @public
	 */
	calculateViewMatrix() {
		var pos = this.getAbsolutePosition();
		var targetToSet = this.Target.clone();
		if (pos.equals(targetToSet))
			targetToSet.X += 1;

		this.ViewMatrix.buildCameraLookAtMatrixLH(pos, targetToSet, this.UpVector);
		this.recalculateViewArea();
	}
	/**
	 * @public
	 */
	OnRegisterSceneNode(mgr) {
		if (mgr.getActiveCamera() === this) {
			mgr.registerNodeForRendering(this, 2); //REGISTER_MODE_CAMERA);
			CL3D.SceneNode.prototype.OnRegisterSceneNode.call(this, mgr);
		}
	}
	/**
	 * @public
	 */
	render(renderer) {
		// we need to rebuild the camera lookat matrix again because the user might have changed 
		// the camera position, target or upvector in OnBeforeDraw
		if (!this.ViewMatrixIsSetByUser)
			this.calculateViewMatrix();

		// if auto aspect, set now
		if (this.Aspect == 0 || this.AutoAdjustAspectratio) {
			this.setAutoAspectIfNoFixedSet(renderer.width, renderer.height);
			if (this.Aspect == 0)
				this.setAspectRatio(3.0 / 4.0);
		}

		// render finally
		renderer.setProjection(this.Projection);
		renderer.setView(this.ViewMatrix);
	}
	/**
	 * @public
	 */
	onMouseDown(event) {
		for (var i = 0; i < this.Animators.length; ++i) {
			this.Animators[i].onMouseDown(event);
		}
	}
	/**
	 * @public
	 */
	onMouseWheel(delta) {
		for (var i = 0; i < this.Animators.length; ++i) {
			this.Animators[i].onMouseWheel(delta);
		}
	}
	/**
	 * @public
	 */
	onMouseUp(event) {
		for (var i = 0; i < this.Animators.length; ++i) {
			this.Animators[i].onMouseUp(event);
		}
	}
	/**
	 * @public
	 */
	onMouseMove(event) {
		for (var i = 0; i < this.Animators.length; ++i) {
			this.Animators[i].onMouseMove(event);
		}
	}
	/**
	 * @public
	 */
	onKeyDown(event) {
		var ret = false;

		for (var i = 0; i < this.Animators.length; ++i) {
			if (this.Animators[i].onKeyDown(event))
				ret = true;
		}

		return ret;
	}
	/**
	 * @public
	 */
	onKeyUp(event) {
		var ret = false;

		for (var i = 0; i < this.Animators.length; ++i) {
			if (this.Animators[i].onKeyUp(event))
				ret = true;
		}

		return ret;
	}
	/**
	 * Creates a clone of the camera.
	 * @public
	 * @param {CL3D.SceneNode} newparent The new parent of the clone. Must be a scene node as well.
	 */
	createClone(newparent, oldNodeId, newNodeId) {
		var c = new CL3D.CameraSceneNode();
		this.cloneMembers(c, newparent, oldNodeId, newNodeId);

		if (this.Target)
			c.Target = this.Target.clone();

		if (this.UpVector)
			c.UpVector = this.UpVector.clone();

		if (this.Projection)
			c.Projection = this.Projection.clone();

		if (this.ViewMatrix)
			c.ViewMatrix = this.ViewMatrix.clone();

		c.Fovy = this.Fovy;
		c.Aspect = this.Aspect;
		c.ZNear = this.ZNear;
		c.ZFar = this.ZFar;

		if (this.Box)
			c.Box = this.Box.clone();

		return c;
	}
	/**
	 * @public
	 */
	setAutoAspectIfNoFixedSet(viewPortWidth, viewPortHeight) {
		if (viewPortWidth == 0 || viewPortHeight == 0)
			return;

		var casp = this.Aspect;

		if (!CL3D.equals(casp, 0) && !this.AutoAdjustAspectratio) {
			// preset aspect ratio in the editor
			return;
		}

		var newaspect = viewPortWidth / viewPortHeight;

		this.setAspectRatio(newaspect);
		this.AutoAdjustAspectratio = true;
	}
};
