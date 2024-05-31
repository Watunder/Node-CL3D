import * as CL3D from "../../dist/cl3d.js";

// create the 3d engine
const canvas = document.getElementById('3darea');
const engine = new CL3D.CopperLicht(canvas);

if (!engine.initRenderer(1280, 720, { alpha: false }, canvas))
    throw new Error("this browser doesn't support WebGL");

// add a new 3d scene

let scene = new CL3D.Scene();
engine.addScene(scene);

scene.setBackgroundColor(CL3D.createColor(1, 100, 0, 0));
scene.setRedrawMode(CL3D.Scene.REDRAW_WHEN_SCENE_CHANGED);

// add a cube to test out
let cubenode = new CL3D.CubeSceneNode();
scene.getRootSceneNode().addChild(cubenode);
cubenode.getMaterial(0).Tex1 = engine.getTextureManager().getTexture("test.jpg", true);

// add a user controlled camera with a first person shooter style camera controller
let cam = new CL3D.CameraSceneNode();
cam.Pos.X = 20;
cam.Pos.Y = 15;

let animator = new CL3D.AnimatorCameraFPS(cam, engine);
cam.addAnimator(animator);
animator.lookAt(new CL3D.Vect3d(0, 0, 0));

scene.getRootSceneNode().addChild(cam);
scene.setActiveCamera(cam);