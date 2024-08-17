// ---------------------------------------------------------------------
// Action SetSceneNodeAnimation
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @public
 * @constructor
 * @class
 */
export class ActionSetSceneNodeAnimation extends CL3D.Action {
	/**
	 * @type {Number}
	 */
	SceneNodeToChangeAnim;
	/**
	 * @type {boolean}
	 */
	ChangeCurrentSceneNode;
	/**
	 * @type {boolean}
	 */
	Loop;
	/**
	 * @type {String}
	 */
	AnimName;

	constructor() {
        super();

		this.Type = 'SetSceneNodeAnimation';
	}
    
	/**
	 * @param {Number} oldNodeId
	 * @param {Number} newNodeId
	 */
	createClone(oldNodeId, newNodeId) {
		var a = new CL3D.ActionSetSceneNodeAnimation();
		a.SceneNodeToChangeAnim = this.SceneNodeToChangeAnim;
		a.ChangeCurrentSceneNode = this.ChangeCurrentSceneNode;
		a.Loop = this.Loop;
		a.AnimName = this.AnimName;

		if (a.SceneNodeToChangeAnim == oldNodeId)
			a.SceneNodeToChangeAnim = newNodeId;

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

		else if (this.SceneNodeToChangeAnim != -1)
			nodeToHandle = sceneManager.getSceneNodeFromId(this.SceneNodeToChangeAnim);

		if (nodeToHandle) {
			// set animation
			var animatedMesh = nodeToHandle;
			if (animatedMesh instanceof CL3D.AnimatedMeshSceneNode && animatedMesh.getType() == 'animatedmesh') {
				animatedMesh.setAnimationByEditorName(this.AnimName, this.Loop);
			}
		}
	}
};
