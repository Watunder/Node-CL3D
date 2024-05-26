// ---------------------------------------------------------------------
// Action ExecuteJavaScript
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

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
		CL3D.gCurrentJScriptNode = currentNode;

		eval(this.JScript);

		CL3D.gCurrentJScriptNode = null;
	}
};
