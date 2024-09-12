import * as CL3D from "../../../main.js";
import X3D from 'x_ite';

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
     */
    initRenderer(width, height, options) {
        (async () => {
            await this.test();
        })();
    }

    async test() {
        const
            browser = X3D.getBrowser(),
            scene = browser.currentScene;

        scene.setProfile(browser.getProfile("Interchange"));
        scene.addComponent(browser.getComponent("Interpolation", 1));

        await browser.loadComponents(scene);

        // Viewpoint

        const viewpointNode = scene.createNode("Viewpoint");

        viewpointNode.set_bind = true;
        viewpointNode.description = "Initial View";
        viewpointNode.position = new X3D.SFVec3f(2.869677, 3.854335, 8.769781);
        viewpointNode.orientation = new X3D.SFRotation(-0.7765887, 0.6177187, 0.1238285, 0.5052317);

        scene.rootNodes.push(viewpointNode);

        // Box

        const
            transformNode = scene.createNode("Transform"),
            shapeNode = scene.createNode("Shape"),
            appearanceNode = scene.createNode("Appearance"),
            materialNode = scene.createNode("Material"),
            boxNode = scene.createNode("Box");

        appearanceNode.material = materialNode;

        shapeNode.appearance = appearanceNode;
        shapeNode.geometry = boxNode;

        transformNode.children.push(shapeNode);

        scene.rootNodes.push(transformNode);

        // Give the node a name if you like.
        scene.addNamedNode("Box", transformNode);

        // Animation

        const
            timeSensorNode = scene.createNode("TimeSensor"),
            interpolatorNode = scene.createNode("OrientationInterpolator");

        timeSensorNode.cycleInterval = 10;
        timeSensorNode.loop = true;

        for (let i = 0; i < 5; ++i) {
            interpolatorNode.key[i] = i / 4;
            interpolatorNode.keyValue[i] = new X3D.SFRotation(0, 1, 0, Math.PI * i / 2);
        }

        scene.rootNodes.push(timeSensorNode, interpolatorNode);

        // Routes

        scene.addRoute(timeSensorNode, "fraction_changed", interpolatorNode, "set_fraction");
        scene.addRoute(interpolatorNode, "value_changed", transformNode, "set_rotation");
    }

    mainLoop() {
        //this.draw3DIntervalHandler();
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