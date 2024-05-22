//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "./main.js";

/**
 * Structure describing a material with a couple of textures and several settings.
 * Simply create an instance of the material class and set the {@link Type} value to
 * one of the known material types or an own material type, created for example with 
 * {@link CopperLicht.createMaterialType}.
 * @class Material description, usually for a {@link MeshBuffer}.
 * @constructor
 * @public
 */
export class Material {
	/**
	 * Type of the material. Default value is {@link Material.EMT_SOLID}. You
	 * can set any value of the predefined materials to this type, or even create
	 * your own material types using {@link Renderer.createMaterialType}.
	 * @public
	 * @type Number
	 */
	Type = 0;

	/**
	 * Texture 1 of this material of type {@link Texture}.
	 * @public
	 * @type {CL3D.Texture}.
	 */
	Tex1 = null;

	/**
	 * Texture 2 of this material of type {@link Texture}.
	 * @public
	 * @type {CL3D.Texture}.
	 */
	Tex2 = null;

	/**
	 * Specifies if the material is allowed to write into the ZBuffer
	 * @public
	 * @type Boolean
	 */
	ZWriteEnabled = true;

	/**
	 * Specifies if the material is allowed to read from the ZBuffer (DepthTest)
	 * @public
	 * @type Boolean
	 */
	ZReadEnabled = true;

	/**
	 * Specifies if the texture wrapping is enabled or not for Texture 1.
	 * In OpenGL terms, this simply sets TEXTURE_WRAP to REPEAT or CLAMP_TO_EDGE
	 * @public
	 * @type Boolean
	 */
	ClampTexture1 = false;

	/**
	 * Specifies if backface culling is enabled for the material. Default is true.
	 * @public
	 * @type Boolean
	 */
	BackfaceCulling = true;

	/**
	 * Specifies if lighting is enabled for the material. Default is false.
	 * @public
	 * @type Boolean
	 */
	Lighting = false;


	/** 
	 * Solid material, constant for using in {@link Material.Type}, specifying the type of the material.
	 * Simply a single texture shown as diffuse material.
	 * @const 
	 * @public
	 */
	EMT_SOLID = 0;

	//Material.EMT_SOLID_2_LAYER						= 1;

	/** 
	 * Lightmapped material, constant for using in {@link Material.Type}, specifying the type of the material.
	 * There should be 2 textures: The first texture layer is a diffuse map, the second is a light map. This is 
	 * the standard lightmap technique: The lightmap is multiplied onto the first texture.
	 * @const 
	 * @public
	 */
	EMT_LIGHTMAP = 2;

	//Material.EMT_LIGHTMAP_ADD						= 3;
	//Material.EMT_LIGHTMAP_M2						= 4;
	//Material.EMT_LIGHTMAP_M4						= 5;

	//Material.EMT_LIGHTMAP_LIGHTING					= 6;
	//Material.EMT_LIGHTMAP_LIGHTING_M2				= 7;
	//Material.EMT_LIGHTMAP_LIGHTING_M4				= 8;
	//Material.EMT_DETAIL_MAP							= 9;
	//Material.EMT_SPHERE_MAP							= 10;
	//Material.EMT_REFLECTION_2_LAYER					= 11;


	/** 
	 * Reflective material for creating metallic looking survaces, constant for using in {@link Material.Type}, specifying the type of the material.
	 * There should be 2 textures: The first texture layer is a diffuse map, the second is the refleced surface.
	 * @const 
	 * @public
	 */
	EMT_REFLECTION_2_LAYER = 11;

	/** 
	 * Transparent additive material, constant for using in {@link Material.Type}, specifying the type of the material.
	 * Only the first texture is used. The new color is calculated by simply adding the source color and the destination color.
	 * This means if for example a billboard using a texture with black background and a red circle on it is drawn with this material,
	 * the result is that only the red circle will be drawn a little bit transparent, and everything which was black is 100% transparent and not visible.
	 * @const 
	 * @public
	 */
	EMT_TRANSPARENT_ADD_COLOR = 12;

	/** 
	 * Transparent material based on the texture alpha channel, constant for using in {@link Material.Type}, specifying the type of the material.
	 * The final color is blended together from the destination color and the texture color, using the alpha channel value as blend factor. Only first texture is used
	 * @const 
	 * @public
	 */
	EMT_TRANSPARENT_ALPHA_CHANNEL = 13;


	/** 
	 * Transparent reflective material for creating metallic looking survaces, constant for using in {@link Material.Type}, specifying the type of the material.
	 * There should be 2 textures: The first texture layer is a diffuse map including an alpha channel for transparency, the second is the refleced surface.
	 * @const 
	 * @public
	 */
	EMT_TRANSPARENT_REFLECTION_2_LAYER = 16;

