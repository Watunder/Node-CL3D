//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

/**
 * A simple 2d overlay scene node which draws a 2d area over the 3d scene. Useful for displaying text, images and similar.
 * @class Scene Node which draws a 2d overlay with color, image and/or text
 * @constructor
 * @extends CL3D.SceneNode
 * @example
 * // how to add a 2D overlay with text
 * var overlay = new CL3D.Overlay2DSceneNode();
 * scene.getRootSceneNode().addChild(overlay);
 *
 * overlay.set2DPosition(10,10,200,70);
 * overlay.setText('Hello World!');
 * overlay.FontName = "12;default;arial;normal;bold;true";
 * overlay.TextColor = CL3D.createColor(255, 150, 232, 249);
 */
CL3D.Overlay2DSceneNode = function(engine)
{
	this.init();
	this.engine = engine;

	/*private static const ETA_TOP_LEFT:int					= 0;
	private static const ETA_CENTER:int						= 1;
	private static const ETA_MULTILINE:int					= 2;*/

	this.Box = new CL3D.Box3d();

	// size and position
	this.TextureWidth = 0.5;
	this.TextureHeight = 0.5;

	this.PosAbsoluteX = 100;
	this.PosAbsoluteY = 100;
	this.SizeAbsoluteWidth = 50;
	this.SizeAbsoluteHeight = 50;

	this.PosRelativeX = 0.5;
	this.PosRelativeY = 0.5;
	this.SizeRelativeWidth = 1.0 / 6.0;
	this.SizeRelativeHeight = 1.0 / 6.0;

	this.SizeModeIsAbsolute = true;

	// what it looks like

	this.ShowBackGround = true; //:Boolean;
	this.BackGroundColor = 0; //:int;

	this.Texture = null; //:Texture;
	this.TextureHover = null; // :Texture;
	this.TextureMask = null; // TODO: mask
	this.RetainAspectRatio = true; // :Boolean;
	this.BlurImage = false;

	this.DrawText = false; //:Boolean;
	this.TextAlignment = 1; //:int;
	this.Text = ""; //:String;
	this.FontName = ""; //:String;
	this.TextColor = 0; //:int;

	this.AnimateOnHover = false; //:Boolean;
	this.OnHoverSetFontColor = false; //:Boolean;
	this.HoverFontColor = false; //:int;
	this.OnHoverSetBackgroundColor = false; //:Boolean;
	this.HoverBackgroundColor = false; //:int;
	this.OnHoverDrawTexture = false; //:Boolean;

	// runtime

	this.TextTexture = null;
	this.TextHoverTexture = null;
	this.CreatedTextTextureText = "";
	this.CreatedTextTextureFontName = "";

	this.CurrentFontPixelHeight = 0;
	//this.CreatedTextColor = 0;
	//this.CreatedTextHoverColor = 0;
}
CL3D.Overlay2DSceneNode.prototype = new CL3D.SceneNode();


/**
 * Font string to be used when drawing text. It uses the following format:
 * PointSize;Family(Default|Decorative|Roman|Script|Swiss|Modern);FaceName(Arial etc);Style(Normal|Slant|Italic);Weight(Normal|Light|Bold);Underlined(True|false)
 * Example: "12;default;arial;normal;bold;true"
 * @public
 * @type String.
 * @default ""
 */
CL3D.Overlay2DSceneNode.prototype.FontName = "";


/**
 * Text color to be used. Use for example CL3D.createColor(255, 150, 232, 249); to create a nice color.
 * @public
 * @type Number
 * @default 0
 */
CL3D.Overlay2DSceneNode.prototype.TextColor = 0;

/**
 * Text alignment to be used. Use 0 for left align, 1 for center and 2 for multiline with word wrap.
 * @public
 * @type Number
 * @default 0
 */
CL3D.Overlay2DSceneNode.prototype.TextAlignment = 1;

/**
 * @private
 */
CL3D.Overlay2DSceneNode.prototype.blocksCameraInput = function()
{
	return false;
}

/**
 * Get the axis aligned, not transformed bounding box of this node.
 * This means that if this node is an animated 3d character, moving in a room, the bounding box will
 * always be around the origin. To get the box in real world coordinates, just transform it with the matrix
 * you receive with {@link getAbsoluteTransformation}() or simply use {@link getTransformedBoundingBox}(), which does the same.
 * @public
 * @returns {CL3D.Box3d} Bounding box of this scene node.
 */
