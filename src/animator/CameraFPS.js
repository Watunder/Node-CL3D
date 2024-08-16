//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "../main.js";

/**
 * Special scene node animator for first person shooter cameras.
 * This scene node animator can be attached to a {@link CL3D.CameraSceneNode} to make it act like a first person shooter.
 * By pressing the cursor keys or WASD, the camera will move and by having the mouse button pressed while moving, the camera
 * will look around.
 * @constructor
 * @public
 * @extends CL3D.Animator
 * @class Special scene node animator for first person shooter cameras.
 * @param {CL3D.CameraSceneNode} cam an instance of a {@link CL3D.CameraSceneNode} this animator will be attached to. Can be null if the camera is not yet known.
 * @param {CL3D.CopperLicht} engine An instance of the {@link CopperLicht} 3d engine, for receiving the mouse and keyboard input.
 */
export class AnimatorCameraFPS extends CL3D.Animator {
	/**
	 * Maximal vertical angle the user is able to look.
	 * @public
	 * @type Number
	 * @default 88
	 */
	MaxVerticalAngle = 88.0;

	/**
	 * Maximal movment speed of the camera.
	 * @default 0.06
	 * @public
	 * @type Number
	 */
	MoveSpeed = 0.06;

	/**
	 * Maximal rotation speed the user is able to look.
	 * @default 200.0
	 * @public
	 * @type Number
	 */
	RotateSpeed = 200.0;

	/**
	 * Maximal jump speed the user is able to jump with this camera.
	 * @default 0
	 * @public
	 * @type Number
	 */
	JumpSpeed = 0;

	/**
	 * Defines if the animator may only move the camera horizontally
	 * @default false
	 * @public
	 * @type Boolean
	 */
	NoVerticalMovement = false;

	/**
	 * Defines if the animator may move  the camera
	 * @default true
	 * @public
	 * @type Boolean
	 * @default true
	 */
	MayMove = true;

	/**
	 * Defines if the animator may zoom the camera
	 * @public
	 * @type Boolean
	 * @default true
	 */
	MayZoom = true;

	constructor(cam, engine) {
		super();

		this.Type = -1;
		this.lastAnimTime = 0;
		this.NoVerticalMovement = false;

		this.moveByMouseDown = true; // move camera look direction only when the mouse is dragged and down
		this.moveByMouseMove = false; // move camera look direction by mouse movement, relative to distance of screen center
		this.moveByPanoDrag = false; // move camera look direction only when the mouse is dragged and down, but don't reset down position

		this.leftKeyDown = false;
		this.rightKeyDown = false;
		this.upKeyDown = false;
		this.downKeyDown = false;
		this.jumpKeyDown = false;

		this.MoveSmoothing = 0; // milliseconds needed to slow down movement
		this.lastMoveVector = new CL3D.Vect3d(0, 0, 0);
		this.lastMoveTime = 0;

		this.ChildrenDontUseZBuffer = true;

		this.relativeRotationX = 0;
		this.relativeRotationY = 0;

		this.minZoom = 20;
		this.maxZoom = 100;
		this.zoomSpeed = (this.maxZoom - this.minZoom) / 50.0;

		this.targetZoomValue = 90;

		this.lastAnimTime = CL3D.CLTimer.getTime();
		this.Camera = cam;
		this.CursorControl = engine;

		this.LastMouseDownLookX = -1;
		this.LastMouseDownLookY = -1;

		this.LastTimeJumpKeyWasUp = true;

		if (cam)
			this.lookAt(cam.getTarget());
	}

	/**
	 * Returns the type of the animator.
	 * For the AnimatorCameraFPS, this will return 'camerafps'.
	 * @public
	 */
	getType() {
		return 'camerafps';
	}

	/**
	 * Sets if the animator may move the camera
	 * @public
	 * @type Boolean
	 * @default true
	 */
	setMayMove(b) {
		this.MayMove = b;
	}

	/**
	 * Sets if the camera look direction is moved by the cursor when the mouse is down or not
	 * @public
	 * @type Boolean
	 * @default true
	 */
	setLookByMouseDown(b) {
		this.moveByMouseDown = b;
		this.moveByMouseMove = !b;
	}

	/**
	 * Lets the camera look at the specified point.
	 * @public
	 * @param target target 3d position of type {@link Vect3d}.
	 */
	lookAt(target) {
		if (this.Camera == null)
			return;

		var vect = target.substract(this.Camera.Pos);
		vect = vect.getHorizontalAngle();
		this.relativeRotationX = vect.X;
		this.relativeRotationY = vect.Y;

		if (this.relativeRotationX > this.MaxVerticalAngle)
			this.relativeRotationX -= 360.0;
	}

