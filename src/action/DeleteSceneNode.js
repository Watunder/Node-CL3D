// ---------------------------------------------------------------------
// Action DeleteSceneNode
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @public
 * @constructor
 * @class
 */
export class ActionDeleteSceneNode extends CL3D.Action {
    /**
     * @type {Number}
     */
    SceneNodeToDelete;
    /**
     * @type {boolean}
     */
    DeleteCurrentSceneNode;
    /**
     * @type {Number}
     */
    TimeAfterDelete;
    
    constructor() {
        super();

        this.Type = 'DeleteSceneNode';
    }

	/**
	 * @param {Number} oldNodeId 
	 * @param {Number} newNodeId 
	 */
    createClone(oldNodeId, newNodeId) {
        var a = new CL3D.ActionDeleteSceneNode();
        a.SceneNodeToDelete = this.SceneNodeToDelete;
        a.DeleteCurrentSceneNode = this.DeleteCurrentSceneNode;
        a.TimeAfterDelete = this.TimeAfterDelete;

        if (a.SceneNodeToDelete == oldNodeId)
            a.SceneNodeToDelete = newNodeId;

        return a;
    }

	/**
	 * @param {CL3D.SceneNode} currentNode 
	 * @param {CL3D.Scene} sceneManager 
	 */
    execute(currentNode, sceneManager) {
        if (!currentNode || !sceneManager)
            return;

        var nodeToHandle = null;
        if (this.DeleteCurrentSceneNode)
            nodeToHandle = currentNode;
        else
            if (this.SceneNodeToDelete != -1)
                nodeToHandle = sceneManager.getSceneNodeFromId(this.SceneNodeToDelete);

        if (nodeToHandle != null)
            sceneManager.addToDeletionQueue(nodeToHandle, this.TimeAfterDelete);
    }
};
