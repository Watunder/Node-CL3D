//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "../main.js";

/**
 * Special scene node animator making cameras user controlled model viewrs around a pivot point on a fixed radius.
 * This scene node animator can be attached to a {@link CameraSceneNode} to make it act like a user controlled model viewer.
 * Simply set the target of the camera to the pivot point and attach this animator to make it work.
 * @constructor
 * @public
 * @extends CL3D.Animator
 * @class Special scene node animator for model viewer cameras. 
 */
export class AnimatorCameraModelViewer extends CL3D.Animator {
	/**
	 * Rotation speed of the camera
	 * @public
	 * @type Number
	 * @default 0.06
	 */
	RotateSpeed = 0.06;

	/**
	 * Radius of the camera
	 * @default 100
	 * @public
	 * @type Number
	 */
	Radius = 100;

	/**
	 * Defines if the animator may only move the camera horizontally
	 * @default false
	 * @public
	 * @type Boolean
	 */
	NoVerticalMovement = false;

	/**
 	 * @param {CL3D.CameraSceneNode} cam an instance of a {@link CameraSceneNode} this animator will be attached to. Can be null if the camera is not yet known.
 	 * @param {CL3D.CopperLicht} engine An instance of the {@link CopperLicht} 3d engine, for receiving the mouse and keyboard input.
	 */
	constructor(cam, engine) {
		super();

		this.Type = -1;

		this.RotateSpeed = 10000;
		this.Radius = 100;
		this.NoVerticalMovement = false;

		this.lastAnimTime = CL3D.CLTimer.getTime();
		this.Camera = cam;
		this.CursorControl = engine;

		this.SlideAfterMovementEnd = false;
		this.SlidingSpeed = 0;
		this.SlidingMoveX = 0;
		this.SlidingMoveY = 0;

		this.AllowZooming = false;
		this.MinZoom = 0;
		this.MaxZoom = 0;
		this.ZoomSpeed = 0;
		this.TargetZoomValue = 90;

		this.NoVerticalMovementYPos = -66666.0;

		this.LastMouseDownLookX = -1;
		this.LastMouseDownLookY = -1;
	}

	/**
	 * Returns the type of the animator.
	 * For the AnimatorCameraModelViewer, this will return 'cameramodelviewer'.
	 * @public
	 */
	getType() {
		return 'cameramodelviewer';
	}

