import * as CL3D from "./main.js";

/**
 * @constructor
 * @public
 */
export class Action
{
    constructor()
    {
        this.Type = '';
    }
    
    /**
     * @public
     * @param {CL3D.SceneNode} node 
     * @param {CL3D.Scene=} mgr 
     */
    execute(node, mgr)
    {

    }

    /**
     * @public
     * @param {Number} oldNodeId 
     * @param {Number} newNodeId 
     */
    createClone(oldNodeId, newNodeId)
    {
        return null;
    }
};
