//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "./main.js";

/**
 * An axis aligned bounding box with a min and a maximal edge.
 * @constructor
 * @class Axis aligned bounding box.
 */
export class Box3d {
	/**
	 * Minimal Edge of the bounding box
	 * @public
	 * @type {CL3D.Vect3d}
	 */
	MinEdge = null;

	/**
	 * Maximal Edge of the bounding box
	 * @public
	 * @type {CL3D.Vect3d}
	 */
	MaxEdge = null;

	constructor() {
		this.MinEdge = new CL3D.Vect3d();
		this.MaxEdge = new CL3D.Vect3d();
	}
	/**
	 * Creates a clone of the box
	 * @public
	 * @returns {CL3D.Box3d} clone
	 */
	clone() {
		let c = new CL3D.Box3d();
		c.MinEdge = this.MinEdge.clone();
		c.MaxEdge = this.MaxEdge.clone();
		return c;
	}
	/**
	 * Returns the center of the box
	 * @public
	 * @returns {CL3D.Vect3d} center
	 */
	getCenter() {
		let ret = this.MinEdge.add(this.MaxEdge);
		ret.multiplyThisWithScal(0.5);
		return ret;
	}
	/**
	 * Returns the extent (or size) of the box
	 * @public
	 * @returns {CL3D.Vect3d} extent
	 */
	getExtent() {
		return this.MaxEdge.substract(this.MinEdge);
	}
	/**
	 * Returns all 8 edges of the bounding box
	 * @public
	 * @returns {Array} edges
	 */
	getEdges() {
		let middle = this.getCenter();
		let diag = middle.substract(this.MaxEdge);

		let edges = new Array();
		edges.push(new CL3D.Vect3d(middle.X + diag.X, middle.Y + diag.Y, middle.Z + diag.Z));
		edges.push(new CL3D.Vect3d(middle.X + diag.X, middle.Y - diag.Y, middle.Z + diag.Z));
		edges.push(new CL3D.Vect3d(middle.X + diag.X, middle.Y + diag.Y, middle.Z - diag.Z));
		edges.push(new CL3D.Vect3d(middle.X + diag.X, middle.Y - diag.Y, middle.Z - diag.Z));
		edges.push(new CL3D.Vect3d(middle.X - diag.X, middle.Y + diag.Y, middle.Z + diag.Z));
		edges.push(new CL3D.Vect3d(middle.X - diag.X, middle.Y - diag.Y, middle.Z + diag.Z));
		edges.push(new CL3D.Vect3d(middle.X - diag.X, middle.Y + diag.Y, middle.Z - diag.Z));
		edges.push(new CL3D.Vect3d(middle.X - diag.X, middle.Y - diag.Y, middle.Z - diag.Z));

		return edges;
	}
	/**
	 * Returns if the box intersects with a line
	 * @param lineStart {CL3D.Vect3d} start of the line
	 * @param lineEnd {CL3D.Vect3d} end of the line
	 * @public
	 */
	intersectsWithLine(lineStart, lineEnd) {
		let vect = lineEnd.substract(lineStart);
		let len = vect.getLength();

		vect.normalize();

		let middle = lineStart.add(lineEnd).multiplyWithScal(0.5);

		return this.intersectsWithLineImpl(middle, vect, len * 0.5);
	}
	/**
	 * @private
	 */
	intersectsWithLineImpl(linemiddle, linevect, halflength) {
		let e = this.getExtent().multiplyWithScal(0.5);
		let t = this.getCenter().substract(linemiddle);

		if ((Math.abs(t.X) > e.X + halflength * Math.abs(linevect.X)) ||
			(Math.abs(t.Y) > e.Y + halflength * Math.abs(linevect.Y)) ||
			(Math.abs(t.Z) > e.Z + halflength * Math.abs(linevect.Z)))
			return false;

		let r = e.Y * Math.abs(linevect.Z) + e.Z * Math.abs(linevect.Y);
		if (Math.abs(t.Y * linevect.Z - t.Z * linevect.Y) > r)
			return false;

		r = e.X * Math.abs(linevect.Z) + e.Z * Math.abs(linevect.X);
		if (Math.abs(t.Z * linevect.X - t.X * linevect.Z) > r)
			return false;

		r = e.X * Math.abs(linevect.Y) + e.Y * Math.abs(linevect.X);
		if (Math.abs(t.X * linevect.Y - t.Y * linevect.X) > r)
			return false;

		return true;
	}
	/**
	 * Adds a point to the bounding box, increasing the box if the point is outside of the box
	  * @public
	 */
	addInternalPoint(x, y, z) {
		if (x > this.MaxEdge.X) this.MaxEdge.X = x;
		if (y > this.MaxEdge.Y) this.MaxEdge.Y = y;
		if (z > this.MaxEdge.Z) this.MaxEdge.Z = z;

		if (x < this.MinEdge.X) this.MinEdge.X = x;
		if (y < this.MinEdge.Y) this.MinEdge.Y = y;
		if (z < this.MinEdge.Z) this.MinEdge.Z = z;
	}
	/**
	 * Adds a point to the bounding box, increasing the box if the point is outside of the box
	  * @public
	  * @param v {CL3D.Vect3d} 3d vector representing the point
	 */
	addInternalPointByVector(v) {
		this.addInternalPoint(v.X, v.Y, v.Z);
	}
	/**
	 * Adds a box to the bounding box
	  * @public
	  * @param v {CL3D.Box3d} 3d bounding box to add
	 */
	addInternalBox(box) {
		this.addInternalPointByVector(box.MinEdge);
		this.addInternalPointByVector(box.MaxEdge);
	}
	/**
	 * Returns if the box intersects with another box
	 * @param box {CL3D.Box3d} other box
	 * @public
	 */
	intersectsWithBox(box) {
		return this.MinEdge.X <= box.MaxEdge.X && this.MinEdge.Y <= box.MaxEdge.Y && this.MinEdge.Z <= box.MaxEdge.Z &&
			this.MaxEdge.X >= box.MinEdge.X && this.MaxEdge.Y >= box.MinEdge.Y && this.MaxEdge.Z >= box.MinEdge.Z;
	}
	/**
	 * Returns if a point is inside this box
	 * @param p {CL3D.Vect3d} point to test
	 * @public
	 */
	isPointInside(p) {
		return p.X >= this.MinEdge.X && p.X <= this.MaxEdge.X &&
			p.Y >= this.MinEdge.Y && p.Y <= this.MaxEdge.Y &&
			p.Z >= this.MinEdge.Z && p.Z <= this.MaxEdge.Z;
	}
	/**
	 * Resets the bounding box
	 * @public
	 */
	reset(x, y, z) {
		this.MaxEdge.set(x, y, z);
		this.MinEdge.set(x, y, z);
	}
	/**
	 * Returns true if the box is empty (MinEdge == MaxEdge)
	 * @public
	 */
	isEmpty() {
		return this.MaxEdge.equals(this.MinEdge);
	}
}
