import * as CL3D from "../../dist/cl3d.js";

// our own scene node implementation
class MySceneNode extends CL3D.SceneNode {
    constructor(engine) {
        super();

        this.init(); // init scene node specific members

        // create a 3d mesh with one mesh buffer
        this.MyMesh = new CL3D.Mesh();
        let buf = new CL3D.MeshBuffer();
        this.MyMesh.AddMeshBuffer(buf);

        // set indices and vertices
        buf.Indices = [0, 2, 3, 2, 1, 3, 1, 0, 3, 2, 0, 1];

        buf.Vertices.push(CL3D.createSimpleVertex(0, 0, 10, 0, 0));
        buf.Vertices.push(CL3D.createSimpleVertex(10, 0, -10, 1, 0));
        buf.Vertices.push(CL3D.createSimpleVertex(0, 20, 0, 0, 1));
        buf.Vertices.push(CL3D.createSimpleVertex(-10, 20, -10, 1, 1));

        // set the texture of the material
        buf.Mat.Tex1 = engine.getTextureManager().getTexture("test.jpg", true);
    }

    OnRegisterSceneNode(scene) {
        scene.registerNodeForRendering(this, CL3D.Scene.RENDER_MODE_DEFAULT);
        CL3D.SceneNode.prototype.OnRegisterSceneNode.call(this, scene); // call base class
    }

    render(renderer) {
        renderer.setWorld(this.getAbsoluteTransformation());
        renderer.drawMesh(this.MyMesh);
    }
};

// create the 3d engine
const canvas = document.getElementById('3darea');
const engine = new CL3D.CopperLicht(canvas);

if (!engine.initRenderer(1280, 720, { alpha: false }, canvas))
    throw new Error("this browser doesn't support WebGL");

// add a new 3d scene

let scene = new CL3D.Scene();
engine.addScene(scene);

scene.setBackgroundColor(CL3D.createColor(1, 0, 0, 64));

// add our own scene node
let mynode = new MySceneNode(engine);
scene.getRootSceneNode().addChild(mynode);
mynode.addAnimator(new CL3D.AnimatorRotation(new CL3D.Vect3d(0, 0.6, 0.8)));

// add a transparent billboard scene node with a text sign
let billboard = new CL3D.BillboardSceneNode();
billboard.setSize(20, 20);
billboard.Pos.Y = 30;
billboard.getMaterial(0).Tex1 = engine.getTextureManager().getTexture("actionsign.jpg", true);
billboard.getMaterial(0).Type = CL3D.Material.EMT_TRANSPARENT_ADD_COLOR;
scene.getRootSceneNode().addChild(billboard);

// add a user controlled camera with a first person shooter style camera controller
let cam = new CL3D.CameraSceneNode();
cam.Pos.X = 50;
cam.Pos.Y = 20;

let animator = new CL3D.AnimatorCameraFPS(cam, engine);
cam.addAnimator(animator);
animator.lookAt(new CL3D.Vect3d(0, 20, 0));

scene.getRootSceneNode().addChild(cam);
scene.setActiveCamera(cam);