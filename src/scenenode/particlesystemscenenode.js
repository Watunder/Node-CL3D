//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

/**
 * A particle system is a simple way to simulate things like fire, smoke, rain, etc in your 3d scene.
  * @class A particle system is a simple way to simulate things like fire, smoke, rain, etc in your 3d scene.
 * @constructor
 * @extends CL3D.SceneNode
 * @example 
 * // Example showing how to create a particle system:
 * // create the 3d engine
 * var engine = new CL3D.CopperLicht('3darea');
 * 
 * if (!engine.initRenderer())
 * 	return; // this browser doesn't support WebGL
 * 	
 * // add a new 3d scene
 * 
 * var scene = new CL3D.Scene();
 * engine.addScene(scene);
 * 
 * scene.setBackgroundColor(CL3D.createColor(1, 0, 0, 64));
 * 
 * // add a user controlled camera with a first person shooter style camera controller
 * var cam = new CL3D.CameraSceneNode();
 * cam.Pos.X = 50;
 * cam.Pos.Y = 20;
 * 
 * var animator = new CL3D.AnimatorCameraFPS(cam, engine);										
 * cam.addAnimator(animator);										
 * animator.lookAt(new CL3D.Vect3d(0,20,0));			
 * 
 * scene.getRootSceneNode().addChild(cam);
 * scene.setActiveCamera(cam);		
 * 
 * // add a particle system to the scene
 * var psystem = new CL3D.ParticleSystemSceneNode();
 * scene.getRootSceneNode().addChild(psystem);
 * 
 * psystem.Direction = new CL3D.Vect3d(0, 0.03, 0);
 * psystem.MaxAngleDegrees = 20;
 * 
 * // set material and texture of the partcle system:
 * psystem.getMaterial(0).Tex1 = engine.getTextureManager().getTexture("crate_wood.jpg", true);
 * psystem.getMaterial(0).Type = CL3D.Material.EMT_TRANSPARENT_ADD_COLOR;
*/
CL3D.ParticleSystemSceneNode = function()
{
	this.init();
	
	this.Box = new CL3D.Box3d();
	this.Buffer = new CL3D.MeshBuffer();
	
	this.Direction = new CL3D.Vect3d(0, -0.03, 0);
	this.EmittArea = new CL3D.Vect3d(0, 0, 0);
	
	// runtime values
	
	this.LastEmitTime = 0;
	this.TimeSinceLastEmitting = 0;
	this.Particles = new Array();
}
CL3D.ParticleSystemSceneNode.prototype = new CL3D.SceneNode();

/**
 * Default direction the particles will be emitted to.
 * @public
 * @type CL3D.Vect3d()
 * @default (0, 0.03, 0)
 */
CL3D.ParticleSystemSceneNode.prototype.Direction = null;
			
/**
 * Maximal amount of degrees the emitting direction is ignored
 * @public
 * @type Number
 * @default 10
 */
CL3D.ParticleSystemSceneNode.prototype.MaxAngleDegrees = 10;

/**
 * Area the particles are emitted in. By default, this area has a size of 0, causing this to be a point emitter.
 * @public
 * @type CL3D.Vect3d()
 * @default (0, 0, 0)
 */
CL3D.ParticleSystemSceneNode.prototype.EmittArea = null;

/**
 * Minimal life time of a particle in milli seconds
 * @public
 * @type Number
 * @default 1000
 */
CL3D.ParticleSystemSceneNode.prototype.MinLifeTime = 1000;

/**
 * Maximal life time of a particle in milli seconds
 * @public
 * @type Number
 * @default 2000
 */
CL3D.ParticleSystemSceneNode.prototype.MaxLifeTime = 2000;

/**
 * Maximal amounts of particles in the system
 * @public
 * @type Number
 * @default 200
 */
CL3D.ParticleSystemSceneNode.prototype.MaxParticles = 200;

/**
 * Minimal amounts of particles emitted per second
 * @public
 * @type Number
 * @default 10
 */
CL3D.ParticleSystemSceneNode.prototype.MinParticlesPerSecond = 10;

/**
 * Maximal amounts of particles emitted per second
 * @public
 * @type Number
 * @default 20
 */
