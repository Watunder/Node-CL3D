//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

/**
 * A simple node derived from Mobile2DInputSceneNode to emulate keyboard input for games on touchscreen devices like phones, tablets and similar 
 * @class Scene Node which draws a 2d mobile input control
 * @constructor
 * @extends CL3D.SceneNode
 */
CL3D.Mobile2DInputSceneNode = function(engine, scene)
{
	CL3D.Overlay2DSceneNode.call(this, engine); 
	
	this.CursorTex = null;
	this.CursorPosX = 0;
	this.CursorPosY = 0;
	this.MouseOverButton = false;
	
	this.RealWidth = 0;
	this.RealHeight = 0;
	this.RealPosX = 0;
	this.RealPosY = 0;
	
	this.InputMode = 0;
	this.KeyCode = 0;
	
	this.addAnimator(new CL3D.AnimatorMobileInput(engine, scene, this));
}
CL3D.Mobile2DInputSceneNode.prototype = new CL3D.Overlay2DSceneNode();



/** 
 * Returns the type string of the scene node.
 * Returns 'mobile2dinput' for the scene node.
 * @public
 * @returns {String} type name of the scene node.
 */
CL3D.Mobile2DInputSceneNode.prototype.getType = function()
{
	return 'mobile2dinput';
}

/** 
 * @private
 */
CL3D.Mobile2DInputSceneNode.prototype.blocksCameraInput = function()
{
	return true;
}

/**
 * @private
 */
CL3D.Mobile2DInputSceneNode.prototype.render = function(renderer)
{
	var rctTarget = this.getScreenCoordinatesRect(true, renderer);
	var rctDrawText = rctTarget;
	
	// test for hovering

	var bHovering = false;

	if (this.engine != null)
	{
		var mposx = this.engine.getMouseX();
		var mposy = this.engine.getMouseY();
		
		this.MouseOverButton = (rctTarget.x <= mposx && rctTarget.y <= mposy &&
				     rctTarget.x + rctTarget.w >= mposx &&
				     rctTarget.y + rctTarget.h >= mposy);
	
		// is point inside rect
		if (this.AnimateOnHover)
			bHovering = this.MouseOverButton;
	}
	
	// draw background

	if (bHovering && this.OnHoverSetBackgroundColor)
		renderer.draw2DRectangle(rctTarget.x, rctTarget.y, rctTarget.w, rctTarget.h, this.HoverBackgroundColor, true);
	else
	if (this.ShowBackGround)
		renderer.draw2DRectangle(rctTarget.x, rctTarget.y, rctTarget.w, rctTarget.h, this.BackGroundColor, true);
		
	// draw texture

	var tex = this.Texture;
	if (bHovering && this.TextureHover && this.OnHoverDrawTexture)
		tex = this.TextureHover;
		
	var usedWidth = 0;
	var usedHeight = 0;

	if (tex != null && tex.isLoaded())
	{
		var w = tex.getWidth();
		var h = tex.getHeight();
				
		if (!this.RetainAspectRatio)
		{
			// ignore aspect ratio
			renderer.draw2DImage(rctTarget.x, rctTarget.y, rctTarget.w, rctTarget.h, tex, true);
			
			usedWidth = rctTarget.w;
			usedHeight = rctTarget.h;
		}
		else
		{
			//rctTarget = this.getScreenCoordinatesRect(false, renderer);

			if (w && h && rctTarget.h && rctTarget.w)
			{
				var aspectRatio = h / w;
				var width = rctTarget.w;
				var height = width * aspectRatio;

				if (height > rctTarget.h)
				{
					// height to big with this scale, scale by height then
					var fact = rctTarget.h / height;
					width *= fact;
					height *= fact;
				}

				rctTarget.w = width;
				rctTarget.h = height;

				rctDrawText = rctTarget;

				renderer.draw2DImage(rctTarget.x, rctTarget.y, rctTarget.w, rctTarget.h, tex, true);
				
				usedWidth = rctTarget.w;
				usedHeight = rctTarget.h;
			}
		}
	}
	
	this.RealWidth = usedWidth;
	this.RealHeight = usedHeight;
	this.RealPosX = rctTarget.x;
	this.RealPosY = rctTarget.y;
	
	if (this.InputMode == 0 &&
	    this.CursorTex != null && 
	    this.CursorTex.isLoaded() &&
		tex != null && tex.isLoaded())
	{
		// map square coordinates to the visual circle
		var xCircle = this.CursorPosX * Math.sqrt(1.0 - 0.5*(this.CursorPosY*this.CursorPosY));
		var yCircle = this.CursorPosY * Math.sqrt(1.0 - 0.5*(this.CursorPosX*this.CursorPosX));

		// move from -1..1 to 0..1 range
		xCircle = (xCircle + 1.0) * 0.5;
		yCircle = (yCircle + 1.0) * 0.5;

		var sizeDeltaX = 1.0 / (tex.getWidth() / Number(this.CursorTex.getWidth()));
		var sizeDeltaY = 1.0 / (tex.getHeight() / Number(this.CursorTex.getHeight()));
		var cursorImgWidth = sizeDeltaX * usedWidth;
		var cursorImgHeight = sizeDeltaY * usedHeight;
		var xPos = rctTarget.x + (xCircle * (usedWidth)) - (cursorImgWidth * 0.5);
		var yPos = rctTarget.y + (yCircle * (usedHeight)) - (cursorImgHeight * 0.5);
		
		renderer.draw2DImage(xPos, yPos, cursorImgWidth, cursorImgHeight, this.CursorTex, true);
	}
}


// ----------------------------------------------------------------------------------------------
// Animator for moving cursor position of Mobile2DInputSceneNode
// ----------------------------------------------------------------------------------------------
// moved to animatorscoppercubeprivate.js since it is needing the animator definition first
