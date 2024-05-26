//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "../main.js";

/**
 * Scene node animator changing the texture of {@link SceneNode}s so that they appear animated.
 * @constructor
 * @public
 * @extends CL3D.Animator
 * @class  Scene node animator changing the texture of {@link SceneNode}s so that they appear animated.
 * @param {Array} textures array of {@link Texture}s to set
 * @param {Number} timeperframe time to switch to the next texture in the texture array, in milliseconds. For example 500 for half a second per  frame.
 * @param {Boolean} donotloop if set to true, the animation will only be played once
 */
export class AnimatorAnimateTexture extends CL3D.Animator {
	constructor(textures, timeperframe, donotloop) {
		super();

		//private static const ETCT_CHANGE_ALL = 0;
		//private static const ETCT_CHANGE_WITH_INDEX = 1;
		this.Textures = new Array(); // Textures

		this.Loop = true;
		this.TimePerFrame = 20;
		this.TextureChangeType = 0;
		this.TextureIndexToChange = 0;
		this.MyStartTime = 0;

		if (textures)
			this.Textures = textures;
		if (timeperframe)
			this.TimePerFrame = timeperframe;
		if (donotloop == true)
			this.loop = false;
	}

	/**
	 * Returns the type of the animator.
	 * For the AnimatorAnimateTexture, this will return 'animatetexture'.
	 * @public
	 */
	getType() {
		return 'animatetexture';
	}

	/**
	 * @private
	 */
	createClone(node, newManager, oldNodeId, newNodeId) {
		var a = new CL3D.AnimatorAnimateTexture();
		a.Textures = this.Textures;
		a.Loop = this.Loop;
		a.TimePerFrame = this.TimePerFrame;
		a.TextureChangeType = this.TextureChangeType;
		a.TextureIndexToChange = this.TextureIndexToChange;
		return a;
	}

	/**
	 * Animates the scene node it is attached to and returns true if scene node was modified.
	 * @public
	 * @param {CL3D.SceneNode} n The Scene node which needs to be animated this frame.
	 * @param {Integer} timeMs The time in milliseconds since the start of the scene.
	 */
	animateNode(n, timeMs) {
		if (n == null || this.Textures == null)
			return false;

		var changedSomething = false;
		var mat = null;

		if (this.Textures.length) {
			var startTime = (this.MyStartTime == 0) ? n.scene.getStartTime() : this.MyStartTime;

			var t = (timeMs - startTime);
			var endTime = startTime + (this.TimePerFrame * this.Textures.length);

			var idx = 0;
			if (!this.Loop && timeMs >= endTime)
				idx = this.Textures.length - 1;

			else {
				if (this.TimePerFrame > 0)
					idx = Math.floor((t / this.TimePerFrame) % this.Textures.length);

				else
					idx = 0;
			}

			if (idx < this.Textures.length) {
				if (this.TextureChangeType == 1) //ETCT_CHANGE_WITH_INDEX)
				{
					// change only the material with the index
					if (this.TextureIndexToChange >= 0 && this.TextureIndexToChange < n.getMaterialCount()) {
						mat = n.getMaterial(this.TextureIndexToChange);
						if (mat && !(mat.Tex1 === this.Textures[idx])) {
							mat.Tex1 = this.Textures[idx];
							changedSomething = true;
						}
					}
				}

				else {
					// change all materials
					var mcount = n.getMaterialCount();
					for (var i = 0; i < mcount; ++i) {
						mat = n.getMaterial(i);
						if (mat && !(mat.Tex1 === this.Textures[idx])) {
							mat.Tex1 = this.Textures[idx];
							changedSomething = true;
						}
					}
				}
			}
		}

		return changedSomething;
	}

	/**
	 * @private
	 */
	reset() {
		this.MyStartTime = CL3D.CLTimer.getTime();
	}
};
