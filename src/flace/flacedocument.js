//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "../main.js";

/**
 * @constructor
 * @public
 */
export class CCDocument {
	constructor() {
		this.CurrentScene = -1;
		this.ApplicationTitle = "";
		/**
		 * @type {CL3D.Free3dScene[]}
		 */
		this.Scenes = new Array();
		//this.UpdateMode = CL3D.Scene.REDRAW_WHEN_SCENE_CHANGED;
		this.UpdateMode = CL3D.Scene.REDRAW_EVERY_FRAME;
		this.WaitUntilTexturesLoaded = false;

		this.CanvasWidth = 320;
		this.CanvasHeight = 200;
	}

	addScene(s)
	{
		this.Scenes.push(s);
	}

	getCurrentScene(s)
	{
		if (this.CurrentScene < 0 || this.CurrentScene >= this.Scenes.length)
			return null;
		return this.Scenes[this.CurrentScene];
	}

	setCurrentScene(s)
	{
		for (var i=0; i<this.Scenes.length; ++i)
		{
			if (this.Scenes[i] === s)
			{
				this.CurrentScene = i;
				return;
			}
		}
	}
};
