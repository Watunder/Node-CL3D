// ---------------------------------------------------------------------
// Action SwitchToScene
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @public
 * @constructor
 * @class
 */
export class ActionSwitchToScene extends CL3D.Action {
	constructor(engine) {
        super();

		this.Engine = engine;
		this.Type = 'SwitchToScene';
	}

	/**
	 * @public
	 */
	createClone(oldNodeId, newNodeId) {
		var a = new CL3D.ActionSwitchToScene();
		a.SceneName = this.SceneName;
		return a;
	}
    
	/**
	 * @public
	 */
	execute(currentNode, sceneManager) {
		if (this.Engine)
			this.Engine.gotoSceneByName(this.SceneName, true);
	}
};
