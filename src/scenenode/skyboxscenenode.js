//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "../main.js";

/**
 * A class rendering a sky box around the whole scene. It is a cube with 6 faces and six textures, which
 * can be accessed using {@link SceneNode}.getMaterial().
 * @constructor
 * @extends CL3D.MeshSceneNode 
 * @class A class rendering a sky box around the whole scene. 
 */
export class SkyBoxSceneNode extends CL3D.MeshSceneNode  {
	constructor() {
		super();

		this.Type = 2037085030;

		this.OwnedMesh = new CL3D.Mesh();

		var baseindices = [0, 1, 2, 0, 2, 3];

		// front side
		var buf = new CL3D.MeshBuffer();
		this.OwnedMesh.AddMeshBuffer(buf);
		buf.Mat.ClampTexture1 = true;
		buf.Indices = baseindices;
		buf.Vertices.push(this.createVertex(-1, -1, -1, 0, 0, 1, 1, 1));
		buf.Vertices.push(this.createVertex(1, -1, -1, 0, 0, 1, 0, 1));
		buf.Vertices.push(this.createVertex(1, 1, -1, 0, 0, 1, 0, 0));
		buf.Vertices.push(this.createVertex(-1, 1, -1, 0, 0, 1, 1, 0));

		// left side
		buf = new CL3D.MeshBuffer();
		this.OwnedMesh.AddMeshBuffer(buf);
		buf.Mat.ClampTexture1 = true;
		buf.Indices = baseindices;
		buf.Vertices.push(this.createVertex(1, -1, -1, -1, 0, 0, 1, 1));
		buf.Vertices.push(this.createVertex(1, -1, 1, -1, 0, 0, 0, 1));
		buf.Vertices.push(this.createVertex(1, 1, 1, -1, 0, 0, 0, 0));
		buf.Vertices.push(this.createVertex(1, 1, -1, -1, 0, 0, 1, 0));

		// right side
		buf = new CL3D.MeshBuffer();
		this.OwnedMesh.AddMeshBuffer(buf);
		buf.Mat.ClampTexture1 = true;
		buf.Indices = baseindices;
		buf.Vertices.push(this.createVertex(-1, -1, 1, 1, 0, 0, 1, 1));
		buf.Vertices.push(this.createVertex(-1, -1, -1, 1, 0, 0, 0, 1));
		buf.Vertices.push(this.createVertex(-1, 1, -1, 1, 0, 0, 0, 0));
		buf.Vertices.push(this.createVertex(-1, 1, 1, 1, 0, 0, 1, 0));

		// back side
		buf = new CL3D.MeshBuffer();
		this.OwnedMesh.AddMeshBuffer(buf);
		buf.Mat.ClampTexture1 = true;
		buf.Indices = baseindices;
		buf.Vertices.push(this.createVertex(1, -1, 1, 0, 0, -1, 1, 1));
		buf.Vertices.push(this.createVertex(-1, -1, 1, 0, 0, -1, 0, 1));
		buf.Vertices.push(this.createVertex(-1, 1, 1, 0, 0, -1, 0, 0));
		buf.Vertices.push(this.createVertex(1, 1, 1, 0, 0, -1, 1, 0));

		// top side
		buf = new CL3D.MeshBuffer();
		this.OwnedMesh.AddMeshBuffer(buf);
		buf.Mat.ClampTexture1 = true;
		buf.Indices = baseindices;
		buf.Vertices.push(this.createVertex(1, 1, -1, 0, -1, 0, 1, 1));
		buf.Vertices.push(this.createVertex(1, 1, 1, 0, -1, 0, 0, 1));
		buf.Vertices.push(this.createVertex(-1, 1, 1, 0, -1, 0, 0, 0));
		buf.Vertices.push(this.createVertex(-1, 1, -1, 0, -1, 0, 1, 0));

		// bottom side
		buf = new CL3D.MeshBuffer();
		this.OwnedMesh.AddMeshBuffer(buf);
		buf.Mat.ClampTexture1 = true;
		buf.Indices = baseindices;
		buf.Vertices.push(this.createVertex(1, -1, 1, 0, 1, 0, 1, 1));
		buf.Vertices.push(this.createVertex(1, -1, -1, 0, 1, 0, 0, 1));
		buf.Vertices.push(this.createVertex(-1, -1, -1, 0, 1, 0, 0, 0));
		buf.Vertices.push(this.createVertex(-1, -1, 1, 0, 1, 0, 1, 0));
	}

	/**
	 * Returns the type string of the scene node.
	 * Returns 'sky' for the mesh scene node.
	 * @public
	 * @returns {String} type name of the scene node.
	 */
	getType() {
		return 'sky';
	}

	/**
	 * @public
	 */
	createVertex(x, y, z, nx, ny, nz, s, t) {
		var vtx = new CL3D.Vertex3D(true);
		vtx.Pos.X = x;
		vtx.Pos.Y = y;
		vtx.Pos.Z = z;
		vtx.TCoords.X = s;
		vtx.TCoords.Y = t;
		return vtx;
	}

	/**
	 * @public
	 */
	OnRegisterSceneNode(mgr) {
		if (this.Visible) {
			mgr.registerNodeForRendering(this, 1); //SceneManager.REGISTER_MODE_SKYBOX);
			CL3D.SceneNode.prototype.OnRegisterSceneNode.call(this, mgr);
		}
	}

	/**
	 * @public
	 */
	render(renderer) {
		//renderer.setWorld(this.AbsoluteTransformation);
		//renderer.drawMesh(this.OwnedMesh);
		var cam = this.scene.getActiveCamera();
		if (!cam || !this.OwnedMesh)
			return;

		var translate = new CL3D.Matrix4(false);
		this.AbsoluteTransformation.copyTo(translate);
		translate.setTranslation(cam.getAbsolutePosition());

		var viewDistance = (cam.getNearValue() + cam.getFarValue()) * 0.5;
		var scale = new CL3D.Matrix4();
		scale.setScale(new CL3D.Vect3d(viewDistance, viewDistance, viewDistance));

		// Draw the sky box between the near and far clip plane
		renderer.setWorld(translate.multiply(scale));
		renderer.drawMesh(this.OwnedMesh, true);
	}
	
	/**
	 * @public
	 */
	createClone(newparent, oldNodeId, newNodeId) {
		var c = new CL3D.SkyBoxSceneNode();
		this.cloneMembers(c, newparent, oldNodeId, newNodeId);

		if (this.OwnedMesh)
			c.OwnedMesh = this.OwnedMesh.clone();

		c.ReadonlyMaterials = this.ReadonlyMaterials;
		c.DoesCollision = this.DoesCollision;

		if (this.Box)
			c.Box = this.Box.clone();

		return c;
	}
};
