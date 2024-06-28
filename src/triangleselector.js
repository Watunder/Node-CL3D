//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

// ------------------------------------------------------------------------------------------------------
// Base class: triangle selector
// ------------------------------------------------------------------------------------------------------

import * as CL3D from "./main.js";

/**
 * Interface to return triangles with specific properties, useful for collision detection.
 * Every {@link SceneNode} may have a triangle selector, available with SceneNode::Selector. This is used for doing collision detection: 
 * For example if you know that a collision may have happened in the area between (1,1,1) and (10,10,10), you can get all triangles of the scene
 * node in this area with the TriangleSelector easily and check every triangle if it collided.<br/>
 * <br/>
 * This is the base class of all triangle selector implementations. Use {@link MeshTriangleSelector} for an implementation for mesh scene
 * nodes, and {@link MetaTriangleSelector} for a selector for multiple other triangle selectors and {@link OctTreeTriangleSelector} for
 * an implementation for huge meshes.
 * @class Interface to return triangles with specific properties, useful for collision detection.
 * @public
 * @constructor
 */
export class TriangleSelector {
	constructor() {
	}

	/**
	 * Returns all triangles for the scene node associated with this selector
	 * @public
	 * @param {CL3D.Matrix4} transform a transformation matrix which transforms all triangles before returning them
	 * @param {Array} outArray output array of the triangles
	 */
	getAllTriangles(transform, outArray) {
	}

	/**
	 * Returns all triangles inside a bounding box, for the scene node associated with this selector. This method will
	 * return at least the triangles that intersect the box, but may return other triangles as well.
	 * @public
	 * @param box {CL3D.Box3d}
	 * @param transform {CL3D.Matrix4} a transformation matrix which transforms all triangles before returning them
	 * @param outArray {Array} output array of the triangles
	 * @returns the new CL3D.TriangleSelector
	 */
	getTrianglesInBox(box, transform, outArray) {
		this.getAllTriangles(transform, outArray);
	}

	/**
	 * Returns the collision 3d point of a 3d line with the 3d geometry in this triangle selector.
	 * @public
	 * @param {CL3D.Vect3d} start 3d point representing the start of the 3d line
	 * @param {CL3D.Vect3d} end 3d point representing the end of the 3d line
	 * @param {Boolean} bIgnoreBackFaces if set to true, this will ignore back faced polygons, making the query twice as fast
	 * @param {CL3D.Triangle3d} outTriangle if set to a triangle, this will contain the 3d triangle with which the line collided
	 * @param {Boolean} ignoreInvisibleItems set to true to ignore invisible scene nodes for collision test
	 * @returns {CL3D.Vect3d}  a 3d position as {@link CL3D.Vect3d} if a collision was found or null if no collision was found
	 */
	getCollisionPointWithLine(start, end, bIgnoreBackFaces, outTriangle, ignoreInvisibleItems) {
		if (!start || !end)
			return null;

		if (this.Node != null && ignoreInvisibleItems && this.Node.Visible == false)
			return null;

		var box = new CL3D.Box3d();
		box.MinEdge = start.clone();
		box.MaxEdge = start.clone();
		box.addInternalPointByVector(end);

		var triangles = new Array();

		this.getTrianglesInBox(box, null, triangles);

		var linevect = end.substract(start);
		linevect.normalize();

		var intersection;
		var nearest = 999999999.9; //FLT_MAX;
		var raylength = end.substract(start).getLengthSQ();

		var minX = Math.min(start.X, end.X);
		var maxX = Math.max(start.X, end.X);
		var minY = Math.min(start.Y, end.Y);
		var maxY = Math.max(start.Y, end.Y);
		var minZ = Math.min(start.Z, end.Z);
		var maxZ = Math.max(start.Z, end.Z);

		var returnPoint = null;

		for (var i = 0; i < triangles.length; ++i) {
			var triangle = triangles[i];

			if (bIgnoreBackFaces && !triangle.getPlane().isFrontFacing(linevect))
				continue;

			if (minX > triangle.pointA.X && minX > triangle.pointB.X && minX > triangle.pointC.X)
				continue;
			if (maxX < triangle.pointA.X && maxX < triangle.pointB.X && maxX < triangle.pointC.X)
				continue;
			if (minY > triangle.pointA.Y && minY > triangle.pointB.Y && minY > triangle.pointC.Y)
				continue;
			if (maxY < triangle.pointA.Y && maxY < triangle.pointB.Y && maxY < triangle.pointC.Y)
				continue;
			if (minZ > triangle.pointA.Z && minZ > triangle.pointB.Z && minZ > triangle.pointC.Z)
				continue;
			if (maxZ < triangle.pointA.Z && maxZ < triangle.pointB.Z && maxZ < triangle.pointC.Z)
				continue;

			if (start.getDistanceFromSQ(triangle.pointA) >= nearest &&
				start.getDistanceFromSQ(triangle.pointB) >= nearest &&
				start.getDistanceFromSQ(triangle.pointC) >= nearest)
				continue;

			intersection = triangle.getIntersectionWithLine(start, linevect);
			if (intersection) {
				var tmp = intersection.getDistanceFromSQ(start);
				var tmp2 = intersection.getDistanceFromSQ(end);

				if (tmp < raylength && tmp2 < raylength && tmp < nearest) {
					nearest = tmp;
					if (outTriangle)
						triangle.copyTo(outTriangle);
					returnPoint = intersection;
				}
			}
		}

		if (returnPoint)
			return returnPoint.clone();
		return null;
	}

