import * as CL3D from "../../../../main.js";
import X3D from 'x_ite';
import { SceneNode } from "../scenenode.js";

export class CubeSceneNode extends SceneNode {
    Size = new X3D.SFVec3f();

    /**
     * @param {number=} size
     * @param {number=} width
     * @param {number=} height
     */
    constructor(size, width, height) {
        super();

        if (size === undefined)
            size = 1;

        if (width === undefined)
            width = size;

        if (height === undefined)
            height = width;

        this.Size.x = size;
        this.Size.y = width;
        this.Size.z = height;
    }

    init() {
        const
            transformNode = this.scene._X3DScene.createNode("Transform"),
            shapeNode = this.scene._X3DScene.createNode("Shape"),
            appearanceNode = this.scene._X3DScene.createNode("Appearance"),
            materialNode = this.scene._X3DScene.createNode("Material"),
            boxNode = this.scene._X3DScene.createNode("Box");

        appearanceNode.material = materialNode;

        shapeNode.appearance = appearanceNode;
        boxNode.size = this.Size;
        shapeNode.geometry = boxNode;

        transformNode.children.push(shapeNode);

        this._X3DNode = transformNode;
    }
};