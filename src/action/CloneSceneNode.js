// ---------------------------------------------------------------------
// Action CloneSceneNode
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @public
 * @constructor
 * @class
 */
export class ActionCloneSceneNode extends CL3D.Action {
    constructor() {
        super();

        this.Type = 'CloneSceneNode';
    }

    /**
     * @public
     */
    createClone(oldNodeId, newNodeId) {
        var a = new CL3D.ActionCloneSceneNode();
        a.SceneNodeToClone = this.SceneNodeToClone;
        a.CloneCurrentSceneNode = this.CloneCurrentSceneNode;
        a.TheActionHandler = this.TheActionHandler ? this.TheActionHandler.createClone(oldNodeId, newNodeId) : null;

        if (a.SceneNodeToClone == oldNodeId)
            a.SceneNodeToClone = newNodeId;
        return a;
    }

    /**
     * @public
     */
    execute(currentNode, sceneManager) {
        if (!currentNode || !sceneManager)
            return;

        var nodeToHandle = null;
        if (this.CloneCurrentSceneNode)
            nodeToHandle = currentNode;
        else
            if (this.SceneNodeToClone != -1)
                nodeToHandle = sceneManager.getSceneNodeFromId(this.SceneNodeToClone);

        if (nodeToHandle) {
            var oldId = nodeToHandle.Id;
            var newId = -1;

            // get new, unused id
            newId = sceneManager.getUnusedSceneNodeId();

            // clone
            var cloned = nodeToHandle.createClone(nodeToHandle.Parent, oldId, newId);

            if (cloned != null) {
                cloned.Id = newId;
                nodeToHandle.Parent.addChild(cloned);

                // update refernced ids which haven't been updated yet
                sceneManager.replaceAllReferencedNodes(nodeToHandle, cloned);

                // also clone collision detection of the node in the world
                var selector = nodeToHandle.Selector;
                if (selector) {
                    var newSelector = selector.createClone(cloned);
                    if (newSelector) {
                        // set to node
                        cloned.Selector = newSelector;

                        // also, copy into world
                        if (sceneManager.getCollisionGeometry())
                            sceneManager.getCollisionGeometry().addSelector(newSelector);
                    }
                }

                // run action on clone
                if (this.TheActionHandler)
                    this.TheActionHandler.execute(cloned);
            }
        }
    }
};
