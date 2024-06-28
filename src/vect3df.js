//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "./main.js";

/**
 * 3d vector class with lots of operators and methods. Usually used to store 3d positions and directions.
 * @class 3d vector class with lots of operators and methods
 * @public
 * @constructor
 * @param {Number} x x coordinate, can be null.
 * @param {Number} y y coordinate, can be null.
 * @param {Number} z z coordinate, can be null.
 */
export class Vect3d {

	/**
	 * X coordinate of the vector
	 * @public
	 * @type Number
	 */
	X = 0;

	/**
	 * Y coordinate of the vector
	 * @public
	 * @type Number 
	 */
	Y = 0;

	/**
	 * Z coordinate of the vector
	 * @public
	 * @type Number
	 */
	Z = 0;
	constructor(x, y, z) {
		if (x != null) {
			this.X = x;
			this.Y = y;
			this.Z = z;
		}
	}
	/**
	 * Sets all 3 coordinates to new values
	 * @public
	 */
	set(x, y, z) {
		this.X = x;
		this.Y = y;
		this.Z = z;
	}
	/**
	 * Creates a copy of this vector and returns it
	 * @public
	 * @type {CL3D.Vect3d}
	 */
	clone() {
		return new CL3D.Vect3d(this.X, this.Y, this.Z);
	}
	/**
	 * Copies the content of this vector to another vector
	 * @public
	 * @param {CL3D.Vect3d} tgt Target vector
	 */
	copyTo(tgt) {
		tgt.X = this.X;
		tgt.Y = this.Y;
		tgt.Z = this.Z;
	}
	/**
	 * Substracts another vector from this vector and returns a new vector
	 * param other {CL3D.Vect3d} other vector
	 * @public
	 * @returns {CL3D.Vect3d} new vector with the result
	 */
	substract(other) {
		return new CL3D.Vect3d(this.X - other.X, this.Y - other.Y, this.Z - other.Z);
	}
	/**
	 * Substracts another vector from this vector, modifying this vector
	 * param other {CL3D.Vect3d} other vector
	 * @public
	 */
	substractFromThis(other) {
		this.X -= other.X;
		this.Y -= other.Y;
		this.Z -= other.Z;
	}
	/**
	 * Adds another vector to this vector and returns a new vector
	 * param other {CL3D.Vect3d} other vector
	 * @public
	 * @returns {CL3D.Vect3d} new vector with the result
	 */
	add(other) {
		return new CL3D.Vect3d(this.X + other.X, this.Y + other.Y, this.Z + other.Z);
	}
	/**
	 * Adds another vector to this vector, modifying this vector
	 * param other {CL3D.Vect3d} other vector
	 * @public
	 */
	addToThis(other) {
		this.X += other.X;
		this.Y += other.Y;
		this.Z += other.Z;
	}
	/**
	 * @private
	 */
	addToThisReturnMe(other) {
		this.X += other.X;
		this.Y += other.Y;
		this.Z += other.Z;
		return this;
	}
	/**
	 * Normalizes this vector, setting it to a length of 1, modifying this vector
	 * @public
	 */
	normalize() {
		let l = this.X * this.X + this.Y * this.Y + this.Z * this.Z;
		if (l > -0.0000001 && l < 0.0000001)
			return;

		l = 1.0 / Math.sqrt(l);
		this.X *= l;
		this.Y *= l;
		this.Z *= l;
	}
	/**
	 * Creates a new vector which is the normalized version of this vector (set to a length of 1)
	 * param other {CL3D.Vect3d} other vector
	 * @returns {CL3D.Vect3d} Returns a new vector with the result
	 * @public
	 */
	getNormalized() {
		let l = this.X * this.X + this.Y * this.Y + this.Z * this.Z;
		if (l > -0.0000001 && l < 0.0000001)
			return new CL3D.Vect3d(0, 0, 0);

		l = 1.0 / Math.sqrt(l);
		return new CL3D.Vect3d(this.X * l, this.Y * l, this.Z * l);
	}
	/**
	 * Sets the lengthh of this vector to the specified value
	 * @public
	 */
	setLength(n) {
		let l = this.X * this.X + this.Y * this.Y + this.Z * this.Z;
		if (l > -0.0000001 && l < 0.0000001)
			return;

		l = n / Math.sqrt(l);
		this.X *= l;
		this.Y *= l;
		this.Z *= l;
	}
	/**
	 * Sets all coordinates of this vector to the coordinates of the other vector
	 * @public
	 * @param {CL3D.Vect3d} other other vector
	 */
	setTo(other) {
		this.X = other.X;
		this.Y = other.Y;
		this.Z = other.Z;
	}
	/**
	 * Returns true if this vector equals another vector. Doesn't use the comparison operator but the {@link CL3D.equals} function.
	 * @public
	 * @param other {CL3D.Vect3d} other vector
	 */
	equals(other) {
		return CL3D.equals(this.X, other.X) &&
			CL3D.equals(this.Y, other.Y) &&
			CL3D.equals(this.Z, other.Z);
	}
	/**
	 * Returns true if this vector equals zero. Doesn't use the comparison operator but the {@link CL3D.iszero} function.
	 * @public
	 */
	equalsZero() {
		return CL3D.iszero(this.X) && CL3D.iszero(this.Y) && CL3D.iszero(this.Z);
	}
	/**
	 * Returns true if this vector equals x, y, and z given as argument. Doesn't use the comparison operator but the {@link CL3D.equals} function.
	 * @public
	 */
	equalsByNumbers(x, y, z) {
		return CL3D.equals(this.X, x) &&
			CL3D.equals(this.Y, y) &&
			CL3D.equals(this.Z, z);
	}
	/**
	 * Returns true if this vector == zero.
	 * @public
	 */
	isZero() {
		//return CL3D.iszero(X) && CL3D.iszero(Y) && CL3D.iszero(Z);
		return this.X == 0 && this.Y == 0 && this.Z == 0;
	}
	/**
	 * Returns the lenght of this vector
	 * @public
	 */
	getLength() {
		return Math.sqrt(this.X * this.X + this.Y * this.Y + this.Z * this.Z);
	}
	/**
	 * Returns the distance to another point
	 * @public
	 * @param {CL3D.Vect3d} v another point
	 */
	getDistanceTo(v) {
		let x = v.X - this.X;
		let y = v.Y - this.Y;
		let z = v.Z - this.Z;

		return Math.sqrt(x * x + y * y + z * z);
	}
	/**
	 * Returns the squared distance to another point
	 * @public
	 * @param {CL3D.Vect3d} v another point
	 */
	getDistanceFromSQ(v) {
		let x = v.X - this.X;
		let y = v.Y - this.Y;
		let z = v.Z - this.Z;

		return x * x + y * y + z * z;
	}
	/**
	 * Returns the squared lenght of this vector, is faster than {@link Vect3d.getLength}.
	 * @public
	 */
	getLengthSQ() {
		return this.X * this.X + this.Y * this.Y + this.Z * this.Z;
	}
	/**
	 * Multiplies this vector with a scalar value (= a number) and returns the result as a new vector
	 * @public
	 */
	multiplyWithScal(v) {
		return new CL3D.Vect3d(this.X * v, this.Y * v, this.Z * v);
	}
	/**
	 * Multiplies this vector with a scalar value (= a number), modifying this vector
	 * @public
	 */
	multiplyThisWithScal(v) {
		this.X *= v;
		this.Y *= v;
		this.Z *= v;
	}
	/**
	 * @private
	 */
	multiplyThisWithScalReturnMe(v) {
		this.X *= v;
		this.Y *= v;
		this.Z *= v;
		return this;
	}
	/**
	 * Multiplies each coordinate with the coordinate of another vector, modifying this vector.
	 * @public
	 */
	multiplyThisWithVect(v) {
		this.X *= v.X;
		this.Y *= v.Y;
		this.Z *= v.Z;
	}
	/**
	 * Multiplies each coordinate with the coordinate of another vector, returning the result as a new vector.
	 * @public
	 */
	multiplyWithVect(v) {
		return new CL3D.Vect3d(this.X * v.X, this.Y * v.Y, this.Z * v.Z);
	}
	/**
	 * Divides each coordinate with the coordinate of another vector, modifying this vector.
	 * @public
	 */
	divideThisThroughVect(v) {
		this.X /= v.X;
		this.Y /= v.Y;
		this.Z /= v.Z;
	}
	/**
	 * Divides each coordinate with the coordinate of another vector, returning the result as a new vector.
	 * @public
	 */
	divideThroughVect(v) {
		return new CL3D.Vect3d(this.X / v.X, this.Y / v.Y, this.Z / v.Z);
	}
	/**
	 * returns the cross product of this vector with another vector as new vector.
	 * @public
	 * @returns {CL3D.Vect3d} a new vector with the result cross product
	 */
	crossProduct(p) {
		return new CL3D.Vect3d(this.Y * p.Z - this.Z * p.Y, this.Z * p.X - this.X * p.Z, this.X * p.Y - this.Y * p.X);
	}
	/**
	 * returns the dot procduct of this vector with another vector
	 * @public
	 */
	dotProduct(other) {
		return this.X * other.X + this.Y * other.Y + this.Z * other.Z;
	}
	/**
	 * Get the rotations that would make a (0,0,1) direction vector point in the same direction as this direction vector.
	 * This utility method is very useful for
	 * orienting scene nodes towards specific targets.  For example, if this vector represents the difference
	 * between two scene nodes, then applying the result of getHorizontalAngle() to one scene node will point
	 * it at the other one.
	 * @public
	 */
	getHorizontalAngle() {
		let angle = new CL3D.Vect3d();

		angle.Y = CL3D.radToDeg(Math.atan2(this.X, this.Z));

		if (angle.Y < 0.0)
			angle.Y += 360.0;
		if (angle.Y >= 360.0)
			angle.Y -= 360.0;

		let z1 = Math.sqrt(this.X * this.X + this.Z * this.Z);

		angle.X = CL3D.radToDeg(Math.atan2(z1, this.Y)) - 90.0;

		if (angle.X < 0.0)
			angle.X += 360.0;
		if (angle.X >= 360.0)
			angle.X -= 360.0;

		return angle;
	}
	/**
	 * Rotates the vector around XY by a specic angle
	 * @public
	 */
	rotateXYBy(degrees) {
		degrees *= CL3D.DEGTORAD;
		let cs = Math.cos(degrees);
		let sn = Math.sin(degrees);

		let oldX = this.X;
		let oldY = this.Y;

		this.X = oldX * cs - oldY * sn;
		this.Y = oldX * sn + oldY * cs;
	}
	/**
	 * Rotates the vector around YZ by a specic angle
	 * @public
	 */
	rotateYZBy(degrees) {
		degrees *= CL3D.DEGTORAD;
		let cs = Math.cos(degrees);
		let sn = Math.sin(degrees);

		let oldY = this.Y;
		let oldZ = this.Z;

		this.Y = oldY * cs - oldZ * sn;
		this.Z = oldY * sn + oldZ * cs;
	}
	/**
	 * Rotates the vector around XZ by a specic angle
	 * @public
	 */
	rotateXZBy(degrees) {
		degrees *= CL3D.DEGTORAD;
		let cs = Math.cos(degrees);
		let sn = Math.sin(degrees);

		let oldX = this.X;
		let oldZ = this.Z;

		this.X = oldX * cs - oldZ * sn;
		this.Z = oldX * sn + oldZ * cs;
	}
	/**
	 * returns a new interpolated vector, between this and another vector.
	 * @param {CL3D.Vect3d} other another point or vector
	 * @param {Number} d value between 0 and 1, specifying the interpolation
	 * @public
	 */
	getInterpolated(other, d) {
		let inv = 1.0 - d;
		return new CL3D.Vect3d(other.X * inv + this.X * d, other.Y * inv + this.Y * d, other.Z * inv + this.Z * d);
	}
	/**
	 * Returns a string representation of this vector.
	 * @public
	 */
	toString() {
		return "(x: " + this.X + " y:" + this.Y + " z:" + this.Z + ")";
	}
}