	/**
	  * Returns the scenenode this selector is for
	  * @returns returns {@link SceneNode} if this selector is for a specific scene node
	 */
	getRelatedSceneNode() {
		return null;
	}

	/**
	  * If there are multiple scene nodes in this selector, it is possible to let it ignore one
	  * specific node, for example to prevent colliding it against itself.
	 */
	setNodeToIgnore(n) {
		// to be implemented in derived classes
	}

	/**
	  * Creates a clone of this triangle selector, for a new scene node
	  * @param {CL3D.SceneNode} node scene node the selector is based on
	  * @returns {CL3D.TriangleSelector} returns triangleSelector if this selector can be cloned or null if not
	 */
	createClone(node) {
		// to be implemented in derived classes
		return null;
	}
};

// ------------------------------------------------------------------------------------------------------
// MeshTriangleSelector
// ------------------------------------------------------------------------------------------------------

/**
 * Implementation of TriangleSelector for meshes, useful for collision detection.<br/>
 * Note use {@link CL3D.OctTreeTriangleSelector} instead of this one if your mesh is huge, otherwise collision detection might be slow.
 * Every {@link CL3D.SceneNode} may have a triangle selector, available with SceneNode::Selector. This is used for doing collision detection: 
 * For example if you know that a collision may have happened in the area between (1,1,1) and (10,10,10), you can get all triangles of the scene
 * node in this area with the TriangleSelector easily and check every triangle if it collided.<br/>
 * @class Interface to return triangles with specific properties, useful for collision detection.
 * @public
 * @constructor
 * @extends CL3D.TriangleSelector
 * @param {CL3D.Mesh} Mesh the {@link CL3D.Mesh} representing the geometry
 * @param {Number} materialToIgnore (optional) material type to ignore for collision. Can be set to null.
 * @param {Number} materialToIgnore2 (optional) material type to ignore for collision. Can be set to null.
 * @param {CL3D.SceneNode} scenenode the {@link CL3D.SceneNode} representing the position of the geometry
 */
export class MeshTriangleSelector extends CL3D.TriangleSelector {
	constructor(mesh, scenenode, materialToIgnore, materialToIgnore2) {
		super();

		if (!mesh)
			return;

		this.Node = scenenode;

		// create triangle array
		this.Triangles = new Array();

		if (mesh != null) {
			for (var b = 0; b < mesh.MeshBuffers.length; ++b) {
				var mb = mesh.MeshBuffers[b];
				if (mb) {
					if (materialToIgnore != null && mb.Mat && mb.Mat.Type == materialToIgnore)
						continue;

					if (materialToIgnore2 != null && mb.Mat && mb.Mat.Type == materialToIgnore2)
						continue;

					var idxcnt = mb.Indices.length;
					for (var j = 0; j < idxcnt; j += 3) {
						var vtx1 = mb.Vertices[mb.Indices[j]];
						var vtx2 = mb.Vertices[mb.Indices[j + 1]];
						var vtx3 = mb.Vertices[mb.Indices[j + 2]];

						this.Triangles.push(new CL3D.Triangle3d(vtx1.Pos, vtx2.Pos, vtx3.Pos));
					}
				}
			}
		}
	}

