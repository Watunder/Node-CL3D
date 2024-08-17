
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
    /**
     * @type {String}
     */
    SceneName;

    /**
     * @param {CL3D.CopperLicht} [engine]
     */
    constructor(engine) {
        super();

        this.Engine = engine;
        this.Type = 'RestartScene';
    }

    /**
     * @param {Number} oldNodeId
     * @param {Number} newNodeId
     */
    createClone(oldNodeId, newNodeId) {
        var a = new CL3D.ActionRestartScene();
        a.SceneName = this.SceneName;
        return a;
    }

    /**
     * @param {CL3D.SceneNode} currentNode
     * @param {CL3D.Scene} sceneManager
     */
    execute(currentNode, sceneManager) {
        if (this.Engine)
            this.Engine.reloadScene(this.SceneName);
    }
};
