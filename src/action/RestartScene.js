
// ---------------------------------------------------------------------
// Action RestartScene
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @private
 * @constructor
 * @class
 */
export class ActionRestartScene extends CL3D.Action {
    constructor(engine) {
        super();

        this.Engine = engine;
        this.Type = 'RestartScene';
    }

    /**
     * @private
     */
    createClone(oldNodeId, newNodeId) {
        var a = new CL3D.ActionRestartScene();
        a.SceneName = this.SceneName;
        return a;
    }

    /**
     * @private
     */
    execute(currentNode, sceneManager) {
        if (this.Engine)
            this.Engine.reloadScene(this.SceneName);
    }
};
