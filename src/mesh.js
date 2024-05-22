//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "./main.js";

/**
 * Class which holds the geometry of an object.
 * A Mesh is nothing more than a collection of some {@link CL3D.MeshBuffer}s. 
 * A mesh is usually used in a {@link CL3D.MeshSceneNode} in order to be rendered.
 * @constructor
 * @public
 * @class Class which holds the geometry of an object
 */
export class Mesh {
	constructor() {
		this.Box = new CL3D.Box3d();
		this.MeshBuffers = new Array();
	}
	/**
	 * Adds a {@link MeshBuffer} to a mesh.
	 * @public
	 */
	AddMeshBuffer(m) {
		this.MeshBuffers.push(m);
	}
	/**
	 * Returns an Array of all {@link MeshBuffer}s in this mesh.
	 * @public
	 * @returns {Array} array of {@link MeshBuffer}s
	 */
	GetMeshBuffers() {
		return this.MeshBuffers;
	}
	/**
	 * Returns the amount of polygons in the mesh
	 * @public
	 * @returns {Number} number of polygons in this mesh
	 */
	GetPolyCount() {
		var cnt = 0;

		if (this.MeshBuffers) {
			for (var i = 0; i < this.MeshBuffers.length; ++i)
				if (this.MeshBuffers[i].Indices)
					cnt += this.MeshBuffers[i].Indices.length;
		}

		return cnt / 3;
	}
	/**
	 * Creates a clone of this mesh, a copy
	 * @public
	 */
	createClone() {
		var ret = new CL3D.Mesh();
		ret.Box = this.Box.clone();

		if (this.MeshBuffers) {
			for (var i = 0; i < this.MeshBuffers.length; ++i)
				if (this.MeshBuffers[i])
					ret.MeshBuffers.push(this.MeshBuffers[i].createClone());
		}

		return ret;
	}
}





