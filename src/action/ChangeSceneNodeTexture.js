// ---------------------------------------------------------------------
// Action ChangeSceneNodeTexture
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @public
 * @constructor
 * @class
 */
export class ActionChangeSceneNodeTexture extends CL3D.Action {
	/**
	 * @type {Number}
	 */
	TextureChangeType;
	/**
	 * @type {Number}
	 */
	SceneNodeToChange;
	/**
	 * @type {boolean}
	 */
	ChangeCurrentSceneNode;
	/**
	 * @type {CL3D.Texture}
	 */
	TheTexture;
	/**
	 * @type {Number}
	 */
	IndexToChange;
	
	constructor() {
        super();

		this.Type = 'ChangeSceneNodeTexture';
	}

	/**
	 * @param {Number} oldNodeId 
	 * @param {Number} newNodeId 
	 */
	createClone(oldNodeId, newNodeId) {
		var a = new CL3D.ActionChangeSceneNodeTexture();
		a.TextureChangeType = this.TextureChangeType;
		a.SceneNodeToChange = this.SceneNodeToChange;
		a.ChangeCurrentSceneNode = this.ChangeCurrentSceneNode;
		a.TheTexture = this.TheTexture;
		a.IndexToChange = this.IndexToChange;

		if (a.SceneNodeToChange == oldNodeId)
			a.SceneNodeToChange = newNodeId;

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

		else if (this.SceneNodeToChange != -1)
			nodeToHandle = sceneManager.getSceneNodeFromId(this.SceneNodeToChange);

		if (nodeToHandle) {
			if (nodeToHandle instanceof CL3D.Overlay2DSceneNode && nodeToHandle.getType() == '2doverlay') {
				nodeToHandle.setShowImage(this.TheTexture);
			}

			else {
				var mcnt = nodeToHandle.getMaterialCount();

				if (this.TextureChangeType == 0) // EIT_REPLACE_ALL
				{
					for (var i = 0; i < mcnt; ++i) {
						var mat = nodeToHandle.getMaterial(i);
						mat.Tex1 = this.TheTexture;
					}
				}

				else if (this.TextureChangeType == 1) // EIT_CHANGE_SPECIFIC_INDEX
				{
					var mat = nodeToHandle.getMaterial(this.IndexToChange);
					if (mat != null)
						mat.Tex1 = this.TheTexture;
				}
			}
		}
	}
};