	/**
	 * Returns all triangles for the scene node associated with this selector
	 * @public
	 * @param {CL3D.Matrix4} transform a transformation matrix which transforms all triangles before returning them
	 * @param {Array} outArray output array of the triangles
	 */
	getAllTriangles(transform, outArray) {
		if (!this.Node.AbsoluteTransformation)
			return;

		var mat; // Matrix4

		if (transform)
			mat = transform.multiply(this.Node.AbsoluteTransformation);

		else
			mat = this.Node.AbsoluteTransformation;

		var i; //:int;

		if (mat.isIdentity()) {
			// copy directly
			for (i = 0; i < this.Triangles.length; ++i)
				outArray.push(this.Triangles[i]);
		}

		else {
			// transform before copying
			if (mat.isTranslateOnly()) {
				// translate only
				for (i = 0; i < this.Triangles.length; ++i) {
					outArray.push(new CL3D.Triangle3d(
						mat.getTranslatedVect(this.Triangles[i].pointA),
						mat.getTranslatedVect(this.Triangles[i].pointB),
						mat.getTranslatedVect(this.Triangles[i].pointC)));
				}
			}

			else {
				// do full transform
				for (i = 0; i < this.Triangles.length; ++i) {
					outArray.push(new CL3D.Triangle3d(
						mat.getTransformedVect(this.Triangles[i].pointA),
						mat.getTransformedVect(this.Triangles[i].pointB),
						mat.getTransformedVect(this.Triangles[i].pointC)));
				}
			}
		}
	}

	/**
	 * Returns all triangles inside a bounding box, for the scene node associated with this selector. This method will
	 * return at least the triangles that intersect the box, but may return other triangles as well.
	 * @public
	 * @param box {CL3D.Box3d}
	 * @param transform {CL3D.Matrix4} a transformation matrix which transforms all triangles before returning them
	 * @param outArray {Array} output array of the triangles
	 * @returns the new CL3D.TriangleSelector
	 */
	getTrianglesInBox(box, transform, outArray) {
		// TODO: do a getTrianglesInBox implementation
		this.getAllTriangles(transform, outArray);
	}

	/**
	  * Returns the scenenode this selector is for
	  * @returns returns {@link SceneNode} if this selector is for a specific scene node
	 */
	getRelatedSceneNode() {
		return this.Node;
	}

	/**
	  * Creates a clone of this triangle selector, for a new scene node
	  * @param node {CL3D.SceneNode} scene node the selector is based on
	  * @returns returns {@link TriangleSelector} if this selector can be cloned or null if not
	 */
	createClone(node) {
		var clone = new CL3D.MeshTriangleSelector(null, node);
		clone.Node = node;
		clone.Triangles = this.Triangles;
		return clone;
	}
};

// ------------------------------------------------------------------------------------------------------
// BoundingBoxTriangleSelector
// ------------------------------------------------------------------------------------------------------

/**
 * Implementation of TriangleSelector based on a simple, static bounding box, useful for collision detection.<br/>
 * Every {@link CL3D.SceneNode} may have a triangle selector, available with SceneNode::Selector. This is used for doing collision detection: 
 * For example if you know that a collision may have happened in the area between (1,1,1) and (10,10,10), you can get all triangles of the scene
 * node in this area with the TriangleSelector easily and check every triangle if it collided.<br/>
 * @class Interface to return triangles with specific properties, useful for collision detection.
 * @public
 * @constructor
 * @extends CL3D.MeshTriangleSelector
 * @param Box {@link CL3D.Box3d} representing the simpliefied collision object of the node
 */
