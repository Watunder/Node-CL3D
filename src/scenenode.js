//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "./main.js";

/**
 * A scene node is a node in the hierarchical scene graph. Every scene node may have children, which are also scene 
 * nodes. Children move relative to their parent's position. If the parent of a node is not visible, its children 
 * won't be visible either. In this way, it is for example easily possible to attach a light to a moving car, 
 * or to place a walking character on a moving platform on a moving ship.
 * <br/> <br/>
 * Concrete implementations are for example: {@link CL3D.CameraSceneNode}, {@link CL3D.BillboardSceneNode}, {@link CL3D.PathSceneNode}, {@link CL3D.MeshSceneNode}, {@link CL3D.SkyBoxSceneNode}.
 * @constructor
 * @class The base class for scene nodes, a node in the hierarchical 3d scene rendering graph.
 */
export class SceneNode {
	constructor() {
		this.Type = -1;
		this.Pos = new CL3D.Vect3d();
		this.Rot = new CL3D.Vect3d();
		this.Scale = new CL3D.Vect3d(1, 1, 1);
		this.Visible = true;
		this.Name = '';
		this.Culling = 0;
		this.Id = -1;
		this.Parent = null;

		this.Children = new Array();
		this.Animators = new Array();

		this.AbsoluteTransformation = new CL3D.Matrix4();
		this.scene = null;
		this.Selector = null;
	}
	/**
	 * Initializes the scene node, can be called by scene nodes derived from this class.
	 * @public
	 */
	init() {
		this.Pos = new CL3D.Vect3d();
		this.Rot = new CL3D.Vect3d();
		this.Scale = new CL3D.Vect3d(1, 1, 1);
		this.Children = new Array();
		this.Animators = new Array();
		this.AbsoluteTransformation = new CL3D.Matrix4();
	}
	/**
	 * Returns the parent scene node of this scene node.
	 * @public
	 * @returns {CL3D.SceneNode}
	 */
	getParent() {
		return this.Parent;
	}
	/**
	 * Returns an array with all child scene nodes of this node
	 * @public
	 * @returns {Array}
	 */
	getChildren() {
		return this.Children;
	}
	/**
	 * Returns the type string of the scene node.
	 * For example 'camera' if this is a camera, or 'mesh' if it is a mesh scene node.
	 * @public
	 * @returns {String} type name of the scene node.
	 */
	getType() {
		return 'none';
	}
	/**
	 * Get the axis aligned, not transformed bounding box of this node.
	 * This means that if this node is an animated 3d character, moving in a room, the bounding box will
	 * always be around the origin. To get the box in real world coordinates, just transform it with the matrix
	 * you receive with {@link getAbsoluteTransformation}() or simply use {@link getTransformedBoundingBox}(), which does the same.
	 * @public
	 * @returns {CL3D.Box3d} Bounding box of this scene node.
	 */
	getBoundingBox() {
		return new CL3D.Box3d();
	}
	/**
	 * Returns an array of {@link Animator}s which are animating this scene node.
	 * @public
	 * @returns {Array} Bounding box of this scene node.
	 */
	getAnimators() {
		return this.Animators;
	}
	/**
	 * Returns the first {@link Animator} attached to this scene node with the specified type.
	 * @param type is a string with the type returned by {@link Animator}.getType(). A possible value
	 * is for example 'camerafps'. See the concreate animator implementations for type strings.
	 * @public
	 * @returns {CL3D.Animator} The animator if found, or null if not.
	 */
	getAnimatorOfType(type) {
		for (var i = 0; i < this.Animators.length; ++i) {
			var oa = this.Animators[i];
			if (oa.getType() == type) {
				return oa;
			}
		}

		return null;
	}
	/**
	 * @private
	 */
	findActionOfType(type) {
		for (var i = 0; i < this.Animators.length; ++i) {
			var oa = this.Animators[i];
			var ac = oa.findActionByType(type);
			if (ac != null)
				return ac;
		}

		return null;
	}
	/**
	 * Returns the bounding box of this scene node, transformed with the absolute transformation of this scene node.
	 * @returns {CL3D.Box3d} The axis aligned, transformed and animated absolute bounding box of this node.
	 * @public
	 */
	getTransformedBoundingBox() {
		var b = this.getBoundingBox().clone();
		this.AbsoluteTransformation.transformBoxEx(b);
		return b;
	}
	/**
	 * @private
	 */
	cloneMembers(b, newparent, oldNodeId, newNodeId) {
		b.Name = new String(this.Name);
		b.Visible = this.Visible;
		b.Culling = this.Culling;
		b.Pos = this.Pos.clone();
		b.Rot = this.Rot.clone();
		b.Scale = this.Scale.clone();
		b.Type = this.Type;
		b.scene = this.scene;

		if (newparent)
			newparent.addChild(b);

		for (var i = 0; i < this.Children.length; ++i) {
			var c = this.Children[i];
			if (c) {
				var newId = -1;
				if (newparent && newparent.scene)
					newId = newparent.scene.getUnusedSceneNodeId();

				var nc = c.createClone(b, c.Id, newId);
				if (nc != null) {
					nc.Id = newId;
					b.addChild(nc);
				}
			}
		}

		//try {
		for (var i = 0; i < this.Animators.length; ++i) {
			var oa = this.Animators[i];
			b.addAnimator(oa.createClone(this, this.scene, oldNodeId, newNodeId));
		}
		//} catch(e) {};
		if (this.AbsoluteTransformation)
			b.AbsoluteTransformation = this.AbsoluteTransformation.clone();
	}
	/**
	 * Creates a clone of this scene node and its children.
	 * @param {CL3D.SceneNode} newparent The new parent of the cloned scene node.
	 * @returns {CL3D.SceneNode} the cloned version of this scene node
	 * @public
	 */
	createClone(newparent, oldNodeId, newNodeId) {
		return null;
	}
	/**
	 * Adds a scene node animator to the list of animators manipulating this scene node.
	 * @param {CL3D.Animator} a the new CL3D.Animator to add.
	 * @public
	 */
	addAnimator(a) {
		if (a != null)
			this.Animators.push(a);
	}
	/**
	 * Removes an animator from this scene node.
	 * @public
	 * @param {CL3D.Animator} a the new CL3D.Animator to remove.
	 */
	removeAnimator(a) {
		if (a == null)
			return;

		var i;

		for (i = 0; i < this.Animators.length; ++i) {
			var oa = this.Animators[i];
			if (oa === a) {
				this.Animators.splice(i, 1);
				return;
			}
		}
	}
	/**
	 * Adds a child to this scene node.
	 * If the scene node already has a parent it is first removed from the other parent.
	 * @public
	 * @param {CL3D.SceneNode} n the child scene node to add.
	 */
	addChild(n) {
		if (n) {
			n.scene = this.scene;

			if (n.Parent)
				n.Parent.removeChild(n);
			n.Parent = this;
			this.Children.push(n);
		}
	}
	/**
	 * Removes a child from this scene node.
	 * @public
	 * @param {CL3D.SceneNode} n the child scene node to remove.
	 */
	removeChild(n) {
		for (var i = 0; i < this.Children.length; ++i) {
			if (this.Children[i] === n) {
				n.Parent = null;
				this.Children.splice(i, 1);
				return;
			}
		}
	}
	/**
	 * This method is called just before the rendering process of the whole scene.
	 * Nodes may register themselves in the rendering pipeline during this call, precalculate
	 * the geometry which should be renderered, and prevent their children from being able to register
	 * themselves if they are clipped by simply not calling their OnRegisterSceneNode method. If you are implementing
	 * your own scene node, you should overwrite this method with an implementation code looking like this:
	 * @example
	 * if (this.Visible)
	 * {
	 *  // register for rendering
	 *  scene.registerNodeForRendering(this, CL3D.Scene.RENDER_MODE_DEFAULT);
	 *
	 *  // call base class to register childs (if needed)
	 *	CL3D.SceneNode.prototype.OnRegisterSceneNode.call(this, scene);
	 * }
	 * @param {CL3D.Scene} scene the current scene
	 * @public
	 */
	OnRegisterSceneNode(scene) {
		if (this.Visible) {
			for (var i = 0; i < this.Children.length; ++i) {
				var c = this.Children[i];
				c.OnRegisterSceneNode(scene);
			}
		}
	}
	/**
	 * OnAnimate() is called just before rendering the whole scene.
	 * Nodes may calculate or store animations here, and may do other useful things,
	 * depending on what they are. Also, OnAnimate() should be called for all child scene nodes here.
	 * This method will be called once per frame, independent of whether the scene node is visible or not.
	 * @param {CL3D.Scene} scene the current scene
	 * @param {Number} current time in milliseconds
	 * @public
	 */
	OnAnimate(scene, timeMs) {
		var modified = false;

		if (this.Visible) {
			var i;
			var animcount = this.Animators.length;
			for (i = 0; i < animcount;) {
				var a = this.Animators[i];
				modified = a.animateNode(this, timeMs) || modified;

				// if the animator deleted itself, don't move forward
				var oldanimcount = animcount;
				animcount = this.Animators.length;
				if (oldanimcount >= animcount)
					++i;
			}

			this.updateAbsolutePosition();

			for (i = 0; i < this.Children.length; ++i) {
				var c = this.Children[i];
				modified = c.OnAnimate(scene, timeMs) || modified;
			}
		}

		return modified;
	}
	/**
	 * Returns the relative transformation of the scene node.
	 * The relative transformation is stored internally as 3 vectors: translation, rotation and scale.
	 * To get the relative transformation matrix, it is calculated from these values.
	 * @public
	 * @returns {CL3D.Matrix4} the relative transformation
	 */
	getRelativeTransformation() {
		var mat = new CL3D.Matrix4();

		mat.setRotationDegrees(this.Rot);
		mat.setTranslation(this.Pos);

		if (this.Scale.X != 1 || this.Scale.Y != 1 || this.Scale.Z != 1) {
			var smat = new CL3D.Matrix4();
			smat.setScale(this.Scale);
			mat = mat.multiply(smat);
		}

		return mat;
	}
	/**
	 * Updates the absolute position based on the relative and the parents position.
	 * Note: This does not recursively update the parents absolute positions, so if you have a deeper hierarchy you might
	 * want to update the parents first.
	 * @public
	*/
	updateAbsolutePosition() {
		if (this.Parent != null) {
			this.AbsoluteTransformation =
				this.Parent.AbsoluteTransformation.multiply(this.getRelativeTransformation());
		}

		else
			this.AbsoluteTransformation = this.getRelativeTransformation();
	}
	/**
	 * Renders the node. Override to implement rendering your own scene node.
	 * @public
	 * @param {CL3D.Renderer} renderer the currently used renderer.
	 */
	render(renderer) {
		// TODO: implement in sub scene nodes
	}
	/**
	 * Returns the absolute transformation matrix of the node, also known as world matrix.
	 * Note: If local changes to the position, scale or rotation have been made to this scene node in this frame,
	 * call {@link updateAbsolutePosition}() to ensure this transformation is up to date.
	 * @public
	 * @returns {CL3D.Matrix4} the absolute matrix
	 */
	getAbsoluteTransformation() {
		return this.AbsoluteTransformation;
	}
	/**
	 * Gets the absolute position of the node in world coordinates.
	 * If you want the position of the node relative to its parent, use {@link Pos} instead, this is much faster as well.
	 * Note: If local changes to the position, scale or rotation have been made to this scene node in this frame,
	 * call {@link updateAbsolutePosition}() to ensure this position is up to date.
	 * @public
	 * @returns {CL3D.Vect3d} the absolute position
	 */
	getAbsolutePosition() {
		return this.AbsoluteTransformation.getTranslation();
	}
	/**
	 * Get amount of materials used by this scene node.
	 * @returns {Number} the amount of materials.
	 * @public
	 */
	getMaterialCount() {
		return 0;
	}
	/**
	 * Returns the material based on the zero based index i.
	 * To get the amount of materials used by this scene node, use {@link getMaterialCount}().
	 * This function is needed for inserting the node into the scene hierarchy at an optimal position for
	 * minimizing renderstate changes, but can also be used to directly modify the material of a scene node.
	 * @returns {CL3D.Material} the material with the specified index or null.
	 * @public
	 */
	getMaterial(i) {
		return null;
	}
	/**
	 * Returns if the scene node and all its parents are actually visible.
	 * For a quicker way, simply check the Visible property of this class. This method
	 * Checks the flags for this node and all its parents and maybe a bit slower.
	 * @returns {boolean} if the scene node and all its parents are visible
	 * @public
	 */
	isActuallyVisible() {
		var node = this;

		while (node) {
			if (!node.Visible)
				return false;

			node = node.Parent;
		}

		return true;
	}
	/**
	 * Called after the deserialization process. Internal method used so that linked nodes link them with the deserialized other nodes.
	 * @private
	 */
	onDeserializedWithChildren() {
		// to be implemented in a specific node if at all.
	}
	/**
	 * replaces all referenced ids of referenced nodes when the referenced node was a child and was cloned
	 * @private
	 */
	replaceAllReferencedNodes(nodeChildOld, nodeChildNew) {
		// to be implemented in a specific node if at all.
	}
	/**
	 * replaces all referenced ids of referenced nodes when the referenced node was a child and was cloned
	 * @private
	 */
	isParentActiveFPSCameraToRenderChildrenWithoutZBuffer() {
		if (!this.scene)
			return false;

		if (!(this.scene.ActiveCamera === this.Parent))
			return false;

		var an = this.Parent.getAnimatorOfType('camerafps');
		if (an == null)
			return false;

		return an.ChildrenDontUseZBuffer;
	}
}