CL3D.ParticleSystemSceneNode.prototype.MaxParticlesPerSecond = 20;

/**
 * Minimal color of a particle when starting. Set to 0xffffffff to make it white.
 * @public
 * @type Number
 * @default 0xff000000
 */
CL3D.ParticleSystemSceneNode.prototype.MinStartColor = 0xff000000;

/**
 * Maximal color of a particle when starting. Set to 0xffffffff to make it white.
 * @public
 * @type Number
 * @default 0xff000000
 */
CL3D.ParticleSystemSceneNode.prototype.MaxStartColor = 0xffffffff;

/**
 * Minimal width of a particle when starting
 * @public
 * @type Number
 * @default 5
 */
CL3D.ParticleSystemSceneNode.prototype.MinStartSizeX = 5;

/**
 * Minimal height of a particle when starting
 * @public
 * @type Number
 * @default 5
 */
CL3D.ParticleSystemSceneNode.prototype.MinStartSizeY = 5;

/**
 * Maximal width of a particle when starting
 * @public
 * @type Number
 * @default 7
 */
CL3D.ParticleSystemSceneNode.prototype.MaxStartSizeX = 7;

/**
 * Maximal height of a particle when starting
 * @public
 * @type Number
 * @default 5
 */
CL3D.ParticleSystemSceneNode.prototype.MaxStartSizeY = 7;

/**
 * Setting if the fade out affector is active, i.e. if particles should be faded out at the end of their lifetime
 * @public
 * @type Boolean
 * @default false
 */
CL3D.ParticleSystemSceneNode.prototype.FadeOutAffector = false;

/**
 * If FadeOutAffector is true, this defines the time in milli seconds used for the fade out effect.
 * @public
 * @type Number
 * @default 500
 */
CL3D.ParticleSystemSceneNode.prototype.FadeOutTime = 500;

/**
 * If FadeOutAffector is true, this defines the target color of the fade out effect.
 * @public
 * @type Number
 * @default 0x00000000
 */
CL3D.ParticleSystemSceneNode.prototype.FadeTargetColor = 0x00000000;

/**
 * Setting if the gravity affector is active, i.e. if should be affected by gravity during their lifetime.
 * @public
 * @type Boolean
 * @default false
 */
CL3D.ParticleSystemSceneNode.prototype.GravityAffector = false;

/**
 * If GravityAffector is true, this defines the time in milli seconds after the gravity will have affect
 * @public
 * @type Number
 * @default 500
 */
CL3D.ParticleSystemSceneNode.prototype.GravityAffectingTime = 500;

/**
 * If GravityAffector is true, this will define the gravity vector. A useful value would be (0,-0.03,0), for example.
 * @public
 * @type Vect3d
 * @default null
 */
CL3D.ParticleSystemSceneNode.prototype.Gravity = null;

/**
 * Setting if the scale affector is active, i.e. if should be scaled their lifetime.
 * @public
 * @type Boolean
 * @default false
 */
CL3D.ParticleSystemSceneNode.prototype.ScaleAffector = false;

/**
 * If ScaleAffector is true, this defines the target scale X value.
 * @public
 * @type Number
 * @default 20
 */
CL3D.ParticleSystemSceneNode.prototype.ScaleToX = 20;

/**
 * If ScaleAffector is true, this defines the target scale Y value.
 * @public
 * @type Number
 * @default 20
 */
CL3D.ParticleSystemSceneNode.prototype.ScaleToY = 20;

/**
 * Option to disable fog for particle system rendering
 * @public
 * @type Number
 * @default 10
 */
CL3D.ParticleSystemSceneNode.prototype.DisableFog = false;

/**
 * @public
 */
