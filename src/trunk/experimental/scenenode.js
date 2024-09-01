import * as CL3D from "../../main.js";
import * as BABYLON from '@babylonjs/core/Legacy/legacy';


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
        
        this._babylonNode = new BABYLON.Node(this.Name, this.scene);
    }

    /**
     * @param {SceneNode} sceneNode 
     */
	addChild(sceneNode) {
		if (sceneNode) {
            sceneNode._babylonNode.parent = this._babylonNode;
			sceneNode.Parent = this;
            
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
                    sceneNode._babylonNode.parent = null;
                    sceneNode.Parent = null;

                    this.Children.splice(i, 1);
                    return;
                }
            }
		}
	}
};