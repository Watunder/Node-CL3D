import * as CL3D from "../../../main.js";
import X3D from 'x_ite';
import { SceneNode } from "./scenenode.js";

export class Scene extends CL3D.Scene {
    /**
     * @param {import('./flace.js').CopperLicht} engine
     * @param {*} options
     */
    constructor(engine, options) {
        super();

        this._X3DScene = engine.X3DScene;

        this.RootNode = new SceneNode();
        this.RootNode.scene = this;
        this.RootNode.init();

        this._X3DScene.rootNodes.push(this.RootNode._X3DNode);
    }

    getRootSceneNode() {
        return this.RootNode;
    }

    drawAll() {

    }
};