export class BoundingBoxTriangleSelector extends CL3D.MeshTriangleSelector {
	constructor(box, scenenode) {
		super();

		if (!scenenode)
			return;

		this.Node = scenenode;

		// create triangle array
		this.Triangles = new Array();

		if (box != null) {
			var edges = box.getEdges();

			this.Triangles.push(new CL3D.Triangle3d(edges[3], edges[0], edges[2]));
			this.Triangles.push(new CL3D.Triangle3d(edges[3], edges[1], edges[0]));

			this.Triangles.push(new CL3D.Triangle3d(edges[3], edges[2], edges[7]));
			this.Triangles.push(new CL3D.Triangle3d(edges[7], edges[2], edges[6]));

			this.Triangles.push(new CL3D.Triangle3d(edges[7], edges[6], edges[4]));
			this.Triangles.push(new CL3D.Triangle3d(edges[5], edges[7], edges[4]));

			this.Triangles.push(new CL3D.Triangle3d(edges[5], edges[4], edges[0]));
			this.Triangles.push(new CL3D.Triangle3d(edges[5], edges[0], edges[1]));

			this.Triangles.push(new CL3D.Triangle3d(edges[1], edges[3], edges[7]));
			this.Triangles.push(new CL3D.Triangle3d(edges[1], edges[7], edges[5]));

			this.Triangles.push(new CL3D.Triangle3d(edges[0], edges[6], edges[2]));
			this.Triangles.push(new CL3D.Triangle3d(edges[0], edges[4], edges[6]));
		}
	}

	/**
	  * Creates a clone of this triangle selector, for a new scene node
	  * @param node {CL3D.SceneNode} scene node the selector is based on
	  * @returns returns {@link TriangleSelector} if this selector can be cloned or null if not
	 */
	createClone(node) {
		var clone = new CL3D.BoundingBoxTriangleSelector(null, node);
		clone.Node = node;
		clone.Triangles = this.Triangles;
		return clone;
	}
};

// ------------------------------------------------------------------------------------------------------
// MetaTriangleSelector
// ------------------------------------------------------------------------------------------------------

/**
 * Interface for making multiple triangle selectors work as one big selector. 
 * This is nothing more than a collection of one or more triangle selectors providing together the interface of one triangle selector.
 * In this way, collision tests can be done with different triangle soups in one pass.
 * See {@link CL3D.MeshTriangleSelector} for an implementation of a triangle selector for meshes.<br/>
 * @class Interface for making multiple triangle selectors work as one big selector. 
 * @public
 * @extends CL3D.TriangleSelector
 * @constructor
 */
export class MetaTriangleSelector extends CL3D.TriangleSelector{
	constructor() {
		super();

		this.Selectors = new Array();
		this.NodeToIgnore = null;
	}

	/**
	 * Returns all triangles for the scene node associated with this selector
	 * @public
	 * @param {CL3D.Matrix4} transform a transformation matrix which transforms all triangles before returning them
	 * @param {Array} outArray output array of the triangles
	 */
	getAllTriangles(transform, outArray) {
		var nodeToIgnore = this.NodeToIgnore;

		for (var i = 0; i < this.Selectors.length; ++i) {
			var sel = this.Selectors[i];

			if (nodeToIgnore != null && nodeToIgnore == sel.getRelatedSceneNode())
				continue;

			sel.getAllTriangles(transform, outArray);
		}
	}

	/**
	 * Returns all triangles inside a bounding box, for the scene node associated with this selector. This method will
	 * return at least the triangles that intersect the box, but may return other triangles as well.
	 * @public
	 * @param box {CL3D.Box3d}
	 * @param transform {CL3D.Matrix4} a transformation matrix which transforms all triangles before returning them
	 * @param outArray {Array} output array of the triangles
	 * @returns the new CL3D.TriangleSelector
	 */
	getTrianglesInBox(box, transform, outArray) {
		var nodeToIgnore = this.NodeToIgnore;

		for (var i = 0; i < this.Selectors.length; ++i) {
			var sel = this.Selectors[i];

			if (nodeToIgnore != null && nodeToIgnore == sel.getRelatedSceneNode())
				continue;

			sel.getTrianglesInBox(box, transform, outArray);
		}
	}

