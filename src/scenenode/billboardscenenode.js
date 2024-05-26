//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "../main.js";

/**
 * A billboard is like a 3d sprite: A 2d element, which always looks to the camera. 
 * It is usually used for explosions, fire, lensflares, particles and things like that.
 * @class A billboard is like a 3d sprite: A 2d element, which always looks to the camera. 
 * @constructor
 * @extends CL3D.SceneNode
 */
export class BillboardSceneNode extends CL3D.SceneNode {
	constructor() {
		super();

		this.init();

		this.Box = new CL3D.Box3d();
		this.SizeX = 10;
		this.SizeY = 10;
		this.IsVertical = false;
		this.MeshBuffer = new CL3D.MeshBuffer();
		this.vtx1 = new CL3D.Vertex3D(true);
		this.vtx2 = new CL3D.Vertex3D(true);
		this.vtx3 = new CL3D.Vertex3D(true);
		this.vtx4 = new CL3D.Vertex3D(true);

		var indices = this.MeshBuffer.Indices;
		indices.push(0);
		indices.push(2);
		indices.push(1);
		indices.push(0);
		indices.push(3);
		indices.push(2);

		var vertices = this.MeshBuffer.Vertices;
		vertices.push(this.vtx1);
		vertices.push(this.vtx2);
		vertices.push(this.vtx3);
		vertices.push(this.vtx4);

		this.vtx1.TCoords.X = 1;
		this.vtx1.TCoords.Y = 1;

		this.vtx2.TCoords.X = 1;
		this.vtx2.TCoords.Y = 0;

		this.vtx3.TCoords.X = 0;
		this.vtx3.TCoords.Y = 0;

		this.vtx4.TCoords.X = 0;
		this.vtx4.TCoords.Y = 1;

		// construct bounding box
		for (var i = 0; i < 4; ++i)
			this.Box.addInternalPointByVector(vertices[i].Pos);
	}

	/**
	 * Get the axis aligned, not transformed bounding box of this node.
	 * This means that if this node is an animated 3d character, moving in a room, the bounding box will
	 * always be around the origin. To get the box in real world coordinates, just transform it with the matrix
	 * you receive with {@link getAbsoluteTransformation}() or simply use {@link getTransformedBoundingBox}(), which does the same.
	 * @public
	 * @returns {CL3D.Box3d} Bounding box of this scene node.
	 */
	getBoundingBox() {
		return this.Box;
	}

	/**
	 * Returns the type string of the scene node.
	 * Returns 'billboard' for the mesh scene node.
	 * @public
	 * @returns {String} type name of the scene node.
	 */
	getType() {
		return 'billboard';
	}

	/**
	 * @private
	 */
	OnRegisterSceneNode(mgr) {
		if (this.Visible) {
			if (this.isParentActiveFPSCameraToRenderChildrenWithoutZBuffer())
				mgr.registerNodeForRendering(this, this.MeshBuffer.Mat.isTransparent() ? CL3D.Scene.RENDER_MODE_TRANSPARENT_AFTER_ZBUFFER_CLEAR : CL3D.Scene.TRANSPARENT_SOLID_AFTER_ZBUFFER_CLEAR);

			else
				mgr.registerNodeForRendering(this, this.MeshBuffer.Mat.isTransparent() ? CL3D.Scene.RENDER_MODE_TRANSPARENT : CL3D.Scene.RENDER_MODE_DEFAULT);

			CL3D.SceneNode.prototype.OnRegisterSceneNode.call(this, mgr);
		}
	}