CL3D.ParticleSystemSceneNode.prototype.createClone = function(newparent, oldNodeId, newNodeId)
{
	var c = new CL3D.ParticleSystemSceneNode();
	this.cloneMembers(c, newparent, oldNodeId, newNodeId);
					
	if (this.Box)
		c.Box = this.Box.clone();
		
	c.Direction = this.Direction.clone();				
	c.MaxAngleDegrees = this.MaxAngleDegrees;
	c.EmittArea = this.EmittArea.clone();	
	c.MinLifeTime = this.MinLifeTime;
	c.MaxLifeTime = this.MaxLifeTime;
	c.MaxParticles = this.MaxParticles;
	c.MinParticlesPerSecond = this.MinParticlesPerSecond;
	c.MaxParticlesPerSecond = this.MaxParticlesPerSecond;
	c.MinStartColor = this.MinStartColor;
	c.MaxStartColor = this.MaxStartColor;
	c.MinStartSizeX = this.MinStartSizeX;
	c.MinStartSizeY = this.MinStartSizeY;
	c.MaxStartSizeX = this.MaxStartSizeX;
	c.MaxStartSizeY = this.MaxStartSizeY;
	c.FadeOutAffector = true;
	c.FadeOutTime = this.FadeOutTime;
	c.FadeTargetColor = this.FadeTargetColor;
	c.GravityAffector = this.GravityAffector;
	c.GravityAffectingTime = this.GravityAffectingTime;
	c.Gravity = this.Gravity;	
	c.ScaleAffector = this.ScaleAffector;
	c.ScaleToX = this.ScaleToX;
	c.ScaleToY = this.ScaleToY;
	c.Buffer.Mat = this.Buffer.Mat.clone();
	
	return c;
}

/**
 * Get the axis aligned, not transformed bounding box of this node.
 * This means that if this node is an animated 3d character, moving in a room, the bounding box will 
 * always be around the origin. To get the box in real world coordinates, just transform it with the matrix 
 * you receive with {@link getAbsoluteTransformation}() or simply use {@link getTransformedBoundingBox}(), which does the same.
 * @public
 * @returns {CL3D.Box3d} Bounding box of this scene node.
 */
CL3D.ParticleSystemSceneNode.prototype.getBoundingBox = function()
{
	return this.Box;
}

/** 
 * Returns the type string of the scene node.
 * Returns 'billboard' for the mesh scene node.
 * @public
 * @returns {String} type name of the scene node.
 */
CL3D.ParticleSystemSceneNode.prototype.getType = function()
{
	return 'particlesystem';
}

/**
 * @private
 */
CL3D.ParticleSystemSceneNode.prototype.OnRegisterSceneNode = function(mgr)
{
	if (this.Visible)
	{
		mgr.registerNodeForRendering(this, this.Buffer.Mat.isTransparent() ? CL3D.Scene.RENDER_MODE_TRANSPARENT : CL3D.Scene.RENDER_MODE_DEFAULT);
		CL3D.SceneNode.prototype.OnRegisterSceneNode.call(this, mgr); 
	}
}


/**
 * @private
 */
CL3D.ParticleSystemSceneNode.prototype.getMaterialCount = function()
{
	return 1;
}

/**
 * @private
 */
CL3D.ParticleSystemSceneNode.prototype.getMaterial = function(i)
{
	return this.Buffer.Mat;
}


/**
 * @private
 */
CL3D.ParticleSystemSceneNode.prototype.OnAnimate = function(mgr, timeMs)
{			
	var framechanged = false;
	
	if (this.Visible)
		framechanged = this.doParticleSystem(timeMs);
		
	return CL3D.SceneNode.prototype.OnAnimate.call(this, mgr, timeMs) || framechanged;
}

/**
 * @private
 */
CL3D.ParticleSystemSceneNode.prototype.OnRegisterSceneNode = function(mgr)
{
	if (this.Visible)
	{				
		if (this.Particles.length != 0)
			mgr.registerNodeForRendering(this, this.Buffer.Mat.isTransparent() ? CL3D.Scene.RENDER_MODE_TRANSPARENT : CL3D.Scene.RENDER_MODE_DEFAULT);
			
		CL3D.SceneNode.prototype.OnRegisterSceneNode.call(this, mgr); 
	}
}

/**
 * @private
 */
