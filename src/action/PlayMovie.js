// ---------------------------------------------------------------------
// Action PlayMovie
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @private
 * @constructor
 * @class
 */
export class ActionPlayMovie extends CL3D.Action {
    constructor(engine) {
        super();

        this.Type = 'ActionPlayMovie';
        this.Engine = engine;
    }

    /**
     * @private
     */
    createClone(oldNodeId, newNodeId) {
        var a = new CL3D.ActionPlayMovie();
        a.PlayLooped = this.PlayLooped;
        a.Command = this.Command;
        a.VideoFileName = this.VideoFileName;
        a.SceneNodeToPlayAt = this.SceneNodeToPlayAt;
        a.PlayAtCurrentSceneNode = this.PlayAtCurrentSceneNode;
        a.MaterialIndex = this.MaterialIndex;
        a.ActionHandlerFinished = this.ActionHandlerFinished ? this.ActionHandlerFinished.createClone(oldNodeId, newNodeId) : null;
        a.ActionHandlerFailed = this.ActionHandlerFailed ? this.ActionHandlerFailed.createClone(oldNodeId, newNodeId) : null;

        if (a.SceneNodeToPlayAt == oldNodeId)
            a.SceneNodeToPlayAt = newNodeId;

        return a;
    }

    /**
     * @private
     */
    execute(currentNode, sceneManager) {
        if (!currentNode || !sceneManager)
            return;

        var nodeToHandle = null;
        if (this.PlayAtCurrentSceneNode)
            nodeToHandle = currentNode;
        else
            if (this.SceneNodeToPlayAt != -1)
                nodeToHandle = sceneManager.getSceneNodeFromId(this.SceneNodeToPlayAt);


        var failed = false;

        // create video stream
        var stream = this.Engine.getOrCreateVideoStream(this.VideoFileName, this.Command == 0, this.ActionHandlerFinished, this.ActionHandlerFailed);

        if (stream != null) {
            switch (this.Command) {
                case 0: // play
                    {
                        stream.play(this.PlayLooped);

                        // set texture
                        if (nodeToHandle) {
                            if (nodeToHandle.getType() == '2doverlay')
                                nodeToHandle.setShowImage(stream.texture);
                            else {
                                var mat = nodeToHandle.getMaterial(this.MaterialIndex);
                                if (mat != null)
                                    mat.Tex1 = stream.texture;
                            }
                        }
                    }
                    break;

                case 1: // pause
                    stream.pause();
                    break;

                case 2: // stop
                    stream.stop();
                    break;
            }
        }
    }
};
