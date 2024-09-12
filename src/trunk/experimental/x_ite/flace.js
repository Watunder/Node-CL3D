import * as CL3D from "../../../main.js";
import X3D from 'x_ite';

/**
 * @type {CL3D.CCDocument}
 */
export let gDocument = new CL3D.CCDocument();

export class CopperLicht {
    /**
     * @param {HTMLCanvasElement} mainElement
     */
    constructor(mainElement) {
        this.MainElement = mainElement;
        this.X3DBrowser = X3D.getBrowser();
        this.X3DScene = this.X3DBrowser.currentScene;
    }

    /**
     * @param {number} width
     * @param {number} height
     * @param {WebGLContextAttributes} options
     */
    initRenderer(width, height, options) {
        this.MainElement.style.width = `${width}px`;
        this.MainElement.style.height = `${height}px`;
    }

    mainLoop() {
        this.draw3DIntervalHandler();
    }

    draw3DIntervalHandler() {
        const timeMs = 0;

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
    }
};