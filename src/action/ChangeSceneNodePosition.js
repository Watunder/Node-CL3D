// ---------------------------------------------------------------------
// Action ChangeSceneNodePosition
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @public
 * @constructor
 * @class
 */
export class ActionChangeSceneNodePosition extends CL3D.Action {
	/**
	 * @type {Number}
	 */
	PositionChangeType;
	/**
	 * @type {Number}
	 */
	SceneNodeToChangePosition;
	/**
	 * @type {boolean}
	 */
	ChangeCurrentSceneNode;
	/**
	 * @type {CL3D.Vect3d}
	 */
	Vector;
	/**
	 * @type {CL3D.Vect3d}
	 */
	Area3DEnd;
	/**
	 * @type {boolean}
	 */
	RelativeToCurrentSceneNode;
	/**
	 * @type {Number}
	 */
	SceneNodeRelativeTo;


	constructor() {
		super();

		this.UseAnimatedMovement = false;
		this.TimeNeededForMovementMs = 0;
		this.Type = 'ChangeSceneNodePosition';
	}

	/**
	 * @param {Number} oldNodeId 
	 * @param {Number} newNodeId 
	 */
	createClone(oldNodeId, newNodeId) {
		var a = new CL3D.ActionChangeSceneNodePosition();
		a.PositionChangeType = this.PositionChangeType;
		a.SceneNodeToChangePosition = this.SceneNodeToChangePosition;
		a.SceneNodeRelativeTo = this.SceneNodeRelativeTo;
		a.ChangeCurrentSceneNode = this.ChangeCurrentSceneNode;
		a.RelativeToCurrentSceneNode = this.RelativeToCurrentSceneNode;
		a.Vector = this.Vector ? this.Vector.clone() : null;
		a.Area3DEnd = this.Area3DEnd ? this.Area3DEnd.clone() : null;
		a.UseAnimatedMovement = this.UseAnimatedMovement;
		a.TimeNeededForMovementMs = this.TimeNeededForMovementMs;

		if (a.SceneNodeToChangePosition == oldNodeId)
			a.SceneNodeToChangePosition = newNodeId;
		if (a.SceneNodeRelativeTo == oldNodeId)
			a.SceneNodeRelativeTo = newNodeId;

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

		if (nodeToHandle) {
			var finalpos = null;

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
				case 3: //EIT_RELATIVE_IN_FACING_DIRECTION:
					{
						var len = this.Vector.getLength();
						var matr = nodeToHandle.AbsoluteTransformation;

						var moveVect = new CL3D.Vect3d(1, 0, 0);
						matr.rotateVect(moveVect);

						if (nodeToHandle instanceof CL3D.CameraSceneNode && nodeToHandle.getType() == 'camera')
							moveVect = nodeToHandle.Target.substract(nodeToHandle.Pos);

						moveVect.setLength(len);

						finalpos = nodeToHandle.Pos.add(moveVect);
					}
					break;
				case 4: //EIT_RANDOM_POSITION:
					{
						var box = new CL3D.Box3d();
						box.reset(this.Vector.X, this.Vector.Y, this.Vector.Z);
						box.addInternalPointByVector(this.Area3DEnd);

						finalpos = new CL3D.Vect3d();
						finalpos.X = box.MinEdge.X + (Math.random() * (box.MaxEdge.X - box.MinEdge.X));
						finalpos.Y = box.MinEdge.Y + (Math.random() * (box.MaxEdge.Y - box.MinEdge.Y));
						finalpos.Z = box.MinEdge.Z + (Math.random() * (box.MaxEdge.Z - box.MinEdge.Z));
					}
					break;
				case 5: //EIT_RELATIVE_TO_LAST_BULLET_IMPACT:
					{
						finalpos = sceneManager.LastBulletImpactPosition.add(this.Vector);
					}
					break;
			}

			if (finalpos != null) {
				if (this.UseAnimatedMovement && this.TimeNeededForMovementMs > 0) {
					// move animated to target
					var anim = new CL3D.AnimatorFlyStraight();
					anim.Start = nodeToHandle.Pos.clone();
					anim.End = finalpos;
					anim.TimeForWay = this.TimeNeededForMovementMs;
					anim.DeleteMeAfterEndReached = true;
					anim.recalculateImidiateValues();

					nodeToHandle.addAnimator(anim);
				}

				else {
					// set position directly
					nodeToHandle.Pos = finalpos;
				}
			}
		}
	}
};
