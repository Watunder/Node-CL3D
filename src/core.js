//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

/*
 * This file Contains basic helper functions to convert between angles, finding minima and maxima of numbers and similar
 */

/** 
 * @const 
 * @private
 * The value PI
 */
export var PI = 3.14159265359;

/** 
 * @const 
 * @private
 * reciprocal PI value
 */
export var RECIPROCAL_PI = 1.0 / 3.14159265359;

/** 
 * @const 
 * @private
 * Half of PI
 */
export var HALF_PI = 3.14159265359 / 2.0;

/** 
 * @const 
 * @private
 * Hih precision PI value
 */
export var PI64 = 3.1415926535897932384626433832795028841971693993751;

/** 
 * @const 
 * @private
 * Value to convert degrees to grad. Use {@link degToRad} to do this.
 */
export var DEGTORAD = 3.14159265359 / 180.0;

/** 
 * @const 
 * @private
 */
export var RADTODEG = 180.0 / 3.14159265359;

/** 
 * Low tolerance value deciding which floating point values are considered equal.
 * @const 
 */
export var TOLERANCE = 0.00000001;



/** 
 * Converts an angle from radians to degrees. 
 */
export var radToDeg = function (radians) {
	return radians * RADTODEG;
};


/** 
 * Converts an angle from degrees to radians.
 */
export var degToRad = function (deg) {
	return deg * DEGTORAD;
}

/** 
 * Returns if a floating point value is considered similar to 0, depending on {@link TOLERANCE}.
 */
export var iszero = function (a) {
	return (a < 0.00000001) && (a > -0.00000001);
}

/** 
 * Returns if a floating point value is considered similar to 0, depending on {@link TOLERANCE}.
 */
export var isone = function (a) {
	return (a + 0.00000001 >= 1) && (a - 0.00000001 <= 1);
}

/** 
 * Returns if two floating point values are considered similar, depending on {@link TOLERANCE}.
 */
export var equals = function (a, b) {
	return (a + 0.00000001 >= b) && (a - 0.00000001 <= b);
}


/** 
 * Returns a new value which is clamped between low and high. 
 */
export var clamp = function (n, low, high) {
	if (n < low)
		return low;

	if (n > high)
		return high;

	return n;
}

/** 
 * Returns the fraction part of a floating point value. Given for example 6.788, this would return 0.788.
 */
export var fract = function (n) {
	return n - Math.floor(n);
}

/** 
 * Returns the maximum value of 3 input values.
 */
export var max3 = function (a, b, c) {
	if (a > b) {
		if (a > c)
			return a;

		return c;
	}

	if (b > c)
		return b;

	return c;
}

/** 
 * Returns the minimum of 3 input values. 
 */
export var min3 = function (a, b, c) {
	if (a < b) {
		if (a < c)
			return a;

		return c;
	}

	if (b < c)
		return b;

	return c;
}

/**
 * Returns the alpha component of a color compressed into one 32bit integer value
 * @param {Number} clr color
 * @returns {Number} color component value, a value between 0 and 255  
 */
export var getAlpha = function (clr) {
	return ((clr & 0xFF000000) >>> 24);
}

/**
 * Returns the red component of a color compressed into one 32bit integer value
 * @param clr {Number} color
 * @returns {Number} color component value, a value between 0 and 255  
 */
export var getRed = function (clr) {
	return ((clr & 0x00FF0000) >> 16);
}

/**
 * Returns the green component of a color compressed into one 32bit integer value
 * @param clr {Number} color
 * @returns {Number} color component value, a value between 0 and 255   
 */
export var getGreen = function (clr) {
	return ((clr & 0x0000FF00) >> 8);
}

/**
 * Returns the blue component of a color compressed into one 32bit integer value
 * @param clr {Number} 32 bit color
 * @returns {Number} color component value, a value between 0 and 255  
 */
export var getBlue = function (clr) {
	return ((clr & 0x000000FF));
}

/**
 * Creates a 32bit value representing a color
 * @param a {Number} Alpha component of the color (value between 0 and 255)
 * @param r {Number} Red component of the color (value between 0 and 255)
 * @param g {Number} Green component of the color (value between 0 and 255)
 * @param b {Number} Blue component of the color (value between 0 and 255)
 * @returns {Number} 32 bit color 
 */
export var createColor = function (a, r, g, b) {
	a = a & 0xff;
	r = r & 0xff;
	g = g & 0xff;
	b = b & 0xff;

	return (a << 24) | (r << 16) | (g << 8) | b;
}


/**
 * Creates a export var ColorF from 32bit value representing a color
 */
export var createColorF = function(c) {
	var r = new ColorF();
	r.A = getAlpha(c) / 255.0;
	r.R = getRed(c) / 255.0;
	r.G = getGreen(c) / 255.0;
	r.B = getBlue(c) / 255.0;
	return r;
}

export var convertIntColor = function (c) {
	var a = (c >> 24) & 255.0;
	var r = (c >> 16) & 255.0;
	var g = (c >> 8) & 255.0;
	var b = (c) & 255.0;
	return { r: r, g: g, b: b, a: a };
}

/**
 * @private
 */
export var getInterpolatedColor = function (clr1, clr2, f) {
	var invf = 1.0 - f;

	return createColor(
		getAlpha(clr1) * f + getAlpha(clr2) * invf,
		getRed(clr1) * f + getRed(clr2) * invf,
		getGreen(clr1) * f + getGreen(clr2) * invf,
		getBlue(clr1) * f + getBlue(clr2) * invf);
}

/**
 * @private
 */
export var sgn = function (a) {
	if (a > 0.0)
		return 1.0;

	if (a < 0.0)
		return -1.0;

	return 0.0;
}

/**
 * A class holding a floating point color, consisting of four Numbers, for r, g, b and alpha
 * @constructor
 * @class A class holding a floating point color, consisting of four Numbers, for r, g, b and alpha
 */
/**
 * A class holding a floating point color, consisting of four Numbers, for r, g, b and alpha
 * @constructor
 * @class A class holding a floating point color, consisting of four Numbers, for r, g, b and alpha
 */
export class ColorF {
	/**
	 * alpha value of the color
	 * @public
	 * @type Number
	 */
	A = 1.0;

	/**
	 * red value of the color
	 * @public
	 * @type Number
	 */
	R = 1.0;

	/**
	 * green value of the color
	 * @public
	 * @type Number
	 */
	G = 1.0;

	/**
	 * blue value of the color
	 * @public
	 * @type Number
	 */
	B = 1.0;

	constructor() {
		this.A = 1.0;
		this.R = 1.0;
		this.G = 1.0;
		this.B = 1.0;
	}

	/**
	 * Creates a copy of this color
	 * @public
	 */
	clone = function () {
		var r = new ColorF();
		r.A = this.A;
		r.R = this.R;
		r.G = this.G;
		r.B = this.B;
		return r;
	}

}

/** 
 * @public
 * Global flag toggling if shadow maps should be rendered using a shadow map cascade or a single map.
 * This needs to be set before initialiting the engine.
 */
export var UseShadowCascade = true;

/** 
 * @private
 * Global flag disabling post effects if hardware or browser is not capable of doing them.
 */
export var Global_PostEffectsDisabled = false;
