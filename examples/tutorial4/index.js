import * as CL3D from "../../dist/cl3d.js";

// create the 3d engine
const canvas = document.getElementById('3darea');
const engine = new CL3D.CopperLicht(canvas);

if (!engine.initRenderer(1280, 720, { alpha: false }, canvas))
    throw new Error("this browser doesn't support WebGL");

// add a new 3d scene

let scene = new CL3D.Scene();
engine.addScene(scene);

scene.setBackgroundColor(CL3D.createColor(1, 0, 0, 0));
scene.setRedrawMode(CL3D.Scene.REDRAW_WHEN_SCENE_CHANGED);

// add a transparent billboard scene node with a text sign
for (let i = 0; i < 50; ++i) {
    let billboard = new CL3D.BillboardSceneNode();
    billboard.setSize(30, 30);
    billboard.Pos.X = Math.random() * 80 - 40;
    billboard.Pos.Y = Math.random() * 80 - 40;
    billboard.Pos.Z = Math.random() * 80 - 40;
    billboard.getMaterial(0).Tex1 = engine.getTextureManager().getTexture("particle.png", true);
    billboard.getMaterial(0).Type = CL3D.Material.EMT_TRANSPARENT_ADD_COLOR;
    scene.getRootSceneNode().addChild(billboard);
}

// add a user controlled camera with a first person shooter style camera controller
let cam = new CL3D.CameraSceneNode();
cam.Pos.X = 50;
cam.Pos.Y = 20;

let animator = new CL3D.AnimatorCameraFPS(cam, engine);
cam.addAnimator(animator);
animator.lookAt(new CL3D.Vect3d(0, 20, 0));

scene.getRootSceneNode().addChild(cam);
scene.setActiveCamera(cam);

// draw handler
let pos3d = new CL3D.Vect3d(0, 0, 0);

engine.OnAnimate = function () {
    let element = document.getElementById('originlabel');
    if (element) {
        // set the position of the label to the 2d position of the 3d point

        let pos2d = engine.get2DPositionFrom3DPosition(pos3d);
        let hide = false;

        if (pos2d) {
            element.style.left = pos2d.X;
            element.style.top = pos2d.Y;

            // hide if outside of the border
            hide = pos2d.X < 0 || pos2d.Y < 0 ||
                pos2d.X > engine.getRenderer().getWidth() - 60 ||
                pos2d.Y > engine.getRenderer().getHeight() - 20;
        }
        else
            hide = true;

        element.style.display = hide ? 'none' : 'block';
    }
}