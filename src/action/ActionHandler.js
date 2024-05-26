// ---------------------------------------------------------------------
// Action Handler
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @constructor
 * @private
 * @class
 */
export class ActionHandler {
    constructor(scene) {

        this.Actions = new Array();
        this.SMGr = scene;
    }

    /**
     * @private
     */
    execute(node, mgr, isCache) {
        for (var i = 0; i < this.Actions.length; ++i) {
            this.Actions[i].execute(node, this.SMGr, isCache);
        }
    }

    /**
     * @private
     */
    addAction(a) {
        if (a == null)
            return;

        this.Actions.push(a);
    }

    /**
     * @private
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
     * @private
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
