// parse args
const args = await import("minimist").then(async (module) => {
	return module.default(process.argv.slice(2));
});

// dependcy module
import path from "node:path";
import url from "node:url";
import sdl from "@kmamal/sdl";
import * as CL3D from "./dist/cl3d.js";

// local file path
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const __example = path.join(__dirname, "examples", args["example"]);
const __exampledata = path.join(__example, "copperlichtdata");

// init window
const window = sdl.video.createWindow({
	resizable: true,
	opengl: true,
	vsync: true,
	width: 1280,
	height: 720
})

const { pixelWidth: width, pixelHeight: height, native } = window;

// bind input
const bindInput = (engine) => {
	window.on("keyDown", ({ scancode: scancode, shift: shift }) => {
		engine.handleKeyDown({ keyCode: scancode, shiftKey: shift })
	});

	window.on("keyUp", ({ scancode: scancode, shift: shift }) => {
		engine.handleKeyUp({ keyCode: scancode, shiftKey: shift })
	});

	window.on("mouseMove", ({ x: x, y: y }) => {
		engine.handleMouseMove({ x: x, y: y });
	});

	window.on("mouseButtonDown", ({ x: x, y: y, button: button }) => {
		engine.handleMouseDown({ x: x, y: y, button: button });
	});

	window.on("mouseButtonUp", ({ x: x, y: y, button: button }) => {
		engine.handleMouseUp({ x: x, y: y, button: button });
	});

	window.on("hover", () => {
		engine.MouseIsInside = true;
	});

	window.on("leave", () => {
		engine.MouseIsInside = false;
	});

	window.on("resize", ({ width: w, height: h, pixelWidth: pw, pixelHeight: ph }) => {
		engine.TheRenderer.ensuresizeok(w, h);
	});
}