	/**
	 * Animates the scene node it is attached to and returns true if scene node was modified.
	 * @public
	 * @param {CL3D.SceneNode} n The Scene node which needs to be animated this frame.
	 * @param {Integer} timeMs The time in milliseconds since the start of the scene.
	 */
	animateNode(n, timeMs) {
		if (this.Camera == null)
			return false;

		if (!(this.Camera.scene.getActiveCamera() === this.Camera))
			return false;

		var now = CL3D.CLTimer.getTime();
		var timeDiff = now - this.lastAnimTime;
		if (timeDiff == 0)
			return false;

		if (timeDiff > 250)
			timeDiff = 250;
		this.lastAnimTime = now;

		// move forwards/backwards
		// var pos = this.Camera.Pos.clone();
		var tomove = new CL3D.Vect3d(0, 0, 0);

		if (this.MayMove && (this.upKeyDown || this.downKeyDown)) {
			var moveVect = this.Camera.Pos.substract(this.Camera.getTarget());

			if (this.NoVerticalMovement)
				moveVect.Y = 0;

			moveVect.normalize();


			if (this.upKeyDown) {
				tomove.addToThis(moveVect.multiplyWithScal(this.MoveSpeed * -timeDiff));
			}

			if (this.downKeyDown) {
				tomove.addToThis(moveVect.multiplyWithScal(this.MoveSpeed * timeDiff));
			}
		}

		// strafe
		if (this.MayMove && (this.leftKeyDown || this.rightKeyDown)) {
			var strafeVect = this.Camera.Pos.substract(this.Camera.getTarget()).crossProduct(this.Camera.getUpVector());
			strafeVect.normalize();

			if (this.leftKeyDown) {
				strafeVect = strafeVect.multiplyWithScal(this.MoveSpeed * -timeDiff);

				tomove.addToThis(strafeVect);
				//this.Camera.setTarget(this.Camera.getTarget().add(strafeVect));
			}

			if (this.rightKeyDown) {
				strafeVect = strafeVect.multiplyWithScal(this.MoveSpeed * timeDiff);

				tomove.addToThis(strafeVect);
				//this.Camera.setTarget(this.Camera.getTarget().add(strafeVect));
			}
		}


		// move smoothing
		if (this.MoveSmoothing != 0) {
			var lastMove = tomove.clone(); //pos.substract(this.Camera.Pos);
			if (!lastMove.equalsZero()) {
				// moved by user this frame, no smoothing, but record movement
				this.lastMoveVector = lastMove;
				this.lastMoveVector.multiplyThisWithScal(1.0 / timeDiff);
				this.lastMoveTime = now;
			}

			else {
				// not moved by user this frame, add movement smoothing
				if (this.lastMoveTime != 0 && !this.lastMoveVector.equalsZero()) {
					var smoothTime = now - this.lastMoveTime;
					if (smoothTime > 0 && smoothTime < this.MoveSmoothing) {
						var smoothLength = this.lastMoveVector.getLength() * (1.0 - (smoothTime / this.MoveSmoothing)) * timeDiff;

						var v = this.lastMoveVector.clone();
						v.normalize();
						v.multiplyThisWithScal(smoothLength * 0.5);

						tomove.addToThis(v);
					}

					else
						this.lastMoveVector.set(0, 0, 0);
				}
			}
		}

		// add everything
		tomove.normalize();
		tomove.multiplyThisWithScal(timeDiff * this.MoveSpeed);
		this.Camera.Pos.addToThis(tomove);
		this.Camera.setTarget(this.Camera.getTarget().add(tomove));

		// this.Camera.Pos = pos;
		// zoom
		/*
		if (this.MayZoom)
		{
			var newFov = CL3D.radToDeg(this.Camera.getFov());

			this.targetZoomValue += this.getAdditionalZoomDiff() * timeDiff;

			if (this.targetZoomValue < this.minZoom)
				this.targetZoomValue = this.minZoom;
			if (this.targetZoomValue > this.maxZoom)
				this.targetZoomValue = this.maxZoom;

			var localZoomSpeed = this.zoomSpeed;
			localZoomSpeed = Math.abs(this.targetZoomValue - newFov) / 8.0;
			if (localZoomSpeed  < this.zoomSpeed)
				localZoomSpeed  = this.zoomSpeed;

			if (newFov < this.maxZoom-localZoomSpeed && newFov < this.targetZoomValue)
			{
				newFov += localZoomSpeed;
				if (newFov > this.maxZoom)
					newFov = this.maxZoom;
			}

			if (newFov > this.minZoom+localZoomSpeed && newFov > this.targetZoomValue)
			{
				newFov -= localZoomSpeed;
				if (newFov < this.minZoom)
					newFov = this.minZoom;
			}

			this.Camera.setFov(CL3D.degToRad(newFov));
		}*/
		// change camera target with mouse
		var target = new CL3D.Vect3d(0, 0, 1);
		var mat = new CL3D.Matrix4();
		mat.setRotationDegrees(new CL3D.Vect3d(this.relativeRotationX, this.relativeRotationY, 0));
		mat.transformVect(target);

		// move lookat target up / down
		var pointerLocked = false;
		if (this.CursorControl != null)
			pointerLocked = this.CursorControl.isInPointerLockMode();

		var maxdiff = 300; // to limit the maximum diff in pixels
		var ydiff = 0;
		var RotateSpeedFactX = 1 / 50000.0;
		var RotateSpeedFactY = 1 / 50000.0;

		var bOver2DOverlay = false;
		if (this.CursorControl != null && n.scene != null && !pointerLocked)
			bOver2DOverlay = n.scene.isCoordOver2DOverlayNode(this.CursorControl.getMouseX(), this.CursorControl.getMouseY(), true) != null;

		if (this.moveByMouseDown) {
			// this is inconsistent, removed in 2.5.4 temporarily, but it simply feels better
			RotateSpeedFactX *= 3.0;
			RotateSpeedFactY *= 3.0;
		}

		if (!bOver2DOverlay) {
			if (pointerLocked) {
				ydiff = this.CursorControl.getMouseMoveY();
			}

			else if (this.moveByMouseMove) {
				var frameHeight = this.CursorControl.getRenderer().getHeight();
				var mousey = this.CursorControl.getMouseY();
				//if (frameHeight > 0 && mousey > 0)
				//	ydiff = ((mousey - (frameHeight / 2))  / frameHeight) * 100.0;
				if (frameHeight > 0 && mousey > 0 && this.CursorControl.isMouseOverCanvas()) {
					ydiff = Math.sin((mousey - (frameHeight / 2)) / frameHeight) * 100.0 * 0.5;
				}
			}

			else if (this.moveByMouseDown || this.moveByPanoDrag) {
				if (this.CursorControl.isMouseDown()) {
					// this works nice, but not for touch controls
					//ydiff = this.CursorControl.getMouseY() - this.CursorControl.getMouseDownY();
					//if (ydiff != 0)
					//	this.CursorControl.LastCameraDragTime = now;
					var my = this.CursorControl.getMouseY();
					ydiff = this.LastMouseDownLookY == -1 ? 0 : (my - this.LastMouseDownLookY);
					if (ydiff != 0)
						this.CursorControl.LastCameraDragTime = now;

					this.LastMouseDownLookY = my;
				}

				else {
					this.LastMouseDownLookY = -1;
				}
			}
		}

		ydiff += this.getAdditionalYLookDiff();

		var lookTimeDiff = timeDiff;
		if (lookTimeDiff > 100) lookTimeDiff = 100; // make jumps in frame not look completely away

		if (ydiff > maxdiff) ydiff = maxdiff;
		if (ydiff < -maxdiff) ydiff = -maxdiff;
		this.relativeRotationX += ydiff * (lookTimeDiff * (this.RotateSpeed * RotateSpeedFactY));

		if (this.relativeRotationX < -this.MaxVerticalAngle)
			this.relativeRotationX = -this.MaxVerticalAngle;
		if (this.relativeRotationX > this.MaxVerticalAngle)
			this.relativeRotationX = this.MaxVerticalAngle;

		// move lookat target left / right
		var xdiff = 0;

		if (!bOver2DOverlay) {
			if (pointerLocked) {
				xdiff = this.CursorControl.getMouseMoveX();
			}

			else if (this.moveByMouseMove) {
				var frameWidth = this.CursorControl.getRenderer().getWidth();
				var mousex = this.CursorControl.getMouseX();

				//if (frameWidth > 0 && mousex > 0)
				//	xdiff = ((mousex - (frameWidth / 2)) / frameWidth) * 100.0;
				if (frameWidth > 0 && mousex > 0 && this.CursorControl.isMouseOverCanvas()) {
					xdiff = Math.sin((mousex - (frameWidth / 2)) / frameWidth) * 100.0 * 0.5;
				}
			}

			else if (this.moveByMouseDown || this.moveByPanoDrag) {
				if (this.CursorControl.isMouseDown()) {
					// this works nice, but not for touch controls
					// xdiff = (this.CursorControl.getMouseX() - this.CursorControl.getMouseDownX());
					// if (xdiff != 0)
					//	this.CursorControl.LastCameraDragTime = now;
					// so do it like this now:
					var mx = this.CursorControl.getMouseX();
					xdiff = this.LastMouseDownLookX == -1 ? 0 : (mx - this.LastMouseDownLookX);
					if (xdiff != 0)
						this.CursorControl.LastCameraDragTime = now;

					this.LastMouseDownLookX = mx;
				}

				else {
					this.LastMouseDownLookX = -1;
				}
			}
		}

		xdiff += this.getAdditionalXLookDiff();

		if (xdiff > maxdiff) xdiff = maxdiff;
		if (xdiff < -maxdiff) xdiff = -maxdiff;
		this.relativeRotationY += xdiff * (lookTimeDiff * (this.RotateSpeed * RotateSpeedFactX));

		if (pointerLocked || this.moveByMouseDown || this.moveByPanoDrag)
			this.CursorControl.setMouseDownWhereMouseIsNow();

		// jump
		if (this.MayMove) {
			if (this.jumpKeyDown) {
				if (this.LastTimeJumpKeyWasUp) {
					var a = n.getAnimatorOfType('collisionresponse');
					if (a && !a.isFalling()) {
						this.LastTimeJumpKeyWasUp = false;
						a.jump(this.JumpSpeed);
					}
				}
			}

			else
				this.LastTimeJumpKeyWasUp = true;
		}

		// finally set target
		this.Camera.setTarget(this.Camera.Pos.add(target));

		return false;
	}

