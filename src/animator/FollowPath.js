//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "../main.js";

/**
 * Scene node animator making {@link CL3D.SceneNode}s move along a path.
 * Uses {@link CL3D.PathSceneNode} to define the path.
 * @constructor
 * @public
 * @extends CL3D.Animator
 * @class  Scene node animator making {@link CL3D.SceneNode}s move along a path, uses {@link CL3D.PathSceneNode} to define the path.
 * @param scene The scene the animator is in
 */
export class AnimatorFollowPath extends CL3D.Animator {
	/** 
	 * Constant for {@link AnimatorFollowPath.EndMode}, specifying to start the movement again when the end of the path has been reached.
	 * @static 
	 * @public
	 */
	static EFPFEM_START_AGAIN = 0;

	/** 
	 * Constant for {@link AnimatorFollowPath.EndMode}, specifying to start the movement again when the end of the path has been reached.
	 * @static 
	 * @public
	 */
	static EFPFEM_STOP = 1;

	/** 
	 * Constant for {@link AnimatorFollowPath.EndMode}, specifying to start the movement again when the end of the path has been reached.
	 * @static 
	 * @public
	 */
	static EFPFEM_SWITCH_TO_CAMERA = 2;

	constructor(scene) {
		super();

		this.TimeNeeded = 5000;
		this.TriedToLinkWithPath = false;
		this.IsCamera = false;
		this.LookIntoMovementDirection = false;
		this.OnlyMoveWhenCameraActive = true;
		this.TimeDisplacement = 0;
		this.LastTimeCameraWasInactive = true;
		this.EndMode = CL3D.AnimatorFollowPath.EFPFEM_START_AGAIN;
		this.SwitchedToNextCamera = false;
		this.Manager = scene;

		this.StartTime = 0;
		this.TriedToLinkWithPath = false;
		this.LastObject = null;
		this.PathNodeToFollow = null;
		this.SwitchedToNextCamera = false;

		this.PathToFollow = null; // string!
		this.TimeDisplacement = 0;
		this.AdditionalRotation = null; //;
		this.CameraToSwitchTo = null; //string	

		this.LastPercentageDoneActionFired = 0;
		this.bActionFired = false;
	}

	/**
	 * Returns the type of the animator.
	 * For the AnimatorFollowPath, this will return 'followpath'.
	 * @public
	 */
	getType() {
		return 'followpath';
	}

	/**
	 * @public
	 */
	createClone(node, newManager, oldNodeId, newNodeId) {
		var a = new CL3D.AnimatorFollowPath();
		a.TimeNeeded = this.TimeNeeded;
		a.LookIntoMovementDirection = this.LookIntoMovementDirection;
		a.OnlyMoveWhenCameraActive = this.OnlyMoveWhenCameraActive;
		a.PathToFollow = this.PathToFollow;
		a.TimeDisplacement = this.TimeDisplacement;
		a.AdditionalRotation = this.AdditionalRotation ? this.AdditionalRotation.clone() : null;
		a.EndMode = this.EndMode;
		a.CameraToSwitchTo = this.CameraToSwitchTo;
		a.TheActionHandler = this.TheActionHandler ? this.TheActionHandler.createClone(oldNodeId, newNodeId) : null;
		return a;
	}

	/**
	 * Sets the options for animating the node along the path
	 * @public
	 * @param endmode {Number} Mode specifying what should happen when the end of the path has been reached.
	 * Can be {@link CL3D.AnimatorFollowPath.EFPFEM_START_AGAIN} or {@link CL3D.AnimatorFollowPath.EFPFEM_STOP}
	 * @param timeNeeded {Number} Time in milliseconds needed for following the whole path, for example 10000 for 10 seconds.
	 * @param lookIntoMovementDirection {Boolean} true if the node should look into the movement direction or false
	 * if not.
	 *
	 */
	setOptions(endmode, timeNeeded, lookIntoMovementDirection) {
		this.EndMode = endmode;
		this.LookIntoMovementDirection = lookIntoMovementDirection;
		this.TimeNeeded = timeNeeded;
	}

