//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "./main.js";

/**
 * 3d triangle class consisting of 3 points in space, formin a triangle
 * @class 3d triangle class consisting of 3 points in space, formin a triangle
 * @public
 * @constructor
 * @param {CL3D.Vect3d} a first point of the triangle, can be null.
 * @param {CL3D.Vect3d} b second point of the triangle, can be null.
 * @param {CL3D.Vect3d} c third point of the triangle, can be null.
 */
export class Triangle3d {
	/**
	 * First point of the triangle
	 * @public
	 * @type {CL3D.Vect3d}
	 */
	pointA = null;

	/**
	 * Second point of the triangle
	 * @public
	 * @type {CL3D.Vect3d}
	 */
	pointB = null;

	/**
	 * Third point of the triangle
	 * @public
	 * @type {CL3D.Vect3d}
	 */
	pointC = null;

	constructor(a, b, c) {
		if (a)
			this.pointA = a;

		else
			this.pointA = new CL3D.Vect3d();

		if (b)
			this.pointB = b;

		else
			this.pointB = new CL3D.Vect3d();

		if (c)
			this.pointC = c;

		else
			this.pointC = new CL3D.Vect3d();
	}

	/**
	 * Creates a copy of this vector and returns it
	 * @public
	 * @returns the new CL3D.Triangle3d
	 */
	clone() {
		return new CL3D.Triangle3d(this.pointA, this.pointB, this.pointC);
	}

	/**
	 * Creates a 3d plane based on this triangle
	 * @public
	 * @returns Triangle3d
	 */
	getPlane() {
		var p = new CL3D.Plane3d();
		p.setPlaneFrom3Points(this.pointA, this.pointB, this.pointC);
		return p;
	}

	/**
	 * Returns if a point is in this triangle using a fast method
	 * @public
	 * @param {CL3D.Vect3d} p point to test
	 * @returns {Boolean} true if inside, false if not
	 */
	isPointInsideFast(p) {
		var f = this.pointB.substract(this.pointA);
		var g = this.pointC.substract(this.pointA);

		var a = f.dotProduct(f);
		var b = f.dotProduct(g);
		var c = g.dotProduct(g);

		var vp = p.substract(this.pointA);
		var d = vp.dotProduct(f);
		var e = vp.dotProduct(g);

		var x = (d * c) - (e * b);
		var y = (e * a) - (d * b);
		var ac_bb = (a * c) - (b * b);
		var z = x + y - ac_bb;

		// return sign(z) && !(sign(x)||sign(y))
		//return (( (IR(z)) & ~((IR(x))|(IR(y))) ) & 0x80000000)!=0;
		return (z < 0) && !((x < 0) || (y < 0));
	}

	/**
	 * Returns if a point is in this triangle using a slow method
	 * @public
	 * @param {CL3D.Vect3d} p point to test
	 * @returns {Boolean} true if inside, false if not
	 */
	isPointInside(p) {
		return (this.isOnSameSide(p, this.pointA, this.pointB, this.pointC) &&
			this.isOnSameSide(p, this.pointB, this.pointA, this.pointC) &&
			this.isOnSameSide(p, this.pointC, this.pointA, this.pointB));
	}

	/**
	 * @public
	 */
	isOnSameSide(p1, p2, a, b) {
		var bminusa = b.substract(a);
		var cp1 = bminusa.crossProduct(p1.substract(a));
		var cp2 = bminusa.crossProduct(p2.substract(a));
		return (cp1.dotProduct(cp2) >= 0.0);
	}

	/**
	 * Returns the normal of this triangle
	 * @public
	 * @returns {CL3D.Vect3d} the normal.
	 */
	getNormal() {
		return this.pointB.substract(this.pointA).crossProduct(this.pointC.substract(this.pointA));
	}

	/**
	 * Returns the intersection of the plane described by this triangle and a line.
	 * @public
	 * @param {CL3D.Vect3d} linePoint point on the line
	 * @param {CL3D.Vect3d} lineVect vector of the line
	 * @returns null if there is no intersection or a vect3d describing the point of intersection
	 */
	getIntersectionOfPlaneWithLine(linePoint, lineVect) {
		var normal = this.getNormal();
		normal.normalize();
		var t2 = normal.dotProduct(lineVect);

		if (CL3D.iszero(t2))
			return null;

		var d = this.pointA.dotProduct(normal);
		var t = -(normal.dotProduct(linePoint) - d) / t2;
		return linePoint.add(lineVect.multiplyWithScal(t));
	}

	/**
	 * Returns the intersection of the triangle and a line.
	 * @public
	 * @param {CL3D.Vect3d} linePoint point on the line
	 * @param {CL3D.Vect3d} lineVect vector of the line
	 * @returns null if there is no intersection or a vect3d describing the point of intersection
	 */
	getIntersectionWithLine(linePoint, lineVect) {
		var ret = this.getIntersectionOfPlaneWithLine(linePoint, lineVect);
		if (ret == null)
			return null;

		if (this.isPointInside(ret))
			return ret;

		return null;
	}

	/**
	 * Returns the the triangle is totally inside a box
	 * @public
	 * @param {CL3D.Box3d} box
	 */
	isTotalInsideBox(box) {
		return box.isPointInside(this.pointA) &&
			box.isPointInside(this.pointB) &&
			box.isPointInside(this.pointC);
	}

	/**
	 * Copies the content of this triangle to another triangle
	 * @public
	 * @param {CL3D.Triangle3d} tgt Target vector
	 */
	copyTo(tgt) {
		this.pointA.copyTo(tgt.pointA);
		this.pointB.copyTo(tgt.pointB);
		this.pointC.copyTo(tgt.pointC);
	}
};
