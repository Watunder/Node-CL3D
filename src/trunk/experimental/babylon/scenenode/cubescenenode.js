import * as CL3D from "../../../../main.js";
import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { SceneNode } from "../scenenode.js";

export class CubeSceneNode extends SceneNode {
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

        this._babylonNode = BABYLON.MeshBuilder.CreateBox(this.Name, {
            size: size,
            width: width,
            height: height,
            sideOrientation: BABYLON.Mesh.FRONTSIDE
        });
    }
};