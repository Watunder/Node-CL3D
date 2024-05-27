//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt
// This file is part of the CopperLicht engine, (c) by N.Gebhardt

import * as CL3D from "./main.js";
//import createContext from '@kmamal/gl'
//import Canvas from "canvas";

const GLSL = String.raw;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Renderer
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * 3D renderer, interface for drawing 3d geometry.
 * @constructor
 * @class 3D renderer, interface for drawing 3d geometry. You can access this using {@link CopperLicht}.getRenderer().
 * @public
 */
export class Renderer {
	// to add shader validation compatible shaders:
	// http://www.khronos.org/webgl/public-mailing-list/archives/1007/msg00034.html
	// add this on top of every shader:
	// #ifdef GL_ES
	// precision highp float;
	// #endif
	// The GL_ES define is not present on desktop, so that line is ignored; however it is present
	// when running under validation, because the translator implements GLSL ES.  Note that the precision qualifiers will have // no effect on the desktop (I believe they're just ignored by the translator), but may have an impact on mobile.

	// drawing 2d rectangles with a color and a position only
	vs_shader_2ddrawing_coloronly = GLSL`
	//#version 100
	precision mediump float;

	attribute vec4 vPosition;

    void main()
    {
        gl_Position = vPosition;
    }`;

	// drawing 2d rectangles with an image only
	vs_shader_2ddrawing_texture = GLSL`
	//#version 100
	precision mediump float;

	attribute vec4 vPosition;
	attribute vec4 vTexCoord1;
	varying vec2 v_texCoord1;

    void main()
    {
        gl_Position = vPosition;
		v_texCoord1 = vTexCoord1.st;
    }`;

	// 2D Fragment shader: simply set the color from a shader parameter (used for 2d drawing rectangles)
	fs_shader_simplecolor = GLSL`
	//#version 100
	precision mediump float;

	uniform vec4 vColor;

    void main()
    {
        gl_FragColor = vColor;
	}`;

	// 2D fragment shader for drawing fonts: The font texture is white/gray on black. Draw the font using the white as alpha,
	// multiplied by a color as parameter
	fs_shader_2ddrawing_canvasfont = GLSL`
	//#version 100
	precision mediump float;

	uniform vec4 vColor;
	uniform sampler2D texture1;
	uniform sampler2D texture2;

    varying vec2 v_texCoord1;

    void main()
    {
	    vec2 texCoord = vec2(v_texCoord1.s, v_texCoord1.t);
        float alpha = texture2D(texture1, texCoord).r;
        gl_FragColor = vec4(vColor.rgb, alpha);
    }`;


	// simple normal 3d world 3d transformation shader
	vs_shader_normaltransform = GLSL`
	//#version 100
	precision mediump float;

	uniform mat4 worldviewproj;

	attribute vec4 vPosition;
    attribute vec4 vNormal;
	attribute vec4 vColor;
    attribute vec2 vTexCoord1;
	attribute vec2 vTexCoord2;

	varying vec4 v_color;
    varying vec2 v_texCoord1;
	varying vec2 v_texCoord2;

    void main()
    {
		v_color = vColor;
        gl_Position = worldviewproj * vPosition;
        v_texCoord1 = vTexCoord1.st;
		v_texCoord2 = vTexCoord2.st;
    }`;

	// just like vs_shader_normaltransform but moves the positions a bit, like grass by the wind
	vs_shader_normaltransform_movegrass = GLSL`
	//#version 100
	precision mediump float;

	uniform mat4 worldviewproj;
	uniform mat4 worldtransform;
	uniform float grassMovement;
	uniform float windStrength;

	attribute vec4 vPosition;
    attribute vec4 vNormal;
	attribute vec4 vColor;
    attribute vec2 vTexCoord1;
	attribute vec2 vTexCoord2;

	varying vec4 v_color;
    varying vec2 v_texCoord1;
	varying vec2 v_texCoord2;

    void main()
    {
		v_color = vColor;
		vec4 grasspos = vPosition;
		grasspos.x += sin(grassMovement + ((worldtransform[3].x + vPosition.x) / 10.0)) * (1.0 - vTexCoord1.y) * windStrength;
        gl_Position = worldviewproj * grasspos;
        v_texCoord1 = vTexCoord1.st;
		v_texCoord2 = vTexCoord2.st;
    }`;

	// reusable part of vertex shaders calculating the light from directional, ambient and up to 4 point lights
	// our lighting works like this:
	// vertexToLight = lightPos - vertexPos;
	// distance = length(vertexToLight)
	// distanceFact = 1 /( lightAttenuation * distance )
	// vertexToLight = normalize(vertexToLight)
	// angle = sin(normal.dotproduct(vertexToLight));
	// if (angle < 0) angle = 0;
	// intensity = angle * distanceFact;
	// color = intensity * lightcolor;
	vs_shader_light_part = GLSL`
	vec3 n = normalize(vec3(vNormal.xyz));
	vec4 currentLight = vec4(0, 0, 0, 1.0);
	for(int i=0; i<4; ++i)
	{
		vec3 lPos = vec3(arrLightPositions[i].xyz);
		vec3 vertexToLight = lPos - vec3(vPosition.xyz);
		float distance = length( vertexToLight );
		float distanceFact = 1.0 / (arrLightPositions[i].w * distance);
		vertexToLight = normalize(vertexToLight);
		float angle = max(0.0, dot(n, vertexToLight));
		float intensity = angle * distanceFact * 0.25;
		currentLight = currentLight + vec4(arrLightColors[i].x*intensity, arrLightColors[i].y*intensity, arrLightColors[i].z*intensity, 1.0);
	}

	// directional light
	float dirlight = max(0.0, dot(n, vecDirLight));
	currentLight = currentLight + vec4(colorDirLight.x*dirlight, colorDirLight.y*dirlight, colorDirLight.z*dirlight, 1.0) * vec4(0.25, 0.25, 0.25, 1.0);

	// ambient light
	//currentLight = max(currentLight,arrLightColors[4]);
	//currentLight = min(currentLight, vec4(1.0,1.0,1.0,1.0));
	currentLight = currentLight + arrLightColors[4];

	// backface value for shadow map back culling
	v_backfaceValue = dirlight;
	`;

	// simple normal 3d world 3d transformation shader, which also calculates the light of up to 4 point light sources
	vs_shader_normaltransform_with_light = GLSL`
	//#version 100
	precision mediump float;

	uniform mat4 worldviewproj;
	uniform vec4 arrLightPositions[4];
	uniform vec4 arrLightColors[5];
	uniform vec3 vecDirLight;
	uniform vec4 colorDirLight;

	attribute vec4 vPosition;
    attribute vec4 vNormal;
	attribute vec4 vColor;
    attribute vec2 vTexCoord1;
	attribute vec2 vTexCoord2;

	varying vec4 v_color;
    varying vec2 v_texCoord1;
	varying vec2 v_texCoord2;
	varying float v_backfaceValue;

    void main()
    {
        gl_Position = worldviewproj * vPosition;
        v_texCoord1 = vTexCoord1.st;
		v_texCoord2 = vTexCoord2.st;

		${this.vs_shader_light_part}

		currentLight = currentLight * vec4(vColor.x, vColor.y, vColor.z, 1.0) * 4.0;
		v_color = min(currentLight, vec4(1.0,1.0,1.0,1.0));
		v_color.a = vColor.a;	// preserve vertex alpha
    }`;

	// simple normal 3d world 3d transformation shader
	vs_shader_normaltransform_gouraud = GLSL`
	//#version 100
	precision mediump float;

	uniform mat4 worldviewproj;

	attribute vec4 vPosition;
    attribute vec2 vTexCoord1;
	attribute vec2 vTexCoord2;
	attribute vec4 vNormal;
	attribute vec4 vColor;

	varying vec4 v_color;
    varying vec2 v_texCoord1;
	varying vec2 v_texCoord2;

    void main()
    {
        gl_Position = worldviewproj * vPosition;
        v_texCoord1 = vTexCoord1.st;
		v_texCoord2 = vTexCoord2.st;
		v_color = vColor;
    }`;


	// 3d world 3d transformation shader generating a reflection in texture coordinate 2
	// normaltransform is the inverse transpose of the upper 3x3 part of the modelview matrix.
	//
	// this is based on
	// D3DTSS_TCI_CAMERASPACEREFLECTIONVECTOR from D3D9:
	// Use the reflection vector, transformed to camera space, as input texture coordinates.
	// The reflection vector is computed from the input vertex position and normal vector.
	vs_shader_reflectiontransform = GLSL`
	//#version 100
	precision mediump float;

	uniform mat4 worldviewproj;
	uniform mat4 normaltransform;
	uniform mat4 modelviewtransform;
	uniform mat4 worldtransform;

	attribute vec4 vPosition;
    attribute vec3 vNormal;
    attribute vec2 vTexCoord1;
	attribute vec2 vTexCoord2;

    varying vec2 v_texCoord1;
	varying vec2 v_texCoord2;

    void main()
    {
		gl_Position = worldviewproj * vPosition;

		//	use reflection
		vec3 pos = normalize((modelviewtransform * vPosition).xyz);
		vec3 n = normalize((normaltransform * vec4(vNormal, 1)).xyz);
		vec3 r = reflect( pos.xyz, n.xyz );
		float m = sqrt( r.x*r.x + r.y*r.y + (r.z+1.0)*(r.z+1.0) );

		//	texture coordinates
		v_texCoord1 = vTexCoord1.st;
		v_texCoord2.x = (r.x / (2.0 * m)  + 0.5);
		v_texCoord2.y = (r.y / (2.0 * m)  + 0.5);
	}`;


	// same shader as before, but now with light
	vs_shader_reflectiontransform_with_light = GLSL`
	//#version 100
	precision mediump float;

	uniform mat4 worldviewproj;
	uniform mat4 normaltransform;
	uniform mat4 modelviewtransform;
	uniform vec4 arrLightPositions[4];
	uniform vec4 arrLightColors[5];
	uniform vec3 vecDirLight;
	uniform vec4 colorDirLight;

	attribute vec4 vPosition;
    attribute vec3 vNormal;
    attribute vec2 vTexCoord1;
	attribute vec2 vTexCoord2;

	varying vec4 v_color;
    varying vec2 v_texCoord1;
	varying vec2 v_texCoord2;
	varying float v_backfaceValue;

    void main()
    {
        gl_Position = worldviewproj * vPosition;

		//	use reflection
		vec3 pos = normalize((modelviewtransform * vPosition).xyz);
		vec3 nt = normalize((normaltransform * vec4(vNormal, 1)).xyz);
		vec3 r = reflect( pos.xyz, nt.xyz );
		float m = sqrt( r.x*r.x + r.y*r.y + (r.z+1.0)*(r.z+1.0) );
		//	texture coordinates
		v_texCoord1 = vTexCoord1.st;
		v_texCoord2.x = r.x / (2.0 * m)  + 0.5;
		v_texCoord2.y = r.y / (2.0 * m)  + 0.5;

		${this.vs_shader_light_part}

		v_color = min(currentLight, vec4(1.0,1.0,1.0,1.0));
    }`;

	// same as vs_shader_normaltransform_with_light but alsow with grass movement
	vs_shader_normaltransform_with_light_movegrass = GLSL`
	//#version 100
	precision mediump float;

	uniform mat4 worldviewproj;
	uniform mat4 worldtransform;
	uniform vec4 arrLightPositions[4];
	uniform vec4 arrLightColors[5];
	uniform vec3 vecDirLight;
	uniform vec4 colorDirLight;
	uniform float grassMovement;
	uniform float windStrength;

	attribute vec4 vPosition;
    attribute vec4 vNormal;
	attribute vec4 vColor;
    attribute vec2 vTexCoord1;
	attribute vec2 vTexCoord2;

	varying vec4 v_color;
    varying vec2 v_texCoord1;
	varying vec2 v_texCoord2;
	varying float v_backfaceValue;

    void main()
    {
		vec4 grasspos = vPosition;
		grasspos.x += sin(grassMovement + ((worldtransform[3].x + vPosition.x) / 10.0)) * (1.0 - vTexCoord1.y) * windStrength;
        gl_Position = worldviewproj * grasspos;
        v_texCoord1 = vTexCoord1.st;
		v_texCoord2 = vTexCoord2.st;

		${this.vs_shader_light_part}

		currentLight = currentLight * vec4(vColor.x, vColor.y, vColor.z, 1.0);

		v_color = min(currentLight * 4.0, vec4(1.0,1.0,1.0,1.0));
		v_color.a = vColor.a;	// preserve vertex alpha
    }`;

	// normal mapped material
	vs_shader_normalmappedtransform = GLSL`
	//#version 100
	precision mediump float;

	uniform mat4 worldviewproj;
	uniform mat4 normaltransform;
	uniform mat4 worldtransform;
	uniform vec4 arrLightPositions[4];
	uniform vec4 arrLightColors[5];

	attribute vec4 vPosition;
    attribute vec3 vNormal;
	attribute vec4 vColor;
    attribute vec2 vTexCoord1;
	attribute vec2 vTexCoord2;
	attribute vec3 vBinormal;
	attribute vec3 vTangent;

	// Output:
    varying vec2 v_texCoord1;
	varying vec2 v_texCoord2;
	varying vec3 v_lightVector[4];
	varying vec3 v_lightColor[4];
	varying vec3 ambientLight;

    void main()
    {
        gl_Position = worldviewproj * vPosition;
        v_texCoord1 = vTexCoord1.st;
		v_texCoord2 = vTexCoord2.st;

		vec4 pos = vec4(dot(vPosition, worldtransform[0]), dot(vPosition, worldtransform[1]), dot(vPosition, worldtransform[2]), dot(vPosition, worldtransform[3]));

		// transform normal, binormal and tangent
		vec3 normal = vec3(dot(vNormal.xyz, worldtransform[0].xyz), dot(vNormal.xyz, worldtransform[1].xyz), dot(vNormal.xyz, worldtransform[2].xyz));
		vec3 tangent = vec3(dot(vTangent.xyz, worldtransform[0].xyz), dot(vTangent.xyz, worldtransform[1].xyz), dot(vTangent.xyz, worldtransform[2].xyz));
		vec3 binormal = vec3(dot(vBinormal.xyz, worldtransform[0].xyz), dot(vBinormal.xyz, worldtransform[1].xyz), dot(vBinormal.xyz, worldtransform[2].xyz));

		vec3 temp = vec3(0.0, 0.0, 0.0);
		for(int i=0; i<4; ++i)
		{
			vec3 lightPos = vec3(arrLightPositions[i].xyz);
			vec3 vertexToLight = lightPos - vec3(pos.xyz);

			// transform the light vector 1 with U, V, W
			temp.x = dot(tangent.xyz, vertexToLight);
			temp.y = dot(binormal.xyz, vertexToLight);
			temp.z = dot(normal.xyz, vertexToLight);

			// normalize light vector
			temp = normalize(temp);

			// move from -1..1 to 0..1 and put into output
			temp = temp * 0.5;
			temp = temp + vec3(0.5,0.5,0.5);
			v_lightVector[i] = temp;

			// calculate attenuation
			float distanceFact = 1.0 / sqrt(dot(vertexToLight, vertexToLight) * arrLightPositions[i].w);
			v_lightColor[i] = min(vec3(arrLightColors[i].x*distanceFact, arrLightColors[i].y*distanceFact, arrLightColors[i].z*distanceFact), vec3(1,1,1));
		}
		// ambient light
		ambientLight = arrLightColors[4].xyz;
    }`;

	fs_shader_onlyfirsttexture = GLSL`
	//#version 100
	precision mediump float;

	uniform sampler2D texture1;
	uniform sampler2D texture2;

    varying vec2 v_texCoord1;
	varying vec2 v_texCoord2;

    void main()
    {
        vec2 texCoord = vec2(v_texCoord1.s, v_texCoord1.t);
        gl_FragColor = texture2D(texture1, texCoord);
    }`;

	fs_shader_onlyfirsttexture_gouraud = GLSL`
	//#version 100
	precision mediump float;

	uniform sampler2D texture1;
	uniform sampler2D texture2;

	varying vec4 v_color;
    varying vec2 v_texCoord1;
	varying vec2 v_texCoord2;

    void main()
    {
        vec2 texCoord = vec2(v_texCoord1.s, v_texCoord1.t);
        gl_FragColor = texture2D(texture1, texCoord) * v_color * 4.0;
	}`;

	fs_shader_onlyfirsttexture_gouraud_alpharef = GLSL`
	//#version 100
	precision mediump float;

	uniform sampler2D texture1;
	uniform sampler2D texture2;

	varying vec4 v_color;
    varying vec2 v_texCoord1;
	varying vec2 v_texCoord2;

    void main()
    {
        vec2 texCoord = vec2(v_texCoord1.s, v_texCoord1.t);
		vec4 clr = texture2D(texture1, texCoord) * v_color;
		if(clr.a < 0.5)
			discard;
        gl_FragColor = clr * 4.0;
    }`;

