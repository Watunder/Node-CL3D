//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

/**
 * A sound scene node represents and plays a 3d sound  
 * @class A sound scene node represents and plays a 3d sound  
 * @constructor
 * @extends CL3D.SceneNode
 */
CL3D.SoundSceneNode = function()
{
	this.init();
	
	this.Box = new CL3D.Box3d();
	this.MinDistance = 0;
	this.MaxDistance = 0;
	this.PlayMode = 0;
	this.DeleteWhenFinished = false;
	this.MaxTimeInterval = 0;
	this.MinTimeInterval = 0;
	this.Volume = 0;
	this.PlayAs2D = false;
	
	this.PlayingSound = null;
	
	//private var PlayingSoundTransform:SoundTransform;
	//private const RollOffFactor:Number = 1.0;
	
	this.SoundPlayCompleted = false;
	this.TimeMsDelayFinished = 0;
	this.PlayedCount = 0;
}
CL3D.SoundSceneNode.prototype = new CL3D.SceneNode();


/**
 * Get the axis aligned, not transformed bounding box of this node.
 * This means that if this node is an animated 3d character, moving in a room, the bounding box will 
 * always be around the origin. To get the box in real world coordinates, just transform it with the matrix 
 * you receive with {@link getAbsoluteTransformation}() or simply use {@link getTransformedBoundingBox}(), which does the same.
 * @public
 * @returns {CL3D.Box3d} Bounding box of this scene node.
 */
CL3D.SoundSceneNode.prototype.getBoundingBox = function()
{
	return this.Box;
}

/** 
 * Returns the type string of the scene node.
 * Returns 'sound' for the mesh scene node.
 * @public
 * @returns {String} type name of the scene node.
 */
CL3D.SoundSceneNode.prototype.getType = function()
{
	return 'sound';
}


/**
 * @private
 */
CL3D.SoundSceneNode.prototype.OnRegisterSceneNode = function(mgr)
{
	if (this.Visible)
	{
		mgr.registerNodeForRendering(this, CL3D.Scene.RENDER_MODE_DEFAULT);
			
		CL3D.SceneNode.prototype.OnRegisterSceneNode.call(this, mgr); 
	}
}

/**
 * @private
 */
CL3D.SoundSceneNode.prototype.get2DAngle = function(X, Y)
{
	if (Y == 0) 
		return X < 0 ? 180 : 0;
	else if (X == 0)
		return Y < 0 ? 90 : 270;

	var tmp = Y / Math.sqrt(X*X + Y*Y);
	tmp = Math.atan(Math.sqrt(1 - tmp*tmp) / tmp) * CL3D.RADTODEG;

	if (X>0 && Y>0)
		return tmp + 270;
	else
	if (X>0 && Y<0)
		return tmp + 90;
	else
	if (X<0 && Y<0)
		return 90 - tmp;
	else
	if (X<0 && Y>0)
		return 270 - tmp;

	return tmp;
}

/**
 * normalizes an angle, returns the same angle clamped into (0;360)
 * @private
 */
CL3D.SoundSceneNode.prototype.normalizeAngle = function(angleInGrad)
{
	return (( angleInGrad % 360.0) + 360.0) % 360.0;
}

/**
 * If you need to find the smallest amount to turn a gun or head or whatever
 * to a certain angle, or find the smallest amount to turn to go a certain direction,
 * you shouldn't have to go more than 180 degrees in either direction.
 * @private
 */
CL3D.SoundSceneNode.normalizeRelativeAngle = function(angleInGrad)
{
	return ((angleInGrad + 7*180.0) % (360.0)) - 1800.0; 
}

/**
 * @private
 */
