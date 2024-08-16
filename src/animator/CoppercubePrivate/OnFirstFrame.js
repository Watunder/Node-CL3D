/////////////////////////////////////////////////////////////////////////////////////////
// AnimatorOnFirstFrame
/////////////////////////////////////////////////////////////////////////////////////////

import * as CL3D from "../../main.js";

/**
 * @constructor
 * @class
 * @public
 * @extends CL3D.Animator
 */
export class AnimatorOnFirstFrame extends CL3D.Animator {
    constructor(scene) {
        super();

        this.RunAlready = false;
        this.AlsoOnReload = false;
        this.SMGr = scene;
        this.TheActionHandler = null;
    }

    /**
     * Returns the type of the animator.
     * For the AnimatorOnFirstFrame, this will return 'onfirstframe'.
     * @public
     */
    getType() {
        return 'onfirstframe';
    }

    /**
     * Animates the scene node it is attached to and returns true if scene node was modified.
     * @public
     * @param {CL3D.SceneNode} n The Scene node which needs to be animated this frame.
     * @param {Integer} timeMs The time in milliseconds since the start of the scene.
     */
    animateNode(n, timeMs) {
        if (this.RunAlready)
            return false;

        this.RunAlready = true;

        if (this.TheActionHandler) {
            this.TheActionHandler.execute(n);
            return true;
        }

        return false;
    }
};
