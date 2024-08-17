// ---------------------------------------------------------------------
// Action PlaySound
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @public
 * @constructor
 * @class
 */
export class ActionPlaySound extends CL3D.Action {
	/**
	 * @type {Number}
	 */
	SceneNodeToPlayAt;
	/**
	 * @type {boolean}
	 */
	PlayAtCurrentSceneNode;
	/**
	 * @type {CL3D.Vect3d}
	 */
	Position3D;
	/**
	 * @type {Number}
	 */
	MinDistance;
	/**
	 * @type {Number}
	 */
	MaxDistance;
	/**
	 * @type {boolean}
	 */
	PlayLooped;
	/**
	 * @type {Number}
	 */
	Volume;
	/**
	 * @type {boolean}
	 */
	PlayAs2D;
	/**
	 * @type {null}
	 */
	TheSound;

	constructor() {
		super();

		this.Type = 'PlaySound';
	}

	/**
	 * @param {Number} oldNodeId
	 * @param {Number} newNodeId
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
	 * @param {CL3D.SceneNode} currentNode
	 * @param {CL3D.Scene} sceneManager
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
