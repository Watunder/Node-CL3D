
// ---------------------------------------------------------------------
// Action RestartScene
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @public
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
     * @public
     */
    createClone(oldNodeId, newNodeId) {
        var a = new CL3D.ActionRestartScene();
        a.SceneName = this.SceneName;
        return a;
    }

    /**
     * @public
     */
    execute(currentNode, sceneManager) {
        if (this.Engine)
            this.Engine.reloadScene(this.SceneName);
    }
};
