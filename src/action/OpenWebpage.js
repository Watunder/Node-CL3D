// ---------------------------------------------------------------------
// Action OpenWebpage
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @private
 * @constructor
 * @class
 */
export class ActionOpenWebpage extends CL3D.Action{
	constructor() {
        super();

		this.Type = 'OpenWebpage';
	}

	/**
	 * @private
	 */
	createClone(oldNodeId, newNodeId) {
		var a = new CL3D.ActionOpenWebpage();
		a.Webpage = this.Webpage;
		a.Target = this.Target;
		return a;
	}

	/**
	 * @private
	 */
	execute(currentNode, sceneManager) {
		//CL3D.gCCDebugOutput.print("opening" + this.Webpage + " with:" + this.Target);
		window.open(this.Webpage, this.Target);
	}
};
