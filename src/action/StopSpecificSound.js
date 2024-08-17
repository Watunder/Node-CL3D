// ---------------------------------------------------------------------
// Action StopSpecificSound
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @public
 * @constructor
 * @class
 */
export class ActionStopSpecificSound extends CL3D.Action {
    /**
     * @type {{ Name: any; }}
     */
    TheSound;

    constructor() {
        super();

        this.Type = 'StopSpecificSound';
    }

    /**
     * @param {Number} oldNodeId
     * @param {Number} newNodeId
     */
    createClone(oldNodeId, newNodeId) {
        var a = new CL3D.ActionStopSpecificSound();
        a.TheSound = this.TheSound;

        return a;
    }

    /**
     * @param {CL3D.SceneNode} currentNode
     * @param {CL3D.Scene} sceneManager
     */
    execute(currentNode, sceneManager) {
        if (sceneManager == null || this.TheSound == null)
            return;

        CL3D.gSoundManager.stopSpecificPlayingSound(this.TheSound.Name);
    }
};
