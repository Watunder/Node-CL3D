/////////////////////////////////////////////////////////////////////////////////////////
// Keypress animator
/////////////////////////////////////////////////////////////////////////////////////////

import * as CL3D from "../../main.js";

/**
 * @constructor
 * @class
 * @public
 * @extends CL3D.Animator
 */
export class AnimatorOnKeyPress extends CL3D.Animator{
    constructor(scene, engine) {
        super();

        this.SMGr = scene;
        this.Engine = engine;
        this.TheActionHandler = null;
        this.TickEverySeconds = 0;
        this.Object = null;
        this.LastTimeDoneSomething = false;

        engine.registerAnimatorForKeyUp(this);
        engine.registerAnimatorForKeyDown(this);

        scene.registerSceneNodeAnimatorForEvents(this);
    }
    
    /**
     * Returns the type of the animator.
     * For the AnimatorOnKeyPress, this will return 'keypress'.
     * @public
     */
    getType() {
        return 'keypress';
    }
    
    /**
     * @public
     */
    createClone(node, newManager, oldNodeId, newNodeId) {
        var a = new CL3D.AnimatorOnKeyPress(this.SMGr, this.Engine);
        a.KeyPressType = this.KeyPressType;
        //a.IfCameraOnlyDoIfActive = this.IfCameraOnlyDoIfActive;
        a.KeyCode = this.KeyCode;
        a.TheActionHandler = this.TheActionHandler ? this.TheActionHandler.createClone(oldNodeId, newNodeId) : null;
        return a;
    }
    
    /**
     * Animates the scene node it is attached to and returns true if scene node was modified.
     * @public
     * @param {CL3D.SceneNode} n The Scene node which needs to be animated this frame.
     * @param {Integer} timeMs The time in milliseconds since the start of the scene.
     */
    animateNode(n, timeMs) {
        this.Object = n;
        var done = this.LastTimeDoneSomething;
        this.LastTimeDoneSomething = false;
        return done;
    }
    
    /**
     * @public
     */
    onKeyDown(evt) {
        if (this.KeyPressType == 0 && evt.keyCode == this.KeyCode) {
            this.directlyRunKeypressEvent();
            return true;
        }

        return false;
    }
    
    /**
     * @public
     */
    onKeyUp(evt) {
        if (this.KeyPressType == 1 && evt.keyCode == this.KeyCode) {
            this.directlyRunKeypressEvent();
            return true;
        }

        return false;
    }
    
    /**
     * @public
     */
    onMouseUp(evt) {
        if (this.KeyPressType == 1) {
            if (evt.button > 1 && this.KeyCode == 0x2) // right click
                this.directlyRunKeypressEvent();

            else if (evt.button <= 1 && this.KeyCode == 0x1) // left click
                this.directlyRunKeypressEvent();
        }
    }
    
    /**
     * @public
     */
    onMouseDown(evt) {
        if (this.KeyPressType == 0) {
            if (evt.button > 1 && this.KeyCode == 0x2) // right click
                this.directlyRunKeypressEvent();

            else if (evt.button <= 1 && this.KeyCode == 0x1) // left click
                this.directlyRunKeypressEvent();
        }
    }
    
    /**
     * @public
     */
    findActionByType(type) {
        if (this.TheActionHandler)
            return this.TheActionHandler.findAction(type);

        return null;
    }
    
    /**
     * @public
     */
    directlyRunKeypressEvent(type) {
        if (this.Object &&
            this.Object.scene === this.SMGr &&
            this.Object.isActuallyVisible() &&
            this.Engine.getScene() === this.Object.scene) {
            if (this.Object.Parent == null && // deleted
                !(this.Object.Type == -1)) // root scene node
            {
                // object seems to be deleted 
                this.Object = null;
                return;
            }

            this.LastTimeDoneSomething = true;

            if (this.TheActionHandler)
                this.TheActionHandler.execute(this.Object);

            this.SMGr.forceRedrawNextFrame(); // the animate might not be recalled after this element has been made invisible in this invokeAction()			
            return true;
        }

        return null;
    }
};
