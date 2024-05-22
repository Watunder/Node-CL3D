//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "./main.js";

//const EVT_STANDARD = 0;
//const EVT_2TCOORDS = 1;
//const EVT_TANGENTS = 2;

/**
 * A buffer containing a set of geometry with one material, usually part of a {@link Mesh}. 
 * @class A buffer containing a set of geometry with one material. 
 * @constructor
 * @public
 *
 */
export class MeshBuffer {
	/**
	 * Axis aligned bounding box enclosing the geometry in this mesh buffer
	 * @public
	 * @type {CL3D.Box3d}
	 */
	Box = null;

	/**
	 * Material of the geometry, of type {@link Material}.
	 * @public
	 * @type Material
	 */
	Mat = null;

	/**
	 * Array of Indices into the {@link Vertices} array. Each 3 indices in this array form a triangle to be rendered.
	 * @public
	 * @type {Array}
	 */
	Indices = null;

	/**
	 * Array of Vertices of this mesh buffer. The members of this array must all be of type {@link Vertex3D}.
	 * @public
	 * @type {Array}
	 */
	Vertices = null;

	/**
	 * Object for the renderer to store renderer created arrays for rendering the geometry. 
	 * @public
	 */
	RendererNativeArray = null;

	/**
	 * Storing if the mesh buffers vertices tangents if available. This is only needed for normal mapped geometry, and null otherwise.
	 * @public
	 */
	Tangents = null;

	/**
	 * Storing if the mesh buffers vertices binormals if available. This is only needed for normal mapped geometry, and null otherwise.
	 * @public
	 */
	Binormals = null;

	//MeshBuffer.prototype.VertexType = null;

	constructor() {
		this.Box = new CL3D.Box3d();
		this.Mat = new CL3D.Material();
		this.Indices = new Array();
		this.Vertices = new Array();
		this.RendererNativeArray = null;
		this.OnlyPositionsChanged = false;
		this.OnlyUpdateBufferIfPossible = false;
		this.Tangents = null;
		this.Binormals = null;
	}
	/**
	 * Needs to be called when the Vertices or Indices have been changed so that the {@link RendererNativeArray} gets recreated.
	 * @public
	 * @param {Boolean} onlyPositionsChanged set to true if only the positions changed in the mesh buffer. This will trigger a faster update then
	 */
	update(onlyPositionsChanged, onlyUpdateBufferIfPossible) {
		if (onlyPositionsChanged)
			this.OnlyPositionsChanged = true;

		else if (onlyUpdateBufferIfPossible)
			this.OnlyUpdateBufferIfPossible = true;

		else
			this.RendererNativeArray = null;
	}
	/**
	 * Clears the native render array and frees up memory
	 * @private
	 */
	freeNativeArray() {
		let obj = this.RendererNativeArray;
		if (obj && obj.gl) {
			// firefox doesn't garbage collect these arrays (Obviously a bug). So we need to collect them here ourselves.
			if (obj.positionBuffer)
				obj.gl.deleteBuffer(obj.positionBuffer);

			if (obj.positionsArray)
				delete obj.positionsArray;

			if (obj.texcoordsBuffer)
				obj.gl.deleteBuffer(obj.texcoordsBuffer);

			if (obj.texcoordsBuffer2)
				obj.gl.deleteBuffer(obj.texcoordsBuffer2);

			if (obj.normalBuffer)
				obj.gl.deleteBuffer(obj.normalBuffer);

			if (obj.colorBuffer)
				obj.gl.deleteBuffer(obj.colorBuffer);

			if (obj.indexBuffer)
				obj.gl.deleteBuffer(obj.colorBuffer);

			if (this.Tangents)
				obj.gl.deleteBuffer(obj.gl.tangentBuffer);

			if (this.Binormals)
				obj.gl.deleteBuffer(obj.gl.binormalBuffer);
		}

		delete this.RendererNativeArray;
	}
	/**
	 * Recalculates the bounding box
	 * @public
	 */
	recalculateBoundingBox() {
		if (!this.Vertices || this.Vertices.length == 0)
			this.Box.reset(0, 0, 0);

		else {
			let vtx = this.Vertices[0];

			this.Box.MinEdge = vtx.Pos.clone();
			this.Box.MaxEdge = vtx.Pos.clone();

			for (let i = 1; i < this.Vertices.length; ++i) {
				vtx = this.Vertices[i];
				this.Box.addInternalPointByVector(vtx.Pos);
			}
		}
	}
	/**
	 * Clones this Mesh buffer, creating a copy of it
	 * @public
	 */
	createClone() {
		let ret = new CL3D.MeshBuffer();
		ret.Box = this.Box.clone();
		ret.Mat = this.Mat.clone();

		if (this.Vertices) {
			for (let i = 0; i < this.Vertices.length; ++i) {
				ret.Vertices.push(this.Vertices[i]);
				/*
				let v = new CL3D.Vertex3D();
				let vold = this.Vertices[i];
				v.Pos = vold.Pos.clone();
				v.Normal = vold.Normal.clone();
				v.Color = vold.Color;
				v.TCoords = new CL3D.Vect2d(vold.TCoords.x, vold.TCoords.y);
				v.TCoords2 = new CL3D.Vect2d(vold.TCoords2.x, vold.TCoords2.y);
				ret.Vertices.push(v);*/
			}
		}

		if (this.Indices) {
			for (let i = 0; i < this.Indices.length; ++i)
				ret.Indices.push(this.Indices[i]);
		}

		if (this.Tangents) {
			for (let i = 0; i < this.Tangents.length; ++i)
				ret.Tangents.push(this.Tangents[i].clone());
		}

		if (this.Binormals) {
			for (let i = 0; i < this.Binormals.length; ++i)
				ret.Binormals.push(this.Binormals[i].clone());
		}

		return ret;
	}
}