CL3D.Overlay2DSceneNode.prototype.getBoundingBox = function()
{
	return this.Box;
}


/**
 * Returns the type string of the scene node.
 * Returns '2doverlay' for the scene node.
 * @public
 * @returns {String} type name of the scene node.
 */
CL3D.Overlay2DSceneNode.prototype.getType = function()
{
	return '2doverlay';
}

/**
 * Sets the position of the overlay in pixels
 * @public
 * @param x {Number} x position of the overlay in pixels
 * @param y {Number} y position of the overlay in pixels
 * @param width {Number} width of the overlay in pixels
 * @param height {Number} height of the overlay in pixels
 */
CL3D.Overlay2DSceneNode.prototype.set2DPosition = function(x , y, width, height)
{
	this.PosAbsoluteX = x;
	this.PosAbsoluteY = y;
	this.SizeAbsoluteWidth = width;
	this.SizeAbsoluteHeight = height;

	this.SizeModeIsAbsolute = true;
}

/**
 * Sets if the overlay scene node should show a colored background
 * @public
 * @param showBackground {Boolean} true to show the backgroundcolor, false if not
 * @param color {Number} a color created with CL3D.createColor defining the color to show
 */
CL3D.Overlay2DSceneNode.prototype.setShowBackgroundColor = function(showBackground, color)
{
	this.ShowBackGround = showBackground;
	if (this.ShowBackGround)
		this.BackGroundColor = color;
}

/**
 * Sets if the overlay scene node should show a image
 * @public
 * @param {CL3D.Texture} tex a {@link CL3D.Texture} to show as image on the 2d overlay
 */
CL3D.Overlay2DSceneNode.prototype.setShowImage = function(tex)
{
	this.Texture = tex;
}

/**
 * Sets the text which should be shown on the overlay 2D node.
 * Note that you can also set a text color using the .TextColor property and a
 * font using the FontName property.
 * @public
 * @param text {String}
 */
CL3D.Overlay2DSceneNode.prototype.setText = function(text)
{
	this.Text = text;
	this.DrawText = this.Text != null && this.Text != "";

	if (this.FontName == "")
		this.FontName = "12;default;arial;normal;bold;true";
}


/**
 * @private
 */
CL3D.Overlay2DSceneNode.prototype.OnRegisterSceneNode = function(mgr)
{
	if (this.Visible)
	{
		mgr.registerNodeForRendering(this, CL3D.Scene.RENDER_MODE_2DOVERLAY);
		CL3D.SceneNode.prototype.OnRegisterSceneNode.call(this, mgr);
	}
}

/**
 * @private
 */
