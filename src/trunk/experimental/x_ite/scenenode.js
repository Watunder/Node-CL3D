import * as CL3D from "../../../main.js";
import X3D from 'x_ite';

export class SceneNode extends CL3D.SceneNode {
    /**
     * @type {import("./scene.js").Scene}
     */
    scene = null;

    /**
     * @type {SceneNode[]}
     */
    Children = [];

    constructor() {
        super();
    }

    init() {
        this._X3DNode = this.scene._X3DScene.createNode("Transform");
    }

    /**
     * @param {SceneNode} sceneNode
     */
    addChild(sceneNode) {
        if (sceneNode) {
            sceneNode.Parent = this;
            sceneNode.scene = this.scene;

            sceneNode.init();
            this._X3DNode.children.push(sceneNode._X3DNode);

            this.Children.push(sceneNode);
        }
    }

    /**
     * @param {SceneNode} sceneNode
     */
    removeChild(sceneNode) {
        if (sceneNode) {
            for (var i = 0; i < this.Children.length; ++i) {
                if (this.Children[i] === n) {
                    sceneNode.Parent = null;

                    this.Children.splice(i, 1);
                    return;
                }
            }
        }
    }
};