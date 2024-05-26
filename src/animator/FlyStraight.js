//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "../main.js";

/**
 * Scene node animator making {@link CL3D.SceneNode}s move along straight line between two points.
 * @constructor
 * @public
 * @extends CL3D.Animator
 * @class Scene node animator making {@link CL3D.SceneNode}s move along straight line between two points.
 * @param {CL3D.Vect3d} start Start 3d position of the line
 * @param {CL3D.Vect3d} end End 3d position of the line
 * @param {Number} timeForWay Time for moving along the whole line in milliseconds. For example 2000 for 2 seconds.
 * @param {Boolean} loop set to true for looping along the line, false for stopping movement when the end has been reached.
 * @param {Boolean} deleteMeAfterEndReached set to true if the animator should delete itself after the end has been reached.
 * @param {Boolean} animateCameraTargetInsteadOfPosition if the animated node is a camera, set to true to animate the camera target instead of the position of the camera.
 */
export class AnimatorFlyStraight extends CL3D.Animator {
	constructor(start, end, timeforway, loop, deleteMeAfterEndReached, animateCameraTargetInsteadOfPosition) {
		super();

		this.Start = new CL3D.Vect3d(0, 0, 0);
		this.End = new CL3D.Vect3d(40, 40, 40);
		this.StartTime = CL3D.CLTimer.getTime();
		this.TimeForWay = 3000;
		this.Loop = false;
		this.DeleteMeAfterEndReached = false;
		this.AnimateCameraTargetInsteadOfPosition = false;

		this.TestShootCollisionWithBullet = false;
		this.ShootCollisionNodeToIgnore = null;
		this.ShootCollisionDamage = 0;
		this.DeleteSceneNodeAfterEndReached = false;
		this.ActionToExecuteOnEnd = false;
		this.ExecuteActionOnEndOnlyIfTimeSmallerThen = 0;

		if (start)
			this.Start = start.clone();
		if (end)
			this.End = end.clone();
		if (timeforway)
			this.TimeForWay = timeforway;
		if (loop)
			this.Loop = loop;

		this.recalculateImidiateValues();

		if (deleteMeAfterEndReached)
			this.DeleteMeAfterEndReached = deleteMeAfterEndReached;
		if (animateCameraTargetInsteadOfPosition)
			this.AnimateCameraTargetInsteadOfPosition = animateCameraTargetInsteadOfPosition;
	}

	/**
	 * Returns the type of the animator.
	 * For the AnimatorFlyStraight, this will return 'flystraight'.
	 * @public
	 */
	getType() {
		return 'flystraight';
	}

	/**
	 * @private
	 */
	createClone(node, newManager, oldNodeId, newNodeId) {
		var a = new CL3D.AnimatorFlyStraight();
		a.Start = this.Start.clone();
		a.End = this.End.clone();
		a.Vector = this.Vector.clone();
		a.WayLength = this.WayLength;
		a.TimeFactor = this.TimeFactor;
		a.TimeForWay = this.TimeForWay;
		a.Loop = this.Loop;
		a.AnimateCameraTargetInsteadOfPosition = this.AnimateCameraTargetInsteadOfPosition;
		a.DeleteSceneNodeAfterEndReached = this.DeleteSceneNodeAfterEndReached;
		a.ActionToExecuteOnEnd = this.ActionToExecuteOnEnd ? this.ActionToExecuteOnEnd.createClone(oldNodeId, newNodeId) : null;
		a.ExecuteActionOnEndOnlyIfTimeSmallerThen = this.ExecuteActionOnEndOnlyIfTimeSmallerThen;
		return a;
	}

	/**
	 * Animates the scene node it is attached to and returns true if scene node was modified.
	 * @public
	 * @param {CL3D.SceneNode} n The Scene node which needs to be animated this frame.
	 * @param {Integer} timeMs The time in milliseconds since the start of the scene.
	 */
	animateNode(n, timeMs) {
		var t = (timeMs - this.StartTime);
		var endReached = false;

		if (t != 0) {
			var pos = this.Start.clone();

			if (!this.Loop && t >= this.TimeForWay) {
				pos = this.End.clone();
				endReached = true;
			}

			else {
				pos.addToThis(this.Vector.multiplyWithScal((t % this.TimeForWay) * this.TimeFactor));
			}

			if (this.AnimateCameraTargetInsteadOfPosition) {
				if (n.getType() == 'camera') {
					n.setTarget(pos);

					var animfps = n.getAnimatorOfType('camerafps');
					if (animfps != null)
						animfps.lookAt(pos);
				}
			}

			else {
				n.Pos = pos;
			}

			if (this.TestShootCollisionWithBullet && this.StartTime != timeMs) // the node must not be in the exact same frame it was created in,

			// otherwise, we risk an endless loop if the bullet is shot in the onHit handler
			{
				endReached = this.doShootCollisionTest(n) || endReached;
			}

			if (endReached) {
				if (n.scene)
					n.scene.LastBulletImpactPosition = n.Pos.clone();

				if (this.ActionToExecuteOnEnd) {
					var runAction = true;
					if (this.ExecuteActionOnEndOnlyIfTimeSmallerThen > 0 && t > this.ExecuteActionOnEndOnlyIfTimeSmallerThen)
						runAction = false;

					if (runAction)
						this.ActionToExecuteOnEnd.execute(n);
				}

				if (this.DeleteMeAfterEndReached)
					n.removeAnimator(this);

				if (this.DeleteSceneNodeAfterEndReached && n.scene)
					n.scene.addToDeletionQueue(n, 0);
			}

			return true;
		}

		return false;
	}

	/**
	 * @private
	 */
	doShootCollisionTest(bulletNode) {
		if (!bulletNode)
			return false;

		bulletNode.updateAbsolutePosition();
		var box = bulletNode.getTransformedBoundingBox();

		var hit = false;

		var nodes = bulletNode.scene.getAllSceneNodesWithAnimator('gameai');

		for (var i = 0; i < nodes.length; ++i) {
			if (nodes[i] === this.ShootCollisionNodeToIgnore)
				continue;

			var enemyAI = nodes[i].getAnimatorOfType('gameai');

			if (enemyAI && !enemyAI.isAlive()) // don't test collision against dead items
				continue;

			if (box.intersectsWithBox(nodes[i].getTransformedBoundingBox())) {
				// hit found
				enemyAI.OnHit(this.ShootCollisionDamage, nodes[i]);
				hit = true;
				break;
			}
		}

		return hit;
	}
	
	/**
	 * @private
	 */
	recalculateImidiateValues() {
		this.Vector = this.End.substract(this.Start);
		this.WayLength = this.Vector.getLength();
		this.Vector.normalize();
		this.TimeFactor = this.WayLength / this.TimeForWay;
	}
};
