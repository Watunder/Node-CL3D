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

		this.SceneNodeToRestart = null;
		this.ChangeCurrentSceneNode = false;
		this.Type = 'RestartBehaviors';
	}

	/**
	 * @public
	 */
	createClone(oldNodeId, newNodeId) {
		var a = new CL3D.ActionRestartBehaviors();
		a.SceneNodeToRestart = this.SceneNodeToRestart;
		a.ChangeCurrentSceneNode = this.ChangeCurrentSceneNode;

		if (a.ChangeCurrentSceneNode == oldNodeId)
			a.ChangeCurrentSceneNode = newNodeId;
		return a;
	}

	/**
	 * @public
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
