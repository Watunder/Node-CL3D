/////////////////////////////////////////////////////////////////////////////////////////
// Timer animator
/////////////////////////////////////////////////////////////////////////////////////////

import * as CL3D from "../../main.js";

/**
 * @constructor
 * @class
 * @public
 * @extends CL3D.Animator
 */
export class AnimatorTimer extends CL3D.Animator {
    constructor(scene) {
        super();

        this.TimeLastTimed = 0;
        this.SMGr = scene;
        this.TheActionHandler = null;
        this.TickEverySeconds = 0;
        this.TimeLastTimed = CL3D.CLTimer.getTime();
    }
    
    /**
     * Returns the type of the animator.
     * For the AnimatorTimer, this will return 'timer'.
     * @public
     */
    getType() {
        return 'timer';
    }
    
    /**
	 * @param {CL3D.SceneNode} node
	 * @param {CL3D.Scene} newManager
	 * @param {Number} oldNodeId
	 * @param {Number} newNodeId
     */
    createClone(node, newManager, oldNodeId, newNodeId) {
        var a = new CL3D.AnimatorTimer(this.SMGr);
        a.TheActionHandler = this.TheActionHandler ? this.TheActionHandler.createClone(oldNodeId, newNodeId) : null;
        a.TimeLastTimed = this.TimeLastTimed;
        a.TickEverySeconds = this.TickEverySeconds;
        return a;
    }
    
    /**
     * Animates the scene node it is attached to and returns true if scene node was modified.
     * @public
     * @param {CL3D.SceneNode} n The Scene node which needs to be animated this frame.
     * @param {Number} timeMs The time in milliseconds since the start of the scene.
     */
    animateNode(n, timeMs) {
        if (n == null)
            return false;

        if (this.TickEverySeconds > 0) {
            var now = CL3D.CLTimer.getTime();

            if (now - this.TimeLastTimed > this.TickEverySeconds) {
                this.TimeLastTimed = now;

                if (this.TheActionHandler)
                    this.TheActionHandler.execute(n);
                return true;
            }
        }
        return false;
    }
};