	/**
	 * Animates the scene node it is attached to and returns true if scene node was modified.
	 * @public
	 * @param {CL3D.SceneNode} n The Scene node which needs to be animated this frame.
	 * @param {Integer} timeMs The time in milliseconds since the start of the scene.
	 */
	animateNode(n, timeMs) {
		if (n == null || !this.Manager || !this.TimeNeeded)
			return false;

		if (!(n === this.LastObject)) {
			this.setNode(n);
			return false;
		}

		this.linkWithPath();

		if (this.PathNodeToFollow == null)
			return false;

		var changed = false;
		var cam = null;

		if (this.IsCamera && this.OnlyMoveWhenCameraActive) {
			// only move the camera when the active flag is set
			var oldActive = !this.LastTimeCameraWasInactive;

			cam = n;
			if (!(this.Manager.getActiveCamera() === cam)) {
				if (this.PathNodeToFollow.Nodes.length) // for the editor only, set the position to the first path node
					cam.Pos = this.PathNodeToFollow.getPathNodePosition(0);

				this.LastTimeCameraWasInactive = true;
				return false;
			}

			else
				this.LastTimeCameraWasInactive = false;

			if (!this.StartTime || !oldActive)
				this.StartTime = timeMs;
		}

		if (!this.StartTime) {
			// use start time of scene
			this.StartTime = this.Manager.getStartTime();
		}

		var percentageDone = (timeMs - this.StartTime + this.TimeDisplacement) / this.TimeNeeded;

		// when path finished, do what set in settings
		if (percentageDone > 1.0 && !this.PathNodeToFollow.IsClosedCircle) {
			switch (this.EndMode) {
				case CL3D.AnimatorFollowPath.EFPFEM_START_AGAIN:
					percentageDone = percentageDone % 1.0;
					break;
				case CL3D.AnimatorFollowPath.EFPFEM_STOP:
					percentageDone = 1.0;
					break;
				case CL3D.AnimatorFollowPath.EFPFEM_SWITCH_TO_CAMERA:
					percentageDone = 1.0;
					if (!this.SwitchedToNextCamera) {
						this.switchToNextCamera();
						this.SwitchedToNextCamera = true;
					}
					break;
				case 3: // EFPFEM_START_AGAIN_AND_DO_ACTION
					if (percentageDone > this.LastPercentageDoneActionFired + 1.0 && this.TheActionHandler != null) {
						this.TheActionHandler.execute(n);
						this.LastPercentageDoneActionFired = percentageDone;
					}
					percentageDone = percentageDone % 1.0;
					break;
				case 4: // EFPFEM_STOP_AND_DO_ACTION
					percentageDone = 1.0;
					if (!this.bActionFired && this.TheActionHandler != null) {
						this.TheActionHandler.execute(n);
						this.bActionFired = true;
					}
					break;
			}
		}

		else
			this.SwitchedToNextCamera = false;

		// advance node on path
		var pos = this.PathNodeToFollow.getPointOnPath(percentageDone);
		changed = !pos.equals(n.Pos);
		n.Pos = pos;

		if (this.LookIntoMovementDirection && this.PathNodeToFollow.Nodes.length) {
			// set lookat target of moving object
			var nextOnWay = percentageDone + 0.001;
			var nextPos;

			if (this.PathNodeToFollow.IsClosedCircle) {
				nextPos = this.PathNodeToFollow.getPointOnPath(nextOnWay);
			}

			else
				nextPos = this.PathNodeToFollow.getPointOnPath(nextOnWay);

			if (!CL3D.iszero(nextPos.getDistanceTo(pos))) {
				var lookvector = nextPos.substract(pos);
				lookvector.setLength(100.0);

				if (this.IsCamera) {
					cam = n;
					var newTarget = pos.add(lookvector);
					changed = changed || !newTarget.equals(cam.Target);
					cam.setTarget(newTarget);
				}

				else {
					//node->setRotation(AdditionalRotation + lookvector.getHorizontalAngle());
					var newRot;

					if (!this.AdditionalRotation || this.AdditionalRotation.equalsZero()) {
						newRot = lookvector.getHorizontalAngle();
						changed = changed || !newRot.equals(n.Rot);
						n.Rot = newRot;
					}

					else {
						// TODO: in this part, there is a bug somewhere, but only in the flash version.
						// that's because the above version is implemented which at least works correctly
						// when AdditionalRotation is zero, and is faster additionally.
						var matrot = new CL3D.Matrix4();
						matrot.setRotationDegrees(lookvector.getHorizontalAngle());
						var matrot2 = new CL3D.Matrix4();
						matrot2.setRotationDegrees(this.AdditionalRotation);
						matrot = matrot.multiply(matrot2);

						newRot = matrot.getRotationDegrees();
						changed = changed || !newRot.equals(n.Rot);
						n.Rot = newRot;
					}
				}
			}
		}

		return changed;
	}

	/**
	* @public
	*/
	setNode(n) {
		this.LastObject = n;
		if (this.LastObject)
			this.IsCamera = (this.LastObject.getType() == 'camera');
	}

	/**
	* @public
	*/
	linkWithPath() {
		if (this.PathNodeToFollow)
			return;

		if (this.TriedToLinkWithPath)
			return;

		if (!this.PathToFollow.length)
			return;

		if (!this.Manager)
			return;

		var node = this.Manager.getSceneNodeFromName(this.PathToFollow);
		if (node && node.getType() == 'path') {
			this.setPathToFollow(node);
		}
	}

	/**
	 * Define the path this animator should follow
	 * @param path {CL3D.PathSceneNode} scene node representing the path
	 * @public
	 */
	setPathToFollow(path) {
		this.PathNodeToFollow = path;
	}

	/**
	 * @public
	 */
	switchToNextCamera() {
		if (!this.Manager)
			return;

		if (!this.CameraToSwitchTo.length)
			return;

		var node = this.Manager.getSceneNodeFromName(this.CameraToSwitchTo);
		if (node && node.getType() == 'camera') {
			var renderer = this.Manager.getLastUsedRenderer();
			if (renderer)
				node.setAutoAspectIfNoFixedSet(renderer.getWidth(), renderer.getHeight());
			this.Manager.setActiveCamera(node);
		}
	}

	/**
	 * @public
	 */
	findActionByType(type) {
		if (this.TheActionHandler)
			return this.TheActionHandler.findAction(type);

		return null;
	}
};