	fs_shader_lightmapcombine = GLSL`
	//#version 100
	precision mediump float;

	uniform sampler2D texture1;
	uniform sampler2D texture2;

    varying vec2 v_texCoord1;
	varying vec2 v_texCoord2;

    void main()
    {
        vec2 texCoord1 = vec2(v_texCoord1.s, v_texCoord1.t);
		vec2 texCoord2 = vec2(v_texCoord2.s, v_texCoord2.t);
        vec4 col1 = texture2D(texture1, texCoord1);
		vec4 col2 = texture2D(texture2, texCoord2);
		gl_FragColor = col1 * col2 * 4.0;
    }`;

	fs_shader_lightmapcombine_m4 = GLSL`
	//#version 100
	precision mediump float;

	uniform sampler2D texture1;
	uniform sampler2D texture2;

    varying vec2 v_texCoord1;
	varying vec2 v_texCoord2;

    void main()
    {
        vec2 texCoord1 = vec2(v_texCoord1.s, v_texCoord1.t);
		vec2 texCoord2 = vec2(v_texCoord2.s, v_texCoord2.t);
        vec4 col1 = texture2D(texture1, texCoord1);
		vec4 col2 = texture2D(texture2, texCoord2);
		gl_FragColor = col1 * col2 * 3.0;
    }`;

	fs_shader_lightmapcombine_gouraud = GLSL`
	//#version 100
	precision mediump float;

	uniform sampler2D texture1;
	uniform sampler2D texture2;

	varying vec4 v_color;
    varying vec2 v_texCoord1;
	varying vec2 v_texCoord2;

    void main()
    {
        vec2 texCoord1 = vec2(v_texCoord1.s, v_texCoord1.t);
		vec2 texCoord2 = vec2(v_texCoord2.s, v_texCoord2.t);
        vec4 col1 = texture2D(texture1, texCoord1);
		vec4 col2 = texture2D(texture2, texCoord2);
		vec4 final = col1 * col2 * v_color * 4.0;
		gl_FragColor = vec4(final.x, final.y, final.z, col1.w);
    }`;

	fs_shader_normalmapped = GLSL`
	//#version 100
	precision mediump float;

	uniform sampler2D texture1;
	uniform sampler2D texture2;

    varying vec2 v_texCoord1;
	varying vec2 v_texCoord2;
	varying vec3 v_lightVector[4];
	varying vec3 v_lightColor[4];
	varying vec3 ambientLight;

    void main()
    {
		vec4 colorMapSample = texture2D(texture1, v_texCoord1);
		vec3 normalMapVector = texture2D(texture2, v_texCoord1).xyz;
		//normalMapVector -= vec3(0.5, 0.5, 0.5);
		//normalMapVector = normalize(normalMapVector);
		normalMapVector *= vec3(2.0, 2.0, 2.0);
		normalMapVector -= vec3(1.0, 1.0, 1.0);

		vec3 totallight = vec3(0.0, 0.0, 0.0);
		for(int i=0; i<4; ++i)
		{
			// process light
			//vec3 lightvect = v_lightVector[i] + vec3(-0.5, -0.5, -0.5);
			vec3 lightvect = (v_lightVector[i] * vec3(2.0, 2.0, 2.0)) - vec3(1.0, 1.0, 1.0);
			lightvect = normalize(lightvect);
			float luminance = dot(lightvect, normalMapVector); // normal DOT light
			luminance = clamp(luminance, 0.0, 1.0);	// clamp result to positive numbers
			lightvect = luminance * v_lightColor[i];	// luminance * light color

			// add to previously calculated lights
			totallight = totallight + lightvect;
		}

		totallight = totallight + ambientLight;
		// 0.25 because of new modulatex4 mode
		gl_FragColor = colorMapSample * 0.25 * vec4(totallight.x, totallight.y, totallight.z, 0.0) * 4.0;
    }`;

	fs_shader_vertex_alpha_two_textureblend = GLSL`
	//#version 100
	precision mediump float;

	uniform sampler2D texture1;
	uniform sampler2D texture2;

	varying vec4 v_color;
    varying vec2 v_texCoord1;
	varying vec2 v_texCoord2;

    void main()
    {
        vec2 texCoord = vec2(v_texCoord1.s, v_texCoord1.t);
		vec4 color1 = texture2D(texture1, texCoord);
		vec4 color2 = texture2D(texture2, texCoord);
		color1 = ((1.0 - v_color.w) * color1) + (v_color.w * color2);	// interpolate texture colors based on vertex alpha
		gl_FragColor = color1 * v_color * 4.0;
    }`;

	// ----------------------------------------------------------------------------
	// Same shaders as above, but with fog
	// ----------------------------------------------------------------------------

	// the 1.442695 is because we use fixed function like exponential fog, like this:
	// Exponantial fog:
	//   const float LOG2E = 1.442695; // = 1 / log(2)
	//   fog = exp2(-gl_Fog.density * gl_FogFragCoord * LOG2E);
	// Exponantial squared fog:
	//   fog = exp2(-gl_Fog.density * gl_Fog.density * gl_FogFragCoord * gl_FogFragCoord * LOG2E);
	fs_shader_onlyfirsttexture_gouraud_fog = GLSL`
	//#version 100
	precision mediump float;

	uniform sampler2D texture1;
	uniform sampler2D texture2;
	uniform vec4 fogColor;
	uniform float fogDensity;

	varying vec4 v_color;
    varying vec2 v_texCoord1;
	varying vec2 v_texCoord2;

    void main()
    {
        vec2 texCoord = vec2(v_texCoord1.s, v_texCoord1.t);
		vec4 tmpFragColor = texture2D(texture1, texCoord) * v_color;
		float z = gl_FragCoord.z / gl_FragCoord.w;
		float fogFactor = clamp(exp2( -fogDensity * z * 1.442695), 0.0, 1.0);
		gl_FragColor = mix(fogColor, tmpFragColor * 4.0, fogFactor);
		gl_FragColor.a = tmpFragColor.a;
    }`;

	// see fs_shader_onlyfirsttexture_gouraud_fog for details
	fs_shader_lightmapcombine_fog = GLSL`
	//#version 100
	precision mediump float;

	uniform sampler2D texture1;
	uniform sampler2D texture2;
	uniform vec4 fogColor;
	uniform float fogDensity;

    varying vec2 v_texCoord1;
	varying vec2 v_texCoord2;

    void main()
    {
        vec2 texCoord1 = vec2(v_texCoord1.s, v_texCoord1.t);
		vec2 texCoord2 = vec2(v_texCoord2.s, v_texCoord2.t);
        vec4 col1 = texture2D(texture1, texCoord1);
		vec4 col2 = texture2D(texture2, texCoord2);
		vec4 tmpFragColor = col1 * col2;
		float z = gl_FragCoord.z / gl_FragCoord.w;
		float fogFactor = clamp(exp2( -fogDensity * z * 1.442695), 0.0, 1.0);
		gl_FragColor = mix(fogColor, tmpFragColor * 4.0, fogFactor);
		gl_FragColor.a = tmpFragColor.a;
    }`;

	fs_shader_onlyfirsttexture_gouraud_alpharef_fog = GLSL`
	//#version 100
	precision mediump float;

	uniform sampler2D texture1;
	uniform vec4 fogColor;
	uniform float fogDensity;

	varying vec4 v_color;
    varying vec2 v_texCoord1;

    void main()
    {
        vec2 texCoord = vec2(v_texCoord1.s, v_texCoord1.t);
		vec4 tmpFragColor = texture2D(texture1, texCoord) * v_color;
		if(tmpFragColor.a < 0.5)
			discard;
		float z = gl_FragCoord.z / gl_FragCoord.w;
		float fogFactor = clamp(exp2( -fogDensity * z * 1.442695), 0.0, 1.0);
		gl_FragColor = mix(fogColor, tmpFragColor * 4.0, fogFactor);
		gl_FragColor.a = tmpFragColor.a;
    }`;

	fs_shader_lightmapcombine_m4_fog = GLSL`
	//#version 100
	precision mediump float;

	uniform sampler2D texture1;
	uniform sampler2D texture2;
	uniform vec4 fogColor;
	uniform float fogDensity;

    varying vec2 v_texCoord1;
	varying vec2 v_texCoord2;

    void main()
    {
        vec2 texCoord1 = vec2(v_texCoord1.s, v_texCoord1.t);
		vec2 texCoord2 = vec2(v_texCoord2.s, v_texCoord2.t);
        vec4 col1 = texture2D(texture1, texCoord1);
		vec4 col2 = texture2D(texture2, texCoord2);
		vec4 tmpFragColor = col1 * col2 * 3.0;
		float z = gl_FragCoord.z / gl_FragCoord.w;
		float fogFactor = clamp(exp2( -fogDensity * z * 1.442695), 0.0, 1.0);
		gl_FragColor = mix(fogColor, tmpFragColor * 4.0, fogFactor);
		gl_FragColor.a = tmpFragColor.a;
    }`;

	fs_shader_vertex_alpha_two_textureblend_fog = GLSL`
	//#version 100
	precision mediump float;

	uniform sampler2D texture1;
	uniform sampler2D texture2;
	uniform vec4 fogColor;
	uniform float fogDensity;

	varying vec4 v_color;
    varying vec2 v_texCoord1;
	varying vec2 v_texCoord2;

    void main()
    {
        vec2 texCoord = vec2(v_texCoord1.s, v_texCoord1.t);
		vec4 color1 = texture2D(texture1, texCoord);
		vec4 color2 = texture2D(texture2, texCoord);
		color1 = ((1.0 - v_color.w) * color1) + (v_color.w * color2);	// interpolate texture colors based on vertex alpha
		vec4 tmpFragColor = color1 * v_color;
		float z = gl_FragCoord.z / gl_FragCoord.w;
		float fogFactor = clamp(exp2( -fogDensity * z * 1.442695), 0.0, 1.0);
		gl_FragColor = mix(fogColor, tmpFragColor * 4.0, fogFactor);
		gl_FragColor.a = tmpFragColor.a;
    }`;

	fs_shader_lightmapcombine_gouraud_fog = GLSL`
	//#version 100
	precision mediump float;

	uniform sampler2D texture1;
	uniform sampler2D texture2;
	uniform vec4 fogColor;
	uniform float fogDensity;

	varying vec4 v_color;
    varying vec2 v_texCoord1;
	varying vec2 v_texCoord2;

    void main()
    {
        vec2 texCoord1 = vec2(v_texCoord1.s, v_texCoord1.t);
		vec2 texCoord2 = vec2(v_texCoord2.s, v_texCoord2.t);
        vec4 col1 = texture2D(texture1, texCoord1);
		vec4 col2 = texture2D(texture2, texCoord2);
		vec4 final = col1 * col2 * v_color;
		vec4 tmpFragColor = vec4(final.x, final.y, final.z, col1.w);
		float z = gl_FragCoord.z / gl_FragCoord.w;
		float fogFactor = clamp(exp2( -fogDensity * z * 1.442695), 0.0, 1.0);
		gl_FragColor = mix(fogColor, tmpFragColor * 4.0, fogFactor);
		gl_FragColor.a = tmpFragColor.a;
    }`;

	// ----------------------------------------------------------------------------
	// Shadow map related shaders
	// ----------------------------------------------------------------------------

	// normal 3d world 3d transformation shader for drawing depth into a shadow map texture
	vs_shader_normaltransform_for_shadowmap = GLSL`
	//#version 100
	precision highp float;

	uniform mat4 worldviewproj;
	attribute vec4 vPosition;

    void main()
    {
        gl_Position = worldviewproj * vPosition;
    }`;

	fs_shader_draw_depth_shadowmap_depth = GLSL`
	//#version 100
	precision highp float;

    void main()
    {
		gl_FragColor = vec4(gl_FragCoord.z);
	}`;

	// like vs_shader_normaltransform_for_shadowmap but for alpha ref materials
	vs_shader_normaltransform_alpharef_for_shadowmap = GLSL`
	//#version 100
	precision highp float;

	uniform mat4 worldviewproj;
	attribute vec4 vPosition;
	attribute vec2 vTexCoord1;

	varying vec2 v_texCoord1;

    void main()
    {
		v_texCoord1 = vTexCoord1.st;
        gl_Position = worldviewproj * vPosition;
    }`;

	// like vs_shader_normaltransform_alpharef_for_shadowmap but with moving grass
	vs_shader_normaltransform_alpharef_moving_grass_for_shadowmap = GLSL`
	//#version 100
	precision highp float;

	uniform mat4 worldviewproj;
	attribute vec4 vPosition;
	attribute vec2 vTexCoord1;
	uniform float grassMovement;
	uniform float windStrength;
	uniform mat4 worldtransform;

	varying vec2 v_texCoord1;

    void main()
    {
		vec4 grasspos = vPosition;
		grasspos.x += sin(grassMovement + ((worldtransform[3].x + vPosition.x) / 10.0)) * (1.0 - vTexCoord1.y) * windStrength;
        gl_Position = worldviewproj * grasspos;
		v_texCoord1 = vTexCoord1.st;
	}`;

	// like fs_shader_draw_depth_shadowmap_depth but for alpha ref materials
	fs_shader_alpharef_draw_depth_shadowmap_depth = GLSL`
	//#version 100
	precision highp float;

	varying vec2 v_texCoord1;
	uniform sampler2D texture1;

    void main()
    {
		vec2 texCoord = vec2(v_texCoord1.s, v_texCoord1.t);
		vec4 diffuseColor = texture2D(texture1, texCoord);
		if (diffuseColor.a < 0.5) discard;
		gl_FragColor = vec4(gl_FragCoord.z);
	}`;

	// we only need to write gl_FragCoord.z for float rtt, but dont
	// use those and pack this into rgba in case we have no floating point support:
	fs_shader_draw_depth_shadowmap_rgbapack = GLSL`
	//#version 100
	precision highp float;

    void main()
    {
		 const vec4 bitShift = vec4(1.0, 256.0, 256.0*256.0, 256.0*256.0*256.0);
		 const vec4 bitMask = vec4(1.0/256.0, 1.0/256.0, 1.0/256.0, 0.0);
		 vec4 rgbavalue = fract(gl_FragCoord.z * bitShift);
		 rgbavalue -= rgbavalue.gbaa * bitMask;
		 gl_FragColor = rgbavalue;
    }`;

	// normal transformation and lighting of an object (like vs_shader_normaltransform_with_light)
	// with additional computation of the lookup coordinate in the rendered shadow map.
	vs_shader_normaltransform_with_shadowmap_lookup = GLSL`
	//#version 100
	precision highp float;

	uniform mat4 worldviewproj;
	uniform mat4 worldviewprojLight;
	uniform mat4 worldviewprojLight2;
	uniform vec4 arrLightPositions[4];
	uniform vec4 arrLightColors[5];
	uniform vec3 vecDirLight;
	uniform vec4 colorDirLight;

	attribute vec4 vPosition;
    attribute vec4 vNormal;
	attribute vec4 vColor;
    attribute vec2 vTexCoord1;
	attribute vec2 vTexCoord2;

	varying vec4 v_color;
    varying vec2 v_texCoord1;
	varying float v_backfaceValue;
	varying vec4 v_posFromLight;	 // position on shadow map
	varying vec4 v_posFromLight2;	 // position on 2nd shadow map

    void main()
    {
        gl_Position = worldviewproj * vPosition;
        v_texCoord1 = vTexCoord1.st;

		// Calculate position on shadow map
		v_posFromLight = worldviewprojLight * vPosition;
		v_posFromLight2 = worldviewprojLight2 * vPosition;

		${this.vs_shader_light_part}

		currentLight = currentLight * vec4(vColor.x, vColor.y, vColor.z, 1.0);
		v_color = min(currentLight * 4.0, vec4(1.0,1.0,1.0,1.0));
		v_color.a = vColor.a;	// preserve vertex alpha
    }`;

	// like fs_shader_onlyfirsttexture_gouraud_fog but also with shadow map
	fs_shader_onlyfirsttexture_gouraud_fog_shadow_map_rgbpack = GLSL`
	//#version 100
	precision mediump float;

	uniform sampler2D texture1;
	uniform sampler2D shadowmap;
	uniform sampler2D shadowmap2;
	uniform vec4 fogColor;
	uniform float fogDensity;
	uniform float shadowMapBias1;
	uniform float shadowMapBias2;
	uniform float shadowMapBackFaceBias;
	uniform float shadowOpacity;

	varying vec4 v_color;
    varying vec2 v_texCoord1;
	varying float v_backfaceValue;
	varying vec4 v_posFromLight;

	float unpackFromRGBA(const in vec4 valuein) {
		const vec4 bitShift = vec4(1.0, 1.0/256.0, 1.0/(256.0*256.0), 1.0/(256.0*256.0*256.0));
		return dot(valuein, bitShift);
	}

    void main()
    {
		// diffuse texture
		vec4 diffuseColor = texture2D(texture1, v_texCoord1) * v_color;

		// shadow map lookup
		float perpDiv = v_posFromLight.w;
		vec3 shadowCoord = (v_posFromLight.xyz / perpDiv) * 0.5 + 0.5;
		shadowCoord = clamp(shadowCoord, vec3(0.0,0.0,0.0), vec3(1.0,1.0,1.0));
		vec4 shadowMapColor = texture2D(shadowmap, shadowCoord.xy);
		float shadowDepth = unpackFromRGBA(shadowMapColor);

		float distanceFromLight = shadowCoord.z;
		float visibility = 1.0 - (shadowOpacity * step(shadowMapBias1, shadowCoord.z - shadowDepth));

		gl_FragColor = diffuseColor * visibility;
		gl_FragColor.a = diffuseColor.a;
	}`;