	/**
	 * Adds a triangle selector to the collection of triangle selectors.
	 * @public
	 * @param {CL3D.TriangleSelector} t a {@link CL3D.TriangleSelector} to add
	 */
	addSelector(t) {
		this.Selectors.push(t);
	}

	/**
	 * Removes a triangle selector from the collection of triangle selectors.
	 * @public
	 * @param {CL3D.TriangleSelector} t a {@link CL3D.TriangleSelector} to remove
	 */
	removeSelector(t) {
		for (var i = 0; i < this.Selectors.length;) {
			var e = this.Selectors[i];

			if (e === t) {
				this.Selectors.splice(i, 1);
				return;
			}

			else
				++i;
		}
	}

	/**
	 * Removes all triangle selectors from the collection of triangle selectors.
	 * @public
	 */
	clear() {
		this.Selectors = new Array();
	}

	/**
	 * Returns the collision 3d point of a 3d line with the 3d geometry in this triangle selector.
	 * @public
	 * @param {CL3D.Vect3d} start 3d point representing the start of the 3d line
	 * @param {CL3D.Vect3d} end 3d point representing the end of the 3d line
	 * @param {Boolean} bIgnoreBackFaces if set to true, this will ignore back faced polygons, making the query twice as fast
	 * @param {CL3D.Triangle3d} outTriangle if set to a triangle, this will contain the 3d triangle with which the line collided
	 * @param {Boolean} ignoreInvisibleItems set to true to ignore invisible scene nodes for collision test
	 * @returns {CL3D.Vect3d} a 3d position as {@link CL3D.Vect3d} if a collision was found or null if no collision was found
	 */
	getCollisionPointWithLine(start, end, bIgnoreBackFaces, outTriangle, ignoreInvisibleItems) {
		// we would not need to re-implement this function here, because it would also work from the base class, since it calls getAllTriangles().
		// but we call it for every node separately, so that the 'ignoreInvisibleItems' also can be used
		var nearest = 999999999.9; //FLT_MAX;
		var returnPos = null;
		var tritmp = null;
		if (outTriangle)
			tritmp = new CL3D.Triangle3d();

		for (var i = 0; i < this.Selectors.length; ++i) {
			var pos = this.Selectors[i].getCollisionPointWithLine(start, end, bIgnoreBackFaces, tritmp, ignoreInvisibleItems);

			if (pos != null) {
				var tmp = pos.getDistanceFromSQ(start);
				if (tmp < nearest) {
					returnPos = pos.clone();
					nearest = tmp;

					if (outTriangle)
						tritmp.copyTo(outTriangle);
				}
			}
		}

		return returnPos;
	}

	/**
	  * If there are multiple scene nodes in this selector, it is possible to let it ignore one
	  * specific node, for example to prevent colliding it against itself.
	 */
	setNodeToIgnore(n) {
		this.NodeToIgnore = n;
	}
};

// ------------------------------------------------------------------------------------------------------
// Octtree selector
// ------------------------------------------------------------------------------------------------------

/**
 * @private
 */
export class SOctTreeNode {
	constructor() {
		this.Triangles = new Array();
		this.Box = new CL3D.Box3d();
		this.Child = new Array(); // always 8 childs
	}
};

/**
 * Implementation of TriangleSelector for huge meshes, useful for collision detection.
 * The internal structure of this mesh is an occtree, speeding up queries using an axis aligne box ({@link getTrianglesInBox}).
 * Every {@link CL3D.SceneNode} may have a triangle selector, available with SceneNode::Selector. This is used for doing collision detection: 
 * For example if you know that a collision may have happened in the area between (1,1,1) and (10,10,10), you can get all triangles of the scene
 * node in this area with the TriangleSelector easily and check every triangle if it collided.<br/>
 * @class OctTree implementation of a triangle selector, useful for collision detection.
 * @public
 * @constructor
 * @extends CL3D.TriangleSelector
 * @param {CL3D.Mesh} Mesh the {@link CL3D.Mesh} representing the geometry
 * @param {CL3D.SceneNode} scenenode the {@link CL3D.SceneNode} representing the position of the geometry
 * @param {Number} minimalPolysPerNode (optional) minmal polygons per oct tree node. Default is 64.
 * @param materialToIgnore {Number} (optional) material type to ignore for collision. Can be set to null.
 * @param materialToIgnore2 {Number} (optional) material type to ignore for collision. Can be set to null.
 */
