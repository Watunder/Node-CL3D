//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "./main.js";

/**
 * Class representing a texture which can be loaded from an URL.
 * @constructor
 * @class Class representing a texture which can be loaded from an URL.
 * @public
 */
export class Texture {
	constructor() {
		this.Name = '';
		this.Loaded = false;

		this.Image = null;
		this.Texture = null; // webgl texture object
		this.RTTFrameBuffer = null; // when used as RTT


		this.CachedWidth = null; // used if the texture was created from a 2d canvas
		this.CachedHeight = null; // used if the texture was created from a 2d canvas

		this.OriginalWidth = null; // original with of the texture, before scaling up to power of two
		this.OriginalHeight = null; // original with of the texture, before scaling up to power of two
	}
	/**
	 * returns the image of the texture
	 * @public
	 * @returns {Image}
	 */
	getImage() {
		return this.Image;
	}
	/**
	 * returns the webGL texture object of the texture, only available if the texture has been loaded already.
	 * @public
	 * @returns {CL3D.Texture}
	 */
	getWebGLTexture() {
		return this.Texture;
	}
	/**
	 * returns the width of this texture, or null if not loaded yet
	 * @public
	 * @returns {Number}
	 */
	getWidth() {
		if (this.Image)
			return this.Image.width;

		if (this.CachedWidth != null)
			return this.CachedWidth;

		return 0;
	}
	/**
	 * returns the height of this texture, or null if not loaded yet
	 * @public
	 * @returns {Number}
	 */
	getHeight() {
		if (this.Image)
			return this.Image.height;

		if (this.CachedHeight != null)
			return this.CachedHeight;

		return 0;
	}
	/**
	 * returns the URL of this texture
	 * @public
	 * @returns {String}
	 */
	getURL() {
		return this.Name;
	}
	/**
	 * returns if the texture has been sucessfully loaded
	 * @public
	 * @returns {Boolean}
	 */
	isLoaded() {
		return this.Loaded;
	}
}
