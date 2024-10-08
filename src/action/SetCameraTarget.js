// ---------------------------------------------------------------------
// Action SetCameraTarget
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @public
 * @constructor
 * @class
 */
export class ActionSetCameraTarget extends CL3D.Action {
	/**
	 * @type {Number}
	 */
	PositionChangeType;
	/**
	 * @type {Number}
	 */
	SceneNodeToChangePosition;
	/**
	 * @type {Number}
	 */
	SceneNodeRelativeTo;
	/**
	 * @type {boolean}
	 */
	ChangeCurrentSceneNode;
	/**
	 * @type {boolean}
	 */
	RelativeToCurrentSceneNode;
	/**
	 * @type {CL3D.Vect3d}
	 */
	Vector;

	constructor() {
		super();

		this.UseAnimatedMovement = false;
		this.TimeNeededForMovementMs = 0;
		this.Type = 'SetCameraTarget';
	}

	/** 
	 * @param {Number} oldNodeId
	 * @param {Number} newNodeId
	 */
	createClone(oldNodeId, newNodeId) {
		var a = new CL3D.ActionSetCameraTarget();
		a.PositionChangeType = this.PositionChangeType;
		a.SceneNodeToChangePosition = this.SceneNodeToChangePosition;
		a.SceneNodeRelativeTo = this.SceneNodeRelativeTo;
		a.ChangeCurrentSceneNode = this.ChangeCurrentSceneNode;
		a.RelativeToCurrentSceneNode = this.RelativeToCurrentSceneNode;
		a.Vector = this.Vector ? this.Vector.clone() : null;
		a.UseAnimatedMovement = this.UseAnimatedMovement;
		a.TimeNeededForMovementMs = this.TimeNeededForMovementMs;
		return a;
	}

	/**
	 * @param {CL3D.SceneNode} currentNode
	 * @param {CL3D.Scene} sceneManager
	 */
	execute(currentNode, sceneManager) {
		if (!currentNode || !sceneManager)
			return;

		var nodeToHandle = null;
		if (this.ChangeCurrentSceneNode)
			nodeToHandle = currentNode;

		else if (this.SceneNodeToChangePosition != -1)
			nodeToHandle = sceneManager.getSceneNodeFromId(this.SceneNodeToChangePosition);

		var cam = nodeToHandle;
		if (cam instanceof CL3D.CameraSceneNode && cam.getType() == 'camera') {
			var finalpos = cam.getTarget().clone();

			switch (this.PositionChangeType) {
				case 0: //EIT_ABSOLUTE_POSITION:
					finalpos = this.Vector.clone();
					break;
				case 1: //EIT_RELATIVE_POSITION:
					finalpos = nodeToHandle.Pos.add(this.Vector);
					break;
				case 2: //EIT_RELATIVE_TO_SCENE_NODE:
					{
						var nodeRelativeTo = null;
						if (this.RelativeToCurrentSceneNode)
							nodeRelativeTo = currentNode;

						else if (this.SceneNodeRelativeTo != -1)
							nodeRelativeTo = sceneManager.getSceneNodeFromId(this.SceneNodeRelativeTo);

						if (nodeRelativeTo)
							finalpos = nodeRelativeTo.Pos.add(this.Vector);
					}
					break;
			}

			if (finalpos != null) {
				if (this.UseAnimatedMovement && this.TimeNeededForMovementMs > 0) {
					// move animated to target
					var anim = new CL3D.AnimatorFlyStraight();
					anim.Start = cam.getTarget().clone();
					anim.End = finalpos;
					anim.TimeForWay = this.TimeNeededForMovementMs;
					anim.DeleteMeAfterEndReached = true;
					anim.AnimateCameraTargetInsteadOfPosition = true;
					anim.recalculateImidiateValues();

					nodeToHandle.addAnimator(anim);
				}

				else {
					// set target directly
					cam.setTarget(finalpos);

					var animfps = cam.getAnimatorOfType('camerafps');
					if (animfps != null && animfps instanceof CL3D.AnimatorCameraFPS)
						animfps.lookAt(finalpos);
				}
			}
		}
	}
};
