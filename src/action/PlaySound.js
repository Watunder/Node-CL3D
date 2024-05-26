// ---------------------------------------------------------------------
// Action PlaySound
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @private
 * @constructor
 * @class
 */
export class ActionPlaySound extends CL3D.Action {
	constructor() {
		this.Type = 'PlaySound';
	}

	/**
	 * @private
	 */
	createClone(oldNodeId, newNodeId) {
		var a = new CL3D.ActionPlaySound();
		a.SceneNodeToPlayAt = this.SceneNodeToPlayAt;
		a.PlayAtCurrentSceneNode = this.PlayAtCurrentSceneNode;
		a.Position3D = this.Position3D ? this.Position3D.clone() : null;
		a.MinDistance = this.MinDistance;
		a.MaxDistance = this.MaxDistance;
		a.PlayLooped = this.PlayLooped;
		a.Volume = this.Volume;
		a.PlayAs2D = this.PlayAs2D;
		a.TheSound = this.TheSound;

		if (a.SceneNodeToPlayAt == oldNodeId)
			a.SceneNodeToPlayAt = newNodeId;

		return a;
	}

	/**
	 * @private
	 */
	execute(currentNode, sceneManager) {
		if (sceneManager == null || this.TheSound == null)
			return;

		if (this.PlayAs2D || true) // currently no 3d playing supported
		{
			this.PlayingSound = CL3D.gSoundManager.play2D(this.TheSound, this.PlayLooped, this.Volume);
		}
	}
};
