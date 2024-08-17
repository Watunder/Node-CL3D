// ---------------------------------------------------------------------
// Action ChangeSceneNodeScale
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @public
 * @constructor
 * @class
 */
export class ActionChangeSceneNodeScale extends CL3D.Action {
	/**
	 * @type {Number}
	 */
	ScaleChangeType;
	/**
	 * @type {Number}
	 */
	SceneNodeToChangeScale;
	/**
	 * @type {boolean}
	 */
	ChangeCurrentSceneNode;
	/**
	 * @type {CL3D.Vect3d}
	 */
	Vector;
	
	constructor() {
        super();

		this.Type = 'ChangeSceneNodeScale';
	}

	/**
	 * @param {Number} oldNodeId 
	 * @param {Number} newNodeId 
	 */
	createClone(oldNodeId, newNodeId) {
		var a = new CL3D.ActionChangeSceneNodeScale();
		a.ScaleChangeType = this.ScaleChangeType;
		a.SceneNodeToChangeScale = this.SceneNodeToChangeScale;
		a.ChangeCurrentSceneNode = this.ChangeCurrentSceneNode;
		a.Vector = this.Vector ? this.Vector.clone() : null;

		if (a.SceneNodeToChangeScale == oldNodeId)
			a.SceneNodeToChangeScale = newNodeId;

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

		else if (this.SceneNodeToChangeScale != -1)
			nodeToHandle = sceneManager.getSceneNodeFromId(this.SceneNodeToChangeScale);

		if (nodeToHandle) {
			switch (this.ScaleChangeType) {
				case 0: //EIT_ABSOLUTE_SCALE:
					nodeToHandle.Scale = this.Vector.clone();
					break;
				case 1: //EIT_RELATIVE_SCALE:
					nodeToHandle.Scale = nodeToHandle.Scale.multiplyWithVect(this.Vector);
					break;
			}
		}
	}
};