	/**
	 * @private
	 */
	render(renderer) {
		var cam = this.scene.getActiveCamera();
		if (!cam)
			return;

		var bShadowMapEnabled = renderer.isShadowMapEnabled();
		renderer.quicklyEnableShadowMap(false);

		var useOldMethod = this.IsVertical;
		if (!useOldMethod) {
			// new hardware drawing of the billboard, which only needs the update of the transformation every frame
			var pos = this.getAbsolutePosition();

			var mb = renderer.getStaticBillboardMeshBuffer();

			var mbillboard = new CL3D.Matrix4(true);
			mbillboard.setScale(new CL3D.Vect3d(this.SizeX * 0.5, this.SizeY * 0.5, 0));

			var mView = renderer.getView().clone();
			mView.setTranslation(new CL3D.Vect3d(0, 0, 0));
			var minvView = new CL3D.Matrix4(true);
			mView.getInverse(minvView);
			minvView.setTranslation(pos);

			mbillboard = minvView.multiply(mbillboard);

			renderer.setWorld(mbillboard);

			renderer.setMaterial(this.MeshBuffer.Mat);
			renderer.drawMeshBuffer(mb);
		}

		else {
			// old software drawing of billboard, which needs a mesh buffer update of it every frame:
			var pos = this.getAbsolutePosition();

			var campos = cam.getAbsolutePosition();
			var target = cam.getTarget();
			var up = cam.getUpVector();
			var view = target.substract(campos);
			view.normalize();

			var horizontal = up.crossProduct(view);
			if (horizontal.getLengthSQ() == 0)
				horizontal.set(up.Y, up.X, up.Z);

			horizontal.normalize();
			horizontal.multiplyThisWithScal(0.5 * this.SizeX);

			var vertical = horizontal.crossProduct(view);
			vertical.normalize();
			vertical.multiplyThisWithScal(0.5 * this.SizeY);

			if (this.IsVertical)
				vertical.set(0, -0.5 * this.SizeY, 0);

			view.multiplyThisWithScal(1.0);

			//for (s32 i=0; i<4; ++i)
			//	vertices[i].Normal = view;
			this.vtx1.Pos.setTo(pos);
			this.vtx1.Pos.addToThis(horizontal);
			this.vtx1.Pos.addToThis(vertical);

			this.vtx2.Pos.setTo(pos);
			this.vtx2.Pos.addToThis(horizontal);
			this.vtx2.Pos.substractFromThis(vertical);

			this.vtx3.Pos.setTo(pos);
			this.vtx3.Pos.substractFromThis(horizontal);
			this.vtx3.Pos.substractFromThis(vertical);

			this.vtx4.Pos.setTo(pos);
			this.vtx4.Pos.substractFromThis(horizontal);
			this.vtx4.Pos.addToThis(vertical);

			this.MeshBuffer.update(true);

			// draw
			var identity = new CL3D.Matrix4(true);
			renderer.setWorld(identity);

			renderer.setMaterial(this.MeshBuffer.Mat);
			renderer.drawMeshBuffer(this.MeshBuffer);
		}

		if (bShadowMapEnabled)
			renderer.quicklyEnableShadowMap(true);
	}

	/**
	 * @private
	 */
	getMaterialCount() {
		return 1;
	}

	/**
	 * @private
	 */
	getMaterial(i) {
		return this.MeshBuffer.Mat;
	}

	/**
	 * @private
	 */
	createClone(newparent, oldNodeId, newNodeId) {
		var c = new CL3D.BillboardSceneNode();
		this.cloneMembers(c, newparent, oldNodeId, newNodeId);

		if (this.Box)
			c.Box = this.Box.clone();

		c.SizeX = this.SizeX;
		c.SizeY = this.SizeY;
		c.IsVertical = this.IsVertical;
		c.MeshBuffer.Mat = this.MeshBuffer.Mat.clone();

		return c;
	}

	/**
	 * gets the size of the billboard
	 * @public
	 * @returns {CL3D.Vect2d}
	 */
	getSize() {
		return new CL3D.Vect2d(this.SizeX, this.SizeY);
	}

	/**
	 * sets the size of the billboard
	 * @public
	 */
	setSize(x, y) {
		this.SizeX = x;
		this.SizeY = y;
	}
};