	/**
	 * @public
	 */
	onMouseDown(event) {
		//super.onMouseDown(event);
		CL3D.Animator.prototype.onMouseDown.call(this, event);

		if (this.moveByMouseMove && this.CursorControl.pointerLockForFPSCameras && !this.CursorControl.isInPointerLockMode())
			this.CursorControl.requestPointerLock();
	}

	/**
	 * @public
	 */
	onMouseWheel(delta) {
		/*this.targetZoomValue += delta * this.zoomSpeed;

		 if (this.targetZoomValue < this.minZoom)
			this.targetZoomValue = this.minZoom;

		 if (this.targetZoomValue > this.maxZoom)
			this.targetZoomValue = this.maxZoom;*/
	}

	/**
	 * @public
	 */
	onMouseUp(event) {
		//super.onMouseUp(event);
		CL3D.Animator.prototype.onMouseUp.call(this, event);
	}

	/**
	 * @public
	 */
	onMouseMove(event) {
		//super.onMouseMove(event);
		CL3D.Animator.prototype.onMouseMove.call(this, event);
	}

	/**
	 * @public
	 */
	setKeyBool(down, code) {
		if (code)
			code = code.toLowerCase();
		if (code == "a" || code == "left" || code == "arrowleft") {
			this.leftKeyDown = down;

			// fix chrome key down problem (key down sometimes doesn't arrive)
			if (down) this.rightKeyDown = false;
			return true;
		}

		if (code == "d" || code == "right" || code == "arrowright") {
			this.rightKeyDown = down;

			// fix chrome key down problem (key down sometimes doesn't arrive)
			if (down) this.leftKeyDown = false;
			return true;
		}

		if (code == "w" || code == "up" || code == "arrowup") {
			this.upKeyDown = down;

			// fix chrome key down problem (key down sometimes doesn't arrive)
			if (down) this.downKeyDown = false;
			return true;
		}

		if (code == "s" || code == "down" || code == "arrowdown") {
			this.downKeyDown = down;

			// fix chrome key down problem (key down sometimes doesn't arrive)
			if (down) this.upKeyDown = false;
			return true;
		}

		if (code == "space" || code == " ") {
			// jump key
			this.jumpKeyDown = down;
			return true;
		}

		return false;
	}

	/**
	 * @public
	 */
	onKeyDown(event) {
		return this.setKeyBool(true, event.key);
	}

	/**
	 * @public
	 */
	onKeyUp(event) {
		return this.setKeyBool(false, event.key);
	}

	/**
	 * @public
	 * for adding force to look up or down
	 */
	getAdditionalXLookDiff() {
		return 0;
	}

	/**
	 * @public
	 * for adding force to look up or down
	 */
	getAdditionalYLookDiff() {
		return 0;
	}

	/**
	 * @public
	 * for adding force to look left or right
	 */
	getAdditionalZoomDiff() {
		return 0;
	}
};