	// header part for shadow maps above main function. Can be used to add test functions for shadow mapping
	fs_shader_shadowmap_header_part = GLSL`
	`;

	// reusable part for calculating the shadow color
	// version for testing cascade shadow maps:
	// version with cascade shadow maps

	fs_shader_shadowmap_part = GLSL`
		// shadow map 1 lookup
		vec3 shadowCoord = (v_posFromLight.xyz / v_posFromLight.w) * 0.5 + 0.5;
		float brightnessFactor = 1.0; // when we have shadows, everthing is a bit darker, so compensate for this

		float visibility = 0.0;

		// now decide which map to use
		if (v_backfaceValue < shadowMapBackFaceBias)
		{
			// backface, no shadow needed there
			visibility = 1.0;
		}
		else
		// if (shadowCoord.x < 0.0 || shadowCoord.x > 1.0 || shadowCoord.y < 0.0 || shadowCoord.y > 1.0)
		// same as:
		if ( ((1.0 - step(1.0, shadowCoord.x)) * (step(0.0, shadowCoord.x)) *
				(1.0 - step(1.0, shadowCoord.y)) * (step(0.0, shadowCoord.y))) < 0.5)
		{
			// use shadowmap 2
			vec3 shadowCoord2 = (v_posFromLight2.xyz / v_posFromLight2.w) * 0.5 + 0.5;
			vec4 shadowMapColor = texture2D(shadowmap2, shadowCoord2.xy);
			float shadowDepth = shadowMapColor.r;

			visibility = 1.0 - (shadowOpacity * step(shadowMapBias2, shadowCoord2.z - shadowDepth));
		}
		else
		{
			// use shadowmap 1
			vec4 shadowMapColor = texture2D(shadowmap, shadowCoord.xy);
			float shadowDepth = shadowMapColor.r;

			visibility = 1.0 - (shadowOpacity * step(shadowMapBias1, shadowCoord.z - shadowDepth));
		}

		vec4 colorWithShadow = diffuseColor * visibility * brightnessFactor;
		`;
	// version without cascade shadow maps




	// reusable part for mixing fog and shadow
	fs_shader_mixdiffusefogandshadow_part = GLSL`
	// fog
	float z = gl_FragCoord.z / gl_FragCoord.w;
	float fogFactor = clamp(exp2( -fogDensity * z * 1.442695), 0.0, 1.0);
	colorWithShadow = mix(fogColor, colorWithShadow, fogFactor);

	gl_FragColor = colorWithShadow * 4.0;
	gl_FragColor.a = diffuseColor.a;
	`;


	// Like fs_shader_onlyfirsttexture_gouraud_fog_shadow_map_rgbpack but with floating point tests
	fs_shader_onlyfirsttexture_gouraud_fog_shadow_map = GLSL`
	//#version 100
	precision mediump float;

	uniform sampler2D texture1;
	uniform sampler2D shadowmap;
	uniform sampler2D shadowmap2;
	uniform vec4 fogColor;
	uniform float fogDensity;
	uniform float shadowMapBias1;
	uniform float shadowMapBias2;
	uniform float shadowMapBackFaceBias;
	uniform float shadowOpacity;

	varying vec4 v_color;
    varying vec2 v_texCoord1;
	varying float v_backfaceValue;
	varying vec4 v_posFromLight;
	varying vec4 v_posFromLight2;

	${this.fs_shader_shadowmap_header_part}

    void main()
    {
		// diffuse texture
		vec4 diffuseColor = texture2D(texture1, v_texCoord1) * v_color;

    	${this.fs_shader_shadowmap_part}
		${this.fs_shader_mixdiffusefogandshadow_part}
	}`;

	// like fs_shader_vertex_alpha_two_textureblend_fog but with shadow map support
	fs_shader_vertex_alpha_two_textureblend_fog_shadow_map = GLSL`
	//#version 100
	precision mediump float;

	uniform sampler2D texture1;
	uniform sampler2D texture2;
	uniform sampler2D shadowmap;
	uniform sampler2D shadowmap2;
	uniform vec4 fogColor;
	uniform float fogDensity;
	uniform float shadowMapBias1;
	uniform float shadowMapBias2;
	uniform float shadowMapBackFaceBias;
	uniform float shadowOpacity;

	varying vec4 v_color;
    varying vec2 v_texCoord1;
	varying vec2 v_texCoord2;
	varying float v_backfaceValue;
	varying vec4 v_posFromLight;
	varying vec4 v_posFromLight2;

	${this.fs_shader_shadowmap_header_part}

    void main()
    {
        vec2 texCoord = vec2(v_texCoord1.s, v_texCoord1.t);
		vec4 color1 = texture2D(texture1, texCoord);
		vec4 color2 = texture2D(texture2, texCoord);
		color1 = ((1.0 - v_color.w) * color1) + (v_color.w * color2);	// interpolate texture colors based on vertex alpha
		vec4 diffuseColor = color1 * v_color;

    ${this.fs_shader_shadowmap_part}
	${this.fs_shader_mixdiffusefogandshadow_part}
	}`;

	// like fs_shader_onlyfirsttexture_gouraud_alpharef_fog but with shadow map support
	fs_shader_onlyfirsttexture_gouraud_alpharef_fog_shadow_map = GLSL`
	//#version 100
	precision mediump float;

	uniform sampler2D texture1;
	uniform sampler2D shadowmap;
	uniform sampler2D shadowmap2;
	uniform vec4 fogColor;
	uniform float fogDensity;
	uniform float shadowMapBias1;
	uniform float shadowMapBias2;
	uniform float shadowMapBackFaceBias;
	uniform float shadowOpacity;

	varying vec4 v_color;
    varying vec2 v_texCoord1;
	varying float v_backfaceValue;
	varying vec4 v_posFromLight;
	varying vec4 v_posFromLight2;

	${this.fs_shader_shadowmap_header_part}

    void main()
    {
        vec2 texCoord = vec2(v_texCoord1.s, v_texCoord1.t);
		vec4 diffuseColor = texture2D(texture1, texCoord) * vec4(v_color.r, v_color.g, v_color.b, 1.0);
		if (diffuseColor.a < 0.5) discard;

	${this.fs_shader_shadowmap_part}
	${this.fs_shader_mixdiffusefogandshadow_part}
	}`;

	// same as vs_shader_normaltransform_with_light_movegrass but with shadow map loopup
	vs_shader_normaltransform_with_light_movegrass_with_shadowmap_lookup = GLSL`
	//#version 100
	precision mediump float;

	uniform mat4 worldviewproj;
	uniform mat4 worldtransform;
	uniform mat4 worldviewprojLight;
	uniform mat4 worldviewprojLight2;
	uniform vec4 arrLightPositions[4];
	uniform vec4 arrLightColors[5];
	uniform vec3 vecDirLight;
	uniform vec4 colorDirLight;
	uniform float grassMovement;
	uniform float windStrength;

	attribute vec4 vPosition;
    attribute vec4 vNormal;
	attribute vec4 vColor;
    attribute vec2 vTexCoord1;
	attribute vec2 vTexCoord2;

	varying vec4 v_color;
    varying vec2 v_texCoord1;
	varying vec2 v_texCoord2;
	varying float v_backfaceValue;
	varying vec4 v_posFromLight;	 // position on shadow map
	varying vec4 v_posFromLight2;	 // position on 2nd shadow map

    void main()
    {
		vec4 grasspos = vPosition;
		grasspos.x += sin(grassMovement + ((worldtransform[3].x + vPosition.x) / 10.0)) * (1.0 - vTexCoord1.y) * windStrength;
        gl_Position = worldviewproj * grasspos;
        v_texCoord1 = vTexCoord1.st;
		v_texCoord2 = vTexCoord2.st;
		// Calculate position on shadow map
		v_posFromLight = worldviewprojLight * vPosition;
		v_posFromLight2 = worldviewprojLight2 * vPosition;

		${this.vs_shader_light_part}

		currentLight = currentLight * vec4(vColor.x, vColor.y, vColor.z, 1.0);
		v_color = min(currentLight * 4.0, vec4(1.0,1.0,1.0,1.0));
		v_color.a = vColor.a;	// preserve vertex alpha
	}`;

	OnChangeMaterial = null;

