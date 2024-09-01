import * as CL3D from "../../main.js";
import * as BABYLON from '@babylonjs/core/Legacy/legacy';

/**
 * @type {CL3D.CCDocument}
 */
export let gDocument = new CL3D.CCDocument();

export class CopperLicht {

    constructor(mainElement) {
        this.MainElement = mainElement;
    }

    /**
     * @param {number} width 
     * @param {number} height 
     * @param {WebGLContextAttributes} options 
     * @param {HTMLCanvasElement} canvasOrContext 
     * @param {boolean} antialias 
     * @param {boolean} adaptToDeviceRatio 
     */
    initRenderer(width, height, options, canvasOrContext, antialias, adaptToDeviceRatio) {
        this.babylon = new BABYLON.Engine(canvasOrContext, antialias, options, adaptToDeviceRatio);
        this.babylon.setSize(width, height);
    }

    mainLoop() {
        this.babylon.runRenderLoop(() => {
            this.draw3DIntervalHandler();
        });
    }

    draw3DIntervalHandler() {
        const timeMs = this.babylon.getDeltaTime();

        this.draw3dScene(timeMs);
    }

    draw3dScene(timeMs) {
        let renderScene = gDocument.getCurrentScene();

        if (renderScene) {
            renderScene.drawAll();
        }
    }

    /**
     * @param {import('./scene.js').Scene} scene 
     */
    addScene(scene) {
        if (gDocument) {
            gDocument.Scenes.push(scene);
            if (gDocument.Scenes.length == 1)
                gDocument.setCurrentScene(scene);
        }

        if (!scene.ActiveCamera) {
            let light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene._babylonScene);

            let camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 5, -10), scene._babylonScene);
            // Target the camera to scene origin
            camera.setTarget(BABYLON.Vector3.Zero());
            // Attach the camera to the canvas
            camera.attachControl(this.MainElement, false);

            let ground = BABYLON.MeshBuilder.CreateGround("ground1", { width: 6, height: 6, subdivisions: 2, updatable: false }, scene._babylonScene);

            scene.ActiveCamera = camera;
        }
    }
};