// ---------------------------------------------------------------------
// Action StopSound
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @private
 * @constructor
 * @class
 */
export class ActionStopSound extends CL3D.Action {
    constructor() {
        super();

        this.Type = 'StopSound';
    }
    
    /**
     * @private
     */
    createClone(oldNodeId, newNodeId) {
        var a = new CL3D.ActionStopSound();
        a.SoundChangeType = this.SoundChangeType;
        a.SoundFileName = this.SoundFileName;
        return a;
    }

    /**
     * @private
     */
    execute(currentNode, sceneManager) {
        CL3D.gSoundManager.stopAll();
    }
};
