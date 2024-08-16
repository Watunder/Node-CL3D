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
    constructor() {
        super();

        this.Type = 'DeleteSceneNode';
    }

    /**
     * @public
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
     * @public
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
