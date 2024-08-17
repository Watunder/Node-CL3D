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
	/**
	 * @type {String}
	 */
	JScript;

	constructor() {
        super();

		this.Type = 'ExecuteJavaScript';
	}

	/**
	 * @param {Number} oldNodeId 
	 * @param {Number} newNodeId 
	 */
	createClone(oldNodeId, newNodeId) {
		var a = new CL3D.ActionExecuteJavaScript();
		a.JScript = this.JScript;
		return a;
	}

	/**
	 * @param {CL3D.SceneNode} currentNode 
	 * @param {CL3D.Scene} sceneManager 
	 */
	execute(currentNode, sceneManager) {
		gCurrentJScriptNode = currentNode;

		(new Function(this.JScript))();

		gCurrentJScriptNode = null;
	}
};