CL3D.Overlay2DSceneNode.prototype.render = function(renderer)
{
	// ScreenShot
	if (CL3D.Enable_ScreenShot)
	{
		const options =
		{
			width: window.innerWidth,
			height : window.innerHeight,
			ignoreElements:	(element) =>
			{
				if (element.id == "text")
					return true;

				if (element.id == "debug")
					return true;

				return false;
			}
		};

		html2canvas(document.body, options)
		.then((canvas) =>
		{
			var base64 = canvas.toDataURL("image/png");
			var tex = new CL3D.Texture();
			tex.Name = rename("ScreenShot");

			Global.SaveData.screenshot.name = tex.Name;
			Global.SaveData.screenshot.base64 = base64;

			tex.Image = new Image();
			tex.Image.onload = function()
			{
				CL3D.ScriptingInterface.getScriptingInterface().Engine.getTextureManager().addTexture(tex);
				CL3D.engine.getRenderer().finalizeLoadedImageTexture(tex);

				tex.Loaded = true;

				Global.Emitter.emit("pass_screenshot_name", Global.SaveData.screenshot.name);
			}
			tex.Image.src = base64;
		});

		CL3D.Enable_ScreenShot = false;
	}

	var rctTarget = this.getScreenCoordinatesRect(true, renderer);
	var rctDrawText = rctTarget;

	// test for hovering

	var bHovering = false;

	if (this.engine != null && this.AnimateOnHover)
	{
		var mposx = this.engine.getMouseX() * this.engine.DPR;
		var mposy = this.engine.getMouseY() * this.engine.DPR;

		// is point inside rect
		bHovering = (rctTarget.x <= mposx && rctTarget.y <= mposy &&
				     rctTarget.x + rctTarget.w >= mposx &&
				     rctTarget.y + rctTarget.h >= mposy);
	}

	// draw background

	if (bHovering && this.OnHoverSetBackgroundColor)
		renderer.draw2DRectangle(rctTarget.x, rctTarget.y, rctTarget.w, rctTarget.h, this.HoverBackgroundColor, true);
	else
	if (this.ShowBackGround)
		renderer.draw2DRectangle(rctTarget.x, rctTarget.y, rctTarget.w, rctTarget.h, this.BackGroundColor, true);

	//renderer.draw2DRectangle(100,100,100,100, CL3D.createColor(100, 255, 0, 0), true); // TODO: remove

	// draw texture

	var tex = this.Texture;
	if (bHovering && this.TextureHover && this.OnHoverDrawTexture)
		tex = this.TextureHover;

	if (tex != null && tex.isLoaded())
	{
		var w = tex.getWidth();
		var h = tex.getHeight();

		if (!this.RetainAspectRatio)
		{
			// ignore aspect ratio
			renderer.draw2DImage(rctTarget.x, rctTarget.y, rctTarget.w, rctTarget.h, tex, true, null, null, null, !this.BlurImage);
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

				this.TextureWidth = width / rctTarget.sw;
				this.TextureHeight = height / rctTarget.sh;

				rctDrawText = rctTarget;

				renderer.draw2DImage(rctTarget.x, rctTarget.y, rctTarget.w, rctTarget.h, tex, true, null, null, null, !this.BlurImage);
			}
		}
	}

	// draw text

	if (this.DrawText && this.FontName && this.Text != "")
	{
		this.createNewTextTexturesIfNecessary(renderer, rctTarget.w);

		var textureToUse = this.TextTexture;
		var colorToUse = this.TextColor;

		if (bHovering)
		{
			if (this.TextHoverTexture)
				textureToUse = this.TextHoverTexture;

			colorToUse = this.HoverFontColor;
		}

		if (textureToUse)
		{
			var fw = textureToUse.OriginalWidth;
			var fh = textureToUse.OriginalHeight;

			if (this.TextAlignment == 1) // center
			{
				renderer.draw2DFontImage(rctTarget.x + ((rctTarget.w - fw) / 2),
				                         rctTarget.y + ((rctTarget.h - fh) / 2),
										 fw, fh, textureToUse, colorToUse);
			}
			else
			{
				// top left
				renderer.draw2DFontImage(rctTarget.x, rctTarget.y, fw, fh, textureToUse, colorToUse);
			}

		}
	}
	else
		this.destroyTextTextures(renderer);
}

/**
 * @private
 */
CL3D.Overlay2DSceneNode.prototype.destroyTextTextures = function(renderer)
{
	renderer.deleteTexture(this.TextTexture);
	renderer.deleteTexture(this.TextHoverTexture);
	this.TextTexture = null;
	this.TextHoverTexture = null;
}

/**
 * @private
 */
