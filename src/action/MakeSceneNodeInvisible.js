// ---------------------------------------------------------------------
// Action MakeSceneNodeInvisible
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @private
 * @constructor
 * @class
 */
export class ActionMakeSceneNodeInvisible extends CL3D.Action {
	constructor() {
        super();

		this.InvisibleMakeType = 0;
		this.SceneNodeToMakeInvisible = null;
		this.ChangeCurrentSceneNode = false;
		this.Type = 'MakeSceneNodeInvisible';
	}

	/**
	 * @private
	 */
	createClone(oldNodeId, newNodeId) {
		var a = new CL3D.ActionMakeSceneNodeInvisible();
		a.InvisibleMakeType = this.InvisibleMakeType;
		a.SceneNodeToMakeInvisible = this.SceneNodeToMakeInvisible;
		a.ChangeCurrentSceneNode = this.ChangeCurrentSceneNode;

		if (a.SceneNodeToMakeInvisible == oldNodeId)
			a.SceneNodeToMakeInvisible = newNodeId;

		return a;
	}
    
	/**
	 * @private
	 */
	execute(currentNode, sceneManager) {
		if (!currentNode || !sceneManager)
			return;

		var nodeToHandle = null;
		if (this.ChangeCurrentSceneNode)
			nodeToHandle = currentNode;

		else if (this.SceneNodeToMakeInvisible != -1)
			nodeToHandle = sceneManager.getSceneNodeFromId(this.SceneNodeToMakeInvisible);

		if (nodeToHandle) {
			switch (this.InvisibleMakeType) {
				case 0: //EIT_MAKE_INVISIBLE:
					nodeToHandle.Visible = false;
					break;
				case 1: //EIT_MAKE_VISIBLE:
					nodeToHandle.Visible = true;
					break;
				case 2: //EIT_TOGGLE_VISIBILITY:
					{
						nodeToHandle.Visible = !nodeToHandle.Visible;
					}
					break;
			}
		}
	}
};
