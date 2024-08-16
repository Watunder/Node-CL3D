// ---------------------------------------------------------------------
// Action SetActiveCamera
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @public
 * @constructor
 * @class
 */
export class ActionSetActiveCamera extends CL3D.Action {
	constructor(engine) {
        super();

		this.Engine = engine;
		this.Type = 'SetActiveCamera';
	}

	/**
	 * @public
	 */
	createClone(oldNodeId, newNodeId) {
		var a = new CL3D.ActionSetActiveCamera();
		a.CameraToSetActive = this.CameraToSetActive;

		if (a.CameraToSetActive == oldNodeId)
			a.CameraToSetActive = newNodeId;

		return a;
	}
    
	/**
	 * @public
	 */
	execute(currentNode, sceneManager) {
		if (!currentNode || !sceneManager)
			return;

		var nodeToHandle = null;
		if (this.CameraToSetActive != -1)
			nodeToHandle = sceneManager.getSceneNodeFromId(this.CameraToSetActive);

		if (nodeToHandle != null) {
			if (nodeToHandle.getType() == 'camera') {
				if (this.Engine) {
					//console.log("Setting camera to" + nodeToHandle.Name);
					this.Engine.setActiveCameraNextFrame(nodeToHandle);
				}
			}
		}
	}
};
