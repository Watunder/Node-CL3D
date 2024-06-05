// ---------------------------------------------------------------------
// Action ExecuteJavaScript
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @type {CL3D.SceneNode}
 */
export let gCurrentJScriptNode = null;

/**
 * @private
 * @constructor
 * @class
 */
export class ActionExecuteJavaScript extends CL3D.Action {
	constructor() {
        super();

		this.Type = 'ExecuteJavaScript';
	}

	/**
	 * @private
	 */
	createClone(oldNodeId, newNodeId) {
		var a = new CL3D.ActionExecuteJavaScript();
		a.JScript = this.JScript;
		return a;
	}

	/**
	 * @private
	 */
	execute(currentNode, sceneManager) {
		gCurrentJScriptNode = currentNode;

		(new Function(this.JScript))();

		gCurrentJScriptNode = null;
	}
};
