//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "./main.js";
import Canvas from "canvas";

/**
 * Texture manager containing all {@link Texture}s and able to load new ones, accessible via {@link CopperLicht.getTextureManager}().
 * @constructor
 * @class texture manager containing all {@link Texture}s and able to load new ones, accessible via {@link CopperLicht.getTextureManager}().
 * @public
 */
export class TextureManager {
	constructor() {
		this.Textures = new Array(); // texure
		this.TheRenderer = null;
		this.PathRoot = '';
	}
	/**
	 * Returns a new CL3D.Texture object from an URL and starts loading it.
	 * If the texture has been already loaded, it doesn't load it a second time but returns the
	 * reference to the old texture.
	 * @public
	 * @param url {String} Url of the image. Can be relative like 'path/to/image/mytexture.jpg' or absolute like 'http://www.ambiera.com/images/ambiera_logo_big.png'
	 * @param createIfNotFound {Boolean} set to true to create a new CL3D.Texture object and start loading it if an existing once wasn't found with this url.
	 * @returns {CL3D.Texture} texture object
	 *
	 */
	getTexture(url, createIfNotFound) {
		if (url == null || url == "")
			return null;

		let t = this.getTextureFromName(url);

		if (t != null)
			return t;

		if (createIfNotFound) {
			t = new CL3D.Texture();
			t.Name = url;
			this.addTexture(t);

			// start loading texture
			let me = this;
			t.Image = new Canvas.Image();
			t.Image.onload = function () { me.onTextureLoaded(t); };
			t.Image.src = t.Name;

			//console.log("starting loading texture: " + t.Image.src);
			return t;
		}

		return null;
	}
	/**
	 * Returns the amount of textures
	 * @public
	 */
	getTextureCount() {
		return this.Textures.length;
	}
	/**
	 * @private
	 */
	onTextureLoaded(t) {
		//console.log("http loaded texture: " + t.Name);
		let r = this.TheRenderer;
		if (r == null)
			return;
		r.finalizeLoadedImageTexture(t);
		t.Loaded = true;
	}
	/**
	 * Returns the amount of textures which still need to be loaded
	 * @public
	 */
	getCountOfTexturesToLoad() {
		let ret = 0;

		for (let i = 0; i < this.Textures.length; ++i) {
			let t = this.Textures[i];
			if (t.Loaded == false)
				++ret;
		}

		return ret;
	}
	/**
	 * @private
	 */
	getTextureFromName(name) {
		for (let i = 0; i < this.Textures.length; ++i) {
			let t = this.Textures[i];
			if (t.Name == name)
				return t;
		}

		return null;
	}
	/**
	 * @private
	 */
	addTexture(t) {
		if (t != null) {
			if (this.getTextureFromName(t.Name) != null)
				console.log("ERROR! Cannot add the texture multiple times: " + t.Name);
			//else
			//	console.log("adding texture: " + t.Name);
			this.Textures.push(t);
		}
	}
	/**
	 * use renderer.deleteTexture instead, this is just for removing it from the list of registered textures
	 * @private
	 */
	removeTexture(tex) {
		for (let i = 0; i < this.Textures.length; ++i) {
			let t = this.Textures[i];
			if (t == tex) {
				this.Textures.splice(i, 1);
				return true;
			}
		}

		return false;
	}
}
