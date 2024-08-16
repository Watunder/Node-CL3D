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
	constructor() {
        super();

		this.Type = 'SetSceneNodeAnimation';
	}
    
	/**
	 * @public
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
	 * @public
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
			if (animatedMesh.getType() != 'animatedmesh')
				return;

			animatedMesh.setAnimationByEditorName(this.AnimName, this.Loop);
		}
	}
};
