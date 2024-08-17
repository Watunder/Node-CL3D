//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "../main.js";

/**
 * A path scene node stores a 3d path which can be used for example by {@link Animator}s to move {@link SceneNode}s along it.
 * @class A path scene node stores a 3d path which can be used for example by {@link Animator}s to move {@link SceneNode}s along it.
 * @constructor
 * @extends CL3D.SceneNode
 */
export class PathSceneNode extends CL3D.SceneNode {
	/**
	 * Tightness of the spline, specifies how the line is interpolated between the path nodes.
	 * With this, you can create for example either cardinal splines (tightness != 0.5) or catmull-rom-splines (tightness == 0.5).
	 * @public
	 * @type Number
	 */
	Tightness = 0;

	/**
	 * Specifies if the path is a closed circle or a unclosed line.
	 * @public
	 * @type Boolean
	 */
	IsClosedCircle = false;

	/**
	 * Array of path nodes, of type {@link Vect3d}.
	 * @public
	 * @type Array
	 */
	Nodes = new Array();

	constructor() {
		super();

		this.init();

		this.Box = new CL3D.Box3d();
		this.Tightness = 0; //;
		this.IsClosedCircle = false; //:Boolean;
		this.Nodes = new Array(); // Vect3d
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
	 * Returns 'path' for the mesh scene node.
	 * @public
	 * @returns {String} type name of the scene node.
	 */
	getType() {
		return 'path';
	}

	/**
	 * @public
	 */
	createClone(newparent, oldNodeId, newNodeId) {
		var c = new CL3D.PathSceneNode();
		this.cloneMembers(c, newparent, oldNodeId, newNodeId);

		if (this.Box)
			c.Box = this.Box.clone();

		c.Tightness = this.Tightness; //;
		c.IsClosedCircle = this.IsClosedCircle; //:Boolean;
		c.Nodes = new Array(); // Vect3d

		for (var i = 0; i < this.Nodes.length; ++i) {
			var n = this.Nodes[i];
			c.Nodes.push(n.clone());
		}

		return c;
	}

	/**
	 * @public
	 */
	getPathNodeCount() {
		return this.Nodes.length;
	}

	/**
	 * @public
	 * returns the absolute position of a path node in the path
	 * @param idx {Number} Index of the path node
	 * @returns {CL3D.Vect3d} returns the 3d vector of the position of the specified path node
	 */
	getPathNodePosition(idx) {
		if (idx < 0 || idx >= this.Nodes.length)
			return new CL3D.Vect3d(0, 0, 0);

		if (!this.AbsoluteTransformation)
			this.updateAbsolutePosition();

		var pos = this.Nodes[idx];
		pos = pos.clone();
		this.AbsoluteTransformation.transformVect(pos);

		return pos;
	}

	/**
	 * @public
	 */
	clampPathIndex(idx, size) {
		if (this.IsClosedCircle)
			return (idx < 0 ? (size + idx) : ((idx >= size) ? (idx - size) : idx));

		return ((idx < 0) ? 0 : ((idx >= size) ? (size - 1) : idx));
	}

	/**
	 * @public
	 * Returns the position of a point on the path, based on a value between 0 and 1. Can be
	 * Used to interpolate a position on the path.
	 * @param {Number} posOnPath Value between 0 and 1, meaning 0 is the start of the path and 1 is the end of the path.
	 * @param {Boolean=} relative set to true to get the position relative to the position of the path scene node, set to
	 * false to receive the position in absolute world space.
	 * @returns {CL3D.Vect3d} returns the 3d vector of the position
	 */
	getPointOnPath(posOnPath, relative) {
		var pSize = this.Nodes.length;

		if (this.IsClosedCircle)
			posOnPath *= pSize;

		else {
			posOnPath = CL3D.clamp(posOnPath, 0.0, 1.0);
			posOnPath *= pSize - 1;
		}

		var finalPos = new CL3D.Vect3d();

		if (pSize == 0)
			return finalPos;

		if (pSize == 1)
			return finalPos;

		var dt = posOnPath;
		var u = CL3D.fract(dt);
		var idx = Math.floor(dt) % pSize;

		var p0 = this.Nodes[this.clampPathIndex(idx - 1, pSize)];
		var p1 = this.Nodes[this.clampPathIndex(idx + 0, pSize)]; // starting point
		var p2 = this.Nodes[this.clampPathIndex(idx + 1, pSize)]; // end point
		var p3 = this.Nodes[this.clampPathIndex(idx + 2, pSize)];

		// hermite polynomials
		var h1 = 2.0 * u * u * u - 3.0 * u * u + 1.0;
		var h2 = -2.0 * u * u * u + 3.0 * u * u;
		var h3 = u * u * u - 2.0 * u * u + u;
		var h4 = u * u * u - u * u;

		// tangents
		var t1 = p2.substract(p0);
		t1.multiplyThisWithScal(this.Tightness);
		var t2 = p3.substract(p1);
		t2.multiplyThisWithScal(this.Tightness);

		// interpolated point
		finalPos = p1.multiplyWithScal(h1);
		finalPos.addToThis(p2.multiplyWithScal(h2));
		finalPos.addToThis(t1.multiplyWithScal(h3));
		finalPos.addToThis(t2.multiplyWithScal(h4));

		if (!relative) {
			if (!this.AbsoluteTransformation)
				this.updateAbsolutePosition();

			this.AbsoluteTransformation.transformVect(finalPos);
		}

		return finalPos;
	}
};
