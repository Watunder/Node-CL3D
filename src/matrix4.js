//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "./main.js";

/**
 * A 4x4 matrix. Mostly used as transformation matrix for 3d calculations. 
 * The matrix is a D3D style matrix, row major with translations in the 4th row.
 * @constructor
 * @public
 * @class A 4x4 matrix, mostly used as transformation matrix for 3d calculations.
 * @param {Boolean} bMakeIdentity If set to true, the matrix will initially have stored the identity matrix.
 */
export class Matrix4 {
	constructor(bMakeIdentity) {
		if (bMakeIdentity == null)
			bMakeIdentity = true;

		this.m00 = 0;
		this.m01 = 0;
		this.m02 = 0;
		this.m03 = 0;
		this.m04 = 0;
		this.m05 = 0;
		this.m06 = 0;
		this.m07 = 0;
		this.m08 = 0;
		this.m09 = 0;
		this.m10 = 0;
		this.m11 = 0;
		this.m12 = 0;
		this.m13 = 0;
		this.m14 = 0;
		this.m15 = 0;

		this.bIsIdentity = false;

		if (bMakeIdentity) {
			this.m00 = 1;
			this.m05 = 1;
			this.m10 = 1;
			this.m15 = 1;
			this.bIsIdentity = true;
		}
	}
	/**
	 * Makes this matrix the identitiy matrix
	 * @public
	 */
	makeIdentity() {
		this.m00 = 1; this.m01 = 0; this.m02 = 0; this.m03 = 0;
		this.m04 = 0; this.m05 = 1; this.m06 = 0; this.m07 = 0;
		this.m08 = 0; this.m09 = 0; this.m10 = 1; this.m11 = 0;
		this.m12 = 0; this.m13 = 0; this.m14 = 0; this.m15 = 1;
		this.bIsIdentity = true;
	}
	/**
	 * Returns if this matrix is the identity matrix
	 * @public
	 */
	isIdentity() {
		if (this.bIsIdentity)
			return true;

		this.bIsIdentity = (CL3D.isone(this.m00) && CL3D.iszero(this.m01) && CL3D.iszero(this.m02) && CL3D.iszero(this.m03) &&
			CL3D.iszero(this.m04) && CL3D.isone(this.m05) && CL3D.iszero(this.m06) && CL3D.iszero(this.m07) &&
			CL3D.iszero(this.m08) && CL3D.iszero(this.m09) && CL3D.isone(this.m10) && CL3D.iszero(this.m11) &&
			CL3D.iszero(this.m12) && CL3D.iszero(this.m13) && CL3D.iszero(this.m14) && CL3D.isone(this.m15));

		return this.bIsIdentity;
	}
	/**
	 * returns if only the translation is set in the matrix
	 * @public
	 */
	isTranslateOnly() {
		if (this.bIsIdentity)
			return true;

		return (CL3D.isone(this.m00) && CL3D.iszero(this.m01) && CL3D.iszero(this.m02) && CL3D.iszero(this.m03) &&
			CL3D.iszero(this.m04) && CL3D.isone(this.m05) && CL3D.iszero(this.m06) && CL3D.iszero(this.m07) &&
			CL3D.iszero(this.m08) && CL3D.iszero(this.m09) && CL3D.isone(this.m10) && CL3D.iszero(this.m11) &&
			CL3D.isone(this.m15));
	}
	/**
	 * Returns if this matrix equals another matrix, uses {@link CL3D.equals} as comparison operator.
	 * @public
	 */
	equals(mat) {
		return CL3D.equals(this.m00, mat.m00) &&
			CL3D.equals(this.m01, mat.m01) &&
			CL3D.equals(this.m02, mat.m02) &&
			CL3D.equals(this.m03, mat.m03) &&
			CL3D.equals(this.m04, mat.m04) &&
			CL3D.equals(this.m05, mat.m05) &&
			CL3D.equals(this.m06, mat.m06) &&
			CL3D.equals(this.m07, mat.m07) &&
			CL3D.equals(this.m08, mat.m08) &&
			CL3D.equals(this.m09, mat.m09) &&
			CL3D.equals(this.m10, mat.m10) &&
			CL3D.equals(this.m11, mat.m11) &&
			CL3D.equals(this.m12, mat.m12) &&
			CL3D.equals(this.m13, mat.m13) &&
			CL3D.equals(this.m14, mat.m14) &&
			CL3D.equals(this.m15, mat.m15);
	}
	/**
	 * Returns the translation stored in the matrix as 3d vector
	 * @returns {CL3D.Vect3d} translation vector
	 * @public
	 */
	getTranslation() {
		return new CL3D.Vect3d(this.m12, this.m13, this.m14);
	}
	/**
	 * Returns the scle stored in the matrix as 3d vector
	 * @returns {CL3D.Vect3d} scale vector
	 * @public
	 */
	getScale() {
		return new CL3D.Vect3d(this.m00, this.m05, this.m10);
	}
	/**
	 * Rotates a 3d vector by this matrix.
	 * @public
	 */
	rotateVect(v) {
		var tmp = v.clone();
		v.X = tmp.X * this.m00 + tmp.Y * this.m04 + tmp.Z * this.m08;
		v.Y = tmp.X * this.m01 + tmp.Y * this.m05 + tmp.Z * this.m09;
		v.Z = tmp.X * this.m02 + tmp.Y * this.m06 + tmp.Z * this.m10;
	}
	/**
	 * Rotates an input vector and stores the result in the output paramter
	 * @public
	 */
	rotateVect2(out, inp) {
		out.X = inp.X * this.m00 + inp.Y * this.m04 + inp.Z * this.m08;
		out.Y = inp.X * this.m01 + inp.Y * this.m05 + inp.Z * this.m09;
		out.Z = inp.X * this.m02 + inp.Y * this.m06 + inp.Z * this.m10;
	}
	/**
	 * Rotate a vector by the inverse of the rotation part of this matrix.
	 * @public
	 */
	inverseRotateVect(v) {
		var tmp = v.clone();
		v.X = tmp.X * this.m00 + tmp.Y * this.m01 + tmp.Z * this.m02;
		v.Y = tmp.X * this.m04 + tmp.Y * this.m05 + tmp.Z * this.m06;
		v.Z = tmp.X * this.m08 + tmp.Y * this.m09 + tmp.Z * this.m10;
	}
	/**
	 * Returns a new vector, rotated from the input vector by this matrix
	 * @public
	 */
	getRotatedVect(v) {
		return new CL3D.Vect3d(v.X * this.m00 + v.Y * this.m04 + v.Z * this.m08,
			v.X * this.m01 + v.Y * this.m05 + v.Z * this.m09,
			v.X * this.m02 + v.Y * this.m06 + v.Z * this.m10);
	}
	/**
	 * returns a new transformed vector from the input vector
	 * @public
	 */
	getTransformedVect(v) {
		return new CL3D.Vect3d(v.X * this.m00 + v.Y * this.m04 + v.Z * this.m08 + this.m12,
			v.X * this.m01 + v.Y * this.m05 + v.Z * this.m09 + this.m13,
			v.X * this.m02 + v.Y * this.m06 + v.Z * this.m10 + this.m14);
	}
	/**
	 * Transforms the input vector by this matrix
	 * @public
	 */
	transformVect(v) {
		var tmpx = v.X * this.m00 + v.Y * this.m04 + v.Z * this.m08 + this.m12;
		var tmpy = v.X * this.m01 + v.Y * this.m05 + v.Z * this.m09 + this.m13;
		var tmpz = v.X * this.m02 + v.Y * this.m06 + v.Z * this.m10 + this.m14;

		v.X = tmpx;
		v.Y = tmpy;
		v.Z = tmpz;
	}
	/**
	 * Transforms the input vector by this matrix and stores the result in the ouput parameter
	 * @public
	 */
	transformVect2(out, inp) {
		out.X = inp.X * this.m00 + inp.Y * this.m04 + inp.Z * this.m08 + this.m12;
		out.Y = inp.X * this.m01 + inp.Y * this.m05 + inp.Z * this.m09 + this.m13;
		out.Z = inp.X * this.m02 + inp.Y * this.m06 + inp.Z * this.m10 + this.m14;
	}
	/**
	 * Translates a input vector by this matrix and returns it as new vector.
	 * @public
	 */
	getTranslatedVect(v) {
		return new CL3D.Vect3d(v.X + this.m12,
			v.Y + this.m13,
			v.Z + this.m14);
	}
	/**
	 * Translates a vector by this matrix
	 * @public
	 */
	translateVect(v) {
		v.X = v.X + this.m12;
		v.Y = v.Y + this.m13;
		v.Z = v.Z + this.m14;
	}
	/**
	 * Transforms a 3d plane by this matrix
	 * @public
	 */
	transformPlane(plane) {
		// this works with all matrices except those with a scale:

		/*var member = plane.getMemberPoint();
		transformVect(member);
	    
		var origin = new CL3D.Vect3d();
		transformVect(plane.Normal);
		transformVect(origin);
    
		plane.Normal = plane.Normal.substract(origin);
		plane.D = - member.dotProduct(plane.Normal);
	    
		plane.Normal.normalize();*/
		// this works as well, bit without scale:
		/*var member = plane.getMemberPoint();
		transformVect(member);
	    
		var normal = plane.Normal.clone();
		rotateVect(normal);
	    
		plane.setPlane(member, normal);*/
		var member = plane.getMemberPoint();

		// Fully transform the plane member point, i.e. rotate, translate and scale it.
		this.transformVect(member);

		var normal = plane.Normal.clone();
		normal.normalize();

		// The normal needs to be rotated and inverse scaled, but not translated.
		var scale = this.getScale();

		if (!CL3D.equals(scale.X, 0.0) && !CL3D.equals(scale.Y, 0.0) && !CL3D.equals(scale.Z, 0.0)
			&& (!CL3D.equals(scale.X, 1.0) || !CL3D.equals(scale.Y, 1.0) || !CL3D.equals(scale.Z, 1.0))) {
			// Rotating the vector will also apply the scale, so we have to invert it twice.
			normal.X *= 1.0 / (scale.X * scale.X);
			normal.Y *= 1.0 / (scale.Y * scale.Y);
			normal.Z *= 1.0 / (scale.Z * scale.Z);
		}

		this.rotateVect(normal);

		normal.normalize();
		plane.setPlane(member, normal);
	}
	/**
	 * Multiplies this matrix with another matrix, returns the result as a new matrix.
	 * @public
	 */
	multiply(m2) {
		var mat = new CL3D.Matrix4(false);

		if (this.bIsIdentity) {
			m2.copyTo(mat);
			return mat;
		}

		if (m2.bIsIdentity) {
			this.copyTo(mat);
			return mat;
		}

		mat.m00 = this.m00 * m2.m00 + this.m04 * m2.m01 + this.m08 * m2.m02 + this.m12 * m2.m03;
		mat.m01 = this.m01 * m2.m00 + this.m05 * m2.m01 + this.m09 * m2.m02 + this.m13 * m2.m03;
		mat.m02 = this.m02 * m2.m00 + this.m06 * m2.m01 + this.m10 * m2.m02 + this.m14 * m2.m03;
		mat.m03 = this.m03 * m2.m00 + this.m07 * m2.m01 + this.m11 * m2.m02 + this.m15 * m2.m03;

		mat.m04 = this.m00 * m2.m04 + this.m04 * m2.m05 + this.m08 * m2.m06 + this.m12 * m2.m07;
		mat.m05 = this.m01 * m2.m04 + this.m05 * m2.m05 + this.m09 * m2.m06 + this.m13 * m2.m07;
		mat.m06 = this.m02 * m2.m04 + this.m06 * m2.m05 + this.m10 * m2.m06 + this.m14 * m2.m07;
		mat.m07 = this.m03 * m2.m04 + this.m07 * m2.m05 + this.m11 * m2.m06 + this.m15 * m2.m07;

		mat.m08 = this.m00 * m2.m08 + this.m04 * m2.m09 + this.m08 * m2.m10 + this.m12 * m2.m11;
		mat.m09 = this.m01 * m2.m08 + this.m05 * m2.m09 + this.m09 * m2.m10 + this.m13 * m2.m11;
		mat.m10 = this.m02 * m2.m08 + this.m06 * m2.m09 + this.m10 * m2.m10 + this.m14 * m2.m11;
		mat.m11 = this.m03 * m2.m08 + this.m07 * m2.m09 + this.m11 * m2.m10 + this.m15 * m2.m11;

		mat.m12 = this.m00 * m2.m12 + this.m04 * m2.m13 + this.m08 * m2.m14 + this.m12 * m2.m15;
		mat.m13 = this.m01 * m2.m12 + this.m05 * m2.m13 + this.m09 * m2.m14 + this.m13 * m2.m15;
		mat.m14 = this.m02 * m2.m12 + this.m06 * m2.m13 + this.m10 * m2.m14 + this.m14 * m2.m15;
		mat.m15 = this.m03 * m2.m12 + this.m07 * m2.m13 + this.m11 * m2.m14 + this.m15 * m2.m15;

		return mat;
	}
	/**
	 * Multiplies this matrix with a 4D Vector (expects components X, Y, Z and W), result is stored in the input vector
	 * @public
	 */
	multiplyWith1x4Matrix(v) {
		var tmp = v.clone();
		tmp.W = v['W'];

		v.X = tmp.X * this.m00 + tmp.Y * this.m04 + tmp.Z * this.m08 + tmp.W * this.m12;
		v.Y = tmp.X * this.m01 + tmp.Y * this.m05 + tmp.Z * this.m09 + tmp.W * this.m13;
		v.Z = tmp.X * this.m02 + tmp.Y * this.m06 + tmp.Z * this.m10 + tmp.W * this.m14;
		v['W'] = tmp.X * this.m03 + tmp.Y * this.m07 + tmp.Z * this.m11 + tmp.W * this.m15;
	}
	/**
	 * same as multiplyWith1x4Matrix, but faster and returns w as value
	 * @public
	 */
	multiplyWith1x4Matrix2(v) {
		var tmpX = v.X;
		var tmpY = v.Y;
		var tmpZ = v.Z;

		v.X = tmpX * this.m00 + tmpY * this.m04 + tmpZ * this.m08 + this.m12;
		v.Y = tmpX * this.m01 + tmpY * this.m05 + tmpZ * this.m09 + this.m13;
		v.Z = tmpX * this.m02 + tmpY * this.m06 + tmpZ * this.m10 + this.m14;

		return tmpX * this.m03 + tmpY * this.m07 + tmpZ * this.m11 + this.m15;
	}
	/**
	 * Copies the inverse of this matrix into the output matrix, returns true succcessful.
	 * @public
	 */
	getInverse(out) {
		if (this.bIsIdentity) {
			this.copyTo(out);
			return true;
		}

		var d = (this.m00 * this.m05 - this.m01 * this.m04) * (this.m10 * this.m15 - this.m11 * this.m14) -
			(this.m00 * this.m06 - this.m02 * this.m04) * (this.m09 * this.m15 - this.m11 * this.m13) +
			(this.m00 * this.m07 - this.m03 * this.m04) * (this.m09 * this.m14 - this.m10 * this.m13) +
			(this.m01 * this.m06 - this.m02 * this.m05) * (this.m08 * this.m15 - this.m11 * this.m12) -
			(this.m01 * this.m07 - this.m03 * this.m05) * (this.m08 * this.m14 - this.m10 * this.m12) +
			(this.m02 * this.m07 - this.m03 * this.m06) * (this.m08 * this.m13 - this.m09 * this.m12);

		if (d > -0.0000001 && d < 0.0000001)
			return false;

		d = 1.0 / d;

		out.m00 = d * (this.m05 * (this.m10 * this.m15 - this.m11 * this.m14) + this.m06 * (this.m11 * this.m13 - this.m09 * this.m15) + this.m07 * (this.m09 * this.m14 - this.m10 * this.m13));
		out.m01 = d * (this.m09 * (this.m02 * this.m15 - this.m03 * this.m14) + this.m10 * (this.m03 * this.m13 - this.m01 * this.m15) + this.m11 * (this.m01 * this.m14 - this.m02 * this.m13));
		out.m02 = d * (this.m13 * (this.m02 * this.m07 - this.m03 * this.m06) + this.m14 * (this.m03 * this.m05 - this.m01 * this.m07) + this.m15 * (this.m01 * this.m06 - this.m02 * this.m05));
		out.m03 = d * (this.m01 * (this.m07 * this.m10 - this.m06 * this.m11) + this.m02 * (this.m05 * this.m11 - this.m07 * this.m09) + this.m03 * (this.m06 * this.m09 - this.m05 * this.m10));
		out.m04 = d * (this.m06 * (this.m08 * this.m15 - this.m11 * this.m12) + this.m07 * (this.m10 * this.m12 - this.m08 * this.m14) + this.m04 * (this.m11 * this.m14 - this.m10 * this.m15));
		out.m05 = d * (this.m10 * (this.m00 * this.m15 - this.m03 * this.m12) + this.m11 * (this.m02 * this.m12 - this.m00 * this.m14) + this.m08 * (this.m03 * this.m14 - this.m02 * this.m15));
		out.m06 = d * (this.m14 * (this.m00 * this.m07 - this.m03 * this.m04) + this.m15 * (this.m02 * this.m04 - this.m00 * this.m06) + this.m12 * (this.m03 * this.m06 - this.m02 * this.m07));
		out.m07 = d * (this.m02 * (this.m07 * this.m08 - this.m04 * this.m11) + this.m03 * (this.m04 * this.m10 - this.m06 * this.m08) + this.m00 * (this.m06 * this.m11 - this.m07 * this.m10));
		out.m08 = d * (this.m07 * (this.m08 * this.m13 - this.m09 * this.m12) + this.m04 * (this.m09 * this.m15 - this.m11 * this.m13) + this.m05 * (this.m11 * this.m12 - this.m08 * this.m15));
		out.m09 = d * (this.m11 * (this.m00 * this.m13 - this.m01 * this.m12) + this.m08 * (this.m01 * this.m15 - this.m03 * this.m13) + this.m09 * (this.m03 * this.m12 - this.m00 * this.m15));
		out.m10 = d * (this.m15 * (this.m00 * this.m05 - this.m01 * this.m04) + this.m12 * (this.m01 * this.m07 - this.m03 * this.m05) + this.m13 * (this.m03 * this.m04 - this.m00 * this.m07));
		out.m11 = d * (this.m03 * (this.m05 * this.m08 - this.m04 * this.m09) + this.m00 * (this.m07 * this.m09 - this.m05 * this.m11) + this.m01 * (this.m04 * this.m11 - this.m07 * this.m08));
		out.m12 = d * (this.m04 * (this.m10 * this.m13 - this.m09 * this.m14) + this.m05 * (this.m08 * this.m14 - this.m10 * this.m12) + this.m06 * (this.m09 * this.m12 - this.m08 * this.m13));
		out.m13 = d * (this.m08 * (this.m02 * this.m13 - this.m01 * this.m14) + this.m09 * (this.m00 * this.m14 - this.m02 * this.m12) + this.m10 * (this.m01 * this.m12 - this.m00 * this.m13));
		out.m14 = d * (this.m12 * (this.m02 * this.m05 - this.m01 * this.m06) + this.m13 * (this.m00 * this.m06 - this.m02 * this.m04) + this.m14 * (this.m01 * this.m04 - this.m00 * this.m05));
		out.m15 = d * (this.m00 * (this.m05 * this.m10 - this.m06 * this.m09) + this.m01 * (this.m06 * this.m08 - this.m04 * this.m10) + this.m02 * (this.m04 * this.m09 - this.m05 * this.m08));

		out.bIsIdentity = this.bIsIdentity;

		return true;
	}
	/**
	 * Inverts this matrix, returns true if successful
	 * @public
	 */
	makeInverse() {
		var mat = new CL3D.Matrix4(false);
		if (this.getInverse(mat)) {
			mat.copyTo(this);
			return true;
		}

		return false;
	}
	/**
	 * Returns a transposed version of this matrix
	 * @public
	 */
	getTransposed() {
		var mat = new CL3D.Matrix4(false);
		mat.m00 = this.m00;
		mat.m01 = this.m04;
		mat.m02 = this.m08;
		mat.m03 = this.m12;

		mat.m04 = this.m01;
		mat.m05 = this.m05;
		mat.m06 = this.m09;
		mat.m07 = this.m13;

		mat.m08 = this.m02;
		mat.m09 = this.m06;
		mat.m10 = this.m10;
		mat.m11 = this.m14;

		mat.m12 = this.m03;
		mat.m13 = this.m07;
		mat.m14 = this.m11;
		mat.m15 = this.m15;

		mat.bIsIdentity = this.bIsIdentity;

		return mat;
	}
	/**
	 * Returns the content of this matrix as array
	 * @public
	 * @returns {Array} array of this matrix.
	 */
	asArray() {
		return [
			this.m00, this.m01, this.m02, this.m03,
			this.m04, this.m05, this.m06, this.m07,
			this.m08, this.m09, this.m10, this.m11,
			this.m12, this.m13, this.m14, this.m15
		];
	}
	/**
	 * Sets a value of the matrix by index
	 * @param i Index in the matrix, a value between 0 and 15
	 * @param n Value to set
	 * @public
	 */
	setByIndex(i, n) {
		this.bIsIdentity = false;

		switch (i) {
			case 0: this.m00 = n; break;
			case 1: this.m01 = n; break;
			case 2: this.m02 = n; break;
			case 3: this.m03 = n; break;
			case 4: this.m04 = n; break;
			case 5: this.m05 = n; break;
			case 6: this.m06 = n; break;
			case 7: this.m07 = n; break;
			case 8: this.m08 = n; break;
			case 9: this.m09 = n; break;
			case 10: this.m10 = n; break;
			case 11: this.m11 = n; break;
			case 12: this.m12 = n; break;
			case 13: this.m13 = n; break;
			case 14: this.m14 = n; break;
			case 15: this.m15 = n; break;
		}
	}
	/**
	 * Creates a clone of this matrix
	 * @public
	 */
	clone() {
		var m = new CL3D.Matrix4(false);
		this.copyTo(m);
		return m;
	}
	/**
	 * Copies the content of this matrix to a target matrix
	 * @public
	 */
	copyTo(mat) {
		mat.m00 = this.m00; mat.m01 = this.m01; mat.m02 = this.m02; mat.m03 = this.m03;
		mat.m04 = this.m04; mat.m05 = this.m05; mat.m06 = this.m06; mat.m07 = this.m07;
		mat.m08 = this.m08; mat.m09 = this.m09; mat.m10 = this.m10; mat.m11 = this.m11;
		mat.m12 = this.m12; mat.m13 = this.m13; mat.m14 = this.m14; mat.m15 = this.m15;
		mat.bIsIdentity = this.bIsIdentity;
	}
	/**
	 * Builds a left-handed perspective projection matrix based on a field of view.
	 * @public
	 */
	buildProjectionMatrixPerspectiveFovLH(fieldOfViewRadians,
		aspectRatio, zNear, zFar) {
		var h = 1.0 / Math.tan(fieldOfViewRadians / 2.0);
		var w = (h / aspectRatio);

		this.m00 = w;
		this.m01 = 0;
		this.m02 = 0;
		this.m03 = 0;

		this.m04 = 0;
		this.m05 = h;
		this.m06 = 0;
		this.m07 = 0;

		this.m08 = 0;
		this.m09 = 0;
		this.m10 = (zFar / (zFar - zNear));
		this.m11 = 1;

		this.m12 = 0;
		this.m13 = 0;
		this.m14 = (-zNear * zFar / (zFar - zNear));
		this.m15 = 0;

		this.bIsIdentity = false;
	}
	/**
	 * Builds a left-handed orthogonal projection matrix.
	 * @public
	 */
	buildProjectionMatrixPerspectiveOrthoLH(widthOfViewVolume, heightOfViewVolume,
		zNear, zFar) {
		this.m00 = 2.0 / widthOfViewVolume;
		this.m01 = 0;
		this.m02 = 0;
		this.m03 = 0;

		this.m04 = 0;
		this.m05 = 2.0 / heightOfViewVolume;
		this.m06 = 0;
		this.m07 = 0;

		this.m08 = 0;
		this.m09 = 0;
		this.m10 = 1.0 / (zFar - zNear);
		this.m11 = 0;

		this.m12 = 0;
		this.m13 = 0;
		this.m14 = (zNear / (zNear - zFar));
		this.m15 = 1;

		this.bIsIdentity = false;
	}
	/**
	 * Builds a left-handed orthogonal projection matrix.
	 * @public
	 */
	buildProjectionMatrixPerspectiveOrthoRH(widthOfViewVolume, heightOfViewVolume,
		zNear, zFar) {
		this.m00 = 2.0 / widthOfViewVolume;
		this.m01 = 0;
		this.m02 = 0;
		this.m03 = 0;

		this.m04 = 0;
		this.m05 = 2.0 / heightOfViewVolume;
		this.m06 = 0;
		this.m07 = 0;

		this.m08 = 0;
		this.m09 = 0;
		this.m10 = 1.0 / (zNear - zFar);
		this.m11 = 0;

		this.m12 = 0;
		this.m13 = 0;
		this.m14 = (zNear / (zNear - zFar));
		this.m15 = 1;

		this.bIsIdentity = false;
	}
	/**
	 * Builds a left-handed look-at matrix.
	 * @public
	 */
	buildCameraLookAtMatrixLH(position, target, upVector) {
		var zaxis = target.substract(position);
		zaxis.normalize();

		var xaxis = upVector.crossProduct(zaxis);
		xaxis.normalize();

		var yaxis = zaxis.crossProduct(xaxis);

		this.m00 = xaxis.X;
		this.m01 = yaxis.X;
		this.m02 = zaxis.X;
		this.m03 = 0;

		this.m04 = xaxis.Y;
		this.m05 = yaxis.Y;
		this.m06 = zaxis.Y;
		this.m07 = 0;

		this.m08 = xaxis.Z;
		this.m09 = yaxis.Z;
		this.m10 = zaxis.Z;
		this.m11 = 0;

		this.m12 = -xaxis.dotProduct(position);
		this.m13 = -yaxis.dotProduct(position);
		this.m14 = -zaxis.dotProduct(position);
		this.m15 = 1;

		this.bIsIdentity = false;
	}
	/**
	 * Make a rotation matrix from Euler angles. The 4th row and column are unmodified.
	 * @public
	 * @param {CL3D.Vect3d} v rotation vector
	 */
	setRotationDegrees(v) {
		this.setRotationRadians(v.multiplyWithScal(CL3D.DEGTORAD));
	}
	/**
	 * Make a rotation matrix from Euler angles. The 4th row and column are unmodified.
	 * @public
	 * @param {CL3D.Vect3d} rotation rotation vector
	 */
	setRotationRadians(rotation) {
		var cr = Math.cos(rotation.X);
		var sr = Math.sin(rotation.X);
		var cp = Math.cos(rotation.Y);
		var sp = Math.sin(rotation.Y);
		var cy = Math.cos(rotation.Z);
		var sy = Math.sin(rotation.Z);

		this.m00 = (cp * cy);
		this.m01 = (cp * sy);
		this.m02 = (-sp);

		var srsp = sr * sp;
		var crsp = cr * sp;

		this.m04 = (srsp * cy - cr * sy);
		this.m05 = (srsp * sy + cr * cy);
		this.m06 = (sr * cp);

		this.m08 = (crsp * cy + sr * sy);
		this.m09 = (crsp * sy - sr * cy);
		this.m10 = (cr * cp);

		this.bIsIdentity = false;
	}
	/**
	 * Returns the rotation, as set by setRotation().
	 * Returns a rotation that is equivalent to that set by setRotationDegrees().
	 * @public
	 * @returns {CL3D.Vect3d} rotation vector
	 */
	getRotationDegrees() {
		var Y = -Math.asin(this.m02);
		var C = Math.cos(Y);
		Y *= CL3D.RADTODEG;

		var rotx;
		var roty;
		var X;
		var Z;

		if (Math.abs(C) > 0.00000001) {
			var invC = (1.0 / C);
			rotx = this.m10 * invC;
			roty = this.m06 * invC;
			X = Math.atan2(roty, rotx) * CL3D.RADTODEG;
			rotx = this.m00 * invC;
			roty = this.m01 * invC;
			Z = Math.atan2(roty, rotx) * CL3D.RADTODEG;
		}

		else {
			X = 0.0;
			rotx = this.m05;
			roty = -this.m04;
			Z = Math.atan2(roty, rotx) * CL3D.RADTODEG;
		}

		// fix values that get below zero
		// before it would set (!) values to 360
		// that where above 360:
		if (X < 0.0) X += 360.0;
		if (Y < 0.0) Y += 360.0;
		if (Z < 0.0) Z += 360.0;

		return new CL3D.Vect3d(X, Y, Z);
	}
	/**
	 * Set the translation of the current matrix. Will erase any previous values.
	 * @public
	 * @param {CL3D.Vect3d} v translation vector
	 */
	setTranslation(v) {
		this.m12 = v.X;
		this.m13 = v.Y;
		this.m14 = v.Z;

		this.bIsIdentity = false;
	}
	/**
	 * Sets the scale of the matrix
	 * @param {CL3D.Vect3d} v translation vector
	 * @public
	 */
	setScale(v) {
		this.m00 = v.X;
		this.m05 = v.Y;
		this.m10 = v.Z;

		this.bIsIdentity = false;
	}
	/**
	 * Sets the scale of the matrix
	 * @public
	 */
	setScaleXYZ(x, y, z) {
		this.m00 = x;
		this.m05 = y;
		this.m10 = z;

		this.bIsIdentity = false;
	}
	/**
	 * Transforms a 3d box
	 * @param {CL3D.Box3d} box
	 */
	transformBoxEx(box) {
		var edges = box.getEdges();

		var i;
		for (i = 0; i < 8; ++i)
			this.transformVect(edges[i]);

		var v = edges[0];
		box.MinEdge = v.clone();
		box.MaxEdge = v.clone();

		for (i = 1; i < 8; ++i)
			box.addInternalPointByVector(edges[i]);
	}
	/**
	 * Transforms a 3d box with another method which is more exact than transformBoxEx
	 * @param {CL3D.Box3d} box
	 */
	transformBoxEx2(box) {
		var Amin = [box.MinEdge.X, box.MinEdge.Y, box.MinEdge.Z];
		var Amax = [box.MaxEdge.X, box.MaxEdge.Y, box.MaxEdge.Z];

		var Bmin = [this.m12, this.m13, this.m14];
		var Bmax = [this.m12, this.m13, this.m14];

		var asarr = this.asArray();

		for (var i = 0; i < 3; ++i) {
			for (var j = 0; j < 3; ++j) {
				var mv = asarr[j * 4 + i];
				var a = mv * Amin[j];
				var b = mv * Amax[j];

				if (a < b) {
					Bmin[i] += a;
					Bmax[i] += b;
				}

				else {
					Bmin[i] += b;
					Bmax[i] += a;
				}
			}
		}

		box.MinEdge.X = Bmin[0];
		box.MinEdge.Y = Bmin[1];
		box.MinEdge.Z = Bmin[2];

		box.MaxEdge.X = Bmax[0];
		box.MaxEdge.Y = Bmax[1];
		box.MaxEdge.Z = Bmax[2];
	}
	/**
	 * Returns a string representation of this matrix.
	 * @public
	 */
	toString() {
		return this.m00 + " " + this.m01 + " " + this.m02 + " " + this.m03 + "\n" +
			this.m04 + " " + this.m05 + " " + this.m06 + " " + this.m07 + "\n" +
			this.m08 + " " + this.m09 + " " + this.m10 + " " + this.m11 + "\n" +
			this.m12 + " " + this.m13 + " " + this.m14 + " " + this.m15;
	}
}