CL3D.Overlay2DSceneNode.prototype.createNewTextTexturesIfNecessary = function(renderer, forcedwidth)
{
	var needsDifferentHoverTexture = false;
	var createNewTexture = this.TextTexture == null || (needsDifferentHoverTexture && this.TextHoverTexture == null);

	if (!createNewTexture)
	{
		// also check for text content
		createNewTexture = this.CreatedTextTextureText != this.Text ||
		                   this.CreatedTextTextureFontName != this.FontName;
						   //this.TextColor != this.CreatedTextColor ||
						   //this.HoverFontColor != this.CreatedTextHoverColor;
	}

	if (!createNewTexture)
		return;

	// delete old textures
	this.destroyTextTextures(renderer);

	// create new CL3D.Textures

	var canvas = document.createElement("canvas");
	if (canvas == null)
		return;

	canvas.width = 1;
	canvas.height = 1;

	var ctx = null;

	try // some browsers don't support the 2D mode (IE WebGL)
	{
		ctx = canvas.getContext("2d");
		if (ctx == null)
			return;
	}
	catch(err)
	{
		return;
	}

	var fontSize = 12;
	var fontStr = this.parseCopperCubeFontString(this.FontName); // fontSize + "pt " + "Arial";
	ctx.font = fontStr;
	// we could also draw the text with alpha into the texture, unfortunately, firefox doesn't like this
	// and creates random green pixels at the border at the font. So we draw it with white onto
	// black and factor the color in the shader


	if (this.TextAlignment == 2) // multiline
	{
		// multiline text
		var BrokenText = new Array();
		this.breakText(BrokenText, forcedwidth, this.Text, ctx);

		var lineheight = this.CurrentFontPixelHeight * 1.2;
		var lineCount = BrokenText.length;
		var y = 0;

		canvas.width = forcedwidth;
		canvas.height = Math.max(1, lineCount * lineheight);

		ctx.fillStyle = "rgba(0, 0, 0, 1)";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = "rgba(255, 255, 255, 1)";
		ctx.textBaseline = "top";
		ctx.font = fontStr;

		for (var i=0; i<BrokenText.length; ++i)
		{
			ctx.fillText(BrokenText[i], 0, y);
			y += lineheight;
		}
	}
	else
	{
		// single line

		var dim = ctx.measureText(this.Text);
		canvas.width = dim.width;
		canvas.height = this.CurrentFontPixelHeight * 1.2;

		// black background
		ctx.fillStyle = "rgba(0, 0, 0, 1)";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = "rgba(255, 255, 255, 1)";
		ctx.textBaseline = "top";
		ctx.font = fontStr;
		ctx.fillText(this.Text, 0, 0);
	}

	var tex = renderer.createTextureFrom2DCanvas(canvas, true);
	this.TextTexture = tex;
	this.TextHoverTexture = tex;

	this.CreatedTextTextureText = this.Text;
	this.CreatedTextTextureFontName = this.FontName;
}

/**
 * @private
 * Breaks the text into multiple lines for text rendering
 */
CL3D.Overlay2DSceneNode.prototype.breakText = function(BrokenText, rectWidth, text, ctx)
{
	var line = "";
	var word = "";
	var whitespace = "";

	var lastLineStart = 0;
	var size = text.length;
	var length = 0;
	var elWidth = rectWidth - 6;
	var c = 'c';
	var WordWrap = true;

	for (var i=0; i<size; ++i)
	{
		c = text.charAt(i);
		var lineBreak = false;

		if (c == '\r') // Mac or Windows breaks
		{
			lineBreak = true;
			c = ' ';
			if (text.charAt(i+1) == '\n') // Windows breaks
			{
				text = text.substr(0, i).concat(text.substr(i+2)); // == text.erase(i+1);
				--size;
			}
		}
		else if (c == '\n') // Unix breaks
		{
			lineBreak = true;
			c = ' ';
		}

		if (c == ' ' || c == 0 || i == (size-1))
		{
			if (word.length)
			{
				// here comes the next whitespace, look if
				// we can break the last word to the next line.

				var whitelgth = ctx.measureText(whitespace).width;
				var worldlgth = ctx.measureText(word).width;

				if (WordWrap && length + worldlgth + whitelgth > elWidth)
				{
					// break to next line
					length = worldlgth;
					BrokenText.push(line);

					lastLineStart = i - word.length;
					line = word;
				}
				else
				{
					// add word to line
					line = line.concat(whitespace);
					line = line.concat(word);
					length += whitelgth + worldlgth;
				}

				word = "";
				whitespace = "";
			}

			whitespace = whitespace.concat(c);

			// compute line break
			if (lineBreak)
			{
				line = line.concat(whitespace);
				line = line.concat(word);

				BrokenText.push(line);

				lastLineStart = i+1;
				line = "";
				word = "";
				whitespace = "";
				length = 0;
			}
		}
		else
		{
			// yippee this is a word..
			word = word.concat(c);
		}
	}

	line = line.concat(whitespace);
	line = line.concat(word);
	BrokenText.push(line);
}

/**
 * @private
 */
CL3D.Overlay2DSceneNode.prototype.getMaterialCount = function()
{
	return 0;
}

/**
 * @private
 * Calculates 2d screen position from a 3d position, including displacement from view ports drawn in editors
 * Returns rectangle object with x, y, w, and h
 */