CL3D.ParticleSystemSceneNode.prototype.render = function(renderer)
{
	var cam = this.scene.getActiveCamera();
	if (!cam)
		return;
		
	if (this.Particles.length == 0)
		return;
		
	var oldFog = renderer.FogEnabled;
	if (this.DisableFog)
		renderer.FogEnabled = false;
	
	var bShadowMapEnabled = renderer.isShadowMapEnabled();
	renderer.quicklyEnableShadowMap(false);
		
						
	// reallocate arrays, if they are too small
	this.reallocateBuffers();
	
	var m = renderer.getView();
	var view = new CL3D.Vect3d( -m.m02, -m.m06 , -m.m10 );
	
	// create particle vertex data
	var idx = 0;
	var v = null;
	
	for (var i=0; i<this.Particles.length; ++i) 
	{
		var particle = this.Particles[i];

		var f = 0.5 * particle.sizeX;
		var horizontal = new CL3D.Vect3d( m.m00 * f, m.m04 * f, m.m08 * f );

		f = -0.5 * particle.sizeY;
		var vertical = new CL3D.Vect3d(m.m01 * f, m.m05 * f, m.m09 * f );
		
		var clr = CL3D.createColor(CL3D.getAlpha(particle.color), CL3D.getRed(particle.color) / 4.0, CL3D.getGreen(particle.color) / 4.0, CL3D.getBlue(particle.color) / 4.0);		

		v = this.Buffer.Vertices[0+idx];
		v.Pos = particle.pos.add(horizontal).add(vertical);
		v.Color = clr;
		v.Normal = view; // clone?

		v = this.Buffer.Vertices[1+idx];
		v.Pos = particle.pos.add(horizontal).substract(vertical);
		v.Color = clr;
		v.Normal = view; // clone?

		v = this.Buffer.Vertices[2+idx];
		v.Pos = particle.pos.substract(horizontal).substract(vertical);
		v.Color = clr;
		v.Normal = view; // clone?

		v = this.Buffer.Vertices[3+idx];
		v.Pos = particle.pos.substract(horizontal).add(vertical);
		v.Color = clr;
		v.Normal = view; // clone?

		idx +=4;
	}

	// render all
	var mat = new CL3D.Matrix4(true);
	
	//if (!this.ParticlesAreGlobal)
	//mat.setTranslation(this.AbsoluteTransformation.getTranslation());

	renderer.setWorld(mat);

	this.Buffer.update(false, true); // TODO performance: we could also tell the engine only to update the data if the size hasn't changed
	renderer.setMaterial(this.Buffer.Mat);	
	renderer.drawMeshBuffer(this.Buffer, this.Particles.length*2 * 3);
	
	if (this.DisableFog)
		renderer.FogEnabled = oldFog;
	
	if (bShadowMapEnabled)
		renderer.quicklyEnableShadowMap(true);
}


/**
 * @private
 */
CL3D.ParticleSystemSceneNode.prototype.doParticleSystem = function(time)
{
	if (this.LastEmitTime == 0)
	{
		this.LastEmitTime = time;
		return false;
	}

	var now = time;
	var timediff = time - this.LastEmitTime;
	this.LastEmitTime = time;

	if (!this.Visible)
		return false;
		
	var changed = false;
	
	// run emitter

	changed = this.emit(time, timediff);

	// run affectors
	
	changed = this.affect(time, timediff) || changed;

	// animate all particles

	var trans = this.AbsoluteTransformation.getTranslation();
	this.Buffer.Box.reset(trans.X, trans.Y, trans.Z);

	var scale = timediff;
	
	if (this.Particles.length != 0)
		changed = true;

	for (var i=0; i<this.Particles.length;)
	{
		var p = this.Particles[i];
		
		if (now > p.endTime)
			this.Particles.splice(i, 1);
		else
		{
			p.pos.addToThis(p.vector.multiplyWithScal(scale));
			this.Buffer.Box.addInternalPointByVector(p.pos);
			++i;
		}
	}	


	// correct bounding box

	var m = this.MaxStartSizeX * 0.5;

	this.Buffer.Box.MaxEdge.X += m;
	this.Buffer.Box.MaxEdge.Y += m;
	this.Buffer.Box.MaxEdge.Z += m;

	this.Buffer.Box.MinEdge.X -= m;
	this.Buffer.Box.MinEdge.Y -= m;
	this.Buffer.Box.MinEdge.Z -= m;

	//if (true) //ParticlesAreGlobal)
	{
		var absinv = new CL3D.Matrix4(false);
		this.AbsoluteTransformation.getInverse(absinv);
	
		absinv.transformBoxEx(this.Buffer.Box);
	}
	
	return changed;
}

