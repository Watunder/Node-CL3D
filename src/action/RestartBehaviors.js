// ---------------------------------------------------------------------
// Action RestartBehaviors
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @public
 * @constructor
 * @class
 */
export class ActionRestartBehaviors extends CL3D.Action {
	constructor() {
        super();

		/**
		 * @type {Number}
		 */
		this.SceneNodeToRestart = null;
		this.ChangeCurrentSceneNode = false;
		this.Type = 'RestartBehaviors';
	}

	/**
	 * @param {Number} oldNodeId
	 * @param {Number} newNodeId
	 * @param {boolean} bChangeCurrentSceneNode
	 */
	createClone(oldNodeId, newNodeId, bChangeCurrentSceneNode = false) {
		var a = new CL3D.ActionRestartBehaviors();
		a.SceneNodeToRestart = this.SceneNodeToRestart;
		a.ChangeCurrentSceneNode = this.ChangeCurrentSceneNode;

		if (a.ChangeCurrentSceneNode != bChangeCurrentSceneNode)
			a.ChangeCurrentSceneNode = bChangeCurrentSceneNode;
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

		else if (this.SceneNodeToRestart != -1)
			nodeToHandle = sceneManager.getSceneNodeFromId(this.SceneNodeToRestart);

		if (nodeToHandle) {
			for (var i = 0; i < nodeToHandle.Animators.length; ++i) {
				var a = nodeToHandle.Animators[i];
				if (a != null)
					a.reset();
			}
		}
	}
};
