import * as CL3D from "../../main.js";
import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import { SceneNode } from "./scenenode.js";

export class Scene extends CL3D.Scene {
    constructor(engine, options) {
        super();

        this._babylonScene = new BABYLON.Scene(engine.babylon, options);

        this.RootNode = new SceneNode();
        this.RootNode.scene = this;
    }

    getRootSceneNode() {
        return this.RootNode;
    }

    drawAll() {
        this._babylonScene.render();
    }
};