/**
 * @private
 */
CL3D.ParticleSystemSceneNode.prototype.emit = function(time, diff)
{
	var pps = (this.MaxParticlesPerSecond - this.MinParticlesPerSecond);
	var perSecond = pps ? (this.MinParticlesPerSecond + (Math.random() * pps)) : this.MinParticlesPerSecond;
	var everyWhatMillisecond = 1000.0 / perSecond;

	var oldParticleAmount = this.Particles.length;

	this.TimeSinceLastEmitting += diff;

	if (this.TimeSinceLastEmitting <= everyWhatMillisecond)
		return false;
	
	var amountNewParticles = ((this.TimeSinceLastEmitting / everyWhatMillisecond) + 0.5);
	
	this.TimeSinceLastEmitting = 0;

	if (oldParticleAmount + amountNewParticles > this.MaxParticles)
	{
		var delta = (oldParticleAmount + amountNewParticles) - this.MaxParticles;
		amountNewParticles -= delta;
	}

	if (amountNewParticles <= 0)
		return false;

	//Particles.set_used(oldParticleAmount + amountNewParticles);
	//Particles.reallocate(oldParticleAmount + amountNewParticles);
	
	var rotatedDirection = this.Direction.clone();
	this.AbsoluteTransformation.rotateVect(rotatedDirection);
	
	var transScale = this.AbsoluteTransformation.getScale().getLength();

	var bPointEmitter = this.EmittArea.equalsZero();

	for (var i=oldParticleAmount; i<oldParticleAmount+amountNewParticles; ++i)
	{
		var p = new CL3D.Particle();
		p.pos = new CL3D.Vect3d(0,0,0);

		if (!bPointEmitter)
		{
			if (this.EmittArea.X != 0.0)
				p.pos.X = (Math.random() * this.EmittArea.X) - this.EmittArea.X * 0.5;
			if (this.EmittArea.Y != 0.0)
				p.pos.Y = (Math.random() * this.EmittArea.Y) - this.EmittArea.Y * 0.5;
			if (this.EmittArea.Z != 0.0)
				p.pos.Z = (Math.random() * this.EmittArea.Z) - this.EmittArea.Z * 0.5;
		}

		p.startTime = time;
		p.vector = rotatedDirection.clone();

		if (this.MaxAngleDegrees)
		{
			var tgt = rotatedDirection.clone();
			tgt.rotateXYBy((Math.random() * this.MaxAngleDegrees*2) - this.MaxAngleDegrees);
			tgt.rotateYZBy((Math.random() * this.MaxAngleDegrees*2) - this.MaxAngleDegrees);
			tgt.rotateXZBy((Math.random() * this.MaxAngleDegrees*2) - this.MaxAngleDegrees);
			p.vector = tgt;
		}

		if (this.MaxLifeTime - this.MinLifeTime == 0)
			p.endTime = time + this.MinLifeTime;
		else
			p.endTime = time + this.MinLifeTime + (Math.random() * (this.MaxLifeTime - this.MinLifeTime));

		p.color = CL3D.getInterpolatedColor(this.MinStartColor, this.MaxStartColor, (Math.random() * 100) / 100.0);

		p.startColor = p.color;
		p.startVector = p.vector.clone();

		if (this.MinStartSizeX == this.MaxStartSizeX && this.MinStartSizeY == this.MaxStartSizeY)
		{
			p.startSizeX = this.MinStartSizeX;
			p.startSizeY = this.MinStartSizeY;
		}
		else
		{
			var f = (Math.random() * 100) / 100.0;
			var inv = 1.0 - f;
			p.startSizeX = this.MinStartSizeX*f + this.MaxStartSizeX*inv;
			p.startSizeY = this.MinStartSizeY*f + this.MaxStartSizeY*inv;
		}

		p.startSizeX *= transScale;
		p.startSizeY *= transScale;
				
		p.sizeX = p.startSizeX;
		p.sizeY = p.startSizeY;

		//AbsoluteTransformation.rotateVect(p.startVector);

		//if (this.ParticlesAreGlobal)
			this.AbsoluteTransformation.transformVect(p.pos);

		//Particles[i] = p;
		this.Particles.unshift(p); // = push_front
	}
				
	return true;
}