	/**
	 * Animates the scene node it is attached to and returns true if scene node was modified.
	 * @public
	 * @param {CL3D.SceneNode} n The Scene node which needs to be animated this frame.
	 * @param {Number} timeMs The time in milliseconds since the start of the scene.
	 */
	animateNode(n, timeMs) {
		if (this.Camera == null)
			return false;

		if (!(this.Camera.scene.getActiveCamera() === this.Camera))
			return false;

		var now = CL3D.CLTimer.getTime();
		var timeDiff = now - this.lastAnimTime;
		if (timeDiff > 250)
			timeDiff = 250;
		this.lastAnimTime = now;

		// move forwards/backwards
		var pos = this.Camera.Pos.clone();
		var target = this.Camera.Target.clone();
		var targetvect = target.substract(this.Camera.getAbsolutePosition());

		var moveX = 0;
		var moveY = 0;

		if (this.CursorControl.isMouseDown()) {
			var mx = this.CursorControl.getMouseX();
			var my = this.CursorControl.getMouseY();

			moveX = (this.LastMouseDownLookX == -1 ? 0 : (mx - this.LastMouseDownLookX)) * this.RotateSpeed / 50000;
			moveY = (this.LastMouseDownLookY == -1 ? 0 : (my - this.LastMouseDownLookY)) * this.RotateSpeed / 50000;

			this.LastMouseDownLookX = mx;
			this.LastMouseDownLookY = my;
		}

		else {
			this.LastMouseDownLookX = -1;
			this.LastMouseDownLookY = -1;
		}

		// sliding after movement ended
		if (this.SlideAfterMovementEnd &&
			this.SlidingSpeed != 0) {
			if (CL3D.iszero(moveX)) {
				// slide a bit after movement has finished
				moveX = this.SlidingMoveX;

				this.SlidingMoveX *= 0.9; // this is not frame independent, but since the fps is capped, its quite ok

				if (this.SlidingMoveX > 0)
					this.SlidingMoveX = Math.max(0.0, this.SlidingMoveX - (timeDiff / this.SlidingSpeed));

				else if (this.SlidingMoveX < 0)
					this.SlidingMoveX = Math.min(0.0, this.SlidingMoveX + (timeDiff / this.SlidingSpeed));
			}

			else
				this.SlidingMoveX = moveX * (this.SlidingSpeed / 1000.0);

			if (CL3D.iszero(moveY)) {
				// slide a bit after movement has finished
				moveY = this.SlidingMoveY;

				this.SlidingMoveY *= 0.9; // this is not frame independent, but since the fps is capped, its quite ok

				if (this.SlidingMoveY > 0)
					this.SlidingMoveY = Math.max(0.0, this.SlidingMoveY - (timeDiff / this.SlidingSpeed));

				else if (this.SlidingMoveY < 0)
					this.SlidingMoveY = Math.min(0.0, this.SlidingMoveY + (timeDiff / this.SlidingSpeed));
			}

			else
				this.SlidingMoveY = moveY * (this.SlidingSpeed / 1000.0);
		}

		// horizontal movement
		var strafevect = targetvect.crossProduct(this.Camera.UpVector);
		strafevect.Y = 0.0;
		strafevect.normalize();

		if (!CL3D.iszero(moveX)) {
			strafevect.multiplyThisWithScal(timeDiff * moveX);
			pos.addToThis(strafevect);
		}

		// vertical movement
		if (!this.NoVerticalMovement && !CL3D.iszero(moveY)) {
			var upv = this.Camera.UpVector.clone();
			upv.normalize();

			var newpos = pos.add(upv.multiplyWithScal(timeDiff * moveY));
			var newPosNoY = newpos.clone();
			newPosNoY.Y = target.Y;

			var minRadius = this.Radius / 10.0;
			if (newPosNoY.getDistanceTo(target) > minRadius)
				pos = newpos;
		}

		// also correct vertical position if bool NoVerticalMovement is on
		if (this.NoVerticalMovement) {
			if (CL3D.equals(this.NoVerticalMovementYPos, -66666.0))
				this.NoVerticalMovementYPos = pos.Y;

			pos.Y = this.NoVerticalMovementYPos;
		}

		// set mouse
		this.CursorControl.setMouseDownWhereMouseIsNow();

		// zoom
		if (this.AllowZooming) {
			var newFov = CL3D.radToDeg(this.Camera.getFov());

			if (this.TargetZoomValue < this.MinZoom)
				this.TargetZoomValue = this.MinZoom;
			if (this.TargetZoomValue > this.MaxZoom)
				this.TargetZoomValue = this.MaxZoom;

			var localZoomSpeed = this.ZoomSpeed;
			localZoomSpeed = Math.abs(this.TargetZoomValue - newFov) / 8.0;
			if (localZoomSpeed < this.ZoomSpeed)
				localZoomSpeed = this.ZoomSpeed;

			if (newFov < this.MaxZoom - localZoomSpeed && newFov < this.TargetZoomValue) {
				newFov += localZoomSpeed;
				if (newFov > this.MaxZoom)
					newFov = this.MaxZoom;
			}

			if (newFov > this.MinZoom + localZoomSpeed && newFov > this.TargetZoomValue) {
				newFov -= localZoomSpeed;
				if (newFov < this.MinZoom)
					newFov = this.MinZoom;
			}

			this.Camera.setFov(CL3D.degToRad(newFov));
		}

		// force circle on radius
		targetvect = pos.substract(target);
		targetvect.setLength(this.Radius);
		pos = target.add(targetvect);

		this.Camera.Pos = pos;

		return false;
	}

	/**
	 * @public
	 */
	onMouseWheel(delta) {
		this.TargetZoomValue += delta * this.ZoomSpeed;

		if (this.TargetZoomValue < this.MinZoom)
			this.TargetZoomValue = this.MinZoom;

		if (this.TargetZoomValue > this.MaxZoom)
			this.TargetZoomValue = this.MaxZoom;
	}
};
