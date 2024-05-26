// ---------------------------------------------------------------------
// Action StopSpecificSound
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @private
 * @constructor
 * @class
 */
export class ActionStopSpecificSound extends CL3D.Action {
    constructor() {
        super();

        this.Type = 'StopSpecificSound';
    }

    /**
     * @private
     */
    createClone(oldNodeId, newNodeId) {
        var a = new CL3D.ActionStopSpecificSound();
        a.TheSound = this.TheSound;

        return a;
    }

    /**
     * @private
     */
    execute(currentNode, sceneManager) {
        if (sceneManager == null || this.TheSound == null)
            return;

        CL3D.gSoundManager.stopSpecificPlayingSound(this.TheSound.Name);
    }
};
