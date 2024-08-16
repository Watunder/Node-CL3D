// ---------------------------------------------------------------------
// Action StopSound
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @public
 * @constructor
 * @class
 */
export class ActionStopSound extends CL3D.Action {
    constructor() {
        super();

        this.Type = 'StopSound';
    }
    
    /**
     * @public
     */
    createClone(oldNodeId, newNodeId) {
        var a = new CL3D.ActionStopSound();
        a.SoundChangeType = this.SoundChangeType;
        a.SoundFileName = this.SoundFileName;
        return a;
    }

    /**
     * @public
     */
    execute(currentNode, sceneManager) {
        CL3D.gSoundManager.stopAll();
    }
};