/**
 * Position of the scene node, relative to its parent.
 * If you want the position in world coordinates, use {@link getAbsolutePosition}().
 * If you change this value, be sure to call {@link updateAbsolutePosition}() afterwards to make the change be reflected immediately.
 * @type Vect3d
 * @public
 */
CL3D.SceneNode.prototype.Pos = null;

/**
 * Rotation of the scene node, relative to its parent, in degrees.
 * Note that this is the relative rotation of the node. If you want the absolute rotation, use {@link getAbsoluteTransformation}().getRotation()
 * If you change this value, be sure to call {@link updateAbsolutePosition}() afterwards to make the change be reflected immediately.
 * @type Vect3d
 * @public
 */
CL3D.SceneNode.prototype.Rot = null;

/**
 * Scale of the scene node, relative to its parent, in degrees. Default is (1,1,1)
 * This is the scale of this node relative to its parent. If you want the absolute scale, use {@link getAbsoluteTransformation}().getScale()
 * If you change this value, be sure to call {@link updateAbsolutePosition}() afterwards to make the change be reflected immediately. 
 * @type Vect3d
 * @public
 */
CL3D.SceneNode.prototype.Scale = null;

/**
 * Defines whether the node should be visible (if all of its parents are visible). 
 * This is only an option set by the user, but has nothing to do with geometry culling.
 * @type Boolean
 * @public
 */
CL3D.SceneNode.prototype.Visible = true;

/**
 * Defines the name of the scene node, completely freely usable by the user.
 * @type String
 * @public
 */
CL3D.SceneNode.prototype.Name = '';

/**
 * Defines the id of the scene node, completely freely usable by the user.
 * @type Number
 * @public
 */
CL3D.SceneNode.prototype.Id = -1;

/**
 * An optional {@link TriangleSelector}, giving access to the collision geometry of this scene node.
 * @type TriangleSelector
 * @public
 */
CL3D.SceneNode.prototype.Selector = null;

/**
 * @private
 */
CL3D.SceneNode.prototype.Parent = null;


