CL3D.SoundSceneNode.prototype.updateSoundFor3DSound = function(playingSnd, Position, mgr)
{
	// unfortunately, HTML5 audio currently is very primitive, so we can only set the volume for this right now
	
	var effectiveVolume = this.Volume;
	
	if (!mgr)
		return;
		
	if (!playingSnd)
		return;

	// calculate distance
	
	var cam = mgr.getActiveCamera();
	if (!cam)
		return;	
	var listenerPos = cam.getAbsolutePosition();
	var lookdir = cam.getTarget().substract(listenerPos);
	var distanceToListener = listenerPos.getDistanceTo(Position);

	if ( distanceToListener < this.MinDistance )
	{
		// no change in volume, listener is inside minDistance
	}
	else
	{
		// calculate volume attenuation/rolloff

		distanceToListener -= this.MinDistance;
		var fact = this.MaxDistance - this.MinDistance;

		if (fact > 0)
		{
			if (false) // linear
			{
				// linear rolloff

				var interpol = distanceToListener / fact; // interpol is 0 if far away, 1 if close
				effectiveVolume = effectiveVolume * (10.0 - interpol);
			}
			else
			{
				// logarithmic rolloff

				if ( distanceToListener > fact ) // keep volume at same level at max distance
					distanceToListener = fact;

				var loga = 10.0;

				if (distanceToListener != 0)
					loga = this.MinDistance / distanceToListener;

				distanceToListener *= this.RollOffFactor;

				effectiveVolume = effectiveVolume * loga;
			}

			if (effectiveVolume > 10.0)
				effectiveVolume = 10.0;
		}
		else
			effectiveVolume = 10.0;
	}

	// set pan
	// we assume here that the upvector will either be (1,0,0), (0,1,0) or (0,0,1)
	// TODO: transform point into that plane if not
	/*
	var lookangle:Number = 0;
	var toSoundAngle:Number = 0;

	var normUp:Vect3dF = cam.getUpVector().clone();
	normUp.normalize();
	normUp.X *= normUp.X;
	normUp.Y *= normUp.Y;
	normUp.Z *= normUp.Z;

	if (normUp.Y >= normUp.X && normUp.Y >= normUp.Z)
	{
		// irrlicht default, Y is up
		lookangle = get2DAngle(lookdir.X, lookdir.Z);
		toSoundAngle = get2DAngle(Position.X - listenerPos.X, Position.Z - listenerPos.Z);
	}
	else
	if (normUp.X >= normUp.Y && normUp.X >= normUp.Z)
	{
		// X is up
		lookangle = get2DAngle(lookdir.Y, lookdir.Z);
		toSoundAngle = get2DAngle(Position.Y - listenerPos.Y, Position.Z - listenerPos.Z);
	}
	else
	{
		// Z is up
		lookangle = get2DAngle(lookdir.X, lookdir.Y);
		toSoundAngle = get2DAngle(Position.X - listenerPos.X, Position.Y - listenerPos.Y);
	}

	lookangle = normalizeAngle(lookangle);
	toSoundAngle = normalizeAngle(toSoundAngle);

	var lookAngleToSoundAngle:Number = lookangle - toSoundAngle;

	lookAngleToSoundAngle = normalizeRelativeAngle(lookAngleToSoundAngle);

	// we need to set the pan between -1.0 and 1.0, the realAngle
	var effectivePan:Number = (lookAngleToSoundAngle / 180.0);
	if (effectivePan > 1.0)
		effectivePan = 1.0;
	if (effectivePan < -1.0)
		effectivePan = -1.0;
		
	playingSnd.pan = effectivePan;
	*/
	
	// set volume
	if (effectiveVolume > 1.0)
		effectiveVolume = 1.0;
		
	CL3D.gSoundManager.setVolume(playingSnd, effectiveVolume);
}

/**
 * @private
 */
CL3D.SoundSceneNode.prototype.startSound = function(loop)
{
	if (!this.PlayingSound && this.TheSound)
	{
		this.SoundPlayCompleted = false;
		this.PlayingSound = CL3D.gSoundManager.play2D(this.TheSound, loop);

		if (!this.PlayAs2D)
		{
			var pos = this.getAbsolutePosition();
			this.updateSoundFor3DSound(this.PlayingSound, pos, this.scene);					
		}
	}
}


/**
 * @private
 */
CL3D.SoundSceneNode.prototype.OnAnimate = function(scene, timeMs)
{
	try
	{	
		var pos = this.getAbsolutePosition();
		
		if (this.PlayingSound && !this.PlayAs2D)
		{
			// update 3d position of the sound
			this.updateSoundFor3DSound(this.PlayingSound, pos, scene);					
		}
		
		
		switch(this.PlayMode)
		{
		case 0: //EPM_NOTHING:
			break;
		case 1: //EPM_RANDOM:
			{
				if (this.PlayingSound && this.PlayingSound.hasPlayingCompleted())
				{
					this.PlayingSound = null;

					// calculate next play time

					var delta = this.MaxTimeInterval - this.MinTimeInterval;

					if (delta < 2)
						delta = 2;

					this.TimeMsDelayFinished = timeMs + (Math.random() * delta) + this.MinTimeInterval;
				}
				else
				if (!this.PlayingSound && (!this.TimeMsDelayFinished || timeMs > this.TimeMsDelayFinished))
				{
					// play new sound		

					if (this.TheSound)
					{
						this.startSound(false);
					}
				}
			}
			break;
		case 2: //EPM_LOOPING:
			{
				if (!this.PlayingSound)
				{
					if (this.TheSound)
					{
						this.startSound(true);
					}
				}
			}
			break;
		case 3: //EPM_ONCE:
			{
				if (this.PlayedCount)
				{
					// stop
				}
				else
				{
					// start

					if (this.TheSound)
					{
						this.startSound(false);
						++this.PlayedCount;
					}
				}
			}
			break;
		}
	}
	catch(e)
	{
		//Debug.print("Error:" + e);
	}

	return false;
}	


/**
 * @private
 */
CL3D.SoundSceneNode.prototype.createClone = function(newparent, oldNodeId, newNodeId)
{
	var c = new CL3D.SoundSceneNode();
	this.cloneMembers(c, newparent, oldNodeId, newNodeId);
			
	if (this.Box)
		c.Box = this.Box.clone();
		
	// TODO: copy other members
		
	return c;
}