CL3D.Overlay2DSceneNode.prototype.getScreenCoordinatesRect = function(adjustForViewPortRendering, renderer)
{
	var w = renderer.getWidth();
	var h = renderer.getHeight();
	//core::dimension2d<s32> screensize = driver->getScreenSize();

	var retobj = new Object();

	retobj.sw = w;
	retobj.sh = h;

	if (this.SizeModeIsAbsolute)
	{
		// use absolute coordinates
		retobj.x = this.PosAbsoluteX;
		retobj.y = this.PosAbsoluteY;
		retobj.w = this.SizeAbsoluteWidth;
		retobj.h = this.SizeAbsoluteHeight;
	}
	else
	{
		// use relative coordinates
		retobj.x = this.PosRelativeX * w;
		retobj.y = this.PosRelativeY * h;
		retobj.w = this.SizeRelativeWidth * w;
		retobj.h = this.SizeRelativeHeight * h;
	}

	return retobj;
}

/**
 * @private
 */
CL3D.Overlay2DSceneNode.prototype.createClone = function(newparent, oldNodeId, newNodeId)
{
	var c = new CL3D.Overlay2DSceneNode();
	this.cloneMembers(c, newparent, oldNodeId, newNodeId);

	c.PosAbsoluteX = this.PosAbsoluteX;
	c.PosAbsoluteY = this.PosAbsoluteY;
	c.SizeAbsoluteWidth = this.SizeAbsoluteWidth;
	c.SizeAbsoluteHeight = this.SizeAbsoluteHeight;

	c.PosRelativeX = this.PosRelativeX;
	c.PosRelativeY = this.PosRelativeY;
	c.SizeRelativeWidth = this.SizeRelativeWidth;
	c.SizeRelativeHeight = this.SizeRelativeHeight;

	c.SizeModeIsAbsolute = this.SizeModeIsAbsolute;

	// other properties

	c.ShowBackGround = this.ShowBackGround;
	c.BackGroundColor = this.BackGroundColor;

	c.Texture = this.Texture;
	c.TextureHover = this.TextureHover;
	c.RetainAspectRatio = this.RetainAspectRatio;

	c.DrawText = this.DrawText;
	c.TextAlignment = this.TextAlignment;
	c.Text = this.Text;
	c.FontName = this.FontName;
	c.TextColor = this.TextColor;

	c.AnimateOnHover = this.AnimateOnHover;
	c.OnHoverSetFontColor = this.OnHoverSetFontColor;
	c.HoverFontColor = this.HoverFontColor;
	c.OnHoverSetBackgroundColor = this.OnHoverSetBackgroundColor;
	c.HoverBackgroundColor = this.HoverBackgroundColor;
	c.OnHoverDrawTexture = this.OnHoverDrawTexture;

	return c;
}



/**
 * @private
 */
CL3D.Overlay2DSceneNode.prototype.parseCopperCubeFontString = function(fontStr)
{
	// we only need to return something like
	// italic 12pt Arial;

	// input format:
	// example format: #fnt_23;default;arial;normal;bold;true
	// with parameters:
	//Point Size
	//Family (Default|Decorative|Roman|Script|Swiss|Modern)
	//Face Name (Arial etc)
	//Style (Normal|Slant|Italic)
	//Weight (Normal|Light|Bold)
	//Underlined (True|False)

	var outSize = 12;
	var outName = "Arial";
	var outItalic = false;
	var outBold = false;

	if (fontStr.indexOf('#fnt_') == 0)
		fontStr = fontStr.substr(5);

	var res = fontStr.split(';');
	for (var i=0; i<res.length; ++i)
	{
		var value = res[i];
		var valuelwr = value.toLowerCase();

		if (i == 0) // point size
		{
			var ptSize = parseInt(valuelwr);
			outSize = ptSize;
		}
		else
		if (i == 2) // face name
			outName = value;
		else
		if (i == 3) // style
		{
			if (valuelwr.indexOf('italic') != -1)
				outItalic = true;
		}
		else
		if (i == 4) // weight
		{
			if (valuelwr.indexOf('bold') != -1)
				outBold = true;
		}
	}

	// all data extracted, build style string
	// example: "italic 12pt Arial"

	var ret = "";
	if (outItalic)
		ret += "italic ";
	if (outBold)
		ret += "bold ";

	//ret += outSize + "pt ";
	// in 96dpi: (we assume this for the display here)
	// points = pixels * 72 / 96
	// pixels = (points * 96) / 72

	this.CurrentFontPixelHeight = (outSize * 96 / 72);
	ret += this.CurrentFontPixelHeight + "px ";

	ret += outName;

	return ret;
}