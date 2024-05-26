//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "../main.js";

/**
 * Scene node animator making {@link CL3D.SceneNode}s rotate
 * @constructor
 * @public
 * @extends CL3D.Animator
 * @class  Scene node animator making {@link CL3D.SceneNode}s rotate
 * @param speed {CL3D.Vect3d} vector defining the RotationSpeed in each direction
 */
export class AnimatorRotation extends CL3D.Animator {
	constructor(speed) {
		super();

		this.Rotation = new CL3D.Vect3d();
		if (speed)
			this.Rotation = speed.clone();

		this.StartTime = CL3D.CLTimer.getTime();

		this.RotateToTargetAndStop = false; // for setRotateToTargetAndStop
		this.RotateToTargetEndTime = 0; // for setRotateToTargetAndStop
		this.BeginRotation = null; // for setRotateToTargetAndStop
	}

	/**
	 * Returns the type of the animator.
	 * For the AnimatorRotation, this will return 'rotation'.
	 * @public
	 */
	getType() {
		return 'rotation';
	}

	/**
	 * @private
	 */
	createClone(node, newManager, oldNodeId, newNodeId) {
		var a = new CL3D.AnimatorRotation(this.SMGr, this.engine);
		a.Rotation = this.Rotation.clone();
		a.StartTime = this.StartTime;
		return a;
	}

	/**
	 * Animates the scene node it is attached to and returns true if scene node was modified.
	 * @public
	 * @param {CL3D.SceneNode} n The Scene node which needs to be animated this frame.
	 * @param timeMs: The time in milliseconds since the start of the scene.
	 */
	animateNode(n, timeMs) {
		var difftime = timeMs - this.StartTime;

		if (!this.RotateToTargetAndStop) {
			if (difftime != 0) {
				n.Rot.addToThis(this.Rotation.multiplyWithScal(difftime / 10.0));

				this.StartTime = timeMs;
				return true;
			}
		}

		else {
			// rotate to a target rotation and then stop
			if (this.RotateToTargetEndTime - this.StartTime == 0)
				return false;

			var interpol = (timeMs - this.StartTime) / (this.RotateToTargetEndTime - this.StartTime);
			if (interpol > 1.0) {
				// end reached, destroy this animator
				n.Rot = this.Rotation.clone();
				n.removeAnimator(this);
			}

			else {
				// interpolate 
				var q1 = new CL3D.Quaternion();
				var vtmp = this.Rotation.multiplyWithScal(CL3D.DEGTORAD);

				q1.setFromEuler(vtmp.X, vtmp.Y, vtmp.Z);

				var q2 = new CL3D.Quaternion();
				vtmp = this.BeginRotation.multiplyWithScal(CL3D.DEGTORAD);
				q2.setFromEuler(vtmp.X, vtmp.Y, vtmp.Z);

				q2.slerp(q2, q1, interpol);
				vtmp = new CL3D.Vect3d();
				q2.toEuler(vtmp);

				vtmp.multiplyThisWithScal(CL3D.RADTODEG);
				n.Rot = vtmp;

				return true;
			}
		}

		return false;
	}

	/**
	 * Makes the animator rotate the scene node to a specific target and then stop there
	 * @private
	 */
	setRotateToTargetAndStop(targetRot, beginRot, timeForMovement) {
		this.RotateToTargetAndStop = true;
		this.Rotation = targetRot.clone();
		this.BeginRotation = beginRot.clone();
		this.RotateToTargetEndTime = this.StartTime + timeForMovement;
	}
};
