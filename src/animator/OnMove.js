//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "../main.js";

/**
 * Scene node animator which invokes an action when the mouse enters or leaves a 3d scene node. 
 * Private, only used to implement the coppercube editor animator.
 * @constructor
 * @public
 * @extends CL3D.AnimatorOnClick
 * @class  Scene node animator which invokes a callback function when the scene node has been clicked.
 */
export class AnimatorOnMove extends CL3D.AnimatorOnClick {
	/**
 	 * @param {CL3D.Scene} scene The scene of the animator.
 	 * @param {CL3D.CopperLicht} engine an instance of the 3d engine
 	 * @param {Function=} functionToCall a function which should be called when the scene node has been clicked
	 */
	constructor(scene, engine, functionToCall) {
		super(null, null, null, true);
		
		this.engine = engine;
		this.SMGr = scene;
		this.FunctionToCall = functionToCall;

		this.ActionHandlerOnEnter = null;
		this.ActionHandlerOnLeave = null;
		this.TimeLastChecked = 0;
		this.bLastTimeWasInside = false;
	}

	/**
	 * Returns the type of the animator.
	 * For the AnimatorOnMove, this will return 'onmove'.
	 * @public
	 */
	getType() {
		return 'onmove';
	}

	/**
	 * @param {CL3D.SceneNode} node
	 * @param {CL3D.Scene} newManager
	 * @param {Number} oldNodeId
	 * @param {Number} newNodeId
	 */
	createClone(node, newManager, oldNodeId, newNodeId) {
		var a = new CL3D.AnimatorOnMove(this.SMGr, this.engine);
		a.BoundingBoxTestOnly = this.BoundingBoxTestOnly;
		a.CollidesWithWorld = this.CollidesWithWorld;
		a.TheActionHandler = this.TheActionHandler ? this.TheActionHandler.createClone(oldNodeId, newNodeId) : null;
		a.World = this.World;
		a.ActionHandlerOnEnter = this.ActionHandlerOnEnter ? this.ActionHandlerOnEnter.createClone(oldNodeId, newNodeId) : null;
		a.ActionHandlerOnLeave = this.ActionHandlerOnLeave ? this.ActionHandlerOnLeave.createClone(oldNodeId, newNodeId) : null;
		return a;
	}

	/**
	 * Animates the scene node it is attached to and returns true if scene node was modified.
	 * @public
	 * @param {CL3D.SceneNode} node The Scene node which needs to be animated this frame.
	 * @param {Number} timeMs The time in milliseconds since the start of the scene.
	 */
	animateNode(node, timeMs) {
		var firstCheck = (this.TimeLastChecked == 0);
		var now = CL3D.CLTimer.getTime();

		if (firstCheck || now - this.TimeLastChecked > 100) {
			this.TimeLastChecked = now;

			//  now test for collision
			var bIsInside = this.isOverNode(node, this.engine.getMouseX(), this.engine.getMouseY());

			if (firstCheck)
				this.bLastTimeWasInside = bIsInside;

			else {
				// invoke action
				if (bIsInside != this.bLastTimeWasInside) {
					this.bLastTimeWasInside = bIsInside;

					if (bIsInside && this.ActionHandlerOnEnter)
						this.ActionHandlerOnEnter.execute(node);

					else if (!bIsInside && this.ActionHandlerOnLeave)
						this.ActionHandlerOnLeave.execute(node);

					return true;
				}

				else if (!bIsInside && this.FunctionToCall)
					this.FunctionToCall();
			}
		}

		return false;
	}

	/**
	 * @public
	 */
	findActionByType(type) {
		var ret = null;

		if (this.ActionHandlerOnLeave) {
			ret = this.ActionHandlerOnLeave.findAction(type);
			if (ret)
				return ret;
		}

		if (this.ActionHandlerOnEnter) {
			ret = this.ActionHandlerOnEnter.findAction(type);
			if (ret)
				return ret;
		}

		return null;
	}
};
