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
export class ActionOpenWebpage extends CL3D.Action{
	constructor() {
        super();

		this.Type = 'OpenWebpage';
	}

	/**
	 * @public
	 */
	createClone(oldNodeId, newNodeId) {
		var a = new CL3D.ActionOpenWebpage();
		a.Webpage = this.Webpage;
		a.Target = this.Target;
		return a;
	}

	/**
	 * @public
	 */
	execute(currentNode, sceneManager) {
		//console.log("opening" + this.Webpage + " with:" + this.Target);
		openWebpage(this.Webpage, this.Target);
	}
};