export class OctTreeTriangleSelector extends CL3D.TriangleSelector {
	constructor(mesh, scenenode, minimalPolysPerNode, materialToIgnore, materialToIgnore2) {
		super();

		this.DebugNodeCount = 0;
		this.DebugPolyCount = 0;

		if (minimalPolysPerNode == null)
			this.MinimalPolysPerNode = 64;

		else
			this.MinimalPolysPerNode = minimalPolysPerNode;

		if (!mesh)
			return;

		this.Node = scenenode;
		this.Root = new CL3D.SOctTreeNode();
		this.Triangles = new Array(); // Additional array to store all triangles to be able to return all quickly without iterating the tree



		// create triangle array
		for (var b = 0; b < mesh.MeshBuffers.length; ++b) {
			var mb = mesh.MeshBuffers[b];
			if (mb) {
				if (materialToIgnore != null && mb.Mat && mb.Mat.Type == materialToIgnore)
					continue;

				if (materialToIgnore2 != null && mb.Mat && mb.Mat.Type == materialToIgnore2)
					continue;

				var idxcnt = mb.Indices.length;
				for (var j = 0; j < idxcnt; j += 3) {
					var vtx1 = mb.Vertices[mb.Indices[j]];
					var vtx2 = mb.Vertices[mb.Indices[j + 1]];
					var vtx3 = mb.Vertices[mb.Indices[j + 2]];

					var tri = new CL3D.Triangle3d(vtx1.Pos, vtx2.Pos, vtx3.Pos);
					this.Root.Triangles.push(tri);
					this.Triangles.push(tri); // also store all triangles in a separate array to be able to retrieve all later
				}
			}
		}

		this.constructTree(this.Root);

		//console.log("Constructed Octtree with " + this.DebugNodeCount + 
		//	" nodes and triangles:" + this.DebugPolyCount);
	}

	/**
	 * @private
	 */
	constructTree(node) {
		++this.DebugNodeCount;

		node.Box.MinEdge = node.Triangles[0].pointA.clone();
		node.Box.MaxEdge = node.Box.MinEdge.clone();

		var tri;
		var cnt = node.Triangles.length;

		for (var i = 0; i < cnt; ++i) {
			tri = node.Triangles[i];
			node.Box.addInternalPointByVector(tri.pointA);
			node.Box.addInternalPointByVector(tri.pointB);
			node.Box.addInternalPointByVector(tri.pointC);
		}

		if (!node.Box.MinEdge.equals(node.Box.MaxEdge) && cnt > this.MinimalPolysPerNode) {
			var middle = node.Box.getCenter();
			var edges = node.Box.getEdges();
			var box = new CL3D.Box3d();

			for (var ch = 0; ch < 8; ++ch) {
				var keepTriangles = new Array();
				box.MinEdge = middle.clone();
				box.MaxEdge = middle.clone();
				box.addInternalPointByVector(edges[ch]);

				node.Child.push(new CL3D.SOctTreeNode());

				for (var i = 0; i < node.Triangles.length; ++i) {
					tri = node.Triangles[i];

					if (tri.isTotalInsideBox(box))
						node.Child[ch].Triangles.push(tri);

					else
						keepTriangles.push(tri);
				}

				node.Triangles = keepTriangles;

				if (node.Child[ch].Triangles.length == 0)
					node.Child[ch] = null;

				else
					this.constructTree(node.Child[ch]);
			}
		}

		this.DebugPolyCount += node.Triangles.length;
	}

