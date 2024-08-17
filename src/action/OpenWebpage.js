// ---------------------------------------------------------------------
// Action OpenWebpage
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";
import { openWebpage } from "../share/openWebpage.js";

/**
 * @public
 * @constructor
 * @class
 */
export class ActionOpenWebpage extends CL3D.Action {
	/**
	 * @type {String}
	 */
	Webpage;
	/**
	 * @type {String}
	 */
	Target;
	
	constructor() {
        super();

		this.Type = 'OpenWebpage';
	}

	/**
	 * @param {Number} oldNodeId 
	 * @param {Number} newNodeId 
	 */
	createClone(oldNodeId, newNodeId) {
		var a = new CL3D.ActionOpenWebpage();
		a.Webpage = this.Webpage;
		a.Target = this.Target;
		return a;
	}

	/**
	 * @param {CL3D.SceneNode} currentNode 
	 * @param {CL3D.Scene} sceneManager 
	 */
	execute(currentNode, sceneManager) {
		//console.log("opening" + this.Webpage + " with:" + this.Target);
		openWebpage(this.Webpage, this.Target);
	}
};