// run cl3d
switch (args["example"] || "tutorial1") {
	case "tutorial1":
		{
			// create the 3d engine
			const engine = new CL3D.CopperLicht();

			if (!engine.initRenderer(width, height, { window: native }))
				throw new Error("this browser doesn't support WebGL");

			// add a new 3d scene

			let scene = new CL3D.Scene();
			engine.addScene(scene);

			scene.setBackgroundColor(CL3D.createColor(1, 100, 0, 0));
			scene.setRedrawMode(CL3D.Scene.REDRAW_WHEN_SCENE_CHANGED);

			// add a cube to test out
			let cubenode = new CL3D.CubeSceneNode();
			scene.getRootSceneNode().addChild(cubenode);

			cubenode.getMaterial(0).Tex1 = engine.getTextureManager().getTexture(path.join(__example, "test.jpg"), true);

			// add a user controlled camera with a first person shooter style camera controller
			let cam = new CL3D.CameraSceneNode();
			cam.Pos.X = 20;
			cam.Pos.Y = 15;

			let animator = new CL3D.AnimatorCameraFPS(cam, engine);
			cam.addAnimator(animator);
			animator.lookAt(new CL3D.Vect3d(0, 0, 0));

			scene.getRootSceneNode().addChild(cam);
			scene.setActiveCamera(cam);

			bindInput(engine);
		}
		break;

	case "tutorial2":
		{
			const engine = CL3D.startCopperLichtFromFile(path.join(__exampledata, "index.ccbjs"));
			engine.createRenderer(width, height, { window: native });

			let cubeSceneNode = null;

			// this is called when loading the 3d scene has finished
			engine.OnLoadingComplete = () => {
				let scene = engine.getScene();
				if (scene) {
					// find the cube scene node
					cubeSceneNode = scene.getSceneNodeFromName("cubeMesh1");

					// also, force the 3d engine to update the scene every frame
					scene.setRedrawMode(CL3D.Scene.REDRAW_EVERY_FRAME);

					// additional, let the sphere constantly rotate
					let sphereSceneNode = scene.getSceneNodeFromName("sphereMesh1");
					if (sphereSceneNode)
						sphereSceneNode.addAnimator(new CL3D.AnimatorRotation(new CL3D.Vect3d(0, 1.6, 0.8)));
				}
			}

			window.on("keyDown", ({ key: key }) => {
				// when pressed "L", move the cube scene node a bit up
				if (key == "f" && cubeSceneNode)
					cubeSceneNode.Pos.Y += 5;

				// when pressed "G", move the cube scene node a bit down
				if (key == "g" && cubeSceneNode)
					cubeSceneNode.Pos.Y -= 5;
			});

			bindInput(engine);
		}
		break;

	case "tutorial3":
		{
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
					buf.Mat.Tex1 = engine.getTextureManager().getTexture(path.join(__example, "test.jpg"), true);
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
			const engine = new CL3D.CopperLicht();

			if (!engine.initRenderer(width, height, { window: native }))
				throw new Error("this browser doesn't support WebGL");

			// add a new 3d scene
			let scene = new CL3D.Scene();
			scene.setBackgroundColor(CL3D.createColor(1, 0, 0, 64));
			engine.addScene(scene);

			// add our own scene node
			let mynode = new MySceneNode(engine);
			scene.getRootSceneNode().addChild(mynode);
			mynode.addAnimator(new CL3D.AnimatorRotation(new CL3D.Vect3d(0, 0.6, 0.8)));

			// add a billboard scene node
			let billboard = new CL3D.BillboardSceneNode();
			billboard.setSize(20, 20);
			billboard.Pos.Y = 30;
			billboard.getMaterial(0).Tex1 = engine.getTextureManager().getTexture(path.join(__example, "actionsign.jpg"), true);
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

			bindInput(engine);
		}
		break;

	case "tutorial4":
		{
			const engine = new CL3D.CopperLicht();

			if (!engine.initRenderer(width, height, { window: native }))
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
				billboard.getMaterial(0).Tex1 = engine.getTextureManager().getTexture(path.join(__example, "particle.png"), true);
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
			//let pos3d = new CL3D.Vect3d(0, 0, 0);

			engine.OnAnimate = function () {
				// let element = document.getElementById("originlabel");
				// if (element) {
				// 	// set the position of the label to the 2d position of the 3d point

				// 	let pos2d = engine.get2DPositionFrom3DPosition(pos3d);
				// 	let hide = false;

				// 	if (pos2d) {
				// 		element.style.left = pos2d.X;
				// 		element.style.top = pos2d.Y;

				// 		// hide if outside of the border
				// 		hide = pos2d.X < 0 || pos2d.Y < 0 ||
				// 			pos2d.X > engine.getRenderer().getWidth() - 60 ||
				// 			pos2d.Y > engine.getRenderer().getHeight() - 20;
				// 	}
				// 	else
				// 		hide = true;

				// 	element.style.display = hide ? "none" : "block";
				// }
			}

			bindInput(engine);
		}
		break;

	case "tutorial5":
		{
			const engine = new CL3D.CopperLicht();

			if (!engine.initRenderer(width, height, { window: native }))
				throw new Error("this browser doesn't support WebGL");

			// add a new 3d scene

			let scene = new CL3D.Scene();
			engine.addScene(scene);

			scene.setBackgroundColor(CL3D.createColor(1, 0, 0, 0));
			scene.setRedrawMode(CL3D.Scene.REDRAW_WHEN_SCENE_CHANGED);

			// add a sky box
			let skybox = new CL3D.SkyBoxSceneNode();
			scene.getRootSceneNode().addChild(skybox);

			// set texture sides of the skybox
			for (let i = 0; i < 6; ++i)
				skybox.getMaterial(i).Tex1 = engine.getTextureManager().getTexture(path.join(__example, "stars.jpg"), true);

			// add a cube to test out
			let cubenode = new CL3D.CubeSceneNode();
			scene.getRootSceneNode().addChild(cubenode);
			cubenode.getMaterial(0).Tex1 = engine.getTextureManager().getTexture(path.join(__example, "crate_wood.jpg"), true);

			// add a user controlled camera with a first person shooter style camera controller
			let cam = new CL3D.CameraSceneNode();
			cam.Pos.X = 20;
			cam.Pos.Y = 15;

			let animator = new CL3D.AnimatorCameraFPS(cam, engine);
			cam.addAnimator(animator);
			animator.lookAt(new CL3D.Vect3d(0, 0, 0));

			scene.getRootSceneNode().addChild(cam);
			scene.setActiveCamera(cam);

			// now, we want to use a custom material for our cube, lets write
			// a vertex and a fragment shader:

			let vertex_shader_source = "\
			//#version 100								\n\
			precision mediump float;					\n\
			#ifdef GL_ES								\n\
			precision highp float;						\n\
			#endif										\n\
			uniform mat4 worldviewproj;					\
			attribute vec4 vPosition;					\
			attribute vec4 vNormal;						\
			attribute vec2 vTexCoord1;					\
			attribute vec2 vTexCoord2;					\
			varying vec2 v_texCoord1;					\
			varying vec2 v_texCoord2;					\
			void main()									\
			{											\
				gl_Position = worldviewproj * vPosition;\
				v_texCoord1 = vTexCoord1.st;			\
				v_texCoord2 = vTexCoord2.st;			\
			}";

			let fragment_shader_source = "\
			//#version 100												\n\
			precision mediump float;									\n\
			#ifdef GL_ES												\n\
			precision highp float;										\n\
			#endif														\n\
			uniform sampler2D texture1;									\
			uniform sampler2D texture2;									\
																		\
			varying vec2 v_texCoord1;									\
			varying vec2 v_texCoord2;									\
																		\
			void main()													\
			{															\
				vec2 texCoord = vec2(v_texCoord1.s, v_texCoord1.t);		\
				gl_FragColor = texture2D(texture1, texCoord) * 2.0;		\
			}";


			// create a solid material using the shaders. For transparent materials, take a look
			// at the other parameters of createMaterialType

			let newMaterialType = engine.getRenderer().createMaterialType(vertex_shader_source, fragment_shader_source);
			if (newMaterialType != -1)
				cubenode.getMaterial(0).Type = newMaterialType;
			else
				console.log("could not create shader"); //copperLicht will write the exact error line in the html

			bindInput(engine);
		}
		break;

	case "tutorial6":
		{
			const engine = CL3D.startCopperLichtFromFile(path.join(__exampledata, "room.ccbjs"));
			engine.createRenderer(width, height, { window: native });

			let cubeCollisionPosition = null;
			// this is called when loading the 3d scene has finished

			engine.OnLoadingComplete = () => {
				let scene = engine.getScene();
				if (!scene)
					return;

				// in the CopperCube 3d editor, we already created a camera which collides against the wall in this scene.
				// But to demonstrate how this would work manually, we create a new camera here which does this as well:

				// add a user controlled camera

				let cam = new CL3D.CameraSceneNode();

				// ensure to place the camera inside the room, or it will fall out, into the endless void

				cam.Pos.X = -50;
				cam.Pos.Y = 180;
				cam.Pos.Z = -20;

				// add an animator which makes the camera move by keyboard and mouse input

				let animator = new CL3D.AnimatorCameraFPS(cam, engine);
				animator.MoveSpeed = 0.2;
				animator.RotateSpeed = 250;
				animator.setLookByMouseDown(false); //  look when the mouse is moved
				cam.addAnimator(animator);
				animator.lookAt(new CL3D.Vect3d(-200, 90, 200));

				scene.getRootSceneNode().addChild(cam);
				scene.setActiveCamera(cam);

				// add the collision response animator to collide against walls

				let colanimator = new CL3D.AnimatorCollisionResponse(
					new CL3D.Vect3d(20, 40, 20), // size of the player ellipsoid
					new CL3D.Vect3d(0, 30, 0), // position of the eye in the ellipsoid
					scene.getCollisionGeometry());

				cam.addAnimator(colanimator);
			}

			// every time the user presses space, we want to do a collision test with the wall
			// and create a cube where we hit the wall

			window.on("keyDown", ({ scancode: scancode }) => {
				let scene = engine.getScene();
				if (!scene)
					return;

				if (scancode == 44) // space has been pressed
				{
					let cam = scene.getActiveCamera();

					// calculate the start and end 3d point of the line, the beinning being
					// the camera position and the end about 2000 units away in the direction of the
					// camera target

					let startLine = cam.getAbsolutePosition();
					let endLine = startLine.add(cam.getTarget().substract(startLine).multiplyWithScal(2000));

					// test our line for a collision with the world

					let collisionPoint = scene.getCollisionGeometry().getCollisionPointWithLine(startLine, endLine, true, null);

					if (collisionPoint) {
						// a collision has been found.
						// create a cube at the point where the collision happened

						if (!cubeCollisionPosition) {
							cubeCollisionPosition = new CL3D.CubeSceneNode();
							scene.getRootSceneNode().addChild(cubeCollisionPosition);
							cubeCollisionPosition.getMaterial(0).Tex1 = engine.getTextureManager().getTexture(path.join(__example, "ground_stone.jpg"), true);
						}

						cubeCollisionPosition.Pos = collisionPoint;
					}
				}
			});

			bindInput(engine);
		}
		break;

	case "tutorial7":
		{
			const engine = CL3D.startCopperLichtFromFile(path.join(__exampledata, "animation.ccbjs"));
			engine.createRenderer(width, height, { window: native });

			// every time the user presses space, we want to do a collision test with the wall
			// and create a cube where we hit the wall

			let lastPlayedAnimation = 0;

			window.on("keyDown", ({ scancode: scancode }) => {
				let scene = engine.getScene();
				if (!scene)
					return;

				// soldier is an AnimatedMeshSceneNode.
				let soldier = scene.getSceneNodeFromName("soldier");

				if (soldier) {
					if (scancode == 42) // space has been pressed
					{
						// switch to next animation
						// select the next animation:

						let animations = ["walk", "stand", "idle_a", "aim"];
						++lastPlayedAnimation;
						if (lastPlayedAnimation > animations.length - 1)
							lastPlayedAnimation = 0;

						let nextAnimationName = animations[lastPlayedAnimation];

						// and set it to be played

						soldier.setAnimation(nextAnimationName);
					}
					else
						if (scancode == 6 || scancode == 32) // "c" has been pressed
						{
							// clone soldier

							let clone = soldier.createClone(scene.getRootSceneNode());
							clone.Pos.X += (Math.random() * 50) - 25;
							clone.Pos.Z += (Math.random() * 50) - 25;
						}
				}
			});

			bindInput(engine);
		}
		break;

	case "tutorial8":
		{
			const engine = new CL3D.CopperLicht();
			let scene = null;

			if (engine.initRenderer(width, height, { window: native })) {
				let setupShadowScene = () => {
					scene = engine.getScene();

					// now setup everything needed for shadow mapping

					scene.ShadowMappingEnabled = true;
					scene.ShadowMapOpacity = 0.5;
					scene.ShadowMapResolution = 1024;
					scene.ShadowMapBias1 = 0.0001;
					scene.ShadowMapCameraViewDetailFactor = 0.1;

				}
				engine.load(path.join(__exampledata, "shadows.ccbz"), false, setupShadowScene);
			}

			bindInput(engine);
		}
		break;

	default:
		{
			console.log(`${args["example"]} does not exsit!`);
		}
}
