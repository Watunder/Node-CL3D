//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "./main.js";

/**
 * An animator animates a scene node. It can animate position, rotation, material, and so on. 
 * A scene node animator is able to animate a {@link SceneNode} in a very simple way: It may change its position,
 * rotation, scale and/or material. There are lots of animators to choose from. You can create scene node animators 
 * and attach them to a scene node using {@link SceneNode.addAnimator()}.<br/>
 * Note that this class is only the base class of all Animators, it doesn't do anything itself. See
 * {@link AnimatorCameraFPS} for a concrete Animator example.
 * @class An animator can be attached to a scene node and animates it.
 * @constructor
 * @public
 */
export class Animator {
	constructor() {
		this.Type = -1;
	}

	/**
	 * Returns the type of the animator.
	 * Usual values are 'none', 'camerafps', etc. See the concreate animator implementations for type strings.
	 * @public
	 */
	getType() {
		return 'none';
	}

	/**
	 * Animates the scene node it is attached to and returns true if scene node was modified.
	 * @public
	 * @param {CL3D.SceneNode} n The Scene node which needs to be animated this frame.
	 * @param {Integer} timeMs The time in milliseconds since the start of the scene.
	 */
	animateNode(n, timeMs) {
		return false;
	}

	/**
	 * Event handler called by the engine so the animator can react to mouse and key input
	 * @public
	 */
	onMouseDown(event) {
	}
	
	/**
	 * Event handler called by the engine so the animator can react to mouse and key input
	 * @public
	 */
	onMouseWheel(delta) {
	}

	/**
	 * Event handler called by the engine so the animator can react to mouse and key input
	 * @public
	 */
	onMouseUp(event) {
	}

	/**
	 * Event handler called by the engine so the animator can react to mouse and key input
	 * @public
	 */
	onMouseMove(event) {
	}

	/**
	 * Event handler called by the engine so the animator can react to mouse and key input.
	 * Returns false if the event has not been processed.
	 * @public
	 */
	onKeyDown(event) {
		return false;
	}

	/**
	 * Event handler called by the engine so the animator can react to mouse and key input
	 * Returns false if the event has not been processed.
	 * @public
	 */
	onKeyUp(event) {
		return false;
	}

	/**
	 * Resets the animator, if supported
	 * @private
	 */
	reset(event) {
	}

	/**
	 * @private
	 */
	findActionByType(type) {
		return null;
	}

	/**
	 * Creates an exact, deep copy of this animator
	 * @public
	 */
	createClone(node, scene, oldNodeId, newNodeId) {
		return null;
	}
};
