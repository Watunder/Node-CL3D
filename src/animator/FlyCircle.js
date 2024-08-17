//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "../main.js";

/**
 * Scene node animator making {@link SceneNode}s move in a circle
 * @constructor
 * @public
 * @extends CL3D.Animator
 * @class Scene node animator making {@link SceneNode}s move in a circle
 */
export class AnimatorFlyCircle extends CL3D.Animator {
	/**
	 * 
	 * @param {CL3D.Vect3d=} center 3d position of the center of the circle
	 * @param {Number=} radius radius of the circle
	 * @param {CL3D.Vect3d=} direction direction of the circle. For example (0,1,0) for up.
	 * @param {Number=} speed movement speed, for example 0.01
	 */
	constructor(center, radius, direction, speed) {
		super();

		this.Center = new CL3D.Vect3d();
		this.Direction = new CL3D.Vect3d(0, 1, 0);
		this.VecU = new CL3D.Vect3d();
		this.VecV = new CL3D.Vect3d();
		this.StartTime = CL3D.CLTimer.getTime();
		this.Speed = 0.01;
		this.Radius = 100;

		if (center)
			this.Center = center.clone();
		if (radius)
			this.Radius = radius;
		if (direction)
			this.Direction = direction.clone();
		if (speed)
			this.Speed = speed;

		this.init();
	}

	/**
	 * Returns the type of the animator.
	 * For the AnimatorFlyCircle, this will return 'flycircle'.
	 * @public
	 */
	getType() {
		return 'flycircle';
	}

	/**
	 * @param {CL3D.SceneNode} node
	 * @param {CL3D.Scene} newManager
	 * @param {Number} oldNodeId
	 * @param {Number} newNodeId
	 */
	createClone(node, newManager, oldNodeId, newNodeId) {
		var a = new CL3D.AnimatorFlyCircle();
		a.Center = this.Center.clone();
		a.Direction = this.Direction.clone();
		a.VecU = this.VecU.clone();
		a.VecV = this.VecV.clone();
		a.Speed = this.Speed;
		a.Radius = this.Radius;
		return a;
	}

	/**
	 * Animates the scene node it is attached to and returns true if scene node was modified.
	 * @public
	 * @param {CL3D.SceneNode} n The Scene node which needs to be animated this frame.
	 * @param {Number} timeMs The time in milliseconds since the start of the scene.
	 */
	animateNode(n, timeMs) {
		var diff = (timeMs - this.StartTime);

		if (diff != 0) {
			var t = diff * this.Speed;

			var v = this.VecU.multiplyWithScal(Math.cos(t)).add(this.VecV.multiplyWithScal(Math.sin(t)));
			v.multiplyThisWithScal(this.Radius);
			n.Pos = this.Center.add(v);
			return true;
		}

		return false;
	}
	
	init() {
		this.Direction.normalize();

		if (this.Direction.Y != 0) {
			this.VecV = new CL3D.Vect3d(50, 0, 0);
			this.VecV = this.VecV.crossProduct(this.Direction);
			this.VecV.normalize();
		}

		else {
			this.VecV = new CL3D.Vect3d(0, 50, 0);
			this.VecV = this.VecV.crossProduct(this.Direction);
			this.VecV.normalize();
		}

		this.VecU = this.VecV.crossProduct(this.Direction);
		this.VecU.normalize();
	}
};
