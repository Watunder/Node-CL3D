// ---------------------------------------------------------------------
// Action ExecuteJavaScript
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @type {CL3D.SceneNode}
 */
export let gCurrentJScriptNode = null;

/**
 * @public
 * @constructor
 * @class
 */
export class ActionExecuteJavaScript extends CL3D.Action {
	constructor() {
        super();

		this.Type = 'ExecuteJavaScript';
	}

	/**
	 * @public
	 */
	createClone(oldNodeId, newNodeId) {
		var a = new CL3D.ActionExecuteJavaScript();
		a.JScript = this.JScript;
		return a;
	}

	/**
	 * @public
	 */
	execute(currentNode, sceneManager) {
		gCurrentJScriptNode = currentNode;

		(new Function(this.JScript))();

		gCurrentJScriptNode = null;
	}
};
