// ---------------------------------------------------------------------
// Action ChangeSceneNodeRotation
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @public
 * @constructor
 * @class
 */
export class ActionChangeSceneNodeRotation extends CL3D.Action {
	/**
	 * @type {Number}
	 */
	RotationChangeType;
	/**
	 * @type {Number}
	 */
	SceneNodeToChangeRotation;
	/**
	 * @type {boolean}
	 */
	ChangeCurrentSceneNode;
	/**
	 * @type {CL3D.Vect3d}
	 */
	Vector;
	/**
	 * @type {boolean}
	 */
	RotateAnimated;
	/**
	 * @type {Number}
	 */
	TimeNeededForRotationMs;
	

	constructor() {
        super();

		this.Type = 'ChangeSceneNodeRotation';
	}

	/**
	 * @param {Number} oldNodeId 
	 * @param {Number} newNodeId 
	 */
	createClone(oldNodeId, newNodeId) {
		var a = new CL3D.ActionChangeSceneNodeRotation();
		a.RotationChangeType = this.RotationChangeType;
		a.SceneNodeToChangeRotation = this.SceneNodeToChangeRotation;
		a.ChangeCurrentSceneNode = this.ChangeCurrentSceneNode;
		a.Vector = this.Vector ? this.Vector.clone() : null;
		a.RotateAnimated = this.RotateAnimated;
		a.TimeNeededForRotationMs = this.TimeNeededForRotationMs;

		if (a.SceneNodeToChangeRotation == oldNodeId)
			a.SceneNodeToChangeRotation = newNodeId;
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

		else if (this.SceneNodeToChangeRotation != -1)
			nodeToHandle = sceneManager.getSceneNodeFromId(this.SceneNodeToChangeRotation);

		if (nodeToHandle) {
			var finalRot = null;

			switch (this.RotationChangeType) {
				case 0: //EIT_ABSOLUTE_ROTATION:
					finalRot = this.Vector.clone();
					break;
				case 1: //EIT_RELATIVE_ROTATION:
					finalRot = nodeToHandle.Rot.add(this.Vector);
					break;
			}

			if (finalRot) {
				if (!this.RotateAnimated) {
					// not animated, set rotation directly
					nodeToHandle.Rot = finalRot;
				}

				else {
					// rotate animated to target
					var anim = new CL3D.AnimatorRotation();
					anim.setRotateToTargetAndStop(finalRot, nodeToHandle.Rot, this.TimeNeededForRotationMs);

					nodeToHandle.addAnimator(anim);
				}
			}
		}
	}
};
