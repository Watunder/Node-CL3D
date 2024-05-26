//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "../main.js";

/**
 * Scene node animator which invokes a callback function when the scene node gets near another scene node.
 * It works like in this example:
 * @example
 * var yourFunction = function(){ alert('now near your scene node!'); }
 * var animator = new CL3D.AnimatorOnProximity(engine.getScene(), 100,
 *     34534, yourFunction, false);
 * yourSceneNode.addAnimator(animator);
 * @constructor
 * @public
 * @extends CL3D.Animator
 * @class  Scene node animator which invokes a callback function when the scene node gets near another scene node.
 * @param scene {CL3D.Scene} the current scene
 * @param radius {Number} the proximity radius to use
 * @param idOfSceneNode {Number} The unique id (see {@link CL3D.SceneNode.id} of the scene node which will trigger this
 * @param functionToCall {function} a function which should be called when the scene node has been clicked. The function will be given two parameters: The node this is attached to and the node colliding.
 * @param triggerOnLeave {Boolean} set to false to let this trigger when the radius is entered, to true if when the radius is left
 */
export class AnimatorOnProximity extends CL3D.Animator {
	constructor(scene, radius, idOfSceneNode, functionToCall, triggerOnLeave) {
		super();

		this.TimeLastClicked = 0;
		this.sceneManager = scene;

		/*private static const EPT_THE_ACTIVE_CAMERA:int = 0;
		private static const EPT_SOME_SCENE_NODE:int = 1;
		private static const EPT_SCENE_NODE_LIKE:int = 2;
		private static const EPET_ENTER:int = 0;
		private static const EPET_LEAVE: int = 1;*/
		this.EnterType = 0;
		this.ProximityType = 0;
		this.AreaType = 0; // sphere
		this.Range = 0;
		this.RangeBox = null; // in case AreaType is a box
		this.SceneNodeToTest = 0;
		this.TheActionHandler = null;
		this.FunctionToCall = functionToCall;

		if (radius)
			this.Range = radius;
		if (idOfSceneNode)
			this.SceneNodeToTest = idOfSceneNode;
		if (triggerOnLeave)
			this.EnterType = 1; //this.EPET_LEAVE;

		this.IsInsideRadius = false;
	}
	/**
	 * Returns the type of the animator.
	 * For the AnimatorOnProximity, this will return 'oncollide'.
	 * @public
	 */
	getType() {
		return 'oncollide';
	}
	/**
	 * @private
	 */
	createClone(node, newManager, oldNodeId, newNodeId) {
		var a = new CL3D.AnimatorOnProximity(this.sceneManager);
		a.EnterType = this.EnterType;
		a.ProximityType = this.ProximityType;
		a.Range = this.Range;
		a.SceneNodeToTest = this.SceneNodeToTest;
		a.TheActionHandler = this.TheActionHandler ? this.TheActionHandler.createClone(oldNodeId, newNodeId) : null;
		return a;
	}
	/**
	 * Animates the scene node it is attached to and returns true if scene node was modified.
	 * @public
	 * @param {CL3D.SceneNode} n The Scene node which needs to be animated this frame.
	 * @param {Integer} timeMs The time in milliseconds since the start of the scene.
	 */
	animateNode(n, timeMs) {
		if (n == null || this.sceneManager == null)
			return false;

		var actionInvoked = false;

		var nodeToHandle = null;
		if (this.ProximityType == 0) //EPT_THE_ACTIVE_CAMERA)
			nodeToHandle = this.sceneManager.getActiveCamera();

		else if (this.SceneNodeToTest != -1)
			nodeToHandle = this.sceneManager.getSceneNodeFromId(this.SceneNodeToTest);

		if (nodeToHandle) {
			if (n === nodeToHandle)
				return false; // same node

			var posNode1 = nodeToHandle.getAbsolutePosition();
			var posNode2 = n.getAbsolutePosition();

			var isInside = false;

			switch (this.AreaType) {
				case 0: // sphere
					isInside = posNode1.getDistanceTo(posNode2) < this.Range;
					break;
				case 1: // box
					{
						var mat = new CL3D.Matrix4(false);
						if (n.getAbsoluteTransformation().getInverse(mat)) {
							var test = posNode1.clone();
							mat.transformVect(test);
							var box = new CL3D.Box3d();
							box.MinEdge = this.RangeBox.multiplyWithScal(-0.5);
							box.MaxEdge = this.RangeBox.multiplyWithScal(0.5);
							isInside = box.isPointInside(test);
						}
					}
			}

			switch (this.EnterType) {
				case 0: // EPET_ENTER:
					if (isInside && !this.IsInsideRadius) {
						this.invokeAction(nodeToHandle, n);
						actionInvoked = true;
					}
					break;
				case 1: //EPET_LEAVE:
					if (!isInside && this.IsInsideRadius) {
						this.invokeAction(nodeToHandle, n);
						actionInvoked = true;
					}
					break;
			}

			this.IsInsideRadius = isInside;
		}

		return actionInvoked;
	}
	/**
	 * @private
	 */
	invokeAction(node, n) {
		if (this.FunctionToCall)
			this.FunctionToCall.call(node, n);

		if (this.TheActionHandler)
			this.TheActionHandler.execute(node);
	}
	/**
	 * @private
	 */
	findActionByType(type) {
		if (this.TheActionHandler)
			return this.TheActionHandler.findAction(type);

		return null;
	}
};
