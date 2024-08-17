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
    /**
     * @type {Number}
     */
    SoundChangeType;
    /**
     * @type {any}
     */
    SoundFileName;

    constructor() {
        super();

        this.Type = 'StopSound';
    }
    
    /**
     * @param {Number} oldNodeId
     * @param {Number} newNodeId
     */
    createClone(oldNodeId, newNodeId) {
        var a = new CL3D.ActionStopSound();
        a.SoundChangeType = this.SoundChangeType;
        a.SoundFileName = this.SoundFileName;
        return a;
    }

    /**
     * @param {CL3D.SceneNode} currentNode
     * @param {CL3D.Scene} sceneManager
     */
    execute(currentNode, sceneManager) {
        CL3D.gSoundManager.stopAll();
    }
};