	/** 
	 * Normal mapped material. Expects tangents and binormals to be existing in the mesh buffer, they are usually precalculated by the CopperCube editor.
	 * There should be 2 textures: The first texture layer is a diffuse map, the second is the normal map.
	 * @const 
	 * @public
	 */
	EMT_NORMAL_MAP_SOLID = 17;

	/** 
	 * Transparent material based on the texture alpha channel, constant for using in {@link Material.Type}, specifying the type of the material.
	 * The final color is blended together from the destination color and the texture color, using the alpha channel value as blend factor. Only first texture is used.
	 * If the alpha value is < 0.5, the pixel is discarded.
	 * @const 
	 * @public
	 */
	EMT_TRANSPARENT_ALPHA_CHANNEL_REF = 14;

	//Material.EMT_TRANSPARENT_VERTEX_ALPHA			= 15;
	//Material.EMT_NORMAL_MAP_SOLID					= 17;
	//Material.EMT_NORMAL_MAP_TRANSPARENT_ADD_COLOR	= 18;
	//Material.EMT_NORMAL_MAP_TRANSPARENT_VERTEX_ALPHA	= 19;
	//Material.EMT_PARALLAX_MAP_SOLID					= 20;
	//Material.EMT_PARALLAX_MAP_TRANSPARENT_ADD_COLOR	= 21;
	//Material.EMT_PARALLAX_MAP_TRANSPARENT_VERTEX_ALPHA= 22;
	//Material.EMT_ONETEXTURE_BLEND					= 23;

	/** 
	 * Solid material, blends based on vertex alpha between the two set textures. Used for terrain rendering.
	 * @const 
	 * @public
	 */
	EMT_SOLID_VERTEX_ALPHA_TWO_TEXTURE_BLEND = 25;

	/** 
	 * Like EMT_TRANSPARENT_ALPHA_CHANNEL_REF but moves by the wind, like for  moving grass or leaves.
	 * @const 
	 * @public
	 */
	EMT_TRANSPARENT_ALPHA_CHANNEL_REF_MOVING_GRASS = 26;

	constructor() {
		this.Type = 0;

		this.Tex1 = null; //:Texture;
		this.Tex2 = null; //:Texture;
		this.ZWriteEnabled = true;

		this.ClampTexture1 = false; //:Boolean;
		this.Lighting = false; //:Boolean;
		this.BackfaceCulling = true;
	}
	setFrom(mat) {
		if (!mat)
			return;

		this.Type = mat.Type;
		this.ZWriteEnabled = mat.ZWriteEnabled;
		this.Tex1 = mat.Tex1;
		this.Tex2 = mat.Tex2;
		this.ClampTexture1 = mat.ClampTexture1;
		this.Lighting = mat.Lighting;
		this.BackfaceCulling = mat.BackfaceCulling;
	}
	clone() {
		let mat = new CL3D.Material();

		mat.Type = this.Type;
		mat.ZReadEnabled = this.ZReadEnabled;
		mat.ZWriteEnabled = this.ZWriteEnabled;
		mat.Tex1 = this.Tex1;
		mat.Tex2 = this.Tex2;
		mat.ClampTexture1 = this.ClampTexture1;
		mat.Lighting = this.Lighting;
		mat.BackfaceCulling = this.BackfaceCulling;

		return mat;
	}
	/**
	 * Returns true if the described material does not use the depth map by default.
	 * @public
	 */
	doesNotUseDepthMap() {
		return this.Type == this.EMT_TRANSPARENT_ADD_COLOR ||
			this.Type == this.EMT_TRANSPARENT_ALPHA_CHANNEL ||
			this.Type == this.EMT_TRANSPARENT_REFLECTION_2_LAYER;
	}
	/**
	 * Returns true if the described material is transparent, used by SceneNodes to check if they
	 * need to register for rendering in transparent or solid mode.
	 * @public
	 */
	isTransparent() {
		return this.Type == this.EMT_TRANSPARENT_ADD_COLOR ||
			this.Type == this.EMT_TRANSPARENT_ALPHA_CHANNEL ||
			this.Type == this.EMT_TRANSPARENT_ALPHA_CHANNEL_REF ||
			this.Type == this.EMT_TRANSPARENT_ALPHA_CHANNEL_REF_MOVING_GRASS ||
			this.Type == this.EMT_TRANSPARENT_REFLECTION_2_LAYER;
	}
}