	/**
	 * Returns all triangles for the scene node associated with this selector
	 * @public
	 * @param transform {CL3D.Matrix4} a transformation matrix which transforms all triangles before returning them
	 * @param outArray {Array} output array of the triangles
	 * @returns the new CL3D.TriangleSelector
	 */
	getAllTriangles(transform, outArray) {
		CL3D.MeshTriangleSelector.prototype.getAllTriangles.call(this, transform, outArray);
	}

	/**
	 * Returns all triangles inside a bounding box, for the scene node associated with this selector. This method will
	 * return at least the triangles that intersect the box, but may return other triangles as well.
	 * @public
	 * @param {CL3D.Box3d}  box
	 * @param {CL3D.Matrix4} transform a transformation matrix which transforms all triangles before returning them
	 * @param {Array} outArray output array of the triangles
	 */
	getTrianglesInBox(box, transform, outArray) {
		if (!this.Node.AbsoluteTransformation)
			return;

		var mat = new CL3D.Matrix4();
		var invbox = box.clone();

		if (this.Node) {
			mat = this.Node.getAbsoluteTransformation().clone();
			mat.makeInverse();
			mat.transformBoxEx(invbox);
		}

		mat.makeIdentity();

		if (transform)
			mat = transform.clone();

		if (this.Node)
			mat = mat.multiply(this.Node.getAbsoluteTransformation());

		if (this.Root) {
			this.getTrianglesFromOctTree(this.Root, outArray, invbox, mat);
		}
	}

	/**
	 * @private
	 */
	getTrianglesFromOctTree(node, outArray, box, transform) {
		if (!node.Box.intersectsWithBox(box))
			return;

		var cnt = node.Triangles.length;

		var i;

		if (transform.isIdentity()) {
			// copy directly
			for (i = 0; i < cnt; ++i)
				outArray.push(node.Triangles[i]);
		}

		else {
			// transform before copying
			if (transform.isTranslateOnly()) {
				// translate only
				for (i = 0; i < cnt; ++i) {
					outArray.push(new CL3D.Triangle3d(
						transform.getTranslatedVect(node.Triangles[i].pointA),
						transform.getTranslatedVect(node.Triangles[i].pointB),
						transform.getTranslatedVect(node.Triangles[i].pointC)));
				}
			}

			else {
				// do full transform
				for (i = 0; i < cnt; ++i) {
					outArray.push(new CL3D.Triangle3d(
						transform.getTransformedVect(node.Triangles[i].pointA),
						transform.getTransformedVect(node.Triangles[i].pointB),
						transform.getTransformedVect(node.Triangles[i].pointC)));
				}
			}
		}

		// also for children
		for (i = 0; i < node.Child.length; ++i) {
			var c = node.Child[i];
			if (c != null)
				this.getTrianglesFromOctTree(c, outArray, box, transform);
		}
	}

	/**
	  * Returns the scenenode this selector is for
	  * @returns returns {@link SceneNode} if this selector is for a specific scene node
	 */
	getRelatedSceneNode() {
		return this.Node;
	}

	/**
	 * @private
	 */
	createOcTreeNodeClone(toclone) {
		var clone = new CL3D.SOctTreeNode();
		clone.Triangles = toclone.Triangles;
		clone.Box = toclone.Box.clone();

		for (var i = 0; i < toclone.Child.length; ++i) {
			var c = toclone.Child[i];
			var clonedchild = null;

			if (c)
				clonedchild = this.createOcTreeNodeClone(c);

			clone.Child.push(clonedchild);
		}

		return clone;
	}

	/**
	  * Creates a clone of this triangle selector, for a new scene node
	  * @param node {CL3D.SceneNode} scene node the selector is based on
	  * @returns returns {@link TriangleSelector} if this selector can be cloned or null if not
	 */
	createClone(node) {
		var clone = new CL3D.OctTreeTriangleSelector(null, node, this.MinimalPolysPerNode);

		clone.Node = node;
		clone.Triangles = this.Triangles;
		clone.Root = null;

		if (this.Root)
			clone.Root = this.createOcTreeNodeClone(this.Root);

		return clone;
	}
};
