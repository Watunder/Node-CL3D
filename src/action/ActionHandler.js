// ---------------------------------------------------------------------
// Action Handler
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @constructor
 * @public
 * @class
 */
export class ActionHandler {
    /**
     * @param {CL3D.Scene} scene 
     */
    constructor(scene) {

        /**
         * @type {CL3D.Action[]}
         */
        this.Actions = new Array();
        this.SMGr = scene;
    }

    /**
     * @public
     * @param {CL3D.SceneNode} node 
     */
    execute(node) {
        for (var i = 0; i < this.Actions.length; ++i) {
            this.Actions[i].execute(node, this.SMGr);
        }
    }

    /**
     * @public
     * @param {CL3D.Action} a 
     */
    addAction(a) {
        if (a == null)
            return;

        this.Actions.push(a);
    }

    /**
     * @public
     * @param {String} type 
     */
    findAction(type) {
        for (var i = 0; i < this.Actions.length; ++i) {
            var a = this.Actions[i];
            if (a.Type == type)
                return a;
        }

        return null;
    }
    
    /**
     * @public
     * @param {Number} oldNodeId 
     * @param {Number} newNodeId 
     */
    createClone(oldNodeId, newNodeId) {
        var c = new CL3D.ActionHandler(this.SMGr);

        for (var i = 0; i < this.Actions.length; ++i) {
            var a = this.Actions[i];
            if (a.createClone != null)
                c.addAction(a.createClone(oldNodeId, newNodeId));
        }

        return c;
    }
};
