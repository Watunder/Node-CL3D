// ---------------------------------------------------------------------
// Action SetOverlayText
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @public
 * @constructor
 * @class
 */
export class ActionSetOverlayText extends CL3D.Action {
	constructor() {
        super();

		this.Text = "";
		this.SceneNodeToChange = null;
		this.ChangeCurrentSceneNode = false;
		this.Type = 'SetOverlayText';
	}

	/**
	 * @param {Number} oldNodeId
	 * @param {Number} newNodeId
	 */
	createClone(oldNodeId, newNodeId) {
		var a = new CL3D.ActionSetOverlayText();
		a.Text = this.Text;
		a.SceneNodeToChange = this.SceneNodeToChange;
		a.ChangeCurrentSceneNode = this.ChangeCurrentSceneNode;

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

		if (nodeToHandle && nodeToHandle instanceof CL3D.Overlay2DSceneNode) {
			var posVar = this.Text.indexOf('$');
			if (posVar != -1) {
				// text probably contains variables. Find and replace them with their values
				var textModified = this.Text;
				var currentPos = 0;
				var found = true;

				while (found) {
					found = false;

					posVar = textModified.indexOf('$', currentPos);
					if (posVar != -1) {
						currentPos = posVar + 1;
						var posEndVar = textModified.indexOf('$', posVar + 1);
						if (posEndVar != -1) {
							found = true;

							var varName = textModified.substr(posVar + 1, posEndVar - (posVar + 1));
							var v = CL3D.CopperCubeVariable.getVariable(varName, false, sceneManager);

							if (v) {
								// replace with content of v
								var newStr = textModified.substr(0, posVar);
								newStr += v.getValueAsString();
								currentPos = newStr.length + 1;
								newStr += textModified.substr(posEndVar + 1, textModified.length - posEndVar);

								textModified = newStr;
							}
						}
					}
				}

				nodeToHandle.setText(textModified);
			}

			else {
				// text doesn't contain variables, set it as it is
				nodeToHandle.setText(this.Text);
			}
		}
	}
};