	/**
	 * Event handler called after the renderer switches to a specific material, useful for shader programming.
	 * You can use this to set the variables and uniforms in a custom shader by using this callback.
	 * The first parameter of the function is the material type id, which gets returned for example by createMaterialType().
	 * @example
	 * let engine = startCopperLichtFromFile('3darea', 'test.ccbjs');
	 *
	 * // [...] create a shader and material here using for example
	 * // let newMaterialType = engine.getRenderer().
	 * //    createMaterialType(vertex_shader_source, fragment_shader_source);
	 *
	 * // register callback function to set a variable in the new shader:
	 * // note that createMaterialType() also accepts a shadercallback function as parameters
	 * // which you could use instead of this approach.
	 * engine.getRenderer().OnChangeMaterial = function(mattype)
	 * {
	 *   let renderer = engine.getRenderer();
	 *   if (renderer && mattype == newMaterialType)
	 *   {
	 *      let gl = renderer.getWebGL();
	 *
	 *      // get variable location
	 *      let program = renderer.getGLProgramFromMaterialType(newMaterialType);
	 *      let variableLocation = gl.getUniformLocation(program, "test");
	 *
	 *      // set the content of the variable
	 *      gl.uniform1f(location, 1.23);
	 *   }
	 * };
	 * @public
	 */
	constructor(textureManager) {
		this.TheTextureManager = textureManager;

		this.canvas = null;
		this.gl = null;
		this.width = 0;
		this.height = 0;
		this.textureWasLoadedFlag = false;

		this.Projection = new CL3D.Matrix4();
		this.View = new CL3D.Matrix4();
		this.World = new CL3D.Matrix4();

		this.AmbientLight = new CL3D.ColorF();
		this.AmbientLight.R = 0.0;
		this.AmbientLight.G = 0.0;
		this.AmbientLight.B = 0.0;

		this.programStandardMaterial = null;
		this.programLightmapMaterial = null;

		this.MaterialPrograms = new Array();
		this.MaterialProgramsWithLight = new Array();
		this.MaterialProgramsFog = new Array();
		this.MaterialProgramsWithLightFog = new Array();
		this.MaterialProgramsWithShadowMap = new Array();
		this.MinExternalMaterialTypeId = 30;

		this.Program2DDrawingColorOnly = null;
		this.Program2DDrawingTextureOnly = null;
		this.Program2DDrawingCanvasFontColor = null;

		this.OnChangeMaterial = null;

		this.StaticBillboardMeshBuffer = null;

		this.Lights = new Array();
		this.DirectionalLight = null;

		// webgl specific
		this.currentGLProgram = null;

		this.domainTextureLoadErrorPrinted = false;

		this.printShaderErrors = true;

		this.CurrentRenderTarget = null;
		this.InvertedDepthTest = false;

		this.FogEnabled = false;
		this.FogColor = new CL3D.ColorF();
		this.FogDensity = 0.01;

		this.WindSpeed = 1.0;
		this.WindStrength = 4.0;

		this.ShadowMapEnabled = false;
		this.ShadowMapTexture = null;
		this.ShadowMapTexture2 = null; // for second shadow buffer in case CL3D.UseShadowCascade is true
		this.ShadowMapLightMatrix = null;
		this.ShadowMapLightMatrix2 = null; // for second shadow buffer in case CL3D.UseShadowCascade is true
		this.ShadowMapUsesRGBPacking = false;
		this.ShadowMapBias1 = 0.000003;
		this.ShadowMapBias2 = 0.000003;
		this.ShadowMapBackFaceBias = 0.5;
		this.ShadowMapOpacity = 0.5;

		this.UsesWebGL2 = false;

		if (!CL3D.UseShadowCascade) {
			this.fs_shader_shadowmap_part = GLSL`
			// shadow map lookup
			vec3 shadowCoord = (v_posFromLight.xyz / v_posFromLight.w) * 0.5 + 0.5;
			vec4 shadowMapColor = texture2D(shadowmap, shadowCoord.xy);
			float shadowDepth = shadowMapColor.r;

			float distanceFromLight = shadowCoord.z;
			float visibility = 1.0 - (shadowOpacity * step(shadowMapBias1, shadowCoord.z - shadowDepth));

			// no shadows outside of shadowmap
			// if (shadowCoord.x < 0.0 || shadowCoord.x > 1.0 || shadowCoord.y < 0.0 || shadowCoord.y > 1.0)
			// same as:
			if ( ((1.0 - step(1.0, shadowCoord.x)) * (step(0.0, shadowCoord.x)) *
					(1.0 - step(1.0, shadowCoord.y)) * (step(0.0, shadowCoord.y))) < 0.5)
				visibility = 1.0;

			vec4 colorWithShadow = diffuseColor * visibility * 4.0;
			`;
		}
	}
	/**
	 * Returns the current width of the rendering surface in pixels.
	 * @public
	 **/
	getWidth() {
		return this.width;
	}
	/**
	 * @private
	 */
	getAndResetTextureWasLoadedFlag() {
		let b = this.textureWasLoadedFlag;
		this.textureWasLoadedFlag = false;
		return b;
	}
	/**
	 * Returns access to the webgl interface. This should not be needed.
	 * @public
	 **/
	getWebGL() {
		return this.gl;
	}
	/**
	 * Returns the current height of the rendering surface in pixels.
	 * @public
	 **/
	getHeight() {
		return this.height;
	}
	/**
	 * @private
	 */
	registerFrame() {
		// TODO: fps counter here
	}
	/**
	 * Draws a {@link Mesh} with the current world, view and projection matrix.
	 * @public
	 * @param {CL3D.Mesh} mesh the mesh to draw
	 */
	drawMesh(mesh, forceNoShadowMap) {
		if (mesh == null)
			return;

		for (let i = 0; i < mesh.MeshBuffers.length; ++i) {
			let buf = mesh.MeshBuffers[i];
			this.setMaterial(buf.Mat, forceNoShadowMap);
			this.drawMeshBuffer(buf);
		}
	}
	/**
	 * Sets a material to activate for drawing 3d graphics.
	 * All 3d drawing functions will draw geometry using this material thereafter.
	 * @param {CL3D.Material} mat Material to set
	 * @public
	 */
	setMaterial(mat, forceNoShadowMap) {
		if (mat == null) {
			return;
		}

		let gl = this.gl;
		if (gl == null)
			return;

		// --------------------------------------------
		// set material
		let program = null;
		try {
			if (this.ShadowMapEnabled && !forceNoShadowMap)
				program = this.MaterialProgramsWithShadowMap[mat.Type];

			else if (this.FogEnabled) {
				if (mat.Lighting)
					program = this.MaterialProgramsWithLightFog[mat.Type];

				else
					program = this.MaterialProgramsFog[mat.Type];
			}

			else {
				if (mat.Lighting)
					program = this.MaterialProgramsWithLight[mat.Type];

				else
					program = this.MaterialPrograms[mat.Type];
			}
		}
		catch (e) {
		}

		if (program == null)
			return;

		this.currentGLProgram = program;
		gl.useProgram(program);

		// call callback function
		if (this.OnChangeMaterial != null) {
			try {
				this.OnChangeMaterial(mat.Type);
			}
			catch (e) { }
		}

		if (program.shaderCallback != null)
			program.shaderCallback();

		// set program blend mode
		if (program.blendenabled) {
			gl.enable(gl.BLEND);
			gl.blendFunc(program.blendsfactor, program.blenddfactor);
		}

		else
			gl.disable(gl.BLEND);

		// zwrite mode
		if (!mat.ZWriteEnabled || mat.doesNotUseDepthMap())
			gl.depthMask(false);

		else
			gl.depthMask(true);

		// zread mode
		if (mat.ZReadEnabled)
			gl.enable(gl.DEPTH_TEST);

		else
			gl.disable(gl.DEPTH_TEST);

		// depth function
		gl.depthFunc(this.InvertedDepthTest ? gl.GREATER : gl.LEQUAL);

		// backface culling
		if (mat.BackfaceCulling)
			gl.enable(gl.CULL_FACE);

		else
			gl.disable(gl.CULL_FACE);

		// -------------------------------------------
		// set textures
		// texture 1
		if (mat.Tex1 && mat.Tex1.Loaded) {
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, mat.Tex1.Texture);

			// texture clamping
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, mat.ClampTexture1 ? gl.CLAMP_TO_EDGE : gl.REPEAT);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, mat.ClampTexture1 ? gl.CLAMP_TO_EDGE : gl.REPEAT);
		}

		else {
			// not yet loaded or inactive
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, null);
		}

		gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);

		// texture 2
		if (mat.Tex2 && mat.Tex2.Loaded) {
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, mat.Tex2.Texture);
		}

		else {
			// not yet loaded or inactive
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, null);
		}

		gl.uniform1i(gl.getUniformLocation(program, "texture2"), 1);
	}
	/**
	 * Sets cull mode
	 * @param mode 1:font, 2:back (default), 3:front_and_back
	 * @public
	 */
	setCullMode(mode) {
		let gl = this.gl;
		let m = 0;

		if (mode == 1)
			m = gl.FRONT;

		else if (mode == 2)
			m = gl.BACK;

		else if (mode == 3)
			m = gl.FRONT_AND_BACK;

		gl.cullFace(m);
	}
	/**
	 * Draws a mesh buffer.
	 * Note, you might want to set the material of the mesh buffer before drawing it, use {@link setMaterial}()
	 * to do this before calling this function.
	 * @param {CL3D.MeshBuffer} buf the mesh buffer to draw.
	 * @public
	 */
	drawMeshBuffer(buf, indexCountToUse) {
		if (buf == null)
			return;

		if (this.gl == null)
			return;

		if (buf.RendererNativeArray == null)
			this.createRendererNativeArray(buf);

		else if (buf.OnlyUpdateBufferIfPossible)
			this.updateRendererNativeArray(buf);

		else if (buf.OnlyPositionsChanged)
			this.updatePositionsInRendererNativeArray(buf);

		buf.OnlyPositionsChanged = false;
		buf.OnlyUpdateBufferIfPossible = false;

		this.drawWebGlStaticGeometry(buf.RendererNativeArray, indexCountToUse);
	}
	/**
	 * Creates a mesh buffer native render array
	 * @private
	 */
	updateRendererNativeArray(buf) {
		if (buf.Vertices.length == 0 || buf.Indices.length == 0)
			return;

		if (buf.RendererNativeArray.vertexCount < buf.Vertices.length ||
			buf.RendererNativeArray.indexCount < buf.Indices.length) {
			buf.RendererNativeArray = null;
			this.createRendererNativeArray(buf);
			return;
		}

		if (buf.RendererNativeArray != null) {
			let gl = this.gl;
			let len = buf.Vertices.length;

			let positionsArray = buf.RendererNativeArray.positionsArray;
			let colorArray = buf.RendererNativeArray.colorArray;

			for (let i = 0; i < len; ++i) {
				let v = buf.Vertices[i];

				positionsArray[i * 3 + 0] = v.Pos.X;
				positionsArray[i * 3 + 1] = v.Pos.Y;
				positionsArray[i * 3 + 2] = v.Pos.Z;

				colorArray[i * 4 + 0] = CL3D.getRed(v.Color) / 255.0;
				colorArray[i * 4 + 1] = CL3D.getGreen(v.Color) / 255.0;
				colorArray[i * 4 + 2] = CL3D.getBlue(v.Color) / 255.0;
				colorArray[i * 4 + 3] = CL3D.getAlpha(v.Color) / 255.0;
			}

			gl.bindBuffer(gl.ARRAY_BUFFER, buf.RendererNativeArray.positionBuffer);
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, positionsArray);

			gl.bindBuffer(gl.ARRAY_BUFFER, buf.RendererNativeArray.colorBuffer);
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, colorArray);

			// this is used for particle systems. The indices only update when size of the array changes
			if (buf.RendererNativeArray.indexCount < buf.Indices.length) {
				let indexCount = buf.Indices.length;
				let indexArray = new WebGLUnsignedShortArray(indexCount);

				for (let j = 0; j < indexCount; j += 3) {
					indexArray[j + 0] = buf.Indices[j + 0];
					indexArray[j + 1] = buf.Indices[j + 2];
					indexArray[j + 2] = buf.Indices[j + 1];
				}

				buf.RendererNativeArray.indexBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf.RendererNativeArray.indexBuffer);
				gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexArray, gl.STATIC_DRAW);

				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
			}

			buf.RendererNativeArray.indexCount = buf.Indices.length;
			buf.RendererNativeArray.vertexCount = buf.Vertices.length;
		}
	}
	/**
	 * Creates a mesh buffer native render array
	 * @private
	 */
	updatePositionsInRendererNativeArray(buf) {
		if (buf.RendererNativeArray != null) {
			let gl = this.gl;
			let len = buf.Vertices.length;

			let positionsArray = buf.RendererNativeArray.positionsArray;

			for (let i = 0; i < len; ++i) {
				let v = buf.Vertices[i];

				positionsArray[i * 3 + 0] = v.Pos.X;
				positionsArray[i * 3 + 1] = v.Pos.Y;
				positionsArray[i * 3 + 2] = v.Pos.Z;
			}

			gl.bindBuffer(gl.ARRAY_BUFFER, buf.RendererNativeArray.positionBuffer);
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, positionsArray);
		}
	}
	/**
	 * Creates a mesh buffer native render array
	 * @private
	 */
	createRendererNativeArray(buf) {
		if (buf.RendererNativeArray == null) {
			let gl = this.gl;
			let obj = new Object();
			let len = buf.Vertices.length;

			let positionsArray = new WebGLFloatArray(len * 3);
			let normalsArray = new WebGLFloatArray(len * 3);
			let tcoordsArray = new WebGLFloatArray(len * 2);
			let tcoordsArray2 = new WebGLFloatArray(len * 2);
			let colorArray = new WebGLFloatArray(len * 4);

			let tangentsArray = null;
			let binormalsArray = null;
			if (buf.Tangents)
				tangentsArray = new WebGLFloatArray(len * 3);
			if (buf.Binormals)
				binormalsArray = new WebGLFloatArray(len * 3);

			for (let i = 0; i < len; ++i) {
				let v = buf.Vertices[i];

				positionsArray[i * 3 + 0] = v.Pos.X;
				positionsArray[i * 3 + 1] = v.Pos.Y;
				positionsArray[i * 3 + 2] = v.Pos.Z;

				normalsArray[i * 3 + 0] = v.Normal.X;
				normalsArray[i * 3 + 1] = v.Normal.Y;
				normalsArray[i * 3 + 2] = v.Normal.Z;

				tcoordsArray[i * 2 + 0] = v.TCoords.X;
				tcoordsArray[i * 2 + 1] = v.TCoords.Y;

				tcoordsArray2[i * 2 + 0] = v.TCoords2.X;
				tcoordsArray2[i * 2 + 1] = v.TCoords2.Y;

				colorArray[i * 4 + 0] = CL3D.getRed(v.Color) / 255.0;
				colorArray[i * 4 + 1] = CL3D.getGreen(v.Color) / 255.0;
				colorArray[i * 4 + 2] = CL3D.getBlue(v.Color) / 255.0;
				colorArray[i * 4 + 3] = CL3D.getAlpha(v.Color) / 255.0;
			}

			if (tangentsArray && binormalsArray) {
				for (let i = 0; i < len; ++i) {
					let t = buf.Tangents[i];

					tangentsArray[i * 3 + 0] = t.X;
					tangentsArray[i * 3 + 1] = t.Y;
					tangentsArray[i * 3 + 2] = t.Z;

					let b = buf.Binormals[i];

					binormalsArray[i * 3 + 0] = b.X;
					binormalsArray[i * 3 + 1] = b.Y;
					binormalsArray[i * 3 + 2] = b.Z;
				}
			}

			let indexCount = buf.Indices.length;
			let indexArray = new WebGLUnsignedShortArray(indexCount);

			for (let j = 0; j < indexCount; j += 3) {
				indexArray[j + 0] = buf.Indices[j + 0];
				indexArray[j + 1] = buf.Indices[j + 2];
				indexArray[j + 2] = buf.Indices[j + 1];
			}

			// create render arrays
			obj.positionBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, obj.positionBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, positionsArray, gl.DYNAMIC_DRAW); //gl.STATIC_DRAW); // set to dynamic draw to make it possible to update it later
			obj.positionsArray = positionsArray; // storing it for making it possible to update this later

			obj.texcoordsBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, obj.texcoordsBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, tcoordsArray, gl.STATIC_DRAW);

			obj.texcoordsBuffer2 = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, obj.texcoordsBuffer2);
			gl.bufferData(gl.ARRAY_BUFFER, tcoordsArray2, gl.STATIC_DRAW);

			obj.normalBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, obj.normalBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, normalsArray, gl.STATIC_DRAW);

			if (tangentsArray && binormalsArray) {
				obj.tangentBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, obj.tangentBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, tangentsArray, gl.STATIC_DRAW);

				obj.binormalBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, obj.binormalBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, binormalsArray, gl.STATIC_DRAW);
			}

			gl.bindBuffer(gl.ARRAY_BUFFER, null);

			obj.colorBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, colorArray, gl.STATIC_DRAW);
			obj.colorArray = colorArray; // storing it for making it possible to update this later

			gl.bindBuffer(gl.ARRAY_BUFFER, null);

			obj.indexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indexBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexArray, gl.STATIC_DRAW);

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

			// finalize
			obj.gl = gl;
			obj.indexCount = indexCount;
			obj.vertexCount = len;

			buf.RendererNativeArray = obj;
			buf.OnlyPositionsChanged = false;
			buf.OnlyUpdateBufferIfPossible = false;
		}
	}
	/**
	 * @private
	 */
	drawWebGlStaticGeometry(b, indexCountToUse) {
		//console.log("drawElementsBegin with " + b.indexCount + " indices " + b.positionBuffer + " " + b.texcoordsBuffer + " " + b.normalBuffer);
		let gl = this.gl;

		let withTangentsAndBinormals = b.tangentBuffer && b.binormalBuffer;

		// enable all of the vertex attribute arrays.
		gl.enableVertexAttribArray(0);
		gl.enableVertexAttribArray(1);
		gl.enableVertexAttribArray(2);
		gl.enableVertexAttribArray(3);
		gl.enableVertexAttribArray(4);

		// set up all the vertex attributes for vertices, normals and texCoords
		gl.bindBuffer(gl.ARRAY_BUFFER, b.positionBuffer);
		gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, b.texcoordsBuffer);
		gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, b.texcoordsBuffer2);
		gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, b.normalBuffer);
		gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, b.colorBuffer);
		gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 0, 0);

		if (withTangentsAndBinormals) {
			gl.enableVertexAttribArray(5);
			gl.enableVertexAttribArray(6);

			gl.bindBuffer(gl.ARRAY_BUFFER, b.tangentBuffer);
			gl.vertexAttribPointer(5, 3, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ARRAY_BUFFER, b.binormalBuffer);
			gl.vertexAttribPointer(6, 3, gl.FLOAT, false, 0, 0);
		}

		// bind the index array
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.indexBuffer);

		// matrices
		let mat = new CL3D.Matrix4(false);
		this.Projection.copyTo(mat);
		mat = mat.multiply(this.View);
		mat = mat.multiply(this.World);

		// set world view projection matrix
		let program = this.currentGLProgram;
		if (program.locWorldViewProj != null)
			gl.uniformMatrix4fv(program.locWorldViewProj, false, this.getMatrixAsWebGLFloatArray(mat));

		// set normal matrix
		if (program.locNormalMatrix != null) {
			// set the normal matrix
			let matnormal = new CL3D.Matrix4(true);
			this.Projection.copyTo(matnormal);
			matnormal = matnormal.multiply(this.View);
			matnormal = matnormal.multiply(this.World);
			matnormal.makeInverse();
			matnormal = matnormal.getTransposed(); // the second argument below, 'false', cannot be set to true because it doesn't work, so we have to transpose it ourselves

			gl.uniformMatrix4fv(program.locNormalMatrix, false, this.getMatrixAsWebGLFloatArray(matnormal));
		}

		// set model view
		if (program.locModelViewMatrix != null) {
			// set the model view matrix
			let matmodelview = new CL3D.Matrix4(true);
			matmodelview = matmodelview.multiply(this.View);
			matmodelview = matmodelview.multiply(this.World);

			gl.uniformMatrix4fv(program.locModelViewMatrix, false, this.getMatrixAsWebGLFloatArray(matmodelview));
		}

		// set model view
		if (program.locModelWorldMatrix != null) {
			// set the model world matrix
			gl.uniformMatrix4fv(program.locModelWorldMatrix, false, this.getMatrixAsWebGLFloatArray(this.World.getTransposed()));
		}

		// set light values
		if (program.locLightPositions != null)
			this.setDynamicLightsIntoConstants(program, withTangentsAndBinormals, withTangentsAndBinormals); // when using normal maps, we need word space coordinates of the light positions


		// set fog values
		if (program.locFogColor != null)
			this.gl.uniform4f(program.locFogColor, this.FogColor.R, this.FogColor.G, this.FogColor.B, 1.0);
		if (program.locFogDensity != null)
			this.gl.uniform1f(program.locFogDensity, this.FogDensity);

		// set shadow map values
		if (this.ShadowMapEnabled)
			this.setShadowMapDataIntoConstants(program);

		// set grass movement values
		if (program.locGrassMovement != null) {
			let grassMovement = ((CL3D.CLTimer.getTime() * this.WindSpeed) / 500.0) % 1000.0;
			this.gl.uniform1f(program.locGrassMovement, grassMovement);
			this.gl.uniform1f(program.locWindStrength, this.WindStrength);
		}

		// draw
		if (indexCountToUse == null)
			indexCountToUse = b.indexCount;

		gl.drawElements(gl.TRIANGLES, indexCountToUse, gl.UNSIGNED_SHORT, 0);

		//console.log("drawElementsEnd");
		// unbind optional buffers
		if (withTangentsAndBinormals) {
			gl.disableVertexAttribArray(5);
			gl.disableVertexAttribArray(6);

			/*gl.bindBuffer(gl.ARRAY_BUFFER, null);
			gl.vertexAttribPointer(5, 3, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ARRAY_BUFFER, null);
			gl.vertexAttribPointer(6, 3, gl.FLOAT, false, 0, 0);*/
		}
	}
	/**
	 * @private
	 */
	setShadowMapDataIntoConstants(program) {
		let gl = this.gl;

		if (this.ShadowMapLightMatrix && program.locWorldviewprojLight) {
			let m = new CL3D.Matrix4(true);
			m = m.multiply(this.ShadowMapLightMatrix);
			m = m.multiply(this.World);

			gl.uniformMatrix4fv(program.locWorldviewprojLight, false, this.getMatrixAsWebGLFloatArray(m));
		}

		if (this.ShadowMapLightMatrix2 && program.locWorldviewprojLight2) {
			let m = new CL3D.Matrix4(true);
			m = m.multiply(this.ShadowMapLightMatrix2);
			m = m.multiply(this.World);

			gl.uniformMatrix4fv(program.locWorldviewprojLight2, false, this.getMatrixAsWebGLFloatArray(m));
		}

		if (program.locShadowMapBias1)
			gl.uniform1f(program.locShadowMapBias1, this.ShadowMapBias1);

		if (program.locShadowMapBias2)
			gl.uniform1f(program.locShadowMapBias2, this.ShadowMapBias2);

		if (program.locShadowMapBackfaceBias)
			gl.uniform1f(program.locShadowMapBackfaceBias, this.ShadowMapBackfaceBias);

		if (program.locShadowMapOpacity)
			gl.uniform1f(program.locShadowMapOpacity, this.ShadowMapOpacity);

		// shadow map texture
		if (this.ShadowMapTexture) {
			gl.activeTexture(gl.TEXTURE2);
			gl.bindTexture(gl.TEXTURE_2D, this.ShadowMapTexture.Texture);
		}

		else {
			// not yet loaded or inactive
			gl.activeTexture(gl.TEXTURE2);
			gl.bindTexture(gl.TEXTURE_2D, null);
		}

		gl.uniform1i(gl.getUniformLocation(program, "shadowmap"), 2);


		if (CL3D.UseShadowCascade) {
			if (this.ShadowMapTexture2) {
				gl.activeTexture(gl.TEXTURE3);
				gl.bindTexture(gl.TEXTURE_2D, this.ShadowMapTexture2.Texture);
			}

			else {
				// not yet loaded or inactive
				gl.activeTexture(gl.TEXTURE3);
				gl.bindTexture(gl.TEXTURE_2D, null);
			}

			gl.uniform1i(gl.getUniformLocation(program, "shadowmap2"), 3);
		}
	}
	/**
	 * @private
	 */
	setDynamicLightsIntoConstants(program, useWorldSpacePositionsForLights, useOldNormalMappingAttenuationCalculation) {
		// we use two contants per light, where we pack Position, Color and Attenuation into, like this:
		// (px, py, pz, att) and (cr, cg, cb, 1)
		let buf1 = new ArrayBuffer(4 * 4 * Float32Array.BYTES_PER_ELEMENT);
		let positionArray = new WebGLFloatArray(buf1);

		let buf2 = new ArrayBuffer(5 * 4 * Float32Array.BYTES_PER_ELEMENT);
		let colorArray = new WebGLFloatArray(buf2);

		// calculate matrix to transform light position into object space (unless useWorldSpacePositionsForLights is true)
		let mat = new CL3D.Matrix4(true);

		if (!useWorldSpacePositionsForLights && ((this.Lights != null && this.Lights.length > 0) || this.DirectionalLight != null))
			this.World.getInverse(mat);

		// add all lights
		for (let i = 0; i < 4; ++i) {
			let idx = i * 4;

			if (this.Lights != null && i < this.Lights.length) {
				let l = this.Lights[i];

				let vt = mat.getTransformedVect(l.Position); // we need to set the position of the light in the current object's space

				positionArray[idx] = vt.X;
				positionArray[idx + 1] = vt.Y;
				positionArray[idx + 2] = vt.Z;

				let attenuation = 1.0;

				if (useOldNormalMappingAttenuationCalculation)
					attenuation = 1.0 / (l.Radius * l.Radius);

				else
					attenuation = l.Attenuation;

				positionArray[idx + 3] = attenuation;

				colorArray[idx] = l.Color.R;
				colorArray[idx + 1] = l.Color.G;
				colorArray[idx + 2] = l.Color.B;
				colorArray[idx + 3] = 1;
			}

			else {
				// add a dark light, since the shader expects 4 lights
				positionArray[idx] = 1;
				positionArray[idx + 1] = 0;
				positionArray[idx + 2] = 0;
				positionArray[idx + 3] = 1.0;

				colorArray[idx] = 0;
				colorArray[idx + 1] = 0;
				colorArray[idx + 2] = 0;
				colorArray[idx + 3] = 1;
			}
		}

		// add ambient light
		colorArray[16] = this.AmbientLight.R;
		colorArray[17] = this.AmbientLight.G;
		colorArray[18] = this.AmbientLight.B;
		colorArray[19] = 1.0;

		// send point lights and ambient light to 3d card
		this.gl.uniform4fv(program.locLightPositions, positionArray);
		this.gl.uniform4fv(program.locLightColors, colorArray);

		// add directional light
		if (program.locDirectionalLight != null) {
			let dirlight = this.DirectionalLight;

			let dir = null;

			if (dirlight && dirlight.Direction)
				dir = dirlight.Direction.clone();

			else
				dir = new CL3D.Vect3d(1, 0, 0);

			dir.multiplyThisWithScal(-1.0);

			mat.rotateVect(dir);
			dir.normalize();

			this.gl.uniform3f(program.locDirectionalLight, dir.X, dir.Y, dir.Z, 1.0);

			if (dirlight)
				this.gl.uniform4f(program.locDirectionalLightColor, dirlight.Color.R, dirlight.Color.G, dirlight.Color.B, 1.0);

			else
				this.gl.uniform4f(program.locDirectionalLightColor, 0.0, 0.0, 0.0, 1.0);
		}
	}
	/**
	 * @private
	 * Draws a 3d line with the current material
	 */
	draw3DLine(vect3dFrom, vect3dTo) {
		// TODO: implement
		//gl.drawElements(gl.LINES, b.indexCount, gl.UNSIGNED_SHORT, 0);
	}
	/**
	 * Draws a 2d rectangle
	 * @public
	 * @param x {Number} x coordinate in pixels
	 * @param y {Number} y coordinate in pixels
	 * @param width {Number} width of the rectangle in pixels
	 * @param height {Number} height of the rectangle in pixels
	 * @param color {Number} color of the rectangle. See CL3D.createColor()
	 * @param blend {Boolean} (optional) set to true to enable alpha blending (using the alpha component of the color) and false not to blend
	 */
	draw2DRectangle(x, y, width, height, color, blend) {
		if (width <= 0 || height <= 0 || this.width == 0 || this.height == 0)
			return;

		let doblend = true;
		if (blend == null || blend == false)
			doblend = false;

		let gl = this.gl;

		gl.enableVertexAttribArray(0);
		gl.disableVertexAttribArray(1);
		gl.disableVertexAttribArray(2);
		gl.disableVertexAttribArray(3);
		gl.disableVertexAttribArray(4);

		// transform to view
		y = this.height - y; // upside down
		let xFact = 2.0 / this.width;
		let yFact = 2.0 / this.height;

		x = (x * xFact) - 1;
		y = (y * yFact) - 1;
		width *= xFact;
		height *= yFact;

		// positions
		let positionsArray = new WebGLFloatArray(4 * 3);

		positionsArray[0] = x;
		positionsArray[1] = y;
		positionsArray[2] = 0;

		positionsArray[3] = x + width;
		positionsArray[4] = y;
		positionsArray[5] = 0;

		positionsArray[6] = x + width;
		positionsArray[7] = y - height;
		positionsArray[8] = 0;

		positionsArray[9] = x;
		positionsArray[10] = y - height;
		positionsArray[11] = 0;

		// indices
		let indexCount = 6;
		let indexArray = new WebGLUnsignedShortArray(indexCount);
		indexArray[0] = 0;
		indexArray[1] = 2;
		indexArray[2] = 1;
		indexArray[3] = 0;
		indexArray[4] = 3;
		indexArray[5] = 2;

		// create render arrays
		let positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, positionsArray, gl.STATIC_DRAW);
		gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

		let indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexArray, gl.STATIC_DRAW);

		// set shader
		this.currentGLProgram = this.Program2DDrawingColorOnly;
		gl.useProgram(this.currentGLProgram);

		// set color
		gl.uniform4f(gl.getUniformLocation(this.currentGLProgram, "vColor"),
			CL3D.getRed(color) / 255,
			CL3D.getGreen(color) / 255,
			CL3D.getBlue(color) / 255,
			doblend ? (CL3D.getAlpha(color) / 255) : 1.0);


		// set blend mode and other tests
		gl.depthMask(false);
		gl.disable(gl.DEPTH_TEST);

		if (!doblend) {
			gl.disable(gl.BLEND);
		}

		else {
			gl.enable(gl.BLEND);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		}

		// draw
		gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);

		// clean up again
		gl.deleteBuffer(positionBuffer);
		gl.deleteBuffer(indexBuffer);
	}
	/**
	 * Draws a 2d image
	 * @public
	 * @param {Number} x x coordinate in pixels
	 * @param {Number} y y coordinate in pixels
	 * @param {Number} width width of the rectangle in pixels
	 * @param {Number} height height of the rectangle in pixels
	 * @param {CL3D.Texture} tex texture to draw
	 * @param {Boolean} blend (optional) set to true to enable alpha blending (using the alpha component of the color) and false not to blend
	 * @param shaderToUse (optional) shader to be used or null if the default shader should be used. Set this to something returned by getGLProgramFromMaterialType() for example.
	 */
	draw2DImage(x, y, width, height, tex, blend, shaderToUse, srcRightX, srcBottomY, sharp) {
		if (tex == null || tex.isLoaded() == false || width <= 0 || height <= 0 || this.width == 0 || this.height == 0)
			return;

		if (srcRightX == null)
			srcRightX = 1.0;
		if (srcBottomY == null)
			srcBottomY = 1.0;

		let doblend = true;
		if (blend == null || blend == false)
			doblend = false;

		let gl = this.gl;

		gl.enableVertexAttribArray(0);
		gl.enableVertexAttribArray(1);
		gl.disableVertexAttribArray(2);
		gl.disableVertexAttribArray(3);
		gl.disableVertexAttribArray(4);

		// transform to view
		y = this.height - y; // upside down
		let xFact = 2.0 / this.width;
		let yFact = 2.0 / this.height;

		x = (x * xFact) - 1;
		y = (y * yFact) - 1;
		width *= xFact;
		height *= yFact;

		// positions
		let positionsArray = new WebGLFloatArray(4 * 3);

		positionsArray[0] = x;
		positionsArray[1] = y;
		positionsArray[2] = 0;

		positionsArray[3] = x + width;
		positionsArray[4] = y;
		positionsArray[5] = 0;

		positionsArray[6] = x + width;
		positionsArray[7] = y - height;
		positionsArray[8] = 0;

		positionsArray[9] = x;
		positionsArray[10] = y - height;
		positionsArray[11] = 0;

		// texture coordinates
		let tcoordsArray = new WebGLFloatArray(4 * 2);

		tcoordsArray[0] = 0;
		tcoordsArray[1] = 0;

		tcoordsArray[2] = srcRightX;
		tcoordsArray[3] = 0;

		tcoordsArray[4] = srcRightX;
		tcoordsArray[5] = srcBottomY;

		tcoordsArray[6] = 0;
		tcoordsArray[7] = srcBottomY;

		// indices
		let indexCount = 6;
		let indexArray = new WebGLUnsignedShortArray(indexCount);
		indexArray[0] = 0;
		indexArray[1] = 2;
		indexArray[2] = 1;
		indexArray[3] = 0;
		indexArray[4] = 3;
		indexArray[5] = 2;

		// create render arrays
		let positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, positionsArray, gl.STATIC_DRAW);
		gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

		let tcoordsBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, tcoordsBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, tcoordsArray, gl.STATIC_DRAW);
		gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

		let indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexArray, gl.STATIC_DRAW);

		// set shader
		if (shaderToUse == null)
			this.currentGLProgram = this.Program2DDrawingTextureOnly;

		else
			this.currentGLProgram = shaderToUse;

		gl.useProgram(this.currentGLProgram);

		// set blend mode and other tests
		gl.depthMask(false);
		gl.disable(gl.DEPTH_TEST);

		if (!doblend) {
			gl.disable(gl.BLEND);
		}

		else {
			gl.enable(gl.BLEND);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		}

		// set texture
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, tex.getWebGLTexture());

		// disable blur
		if (sharp) {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		}

		else {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		}

		// texture clamping
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		// disable texture 2
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, null);

		// draw
		gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);

		// clean up again
		gl.deleteBuffer(tcoordsBuffer);
		gl.deleteBuffer(positionBuffer);
		gl.deleteBuffer(indexBuffer);

		//if (disableBlur)
		{
			// reset to default again
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, tex.getWebGLTexture());
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		}
	}
	/**
	 * @private
	 * internal drawing function for drawing 2d overlay fonts
	 */
	draw2DFontImage(x, y, width, height, tex, color) {
		if (tex == null || tex.isLoaded() == false || width <= 0 || height <= 0 || this.width == 0 || this.height == 0)
			return;

		let doblend = true;
		let gl = this.gl;

		this.currentGLProgram = this.Program2DDrawingCanvasFontColor;
		gl.useProgram(this.currentGLProgram);

		// TODO: in the latest release, non-power-of-two textures do not work anymore, so ALL
		// out font textures are scaled up. we need to fix this later by drawing them with the actual size and not scaling them up
		// set color
		gl.uniform4f(gl.getUniformLocation(this.currentGLProgram, "vColor"),
			CL3D.getRed(color) / 255,
			CL3D.getGreen(color) / 255,
			CL3D.getBlue(color) / 255,
			doblend ? (CL3D.getAlpha(color) / 255) : 1.0);

		//this.draw2DImage(x, y, width, height, tex, doblend, this.Program2DDrawingCanvasFontColor, );
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		this.draw2DImage(x, y, width, height, tex, doblend, this.Program2DDrawingCanvasFontColor, tex.OriginalWidth / tex.CachedWidth, tex.OriginalHeight / tex.CachedHeight, true);
	}
	/**
	 * Starts the drawing process by clearing the whole scene. Is called by {@link CopperLicht.draw3dScene}(),
	 * so it shouldn't be necessary to call this yourself.
	 * @public
	 * @param clearColor {Number} Color for the background. See {@link CL3D.createColor}.
	 */
	beginScene(clearColor) {
		if (this.gl == null)
			return;

		//console.log("drawBegin");
		// adjust size
		this.ensuresizeok();

		// clear graphics here
		let gl = this.gl;

		gl.clearDepth(this.InvertedDepthTest ? 0.0 : 1.0);
		gl.depthMask(true);
		gl.clearColor(CL3D.getRed(clearColor) / 255.0,
			CL3D.getGreen(clearColor) / 255.0,
			CL3D.getBlue(clearColor) / 255.0,
			1); //CL3D.getAlpha(clearColor) / 255.0);

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}
	/**
	 * Clears the z buffer
	 * @public
	 */
	clearZBuffer() {
		let gl = this.gl;
		gl.clearDepth(this.InvertedDepthTest ? 0.0 : 1.0);
		gl.depthMask(true);
		gl.clear(gl.DEPTH_BUFFER_BIT);
	}
	/**
	 * Ends the drawing process by flushing the renderin instructions. Is called by {@link CopperLicht.draw3dScene}(),
	 * so it shouldn't be necessary to call this yourself.
	 * @public
	 */
	endScene() {
		if (this.gl == null)
			return;

		let gl = this.gl;

		gl.flush();
		//gl.swap();

		//console.log("drawEnd");
	}
	/**
	 * Clears all dynamic lights in the rendering pipeline. Is called by {@link CopperLicht.draw3dScene}(),
	 * so it shouldn't be necessary to call this yourself.
	 * @public
	 */
	clearDynamicLights() {
		this.Lights = new Array();
		this.DirectionalLight = null;
	}
	/**
	 * Adds a new dynamic light to the rendering pipeline.
	 * @public
	  * @param {CL3D.Light} l light data of the light to add
	 */
	addDynamicLight(l) {
		this.Lights.push(l);
	}
	/**
	 * Sets the current dynamic directional light to the rendering pipeline.
	 * The renderer supports an unlimited amount of point lights and one directional light.
	 * @public
	  * @param {CL3D.Light} l light data of the light to add
	 */
	setDirectionalLight(l) {
		this.DirectionalLight = l;
	}
	/**
	 * @private
	 */
	ensuresizeok() {
		if (this.canvas == null || this.gl == null)
			return;

		if (this.width == this.canvas.width &&
			this.height == this.canvas.height)
			return;

		this.width = this.canvas.width;
		this.height = this.canvas.height;

		let gl = this.gl;

		// Set the viewport and projection matrix for the scene
		if (gl.viewport)
			gl.viewport(0, 0, this.width, this.height);

		//console.log("adjusted size: " + this.width + " " + this.height);
	}
	/**
	 * @private
	 */
	init(canvaselement, /*width, height, native*/) {
		this.canvas = canvaselement;

		this.gl = null;
		// this.width = width;
		// this.height = height;
		try {
			//this.gl = createContext(this.width, this.height, window: native }); // { antialias: true }
			this.gl = this.canvas.getContext("webgl2", {alpha: false });
			this.UsesWebGL2 = true;
		}
		catch (e) {
			console.log(e);
		}

		if (this.gl == null) {
			return false;
		}

		else {
			this.removeCompatibilityProblems();
			this.initWebGL();
			this.ensuresizeok();
		}

		return true;
	}
	/**
	 * @private
	 */
	removeCompatibilityProblems() {
		// WebKit and Chrome:
		// 20. Aug 2010: WebGLFloatArray has been renamed to Float32Array and
		// WebGLUnsignedShortArray to Uint16Array
		if (typeof WebGLFloatArray == 'undefined' &&
			typeof Float32Array != 'undefined') {
			try {
				globalThis.WebGLFloatArray = Float32Array;
				globalThis.WebGLUnsignedShortArray = Uint16Array;
			}
			catch (e) {
				console.log("Error: Float32 array types for webgl not found.");
			}
		}

		/*
		if ( typeof WebGLIntArray == 'undefined' &&
			 typeof Int32Array != 'undefined' )
		{
			try
			{
				WebGLIntArray = Int32Array;
			}
			catch (e)
			{
				console.log("Error: Int32 array types for webgl not found.");
			}
		}
		*/
		// Firefox:
		// The WebGL*Array where named Canvas*Array in the past.
		// However, this will only affect old nightly builds. The current nightly does already
		// support the new names. (13 Dec 2009).
		if (typeof WebGLFloatArray == 'undefined' &&
			typeof CanvasFloatArray != 'undefined') {
			try {
				WebGLFloatArray = CanvasFloatArray;
				WebGLUnsignedShortArray = CanvasUnsignedShortArray;

				// others, not used by copperlicht
				//WebGLArrayBuffer = CanvasArrayBuffer;
				//WebGLByteArray = CanvasByteArray;
				//WebGLUnsignedByteArray = CanvasUnsignedByteArray;
				//WebGLShortArray = CanvasShortArray;
				//WebGLIntArray = CanvasIntArray;
				//WebGLUnsignedIntArray = CanvasUnsignedIntArray;
			}
			catch (e) {
				console.log("Error: canvas array types for webgl not found.");
			}
		}

		let gl = this.gl;

		// Google Chrome compatibility code
		// Since a JavaScript function may have multiple return types, functions
		// 'getProgrami' and 'getShaderi' where renamed. However, Chrome does still
		// use the old names.  (30 Nov 2009)
		if (!gl['getProgramParameter'])
			gl['getProgramParameter'] = gl['getProgrami'];
		if (!gl['getShaderParameter'])
			gl['getShaderParameter'] = gl['getShaderi'];
	}
	/**
	 * @private
	 */
	loadShader(shaderType, shaderSource) {
		let gl = this.gl;
		let shader = gl.createShader(shaderType);
		if (shader == null)
			return null;

		gl.shaderSource(shader, shaderSource);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			if (this.printShaderErrors) {
				let strType = (shaderType == gl.VERTEX_SHADER) ? "vertex" : "fragment";
				let msg = "Error loading " + strType + " shader: " + gl.getShaderInfoLog(shader);
				if (CL3D.gCCDebugInfoEnabled)
					console.log(msg);
			}
			return null;
		}

		return shader;
	}
	/**
	 * @private
	 */
	createShaderProgram(vertexShaderSource, fragmentShaderSource, useBinormalsAndTangents) {
		// create shader
		let gl = this.gl;

		let finalVertexShader = vertexShaderSource;
		let finalFramentShader = fragmentShaderSource;

		let head_append = GLSL`
		#version 100
		precision mediump float;
		`;

		if (finalVertexShader.indexOf('#version 100') == -1)
			finalVertexShader = head_append + vertexShaderSource;

		if (finalFramentShader.indexOf('#version 100') == -1)
			finalFramentShader = head_append + fragmentShaderSource;

		let vertexShader = this.loadShader(gl.VERTEX_SHADER, finalVertexShader);
		let fragmentShader = this.loadShader(gl.FRAGMENT_SHADER, finalFramentShader);

		if (!vertexShader || !fragmentShader) {
			if (this.printShaderErrors)
				console.log("Could not create shader program");
			return null;
		}

		// create program
		// create program object
		let program = gl.createProgram();

		// attach our two shaders to the program
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);

		// setup attributes (optional)
		gl.bindAttribLocation(program, 0, "vPosition");
		gl.bindAttribLocation(program, 1, "vTexCoord1");
		gl.bindAttribLocation(program, 2, "vTexCoord2");
		gl.bindAttribLocation(program, 3, "vNormal");
		gl.bindAttribLocation(program, 4, "vColor");

		if (useBinormalsAndTangents) {
			gl.bindAttribLocation(program, 5, "vBinormal");
			gl.bindAttribLocation(program, 6, "vTangent");
		}

		//gl.bindTexture(gl.TEXTURE_2D, mat.Tex1.Texture);
		// linking
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			if (this.printShaderErrors)
				console.log("Could not link program:" + gl.getProgramInfoLog(program));
		}

		else {
			gl.useProgram(program);
			gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);
			gl.uniform1i(gl.getUniformLocation(program, "texture2"), 1);
		}

		// setup uniforms (optional)
		//this.gl.useProgram(program);
		//this.gl.uniform1i(gl.getUniformLocation(program, "uTexture"), 0);
		return program;
	}
	/**
	 * Creates a new CL3D.Material type with custom shaders. Returns an id which can be used in {@link Material.Type}.
	 * There is a tutorial showing how to create a new CL3D.Material in the documentation, but also this short
	 * example may give an overview:
	 * @public
	 * @example
	 * // add a cube to test out
	 * let cubenode = new CubeSceneNode();
	 * scene.getRootSceneNode().addChild(cubenode);
	 * cubenode.getMaterial(0).Tex1 =
	 *   engine.getTextureManager().getTexture("crate_wood.jpg", true);
	 *
	 * // now, we want to use a custom material for our cube, lets write
	 * // a vertex and a fragment shader:
	 * // (note: there must be no character, even no space behind
	 * // the '\' characters).
	 * let vertex_shader = "           \
	 *   uniform mat4 worldviewproj;   \
	 *   attribute vec4 vPosition;     \
	 *   attribute vec4 vNormal;       \
	 *   attribute vec2 vTexCoord1;    \
	 *   attribute vec2 vTexCoord2;    \
	 *   varying vec2 v_texCoord1;     \
	 *   varying vec2 v_texCoord2;     \
	 *   void main()                   \
	 *   {                             \
	 *     gl_Position = worldviewproj * vPosition;\
	 *     v_texCoord1 = vTexCoord1.st; \
	 *     v_texCoord2 = vTexCoord2.st; \
	 *   }";
	 *
	 *  let fragment_shader = "        \
	 *   uniform sampler2D texture1;   \
	 *   uniform sampler2D texture2;   \
	 *                                 \
	 *   varying vec2 v_texCoord1;     \
	 *   varying vec2 v_texCoord2;     \
	 *                                 \
	 *   void main()                   \
	 *   {                             \
	 *     vec2 texCoord = vec2(v_texCoord1.s, v_texCoord1.t); \
	 *     gl_FragColor = texture2D(texture1, texCoord) * 2; \
	 *   }";
	 *
	 *  // create a solid material using the shaders. For transparent materials,
	 *  // take a look at the other parameters of createMaterialType
	 *  let newMaterialType = engine.getRenderer().createMaterialType(vertex_shader, fragment_shader);
	 *  if (newMaterialType != -1)
	 *    cubenode.getMaterial(0).Type = newMaterialType;
	 *  else
	 *    alert('could not create shader');
	 * @param vertexShaderSource {String} Source for the vertex shader of the new CL3D.Material. CopperLicht will set the current
	 *  World-View-Projection matrix in an attribute named 'worldviewproj' (if existing), the world transformation matrix into 'worldtransform', the normal transformation matrix in an attribute named
	 *  'normaltransform' if available, and the concatenated view model transformation into an attribute named 'modelviewtransform', if available.
	 * Positions will be stored in vPosition,
	 * normals in vNormal, the first texture coordinate in vTexCoord1 and the second in vTexCoord2.
	 * All other variables will need to be set manually by you. Use {@link getGLProgramFromMaterialType} to do this.
	 * @param fragmentShaderSource {String} Source for the fragment shader of the new CL3D.Material. If the fragment shader uses a variable 'texture1' and 'texture2' as in the example above, CopperLicht will set this to the textures of the current material.
	 * @param blendenabled  {Boolean} this is optional and can be set to true to enable blending. See next two parameters. Note: When creating
	 * a transparent material, in order to let it be sorted correctly by CopperLicht, override the {@link Material.isTransparent} to return true for
	 * your material type.
	 * @param blendsfactor this is optional. Blend source factor, when blending is enabled. Set to a webGL blend factor like gl.ONE or gl.SRC_ALPHA. You can get the gl object by using {@link getWebGL()}.
	 * @param blenddfactor this is optional. Blend destination factor, when blending is enabled. Set to a webGL blend factor like gl.ONE_MINUS_SRC_ALPHA or gl.ONE_MINUS_SRC_COLOR. You can get the gl object by using {@link getWebGL()}.
	 * @param functionShaderCallback {function} an optional function which should be called when the material is being used. Can be used to set shader variables.
	 */
	createMaterialType(vertexShaderSource, fragmentShaderSource, blendenabled,
		blendsfactor, blenddfactor, functionShaderCallback) {
		let program = this.createMaterialTypeInternal(vertexShaderSource, fragmentShaderSource, blendenabled, blendsfactor, blenddfactor);
		if (!program)
			return -1;

		program.shaderCallback = functionShaderCallback;

		this.MinExternalMaterialTypeId += 1;
		this.MaterialPrograms[this.MinExternalMaterialTypeId] = program;
		this.MaterialProgramsWithLight[this.MinExternalMaterialTypeId] = program;
		this.MaterialProgramsFog[this.MinExternalMaterialTypeId] = program;
		this.MaterialProgramsWithLightFog[this.MinExternalMaterialTypeId] = program;
		this.MaterialProgramsWithShadowMap[this.MinExternalMaterialTypeId] = program;

		return this.MinExternalMaterialTypeId;
	}
	/**
	 * Returns the webgl shader program from a material type. This is useful when you are using {@link createMaterialType} to create your
	 * own shaders and need to set material constants using for example uniform1i.
	 * @public
	 * @param mattype {int} The material type, like for example {@link Material.EMT_SOLID}, or your own material type returned by {@link createMaterialType}.
	 * @returns {program} Returns the WebGL shader program or null if not found.
	 */
	getGLProgramFromMaterialType(mattype) {
		let program = null;
		try {
			program = this.MaterialPrograms[mattype];
		}
		catch (e) { }

		return program;
	}
	/**
	 * @private
	 */
	createMaterialTypeInternal(vsshader, fsshader, blendenabled, blendsfactor, blenddfactor, useBinormalsAndTangents) {
		if (useBinormalsAndTangents == null)
			useBinormalsAndTangents = false;

		let program = this.createShaderProgram(vsshader, fsshader, useBinormalsAndTangents);
		if (program) {
			// store blend mode
			program.blendenabled = blendenabled ? blendenabled : false;
			program.blendsfactor = blendsfactor;
			program.blenddfactor = blenddfactor;

			let gl = this.gl;

			// store preset shader attribute locations
			program.locWorldViewProj = gl.getUniformLocation(program, "worldviewproj");
			program.locNormalMatrix = gl.getUniformLocation(program, "normaltransform");
			program.locModelViewMatrix = gl.getUniformLocation(program, "modelviewtransform");
			program.locModelWorldMatrix = gl.getUniformLocation(program, "worldtransform");
			program.locLightPositions = gl.getUniformLocation(program, "arrLightPositions");
			program.locLightColors = gl.getUniformLocation(program, "arrLightColors");
			program.locDirectionalLight = gl.getUniformLocation(program, "vecDirLight");
			program.locDirectionalLightColor = gl.getUniformLocation(program, "colorDirLight");
			program.locFogColor = gl.getUniformLocation(program, "fogColor");
			program.locFogDensity = gl.getUniformLocation(program, "fogDensity");
			program.locGrassMovement = gl.getUniformLocation(program, "grassMovement");
			program.locWindStrength = gl.getUniformLocation(program, "windStrength");

			// locations for shadow maps related attributes
			program.locWorldviewprojLight = gl.getUniformLocation(program, "worldviewprojLight");
			program.locWorldviewprojLight2 = gl.getUniformLocation(program, "worldviewprojLight2");
			program.locShadowMapBias1 = gl.getUniformLocation(program, "shadowMapBias1");
			program.locShadowMapBias2 = gl.getUniformLocation(program, "shadowMapBias2");
			program.locShadowMapBackfaceBias = gl.getUniformLocation(program, "shadowMapBackFaceBias");
			program.locShadowMapOpacity = gl.getUniformLocation(program, "shadowOpacity");


			// shader callback function default to null
			program.shaderCallback = null;
		}

		return program;
	}
	/**
	 * @private
	 */
	initWebGL() {
		let gl = this.gl;

		// don't console.log shader errors
		this.printShaderErrors = true;

		// -------------------------------------------------------------
		// create shaders without lighting
		let fallbackShader = this.createMaterialTypeInternal(this.vs_shader_normaltransform, this.fs_shader_onlyfirsttexture_gouraud);

		let programStandardMaterial = fallbackShader;
		let programLightmapMaterial = this.createMaterialTypeInternal(this.vs_shader_normaltransform, this.fs_shader_lightmapcombine);
		let programLightmapMaterial_m4 = this.createMaterialTypeInternal(this.vs_shader_normaltransform, this.fs_shader_lightmapcombine_m4);
		let programTransparentAlphaChannel = this.createMaterialTypeInternal(this.vs_shader_normaltransform, this.fs_shader_onlyfirsttexture_gouraud, true, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		let programTransparentAlphaChannelRef = this.createMaterialTypeInternal(this.vs_shader_normaltransform, this.fs_shader_onlyfirsttexture_gouraud_alpharef, true, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		let programTransparentAlphaChannelRefMoveGrass = this.createMaterialTypeInternal(this.vs_shader_normaltransform_movegrass, this.fs_shader_onlyfirsttexture_gouraud_alpharef, true, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		let programTransparentAdd = this.createMaterialTypeInternal(this.vs_shader_normaltransform, this.fs_shader_onlyfirsttexture_gouraud, true, gl.ONE, gl.ONE_MINUS_SRC_COLOR);
		let programReflectionMaterial = this.createMaterialTypeInternal(this.vs_shader_reflectiontransform, this.fs_shader_lightmapcombine);
		let programTranspReflectionMaterial = this.createMaterialTypeInternal(this.vs_shader_reflectiontransform, this.fs_shader_lightmapcombine, true, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		let programGouraudShaded = this.createMaterialTypeInternal(this.vs_shader_normaltransform_gouraud, this.fs_shader_onlyfirsttexture_gouraud);
		let programNormalmappedMaterial = this.createMaterialTypeInternal(this.vs_shader_normalmappedtransform, this.fs_shader_normalmapped);
		let programSolidVertexAlphaTwoTextureBlendMaterial = this.createMaterialTypeInternal(this.vs_shader_normaltransform, this.fs_shader_vertex_alpha_two_textureblend);

		this.Program2DDrawingColorOnly = this.createMaterialTypeInternal(this.vs_shader_2ddrawing_coloronly, this.fs_shader_simplecolor);
		this.Program2DDrawingTextureOnly = this.createMaterialTypeInternal(this.vs_shader_2ddrawing_texture, this.fs_shader_onlyfirsttexture);
		this.Program2DDrawingCanvasFontColor = this.createMaterialTypeInternal(this.vs_shader_2ddrawing_texture, this.fs_shader_2ddrawing_canvasfont);

		this.MaterialPrograms[CL3D.Material.EMT_SOLID] = programStandardMaterial;
		this.MaterialPrograms[CL3D.Material.EMT_SOLID + 1] = programStandardMaterial;
		this.MaterialPrograms[CL3D.Material.EMT_LIGHTMAP] = programLightmapMaterial;
		this.MaterialPrograms[CL3D.Material.EMT_LIGHTMAP + 1] = programLightmapMaterial;
		this.MaterialPrograms[CL3D.Material.EMT_LIGHTMAP + 2] = programLightmapMaterial;
		this.MaterialPrograms[CL3D.Material.EMT_LIGHTMAP + 3] = programLightmapMaterial_m4;
		this.MaterialPrograms[CL3D.Material.EMT_TRANSPARENT_ADD_COLOR] = programTransparentAdd;
		this.MaterialPrograms[CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL] = programTransparentAlphaChannel;
		this.MaterialPrograms[CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL_REF] = programTransparentAlphaChannelRef;
		this.MaterialPrograms[CL3D.Material.EMT_REFLECTION_2_LAYER] = programReflectionMaterial;
		this.MaterialPrograms[CL3D.Material.EMT_TRANSPARENT_REFLECTION_2_LAYER] = programTranspReflectionMaterial;
		this.MaterialPrograms[CL3D.Material.EMT_NORMAL_MAP_SOLID] = programNormalmappedMaterial;
		this.MaterialPrograms[CL3D.Material.EMT_SOLID_VERTEX_ALPHA_TWO_TEXTURE_BLEND] = programSolidVertexAlphaTwoTextureBlendMaterial;
		this.MaterialPrograms[CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL_REF_MOVING_GRASS] = programTransparentAlphaChannelRefMoveGrass;

		// EMT_ONETEXTURE_BLEND
		this.MaterialPrograms[23] = programGouraudShaded;

		// -------------------------------------------------------------
		// now do the same with materials with lighting
		programStandardMaterial = this.createMaterialTypeInternal(this.vs_shader_normaltransform_with_light, this.fs_shader_onlyfirsttexture_gouraud);
		programTransparentAlphaChannel = this.createMaterialTypeInternal(this.vs_shader_normaltransform_with_light, this.fs_shader_onlyfirsttexture_gouraud, true, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		programTransparentAlphaChannelRef = this.createMaterialTypeInternal(this.vs_shader_normaltransform_with_light, this.fs_shader_onlyfirsttexture_gouraud_alpharef, true, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		programTransparentAlphaChannelRefMoveGrass = this.createMaterialTypeInternal(this.vs_shader_normaltransform_with_light_movegrass, this.fs_shader_onlyfirsttexture_gouraud_alpharef, true, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		programTransparentAdd = this.createMaterialTypeInternal(this.vs_shader_normaltransform_with_light, this.fs_shader_onlyfirsttexture_gouraud, true, gl.ONE, gl.ONE_MINUS_SRC_COLOR);

		programReflectionMaterial = this.createMaterialTypeInternal(this.vs_shader_reflectiontransform_with_light, this.fs_shader_lightmapcombine_gouraud);
		programTranspReflectionMaterial = this.createMaterialTypeInternal(this.vs_shader_reflectiontransform_with_light, this.fs_shader_lightmapcombine_gouraud, true, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		programSolidVertexAlphaTwoTextureBlendMaterial = this.createMaterialTypeInternal(this.vs_shader_normaltransform_with_light, this.fs_shader_vertex_alpha_two_textureblend);

		this.MaterialProgramsWithLight[CL3D.Material.EMT_SOLID] = programStandardMaterial;
		this.MaterialProgramsWithLight[CL3D.Material.EMT_SOLID + 1] = programStandardMaterial;
		this.MaterialProgramsWithLight[CL3D.Material.EMT_LIGHTMAP] = programLightmapMaterial;
		this.MaterialProgramsWithLight[CL3D.Material.EMT_LIGHTMAP + 1] = programLightmapMaterial;
		this.MaterialProgramsWithLight[CL3D.Material.EMT_LIGHTMAP + 2] = programLightmapMaterial;
		this.MaterialProgramsWithLight[CL3D.Material.EMT_LIGHTMAP + 3] = programLightmapMaterial_m4;
		this.MaterialProgramsWithLight[CL3D.Material.EMT_TRANSPARENT_ADD_COLOR] = programTransparentAdd;
		this.MaterialProgramsWithLight[CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL] = programTransparentAlphaChannel;
		this.MaterialProgramsWithLight[CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL_REF] = programTransparentAlphaChannelRef;
		this.MaterialProgramsWithLight[CL3D.Material.EMT_REFLECTION_2_LAYER] = programReflectionMaterial;
		this.MaterialProgramsWithLight[CL3D.Material.EMT_TRANSPARENT_REFLECTION_2_LAYER] = programTranspReflectionMaterial;
		this.MaterialProgramsWithLight[CL3D.Material.EMT_NORMAL_MAP_SOLID] = programNormalmappedMaterial;
		this.MaterialProgramsWithLight[CL3D.Material.EMT_SOLID_VERTEX_ALPHA_TWO_TEXTURE_BLEND] = programSolidVertexAlphaTwoTextureBlendMaterial;
		this.MaterialProgramsWithLight[CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL_REF_MOVING_GRASS] = programTransparentAlphaChannelRefMoveGrass;


		// -------------------------------------------------------------
		// now create both material types also with fog support
		let programStandardMaterialFog = this.createMaterialTypeInternal(this.vs_shader_normaltransform, this.fs_shader_onlyfirsttexture_gouraud_fog);
		let programLightmapMaterialFog = this.createMaterialTypeInternal(this.vs_shader_normaltransform, this.fs_shader_lightmapcombine_fog);
		let programLightmapMaterial_m4Fog = this.createMaterialTypeInternal(this.vs_shader_normaltransform, this.fs_shader_lightmapcombine_m4_fog);
		let programTransparentAlphaChannelFog = this.createMaterialTypeInternal(this.vs_shader_normaltransform, this.fs_shader_onlyfirsttexture_gouraud_fog, true, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		let programTransparentAlphaChannelRefFog = this.createMaterialTypeInternal(this.vs_shader_normaltransform, this.fs_shader_onlyfirsttexture_gouraud_alpharef_fog, true, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		let programTransparentAlphaChannelRefFogMoveGrass = this.createMaterialTypeInternal(this.vs_shader_normaltransform_movegrass, this.fs_shader_onlyfirsttexture_gouraud_alpharef_fog, true, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		let programTransparentAddFog = this.createMaterialTypeInternal(this.vs_shader_normaltransform, this.fs_shader_onlyfirsttexture_gouraud_fog, true, gl.ONE, gl.ONE_MINUS_SRC_COLOR);
		let programReflectionMaterialFog = this.createMaterialTypeInternal(this.vs_shader_reflectiontransform, this.fs_shader_lightmapcombine_fog);
		let programTranspReflectionMaterialFog = this.createMaterialTypeInternal(this.vs_shader_reflectiontransform, this.fs_shader_lightmapcombine_fog, true, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		let programGouraudShadedFog = this.createMaterialTypeInternal(this.vs_shader_normaltransform_gouraud, this.fs_shader_onlyfirsttexture_gouraud_fog);
		let programNormalmappedMaterialFog = this.createMaterialTypeInternal(this.vs_shader_normalmappedtransform, this.fs_shader_normalmapped);
		let programSolidVertexAlphaTwoTextureBlendMaterialFog = this.createMaterialTypeInternal(this.vs_shader_normaltransform, this.fs_shader_vertex_alpha_two_textureblend_fog);

		this.MaterialProgramsFog[CL3D.Material.EMT_SOLID] = programStandardMaterialFog;
		this.MaterialProgramsFog[CL3D.Material.EMT_SOLID + 1] = programStandardMaterialFog;
		this.MaterialProgramsFog[CL3D.Material.EMT_LIGHTMAP] = programLightmapMaterialFog;
		this.MaterialProgramsFog[CL3D.Material.EMT_LIGHTMAP + 1] = programLightmapMaterialFog;
		this.MaterialProgramsFog[CL3D.Material.EMT_LIGHTMAP + 2] = programLightmapMaterialFog;
		this.MaterialProgramsFog[CL3D.Material.EMT_LIGHTMAP + 3] = programLightmapMaterial_m4Fog;
		this.MaterialProgramsFog[CL3D.Material.EMT_TRANSPARENT_ADD_COLOR] = programTransparentAddFog;
		this.MaterialProgramsFog[CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL] = programTransparentAlphaChannelFog;
		this.MaterialProgramsFog[CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL_REF] = programTransparentAlphaChannelRefFog;
		this.MaterialProgramsFog[CL3D.Material.EMT_REFLECTION_2_LAYER] = programReflectionMaterialFog;
		this.MaterialProgramsFog[CL3D.Material.EMT_TRANSPARENT_REFLECTION_2_LAYER] = programTranspReflectionMaterialFog;
		this.MaterialProgramsFog[CL3D.Material.EMT_NORMAL_MAP_SOLID] = programNormalmappedMaterialFog;
		this.MaterialProgramsFog[CL3D.Material.EMT_SOLID_VERTEX_ALPHA_TWO_TEXTURE_BLEND] = programSolidVertexAlphaTwoTextureBlendMaterialFog;
		this.MaterialProgramsFog[CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL_REF_MOVING_GRASS] = programTransparentAlphaChannelRefFogMoveGrass;

		// EMT_ONETEXTURE_BLEND
		this.MaterialProgramsFog[23] = programGouraudShadedFog;

		// -------------------------------------------------------------
		// dynamic light shaders with fog support
		programStandardMaterialFog = this.createMaterialTypeInternal(this.vs_shader_normaltransform_with_light, this.fs_shader_onlyfirsttexture_gouraud_fog);
		programTransparentAlphaChannelFog = this.createMaterialTypeInternal(this.vs_shader_normaltransform_with_light, this.fs_shader_onlyfirsttexture_gouraud_fog, true, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		programTransparentAlphaChannelRefFog = this.createMaterialTypeInternal(this.vs_shader_normaltransform_with_light, this.fs_shader_onlyfirsttexture_gouraud_alpharef_fog, true, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		programTransparentAlphaChannelRefFogMoveGrass = this.createMaterialTypeInternal(this.vs_shader_normaltransform_with_light_movegrass, this.fs_shader_onlyfirsttexture_gouraud_alpharef_fog, true, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		programTransparentAddFog = this.createMaterialTypeInternal(this.vs_shader_normaltransform_with_light, this.fs_shader_onlyfirsttexture_gouraud_fog, true, gl.ONE, gl.ONE_MINUS_SRC_COLOR);

		programReflectionMaterialFog = this.createMaterialTypeInternal(this.vs_shader_reflectiontransform_with_light, this.fs_shader_lightmapcombine_gouraud_fog);
		programTranspReflectionMaterialFog = this.createMaterialTypeInternal(this.vs_shader_reflectiontransform_with_light, this.fs_shader_lightmapcombine_gouraud_fog, true, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		programSolidVertexAlphaTwoTextureBlendMaterialFog = this.createMaterialTypeInternal(this.vs_shader_normaltransform_with_light, this.fs_shader_vertex_alpha_two_textureblend_fog);

		this.MaterialProgramsWithLightFog[CL3D.Material.EMT_SOLID] = programStandardMaterialFog;
		this.MaterialProgramsWithLightFog[CL3D.Material.EMT_SOLID + 1] = programStandardMaterialFog;
		this.MaterialProgramsWithLightFog[CL3D.Material.EMT_LIGHTMAP] = programLightmapMaterialFog;
		this.MaterialProgramsWithLightFog[CL3D.Material.EMT_LIGHTMAP + 1] = programLightmapMaterialFog;
		this.MaterialProgramsWithLightFog[CL3D.Material.EMT_LIGHTMAP + 2] = programLightmapMaterialFog;
		this.MaterialProgramsWithLightFog[CL3D.Material.EMT_LIGHTMAP + 3] = programLightmapMaterial_m4Fog;
		this.MaterialProgramsWithLightFog[CL3D.Material.EMT_TRANSPARENT_ADD_COLOR] = programTransparentAddFog;
		this.MaterialProgramsWithLightFog[CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL] = programTransparentAlphaChannelFog;
		this.MaterialProgramsWithLightFog[CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL_REF] = programTransparentAlphaChannelRefFog;
		this.MaterialProgramsWithLightFog[CL3D.Material.EMT_REFLECTION_2_LAYER] = programReflectionMaterialFog;
		this.MaterialProgramsWithLightFog[CL3D.Material.EMT_TRANSPARENT_REFLECTION_2_LAYER] = programTranspReflectionMaterialFog;
		this.MaterialProgramsWithLightFog[CL3D.Material.EMT_NORMAL_MAP_SOLID] = programNormalmappedMaterialFog;
		this.MaterialProgramsWithLightFog[CL3D.Material.EMT_SOLID_VERTEX_ALPHA_TWO_TEXTURE_BLEND] = programSolidVertexAlphaTwoTextureBlendMaterialFog;
		this.MaterialProgramsWithLightFog[CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL_REF_MOVING_GRASS] = programTransparentAlphaChannelRefFogMoveGrass;

		// -------------------------------------------------------------
		// dynamic light + fog + shadow map shaders
		let vsshaderShadowMap = this.ShadowMapUsesRGBPacking ?
			this.fs_shader_onlyfirsttexture_gouraud_fog_shadow_map_rgbpack :
			this.fs_shader_onlyfirsttexture_gouraud_fog_shadow_map;

		programStandardMaterialFog = this.createMaterialTypeInternal(this.vs_shader_normaltransform_with_shadowmap_lookup, vsshaderShadowMap);
		programTransparentAlphaChannelFog = this.createMaterialTypeInternal(this.vs_shader_normaltransform_with_shadowmap_lookup, vsshaderShadowMap, true, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		programTransparentAlphaChannelRefFog = this.createMaterialTypeInternal(this.vs_shader_normaltransform_with_shadowmap_lookup, this.fs_shader_onlyfirsttexture_gouraud_alpharef_fog_shadow_map, true, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		programTransparentAlphaChannelRefFogMoveGrass = this.createMaterialTypeInternal(this.vs_shader_normaltransform_with_light_movegrass_with_shadowmap_lookup, this.fs_shader_onlyfirsttexture_gouraud_alpharef_fog_shadow_map, true, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		programTransparentAddFog = this.createMaterialTypeInternal(this.vs_shader_normaltransform_with_shadowmap_lookup, vsshaderShadowMap, true, gl.ONE, gl.ONE_MINUS_SRC_COLOR);

		// TODO: this material needs  shadow map support
		programReflectionMaterialFog = this.createMaterialTypeInternal(this.vs_shader_reflectiontransform_with_light, this.fs_shader_lightmapcombine_gouraud_fog);
		programTranspReflectionMaterialFog = this.createMaterialTypeInternal(this.vs_shader_reflectiontransform_with_light, this.fs_shader_lightmapcombine_gouraud_fog, true, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		programSolidVertexAlphaTwoTextureBlendMaterialFog = this.createMaterialTypeInternal(this.vs_shader_normaltransform_with_shadowmap_lookup, this.fs_shader_vertex_alpha_two_textureblend_fog_shadow_map);

		this.MaterialProgramsWithShadowMap[CL3D.Material.EMT_SOLID] = programStandardMaterialFog;
		this.MaterialProgramsWithShadowMap[CL3D.Material.EMT_SOLID + 1] = programStandardMaterialFog;
		this.MaterialProgramsWithShadowMap[CL3D.Material.EMT_LIGHTMAP] = programLightmapMaterialFog;
		this.MaterialProgramsWithShadowMap[CL3D.Material.EMT_LIGHTMAP + 1] = programLightmapMaterialFog;
		this.MaterialProgramsWithShadowMap[CL3D.Material.EMT_LIGHTMAP + 2] = programLightmapMaterialFog;
		this.MaterialProgramsWithShadowMap[CL3D.Material.EMT_LIGHTMAP + 3] = programLightmapMaterial_m4Fog;
		this.MaterialProgramsWithShadowMap[CL3D.Material.EMT_TRANSPARENT_ADD_COLOR] = programTransparentAddFog;
		this.MaterialProgramsWithShadowMap[CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL] = programTransparentAlphaChannelFog;
		this.MaterialProgramsWithShadowMap[CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL_REF] = programTransparentAlphaChannelRefFog;
		this.MaterialProgramsWithShadowMap[CL3D.Material.EMT_REFLECTION_2_LAYER] = programReflectionMaterialFog;
		this.MaterialProgramsWithShadowMap[CL3D.Material.EMT_TRANSPARENT_REFLECTION_2_LAYER] = programTranspReflectionMaterialFog;
		this.MaterialProgramsWithShadowMap[CL3D.Material.EMT_NORMAL_MAP_SOLID] = programNormalmappedMaterialFog;
		this.MaterialProgramsWithShadowMap[CL3D.Material.EMT_SOLID_VERTEX_ALPHA_TWO_TEXTURE_BLEND] = programSolidVertexAlphaTwoTextureBlendMaterialFog;
		this.MaterialProgramsWithShadowMap[CL3D.Material.EMT_TRANSPARENT_ALPHA_CHANNEL_REF_MOVING_GRASS] = programTransparentAlphaChannelRefFogMoveGrass;


		// -------------------------------------------------------------
		// reset shader error output
		this.printShaderErrors = true;

		// set fallback materials
		for (let f = 0; f < this.MinExternalMaterialTypeId; ++f) {
			if (this.MaterialPrograms[f] == null)
				this.MaterialPrograms[f] = fallbackShader;

			if (this.MaterialProgramsWithLight[f] == null)
				this.MaterialProgramsWithLight[f] = fallbackShader;

			if (this.MaterialProgramsFog[f] == null)
				this.MaterialProgramsFog[f] = fallbackShader;

			if (this.MaterialProgramsWithLightFog[f] == null)
				this.MaterialProgramsWithLightFog[f] = fallbackShader;

			if (this.MaterialProgramsWithShadowMap[f] == null)
				this.MaterialProgramsWithShadowMap[f] = fallbackShader;
		}

		// set WebGL default values
		gl.useProgram(programStandardMaterial);
		this.currentGLProgram = programStandardMaterial;

		gl.clearColor(0, 0, 1, 1);
		gl.clearDepth(1.0);

		gl.depthMask(true);
		gl.enable(gl.DEPTH_TEST);
		gl.disable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		//gl.enable(gl.TEXTURE_2D); invalid in webgl
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);
	}
	/**
	 * Sets the projection transformation matrix. This is automatically called by {@link CopperLicht.draw3dScene}(),
	 * so it shouldn't be necessary to call this yourself.
	 * @param {CL3D.Matrix4} m matrix representing the transformation matrix.
	 * @public
	 */
	setProjection(m) {
		m.copyTo(this.Projection);
	}
	/**
	 * Returns the currently used projection matrix.
	 * @public
	 */
	getProjection() {
		return this.Projection;
	}
	/**
	 * Sets the view transformation matrix. This is automatically called by {@link CopperLicht.draw3dScene}(),
	 * so it shouldn't be necessary to call this yourself.
	 * @param {CL3D.Matrix4} m matrix representing the transformation matrix.
	 * @public
	 */
	setView(m) {
		m.copyTo(this.View);
	}
	/**
	 * Returns the currently used view matrix.
	 * @public
	 */
	getView() {
		return this.View;
	}
	/**
	 * Returns the currently used view matrix.
	 * @public
	 */
	getWorld() {
		return this.World;
	}
	/**
	 * Sets the world transformation matrix. This is automatically called by {@link CopperLicht.draw3dScene}(),
	 * so it shouldn't be necessary to call this yourself.
	 * @param {CL3D.Matrix4} m matrix representing the transformation matrix.
	 * @public
	 */
	setWorld(m) {
		if (m)
			m.copyTo(this.World);
	}
	/**
	 * @private
	 */
	getMatrixAsWebGLFloatArray(mat) {
		return new WebGLFloatArray(mat.asArray());
	}
	/**
	 * @private
	 */
	findTexture(name) {
		return this.TheTextureManager.getTextureFromName(name);
	}
	/**
	 * Deletes a {@link Texture}, freeing a lot of memory
	 * @public
	 * @param {CL3D.Texture} tex the texture to draw
	 */
	deleteTexture(tex) {
		if (tex == null)
			return;

		let gl = this.gl;
		gl.deleteTexture(tex.getWebGLTexture());

		tex.Texture = null;
		tex.Loaded = false;

		if (tex.RTTFrameBuffer)
			gl.deleteFramebuffer(tex.RTTFrameBuffer);

		this.TheTextureManager.removeTexture(tex);

		tex.RTTFrameBuffer = null;
	}
	/**
	 * Creates a new render target {@link Texture}
	 * @public
	 * @param sx width of the texture
	 * @param sy height of the texture
	 */
	addRenderTargetTexture(sx, sy, createFloatingPointTexture, createDepthTexture, registerInTextureManagerWithThisName) {
		let gl = this.gl;

		// check for floating point extension
		if (createFloatingPointTexture) {
			// In WebGL1 to check for support for rendering to a floating point texture:
			// - first check for and enable the OES_texture_float extension
			// - then create a floating point texture
			// - attach it to a framebuffer
			// - call gl.checkFramebufferStatus to see if it returned gl.FRAMEBUFFER_COMPLETE
			// In WebGL2 you need to check for and enable EXT_color_buffer_float
			// or else gl.checkFramebufferStatus will never return gl.FRAMEBUFFER_COMPLETE for a floating point texture
			if (!this.UsesWebGL2) {
				// webgl 1
				let ext = gl.getExtension('OES_texture_float');
				if (!ext)
					return null;
				this.ExtFloat = ext;

				let ext2 = gl.getExtension('OES_texture_float_linear'); // for linear filtering
				if (!ext2)
					return null;
				this.ExtFloatLinear = ext2;
			}

			else {
				// webgl 2
				let ext = gl.getExtension('EXT_color_buffer_float');
				if (!ext)
					return null;
				this.ExtFloat2 = ext;

				ext = gl.getExtension('OES_texture_float_linear'); // for linear filtering
				if (!ext)
					return null;
				this.ExtFloatLinear = ext;
			}
		}

		if (createDepthTexture && !this.UsesWebGL2) // in webgl 2, this is built-in
		{
			let ext = gl.getExtension('WEBGL_depth_texture');
			if (!ext)
				return null;
			this.ExtDepth = ext;
		}

		// texture
		let texture = gl.createTexture();

		gl.bindTexture(gl.TEXTURE_2D, texture);

		let withMipMap = false;
		if (withMipMap) {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); //gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST); //gl.NEAREST);
			gl.generateMipmap(gl.TEXTURE_2D);
		}

		else {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		}

		if (createDepthTexture)
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, sx, sy, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);

		else if (createFloatingPointTexture) {
			if (this.UsesWebGL2)
				gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, sx, sy);

			else
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sx, sy, 0, gl.RGBA, gl.FLOAT, null);
		}

		else
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sx, sy, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

		// frame buffer
		let rttFramebuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
		rttFramebuffer.width = sx;
		rttFramebuffer.height = sy;

		if (createDepthTexture) {
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, texture, 0);
		}

		else {
			// render buffer
			let renderbuffer = gl.createRenderbuffer();
			gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
			gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, sx, sy);

			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
			gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
		}

		// for floating point buffers, we need to check if it worked (it won't on old mobile devices although
		// they report it worked)
		if (createFloatingPointTexture) {
			let fbstatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
			if (fbstatus != gl.FRAMEBUFFER_COMPLETE) {
				gl.bindTexture(gl.TEXTURE_2D, null);
				gl.bindRenderbuffer(gl.RENDERBUFFER, null);
				gl.bindFramebuffer(gl.FRAMEBUFFER, null);
				return null;
			}
		}

		// reset
		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		// store
		let t = new CL3D.Texture();
		t.Name = "";
		t.Texture = texture;
		t.Image = null;
		t.Loaded = true;
		t.CachedWidth = sx;
		t.CachedHeight = sy;
		t.OriginalWidth = sx;
		t.OriginalHeight = sy;
		t.RTTFrameBuffer = rttFramebuffer;
		t.IsFloatingPoint = createFloatingPointTexture;

		if (registerInTextureManagerWithThisName != null) {
			t.Name = registerInTextureManagerWithThisName;
			this.TheTextureManager.addTexture(t);
		}

		return t;
	}
	/**
	 * Sets the current render target
	 * @public
	 * @param {@link Texture} texture Texture or null, which will become the new render target
	 * @param clearBackBuffer To clear the buffer or not
	 * @param clearZBuffer To clear the zbuffer or not
	 * @param bgcolor Background color to set if clearBackBuffer is true
	 */
	setRenderTarget(texture, clearBackBuffer, clearZBuffer, bgcolor) {
		let gl = this.gl;

		if (texture != null) {
			gl.bindFramebuffer(gl.FRAMEBUFFER, texture.RTTFrameBuffer);
			gl.viewport(0, 0, texture.CachedWidth, texture.CachedHeight);
		}

		else {
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.viewport(0, 0, this.width, this.height);
		}

		if (this.CurrentRenderTarget != null) {
			// update mip maps of render target
			gl.bindTexture(gl.TEXTURE_2D, this.CurrentRenderTarget.Texture);
			gl.generateMipmap(gl.TEXTURE_2D);
		}

		this.CurrentRenderTarget = texture;

		if (clearBackBuffer || clearZBuffer) {
			let mask = 0;

			if (clearBackBuffer) {
				mask = mask | gl.COLOR_BUFFER_BIT;

				gl.clearColor(CL3D.getRed(bgcolor) / 255.0,
					CL3D.getGreen(bgcolor) / 255.0,
					CL3D.getBlue(bgcolor) / 255.0,
					1);
			}

			if (clearZBuffer) {
				gl.clearDepth(this.InvertedDepthTest ? 0.0 : 1.0);
				mask = mask | gl.DEPTH_BUFFER_BIT;
			}

			gl.clear(mask);
		}

		return true;
	}
	/**
	 * Returns the current render target, usually a {@link Texture} texture or null
	 * @public
	 */
	getRenderTarget() {
		return this.CurrentRenderTarget;
	}
	/**
	 * Returns the size of the current render target, or screen size if no render target
	 * @public
	 */
	getRenderTargetSize() {
		if (this.CurrentRenderTarget)
			return new CL3D.Vect2d(this.CurrentRenderTarget.CachedWidth, this.CurrentRenderTarget.CachedHeight);

		return new CL3D.Vect2d(this.width, this.height);
	}
	/**
	 * Sets if the depth test should be enabled or not.
	 * @public
	 */
	setInvertedDepthTest(enable) {
		this.InvertedDepthTest = enable;
	}
	/**
	 * Replaces the content of a placeholder texture with the content of a new texture.
	 * The new texture shouldn't be used anymore after this.
	 * Useful for creating placeholder textures for videos, for example.
	 * @private
	 */
	replacePlaceholderTextureWithNewTextureContent(placeholderTexture, newtexture) {
		placeholderTexture.Texture = newtexture.Texture;
		placeholderTexture.CachedWidth = newtexture.CachedWidth;
		placeholderTexture.CachedHeight = newtexture.CachedHeight;
		placeholderTexture.OriginalWidth = newtexture.OriginalWidth;
		placeholderTexture.OriginalHeight = newtexture.OriginalHeight;
	}
	/**
	 * Fills an existing {@link CL3D.Texture} with the content of a from a 2d canvas
	 * @public
	 * @param {Canvas} canvas a 2d canvas to be converted into a texture
	 * @param {boolean} nonscaling optional parameter, if set to true, and the texture don't have a power-of-two size, the texture will not be scaled up, but copied without scaling.
	 *        This is useful for font or 2D textures, for example, to make them less blurry.
	 */
	updateTextureFrom2DCanvas(t, canvas, nonscaling) {
		let gl = this.gl;

		let texture = t.Texture;
		gl.bindTexture(gl.TEXTURE_2D, texture);

		let origwidth = canvas.width;
		let origheight = canvas.height;

		if (canvas.videoWidth)
			origwidth = canvas.videoWidth;
		if (canvas.videoHeight)
			origheight = canvas.videoHeight;

		let scaledUpWidth = origwidth;
		let scaledUpHeight = origheight;

		if (!this.isPowerOfTwo(origwidth) || !this.isPowerOfTwo(origheight)) {
			// Scale up the texture to the next highest power of two dimensions.
			// let tmpcanvas = Canvas.createCanvas();
			// tmpcanvas.width = this.nextHighestPowerOfTwo(origwidth);
			// tmpcanvas.height = this.nextHighestPowerOfTwo(origheight);
			// let tmpctx = tmpcanvas.getContext("2d");

			var tmpcanvas = document.createElement("canvas");
			tmpcanvas.width = this.nextHighestPowerOfTwo(origwidth);
			tmpcanvas.height = this.nextHighestPowerOfTwo(origheight);
			var tmpctx = tmpcanvas.getContext("2d");

			tmpctx.fillStyle = "rgba(0, 255, 255, 1)";
			tmpctx.fillRect(0, 0, tmpcanvas.width, tmpcanvas.height);

			if (nonscaling)
				tmpctx.drawImage(canvas, 0, 0, origwidth, origheight, 0, 0, origwidth, origheight);

			else
				tmpctx.drawImage(canvas, 0, 0, origwidth, origheight, 0, 0, tmpcanvas.width, tmpcanvas.height);

			canvas = tmpcanvas;
			scaledUpWidth = tmpcanvas.width;
			scaledUpHeight = tmpcanvas.height;
		}

		//console.log("createTextureFrom2DCanvas orig " + origwidth + "x" + origheight + " and scaled" + scaledUpWidth + "x" + scaledUpHeight);
		this.fillTextureFromDOMObject(texture, canvas);

		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

		gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}
	/**
	 * Creates a {@link CL3D.Texture} from a 2d canvas
	 * @public
	 * @param {Canvas} canvas a 2d canvas to be converted into a texture
	 * @param {boolean} nonscaling optional parameter, if set to true, and the texture don't have a power-of-two size, the texture will not be scaled up, but copied without scaling.
	 *        This is useful for font or 2D textures, for example, to make them less blurry.
	 */
	createTextureFrom2DCanvas(canvas, nonscaling) {
		let gl = this.gl;

		let texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);

		let origwidth = canvas.width;
		let origheight = canvas.height;

		if (canvas.videoWidth)
			origwidth = canvas.videoWidth;
		if (canvas.videoHeight)
			origheight = canvas.videoHeight;

		let scaledUpWidth = origwidth;
		let scaledUpHeight = origheight;

		if (!this.isPowerOfTwo(origwidth) || !this.isPowerOfTwo(origheight)) {
			// Scale up the texture to the next highest power of two dimensions.
			// let tmpcanvas = Canvas.createCanvas();
			// tmpcanvas.width = this.nextHighestPowerOfTwo(origwidth);
			// tmpcanvas.height = this.nextHighestPowerOfTwo(origheight);
			// let tmpctx = tmpcanvas.getContext("2d");

			var tmpcanvas = document.createElement("canvas");
			tmpcanvas.width = this.nextHighestPowerOfTwo(origwidth);
			tmpcanvas.height = this.nextHighestPowerOfTwo(origheight);
			var tmpctx = tmpcanvas.getContext("2d");

			//tmpctx.fillStyle = "rgba(0, 255, 255, 1)";
			//tmpctx.fillRect(0, 0, tmpcanvas.width, tmpcanvas.height);
			if (nonscaling)
				tmpctx.drawImage(canvas, 0, 0, origwidth, origheight, 0, 0, origwidth, origheight);

			else
				tmpctx.drawImage(canvas, 0, 0, origwidth, origheight, 0, 0, tmpcanvas.width, tmpcanvas.height);

			canvas = tmpcanvas;
			scaledUpWidth = tmpcanvas.width;
			scaledUpHeight = tmpcanvas.height;
		}

		//console.log("createTextureFrom2DCanvas orig " + origwidth + "x" + origheight + " and scaled" + scaledUpWidth + "x" + scaledUpHeight);
		this.fillTextureFromDOMObject(texture, canvas);

		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

		gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D, null);

		let t = new CL3D.Texture();
		t.Name = "";
		t.Texture = texture;
		t.Image = null;
		t.Loaded = true;
		t.CachedWidth = scaledUpWidth;
		t.CachedHeight = scaledUpHeight;
		t.OriginalWidth = origwidth;
		t.OriginalHeight = origheight;

		return t;
	}
	/**
	 * @private
	 */
	isPowerOfTwo(x) {
		return (x & (x - 1)) == 0;
	}
	/**
	 * @private
	 */
	nextHighestPowerOfTwo(x) {
		--x;
		for (let i = 1; i < 32; i <<= 1) {
			x = x | x >> i;
		}
		return x + 1;
	}
	/**
	 * @private
	 * domobj is an image or a canvas element
	 */
	fillTextureFromDOMObject(wgltex, domobj) {
		let gl = this.gl;

		// new version replaced the old:
		//  texImage2D(target, level, HTMLImageElement, [optional] flipY, [optional] premultiplyAlpha)
		//  with the new
		// texImage2D(target, level, internalformat, format, type, HTMLImageElement)
		// concrete:
		try {
			// new version
			//void texImage2D(GLenum target, GLint level, GLenum internalformat,
			//           GLenum format, GLenum type, HTMLImageElement image) raises (DOMException);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, domobj);

		}
		catch (e) {
			if (e.code != null && DOMException != null && DOMException['SECURITY_ERR'] != null &&
				e.code == DOMException['SECURITY_ERR']) {
				if (this.domainTextureLoadErrorPrinted == false)
					console.log("<i>A security setting in the browser prevented loading a texture.<br/>Workaround: run this from a webserver, change security settings, or allow the specific domain.</i>", true);

				this.domainTextureLoadErrorPrinted = true;
				return;
			}

			//console.log(browserVersion + "Could not texImage2D texture: " + e);
			try {
				// old version
				gl.texImage2D(gl.TEXTURE_2D, 0, domobj);
			}
			catch (e2) {
				// something is pretty wrong here
				//console.log("Could not texImage2D texture (2nd try):" + e2);
			}
		}

	}
	/**
	 * @private
	 */
	finalizeLoadedImageTexture(t) {
		let gl = this.gl;

		let texture = gl.createTexture();
		let objToCopyFrom = t.Image;

		if (!this.isPowerOfTwo(objToCopyFrom.width) || !this.isPowerOfTwo(objToCopyFrom.height)) {
			// Scale up the texture to the next highest power of two dimensions.
			let tmpcanvas = Canvas.createCanvas();
			if (tmpcanvas != null) {
				tmpcanvas.width = this.nextHighestPowerOfTwo(objToCopyFrom.width);
				tmpcanvas.height = this.nextHighestPowerOfTwo(objToCopyFrom.height);
				let tmpctx = tmpcanvas.getContext("2d");
				tmpctx.drawImage(objToCopyFrom,
					0, 0, objToCopyFrom.width, objToCopyFrom.height,
					0, 0, tmpcanvas.width, tmpcanvas.height);
				objToCopyFrom = tmpcanvas;
			}
		}

		gl.bindTexture(gl.TEXTURE_2D, texture);

		this.fillTextureFromDOMObject(texture, objToCopyFrom);

		//  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		//	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.generateMipmap(gl.TEXTURE_2D);

		// TODO: enable these lines for anisotropic filtering (looks much nicer)
		/*let ext = gl.getExtension('EXT_texture_filter_anisotropic');
		if (ext)
		{
			gl.texParameterf(gl.TEXTURE_2D, ext['TEXTURE_MAX_ANISOTROPY_EXT'], 4);
		}*/
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);

		gl.bindTexture(gl.TEXTURE_2D, null);

		this.textureWasLoadedFlag = true;

		t.Texture = texture;
	}
	/**
	 * @private
	 */
	getStaticBillboardMeshBuffer() {
		if (this.StaticBillboardMeshBuffer == null)
			this.createStaticBillboardMeshBuffer();

		return this.StaticBillboardMeshBuffer;
	}
	/**
	 * @private
	 */
	createStaticBillboardMeshBuffer() {
		if (this.StaticBillboardMeshBuffer != null)
			return;

		let mb = null;

		mb = new CL3D.MeshBuffer();
		let vtx1 = new CL3D.Vertex3D(true);
		let vtx2 = new CL3D.Vertex3D(true);
		let vtx3 = new CL3D.Vertex3D(true);
		let vtx4 = new CL3D.Vertex3D(true);

		let indices = mb.Indices;
		indices.push(0);
		indices.push(2);
		indices.push(1);
		indices.push(0);
		indices.push(3);
		indices.push(2);

		let vertices = mb.Vertices;
		vertices.push(vtx1);
		vertices.push(vtx2);
		vertices.push(vtx3);
		vertices.push(vtx4);

		vtx1.TCoords.X = 1;
		vtx1.TCoords.Y = 1;
		vtx1.Pos.set(1, -1, 0);

		vtx2.TCoords.X = 1;
		vtx2.TCoords.Y = 0;
		vtx2.Pos.set(1, 1, 0);

		vtx3.TCoords.X = 0;
		vtx3.TCoords.Y = 0;
		vtx3.Pos.set(-1, 1, 0);

		vtx4.TCoords.X = 0;
		vtx4.TCoords.Y = 1;
		vtx4.Pos.set(-1, -1, 0);

		this.StaticBillboardMeshBuffer = mb;
	}
	/**
	 * Quickly enables / Disables rendering with shadow map support without any state changes. If enabled, all materials drawn will
	 * Use the shadow map and the light matrix for rendering their geometry from a light.
	 * @public
	 **/
	quicklyEnableShadowMap(enable) {
		this.ShadowMapEnabled = enable;
	}
	/**
	 * @public
	 **/
	isShadowMapEnabled() {
		return this.ShadowMapEnabled;
	}
	/**
	 * Enables / Disables rendering with shadow map support. If enabled, all materials drawn will
	 * Use the shadow map and the light matrix for rendering their geometry from a light.
	 * @public
	 **/
	enableShadowMap(enable,
		shadowMapTexture,
		shadowMapLightMatrix,
		shadowMapTexture2,
		shadowMapLightMatrix2) {
		this.ShadowMapEnabled = enable;
		this.ShadowMapTexture = shadowMapTexture;
		this.ShadowMapTexture2 = shadowMapTexture2;

		if (shadowMapLightMatrix != null)
			this.ShadowMapLightMatrix = shadowMapLightMatrix.clone();

		else
			this.ShadowMapLightMatrix = null;

		if (shadowMapLightMatrix2 != null)
			this.ShadowMapLightMatrix2 = shadowMapLightMatrix2.clone();

		else
			this.ShadowMapLightMatrix2 = null;
	}
};