/**
 * @private
 */
CL3D.ParticleSystemSceneNode.prototype.affect = function(now, diff)
{
	if (!this.FadeOutAffector && !this.GravityAffector && !this.ScaleAffector)
		return false;
		
	var i = 0;
	var p = null;

	if (this.FadeOutAffector)
	{
		for (i=0; i<this.Particles.length; ++i)
		{
			p = this.Particles[i];

			if (p.endTime - now < this.FadeOutTime)
			{
				var d = (p.endTime - now) / this.FadeOutTime;
				p.color = CL3D.getInterpolatedColor(p.startColor, this.FadeTargetColor, d);
			}
		}	
	}

	if (this.GravityAffector)
	{
		var g = this.Gravity.multiplyWithVect(this.AbsoluteTransformation.getScale());
		
		for (i=0; i<this.Particles.length; ++i)
		{
			p = this.Particles[i];

			var u = (now - p.startTime) / this.GravityAffectingTime;
			u = CL3D.clamp(u, 0.0, 1.0);
			u = 1.0 - u;

			p.vector = p.startVector.getInterpolated(g, u);
		}	
	}

	if (this.ScaleAffector)
	{
		var transScale = this.AbsoluteTransformation.getScale().X;
		
		for (i=0; i<this.Particles.length; ++i)
		{
			p = this.Particles[i];

			var maxdiff = p.endTime - p.startTime;
			var curdiff = now - p.startTime;
			var newscale = curdiff/maxdiff;
			
			p.sizeX = p.startSizeX + this.ScaleToX * newscale * transScale;
			p.sizeY = p.startSizeY + this.ScaleToY * newscale * transScale;
		}	
	}
	
	return true;
}

/**
 * @private
 */
CL3D.ParticleSystemSceneNode.prototype.reallocateBuffers = function()
{
	if (this.Particles.length * 4 > this.Buffer.Vertices.length ||
		this.Particles.length * 6 > this.Buffer.Indices.length)
	{
		var oldSize = this.Buffer.Vertices.length;
		var va = this.Buffer.Vertices;
		
		while(this.Buffer.Vertices.length < this.Particles.length * 4)
		{
			var v = null;
			
			v = new CL3D.Vertex3D(true);
			v.TCoords.set(0.0, 0.0);
			va.push(v);
			
			v = new CL3D.Vertex3D(true);
			v.TCoords.set(0.0, 1.0);
			va.push(v);
			
			v = new CL3D.Vertex3D(true);
			v.TCoords.set(1.0, 1.0);
			va.push(v);
			
			v = new CL3D.Vertex3D(true);
			v.TCoords.set(1.0, 0.0);
			va.push(v);
		}

		// fill remaining indices
		var oldIdxSize = this.Buffer.Indices.length;
		var oldvertices = oldSize;
		var newIndexSize = this.Particles.length * 6;
		
		var ia = this.Buffer.Indices;

		for (var i=oldIdxSize; i<newIndexSize; i+=6)
		{
			ia.push(0+oldvertices);
			ia.push(2+oldvertices);
			ia.push(1+oldvertices);
			ia.push(0+oldvertices);
			ia.push(3+oldvertices);
			ia.push(2+oldvertices);
			
			oldvertices += 4;
		}
	}
}


// ------------------------------------------------------------------------

/**
 * A 3d particle, internally used in {@link ParticleSystemSceneNode}
 * @constructor
 * @class A 3d particle, internally used in {@link ParticleSystemSceneNode}
 * @private
 */
CL3D.Particle = function(init)
{
	this.pos = null; //:Vect3dF;
	this.vector = null;		
	this.startTime = 0;
	this.endTime = 0;
	this.color = 0;
	this.startColor = 0;
	this.startVector = null;
	this.sizeX = 0.0;
	this.sizeY = 0.0;
	this.startSizeX = 0.0;
	this.startSizeY = 0.0;
}