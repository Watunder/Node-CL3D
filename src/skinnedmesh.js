//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "./main.js";

// ------------------------------------------------------------------------------------------------
// MeshCache
// Holds list of already loaded animated meshes
// ------------------------------------------------------------------------------------------------

/**
 * @public
 */
export class MeshCache {
	constructor() {
		this.Meshes = new Array();
	}

	/**
	 * @public
	 */
	getMeshFromName(name) {
		for (var i = 0; i < this.Meshes.length; ++i) {
			var t = this.Meshes[i]; // as AnimatedMesh;
			if (t.Name == name)
				return t;
		}

		return null;
	}

	/**
	 * @public
	 */
	addMesh(t) {
		if (t != null) {
			//if (this.getMeshFromName(t.Name) != null)
			//	Debug.print("ERROR! Cannot add the mesh multiple times: " + t.Name);
			//else
			//	Debug.print("adding mesh: " + t.Name);
			this.Meshes.push(t);
		}
	}
};

// ------------------------------------------------------------------------------------------------
// SkinnedMeshJoint
// ------------------------------------------------------------------------------------------------

/**
 * @public
 */
export class SkinnedMeshJoint {
	constructor() {
		this.Name = ''; //;
		this.LocalMatrix = new CL3D.Matrix4();
		this.Children = new Array(); // SkinnedMeshJoint
		this.AttachedMeshes = new Array(); // int
		this.PositionKeys = new Array(); // SkinnedMeshPositionKey
		this.ScaleKeys = new Array(); // SkinnedMeshScaleKey
		this.RotationKeys = new Array(); // SkinnedMeshRotationKey
		this.Weights = new Array(); // SkinnedMeshWeight
		this.StaticCollisionBoundingBox = new CL3D.Box3d(); // box used by CopperCube as collision proxy object, when the object is static and if it is set at all (not always)
		
		// runtime:
		this.GlobalMatrix = new CL3D.Matrix4();
		this.GlobalAnimatedMatrix = new CL3D.Matrix4();
		this.LocalAnimatedMatrix = new CL3D.Matrix4();
		this.Animatedposition = new CL3D.Vect3d(0,0,0);
		this.Animatedscale = new CL3D.Vect3d(1,1,1);
		this.Animatedrotation = new CL3D.Quaternion();
		this.GlobalInversedMatrix = new CL3D.Matrix4(); //the x format pre-calculates this

		this.GlobalSkinningSpace = false;
		
		this.positionHint = -1;
		this.scaleHint = -1;
		this.rotationHint = -1;
	}
};

// ------------------------------------------------------------------------------------------------
// SkinnedMeshWeight
// ------------------------------------------------------------------------------------------------

/**
 * @public
 */
export class SkinnedMeshWeight {
	constructor() {
		this.buffer_id = 0; //;
		this.vertex_id = 0; //;
		this.strength = 0; //;
		
		// private, to be used during skinning only
		this.StaticPos = new CL3D.Vect3d();
		this.StaticNormal = new CL3D.Vect3d();
	}
};
	
// ------------------------------------------------------------------------------------------------
// SkinnedMeshScaleKey
// ------------------------------------------------------------------------------------------------

/**
 * @public
 */
export class SkinnedMeshScaleKey {
	constructor() {

		this.frame = 0; //;
		this.scale = new CL3D.Vect3d();
	}
};

// ------------------------------------------------------------------------------------------------
// SkinnedMeshPositionKey
// ------------------------------------------------------------------------------------------------

/**
 * @public
 */
export class SkinnedMeshPositionKey {	
	constructor() {
		this.frame = 0; //;
		this.position = new CL3D.Vect3d();
	}
};

// ------------------------------------------------------------------------------------------------
// SkinnedMeshRotationKey
// ------------------------------------------------------------------------------------------------

/**
 * @public
 */
export class SkinnedMeshRotationKey {	
	constructor() {
		this.frame = 0; //;
		this.rotation = new CL3D.Quaternion();
	}
};

// ------------------------------------------------------------------------------------------------
// NamedAnimationRange
// ------------------------------------------------------------------------------------------------

/**
 * @public
 */
export class NamedAnimationRange {
	Name = '';
	Begin = 0;
	End = 0;
	FPS = 0;

	constructor() {
		this.Name = '';
		this.Begin = 0;
		this.End = 0;
		this.FPS = 0;
	}
};

// ------------------------------------------------------------------------------------------------
// SkinnedMesh
// ------------------------------------------------------------------------------------------------

/**
 * @public
 */
export class SkinnedMesh {
	constructor() {
		/*private const EIM_CONSTANT = 0;
		private const EIM_LINEAR = 1;
		private const EIM_COUNT = 2;*/
		this.Name = '';
		this.AnimatedMeshesToLink = new Array();

		this.AnimationFrames = 0.0;
		this.LocalBuffers = new Array(); // MeshBuffer
		this.AllJoints = new Array(); // Joints
		this.RootJoints = new Array(); // Joints
		this.DefaultFPS = 0;

		this.HasAnimation = false;
		this.PreparedForSkinning = false;

		this.LastAnimatedFrame = 0;
		this.LastSkinnedFrame = 0;
		this.BoneControlUsed = 0;
		this.BoundingBox = new CL3D.Box3d();
		this.InterpolationMode = 1; //EIM_LINEAR;

		this.Vertices_Moved = new Array(); // Vector.< Vector.<Boolean> > = new Vector.< Vector.<Boolean> >;
		this.skinDoesNotMatchJointPositions = true;

		this.NamedAnimationRanges = new Array(); // NamedAnimationRange
	}

	/**
	 * @public
	 */
	AddMeshBuffer(buf) {
		this.LocalBuffers.push(buf);
	}

	/**
	 * @public
	 */
	getFrameCount() {
		return Math.floor(this.AnimationFrames);
	}

	/**
	 * @public
	 */
	getBoundingBox() {
		return this.BoundingBox;
	}

	/**
	 * @public
	 */
	finalize() {
		this.LastAnimatedFrame = -1;
		this.LastSkinnedFrame = -1;

		// populate RootJoints
		var i = 0;
		var j = 0;
		var mbuffer;
		var joint;

		for (var CheckingIdx = 0; CheckingIdx < this.AllJoints.length; ++CheckingIdx) {
			var foundParent = false;

			for (i = 0; i < this.AllJoints.length; ++i) {
				joint = this.AllJoints[i];

				for (var n = 0; n < joint.Children.length; ++n) {
					if (joint.Children[n] === this.AllJoints[CheckingIdx])
						foundParent = true;
				}
			}

			if (!foundParent)
				this.RootJoints.push(this.AllJoints[CheckingIdx]);
		}

		// Set array sizes
		for (i = 0; i < this.LocalBuffers.length; ++i) {
			var buf = new Array(); // :Vector.<Boolean>

			this.Vertices_Moved.push(buf);

			mbuffer = this.LocalBuffers[i]; // as MeshBuffer;
			var vtxcount = mbuffer.Vertices.length;
			for (var v = 0; v < vtxcount; ++v)
				buf.push(false);
		}

		this.checkForAnimation();
		this.CalculateGlobalMatrices(null, null);

		// rigid animation for non animated meshes
		for (i = 0; i < this.AllJoints.length; ++i) {
			joint = this.AllJoints[i];
			for (j = 0; j < joint.AttachedMeshes.length; ++j) {
				mbuffer = this.LocalBuffers[joint.AttachedMeshes[j]]; // as MeshBuffer;
				mbuffer.Transformation = joint.GlobalAnimatedMatrix.clone();
			}
		}

		// calculate bounding box
		if (this.LocalBuffers.length == 0) {
			this.BoundingBox.MinEdge.set(0, 0, 0);
			this.BoundingBox.MaxEdge.set(0, 0, 0);
		}

		else {
			mbuffer = this.LocalBuffers[0]; // as MeshBuffer;
			this.BoundingBox.MinEdge = mbuffer.Box.MinEdge.clone();
			this.BoundingBox.MaxEdge = mbuffer.Box.MaxEdge.clone();

			for (i = 1; i < this.LocalBuffers.length; ++i) {
				mbuffer = this.LocalBuffers[i]; // as MeshBuffer;
				if (mbuffer.Transformation == null) {
					this.BoundingBox.addInternalPointByVector(mbuffer.Box.MinEdge);
					this.BoundingBox.addInternalPointByVector(mbuffer.Box.MaxEdge);
				}

				else {
					var newbox = mbuffer.Box.clone();
					mbuffer.Transformation.transformBoxEx(newbox);

					this.BoundingBox.addInternalPointByVector(newbox.MinEdge);
					this.BoundingBox.addInternalPointByVector(newbox.MaxEdge);
				}
			}
		}

		// debug output infos
		//console.log("HasAnimation:" + this.HasAnimation + " Roots:" + this.RootJoints.length + " Frames:" + this.AnimationFrames);
	}

	/**
	 * @public
	 */
	checkForAnimation() {
		this.HasAnimation = false;

		var i = 0;
		var j = 0;
		var mbuffer;
		var joint;

		for (i = 0; i < this.AllJoints.length; ++i) {
			joint = this.AllJoints[i]; // as SkinnedMeshJoint;
			if (joint.PositionKeys.length ||
				joint.ScaleKeys.length ||
				joint.RotationKeys.length ||
				joint.Weights.length) {
				this.HasAnimation = true;
				break;
			}
		}

		if (this.HasAnimation) {
			// Find the length of the animation
			this.AnimationFrames = 0;

			for (i = 0; i < this.AllJoints.length; ++i) {
				joint = this.AllJoints[i];

				if (joint.PositionKeys.length) {
					var poskey = joint.PositionKeys[joint.PositionKeys.length - 1];
					if (poskey.frame > this.AnimationFrames)
						this.AnimationFrames = poskey.frame;
				}

				if (joint.ScaleKeys.length) {
					var scalekey = joint.ScaleKeys[joint.ScaleKeys.length - 1];
					if (scalekey.frame > this.AnimationFrames)
						this.AnimationFrames = scalekey.frame;
				}

				if (joint.RotationKeys.length) {
					var rotkey = joint.RotationKeys[joint.RotationKeys.length - 1];
					if (rotkey.frame > this.AnimationFrames)
						this.AnimationFrames = rotkey.frame;
				}
			}
		}

		if (this.HasAnimation && !this.PreparedForSkinning) {
			this.PreparedForSkinning = true;

			// For skinning: cache weight values for speed
			for (i = 0; i < this.AllJoints.length; ++i) {
				joint = this.AllJoints[i]; // as SkinnedMeshJoint;
				for (j = 0; j < joint.Weights.length; ++j) {
					var w = joint.Weights[j]; // SkinnedMeshWeight

					var buffer_id = w.buffer_id;
					var vertex_id = w.vertex_id;

					//w.Moved = 
					mbuffer = this.LocalBuffers[buffer_id];
					var vtx = mbuffer.Vertices[vertex_id];
					w.StaticPos = vtx.Pos.clone();
					w.StaticNormal = vtx.Normal.clone();
				}
			}
		}

	}

	/**
	 * @public
	 */
	CalculateGlobalMatrices(joint, parentJoint) {
		if (joint == null && parentJoint != null)
			return;

		if (joint == null) {
			// go trough root joints
			for (var i = 0; i < this.RootJoints.length; ++i)
				this.CalculateGlobalMatrices(this.RootJoints[i], null);
			return;
		}

		if (parentJoint == null)
			joint.GlobalMatrix = joint.LocalMatrix.clone();

		else
			joint.GlobalMatrix = parentJoint.GlobalMatrix.multiply(joint.LocalMatrix);

		joint.LocalAnimatedMatrix = joint.LocalMatrix.clone();
		joint.GlobalAnimatedMatrix = joint.GlobalMatrix.clone();

		if (joint.GlobalInversedMatrix.isIdentity()) // might be pre calculated
		{
			joint.GlobalInversedMatrix = joint.GlobalMatrix.clone();
			joint.GlobalInversedMatrix.makeInverse(); // slow
		}

		for (var j = 0; j < joint.Children.length; ++j)
			this.CalculateGlobalMatrices(joint.Children[j], joint);
	}

	/**
	 * returns if this mesh isn't animated but actually static
	 * @public
	 */
	isStatic() {
		return !this.HasAnimation;
	}

	/**
	 * Animates this mesh's joints based on frame input
	 * blend: {0-old position, 1-New position}
	 * returns if animation has changed
	 * @public
	 */
	animateMesh(frame, blend) {
		if (!this.HasAnimation ||
			(CL3D.equals(this.LastAnimatedFrame, frame) && (blend == 1.0))) {
			return false;
		}

		this.LastAnimatedFrame = frame;

		if (blend < 0.0)
			return false; //No need to animate

		if (CL3D.equals(blend, 1.0)) {
			// no animation blending
			for (var i = 0; i < this.AllJoints.length; ++i) {
				var joint = this.AllJoints[i];

				var position = joint.Animatedposition.clone();
				var scale = joint.Animatedscale.clone();
				var rotation = joint.Animatedrotation.clone(); // Quaternion

				this.getFrameData(frame, joint,
					position, joint.positionHint,
					scale, joint.scaleHint,
					rotation, joint.rotationHint);

				joint.Animatedposition = position.clone();
				joint.Animatedscale = scale.clone();
				joint.Animatedrotation = rotation.clone();
			}
		}

		else {
			// with animation blending
			for (var i = 0; i < this.AllJoints.length; ++i) {
				var joint = this.AllJoints[i];

				var oldposition = joint.Animatedposition.clone();
				var oldscale = joint.Animatedscale.clone();
				var oldrotation = joint.Animatedrotation.clone(); // Quaternion

				var position = oldposition.clone();
				var scale = oldscale.clone();
				var rotation = oldrotation.clone(); // Quaternion

				this.getFrameData(frame, joint,
					position, joint.positionHint,
					scale, joint.scaleHint,
					rotation, joint.rotationHint);

				joint.Animatedposition = oldposition.getInterpolated(position, blend);
				joint.Animatedscale = oldscale.getInterpolated(scale, blend);
				joint.Animatedrotation.slerp(oldrotation, rotation, blend);
			}
		}

		this.buildAll_LocalAnimatedMatrices();
		this.skinDoesNotMatchJointPositions = true;

		return true;
	}

	/**
	 * @public
	 */
	getFrameData(frame, joint,
		position, positionHint,
		scale, scaleHint,
		rotation, rotationHint) {
		var foundPositionIndex = -1;
		var foundScaleIndex = -1;
		var foundRotationIndex = -1;

		var PositionKeys = joint.PositionKeys;
		var ScaleKeys = joint.ScaleKeys;
		var RotationKeys = joint.RotationKeys;

		var poskey;
		var scalekey; //:SkinnedMeshScaleKey;
		var rotkey; //:SkinnedMeshRotationKey;

		var i;
		var fd1;
		var fd2;

		if (PositionKeys.length) {
			foundPositionIndex = -1;

			// test the Hints...
			/*if (positionHint>=0 && positionHint < PositionKeys.length)
			{
				//check this hint
				if (positionHint>0 &&
					PositionKeys[positionHint].frame >= frame &&
					PositionKeys[positionHint-1].frame < frame )
				{
					foundPositionIndex=positionHint;
				}
				else
				if (positionHint+1 < (int)PositionKeys.length)
				{
					//check the next index
					if ( PositionKeys[positionHint+1].frame>=frame &&
						 PositionKeys[positionHint+0].frame<frame)
					{
						positionHint++;
						foundPositionIndex=positionHint;
					}
				}
			}*/
			//The hint test failed, do a full scan...
			if (foundPositionIndex == -1) {
				for (i = 0; i < PositionKeys.length; ++i) {
					poskey = PositionKeys[i];
					if (poskey.frame >= frame) //Keys should to be sorted by frame
					{
						foundPositionIndex = i;
						positionHint = i;
						break;
					}
				}
			}

			//Do interpolation...
			if (foundPositionIndex != -1) {
				if (this.InterpolationMode == 0 /*EIM_CONSTANT*/ || foundPositionIndex == 0) {
					poskey = PositionKeys[foundPositionIndex];
					position = poskey.position.clone();
				}
				else if (this.InterpolationMode == 1 /*EIM_LINEAR*/) {
					poskey = PositionKeys[foundPositionIndex];
					var poskeyb = PositionKeys[foundPositionIndex - 1];

					fd1 = frame - poskey.frame;
					fd2 = poskeyb.frame - frame;

					//position = ((poskeyb.position-poskey.position)/(fd1+fd2))*fd1 + poskey.position;
					position.setTo(
						poskeyb.position.
							substract(poskey.position).
							multiplyThisWithScalReturnMe(1.0 / (fd1 + fd2)).
							multiplyThisWithScalReturnMe(fd1).
							addToThisReturnMe(poskey.position));
				}

				//if (Config.isDebugCompilation)
				//{
				//	Debug.print(
				//		"joint: " + joint.Name + 
				//		" position: " + position + 
				//		", key:%d" + foundPositionIndex +
				//		", frame:" + frame + 
				//		", keyposition: " + PositionKeys[foundPositionIndex-1].position);
				//}
			}
		}

		//------------------------------------------------------------
		if (ScaleKeys.length) {
			foundScaleIndex = -1;

			//Test the Hints...
			/*if (scaleHint>=0 && (u32)scaleHint < ScaleKeys.length)
			{
				//check this hint
				if (scaleHint>0 && ScaleKeys[scaleHint].frame>=frame && ScaleKeys[scaleHint-1].frame<frame )
					foundScaleIndex=scaleHint;
				else if (scaleHint+1 < (s32)ScaleKeys.length)
				{
					//check the next index
					if ( ScaleKeys[scaleHint+1].frame>=frame &&
							ScaleKeys[scaleHint+0].frame<frame)
					{
						scaleHint++;
						foundScaleIndex=scaleHint;
					}
				}
			}*/
			//The hint test failed, do a full scan...
			if (foundScaleIndex == -1) {
				for (i = 0; i < ScaleKeys.length; ++i) {
					scalekey = ScaleKeys[i];
					if (scalekey.frame >= frame) //Keys should to be sorted by frame
					{
						foundScaleIndex = i;
						scaleHint = i;
						break;
					}
				}
			}

			//Do interpolation...
			if (foundScaleIndex != -1) {
				if (this.InterpolationMode == 0 /*EIM_CONSTANT*/ || foundScaleIndex == 0) {
					scalekey = ScaleKeys[foundScaleIndex];
					scale = scalekey.scale.clone();
				}

				else if (this.InterpolationMode == 1 /*EIM_LINEAR*/) {
					scalekey = ScaleKeys[foundScaleIndex];
					var scalekeyb = ScaleKeys[foundScaleIndex - 1]; // SkinnedMeshScaleKey

					fd1 = frame - scalekey.frame;
					fd2 = scalekeyb.frame - frame;

					//scale = ((scalekeyb.scale-scalekey.scale)/(fd1+fd2))*fd1 + scalekey.scale;
					scale.setTo(
						scalekeyb.scale.
							substract(scalekey.scale).
							multiplyThisWithScalReturnMe(1.0 / (fd1 + fd2)).
							multiplyThisWithScalReturnMe(fd1).
							addToThisReturnMe(scalekey.scale));
				}
			}
		}

		//-------------------------------------------------------------
		if (RotationKeys.length) {
			foundRotationIndex = -1;

			//Test the Hints...
			/*if (rotationHint>=0 && (u32)rotationHint < RotationKeys.length)
			{
				//check this hint
				if (rotationHint>0 && RotationKeys[rotationHint].frame>=frame && RotationKeys[rotationHint-1].frame<frame )
					foundRotationIndex=rotationHint;
				else if (rotationHint+1 < (s32)RotationKeys.length)
				{
					//check the next index
					if ( RotationKeys[rotationHint+1].frame>=frame &&
							RotationKeys[rotationHint+0].frame<frame)
					{
						rotationHint++;
						foundRotationIndex=rotationHint;
					}
				}
			}*/
			//The hint test failed, do a full scan...
			if (foundRotationIndex == -1) {
				for (i = 0; i < RotationKeys.length; ++i) {
					rotkey = RotationKeys[i];
					if (rotkey.frame >= frame) //Keys should be sorted by frame
					{
						foundRotationIndex = i;
						rotationHint = i;
						break;
					}
				}
			}

			//Do interpolation...
			if (foundRotationIndex != -1) {
				if (this.InterpolationMode == 0 /*EIM_CONSTANT*/ || foundRotationIndex == 0) {
					rotkey = RotationKeys[foundRotationIndex];
					rotation = rotkey.rotation.clone();
				}
				else if (this.InterpolationMode == 1 /*EIM_LINEAR*/) {
					rotkey = RotationKeys[foundRotationIndex];
					var rotkeyb = RotationKeys[foundRotationIndex - 1]; // SkinnedMeshRotationKey

					fd1 = frame - rotkey.frame;
					fd2 = rotkeyb.frame - frame;

					rotation.slerp(rotkey.rotation, rotkeyb.rotation, fd1 / (fd1 + fd2));
				}
			}
		}
	}

	/**
	 * @public
	 */
	buildAll_LocalAnimatedMatrices() {
		for (var i = 0; i < this.AllJoints.length; ++i) {
			var joint = this.AllJoints[i];

			if (joint.PositionKeys.length ||
				joint.ScaleKeys.length ||
				joint.RotationKeys.length) {
				if (!joint.Animatedrotation)
					joint.Animatedrotation = new CL3D.Quaternion();
				if (!joint.Animatedposition)
					joint.Animatedposition = new CL3D.Vect3d();

				/*var translateMatrix = new CL3D.Matrix4(true);
				translateMatrix.setTranslation(joint.Animatedposition);
				joint.LocalAnimatedMatrix = joint.LocalMatrix.multiply(joint.Animatedrotation.getMatrix());
				joint.LocalAnimatedMatrix = joint.LocalAnimatedMatrix.multiply(translateMatrix);	*/
				joint.LocalAnimatedMatrix = joint.Animatedrotation.getMatrix();

				// --- joint->LocalAnimatedMatrix *= joint->Animatedrotation.getMatrix() ---
				var mptr = joint.LocalAnimatedMatrix;
				var Pos = joint.Animatedposition;

				mptr.m00 += Pos.X * mptr.m03;
				mptr.m01 += Pos.Y * mptr.m03;
				mptr.m02 += Pos.Z * mptr.m03;
				mptr.m04 += Pos.X * mptr.m07;
				mptr.m05 += Pos.Y * mptr.m07;
				mptr.m06 += Pos.Z * mptr.m07;
				mptr.m08 += Pos.X * mptr.m11;
				mptr.m09 += Pos.Y * mptr.m11;
				mptr.m10 += Pos.Z * mptr.m11;
				mptr.m12 += Pos.X * mptr.m15;
				mptr.m13 += Pos.Y * mptr.m15;
				mptr.m14 += Pos.Z * mptr.m15;

				mptr.bIsIdentity = false;

				// -----------------------------------
				joint.GlobalSkinningSpace = false;

				if (joint.ScaleKeys.length && joint.Animatedscale &&
					!joint.Animatedscale.equalsByNumbers(1, 1, 1)) {

					//var scalematrix = new CL3D.Matrix4(true);
					//scalematrix.setScale(joint.Animatedscale);
					//joint.LocalAnimatedMatrix = joint.LocalAnimatedMatrix.multiply(scalematrix);
					// -------- joint->LocalAnimatedMatrix *= scaleMatrix -----------------
					Pos = joint.Animatedscale;
					mptr.m00 *= Pos.X;
					mptr.m01 *= Pos.X;
					mptr.m02 *= Pos.X;
					mptr.m03 *= Pos.X;
					mptr.m04 *= Pos.Y;
					mptr.m05 *= Pos.Y;
					mptr.m06 *= Pos.Y;
					mptr.m07 *= Pos.Y;
					mptr.m08 *= Pos.Z;
					mptr.m09 *= Pos.Z;
					mptr.m10 *= Pos.Z;
					mptr.m11 *= Pos.Z;
					// -----------------------------------
				}
			}

			else {
				joint.LocalAnimatedMatrix = joint.LocalMatrix.clone(); // no copy necessary, reference is ok
			}
		}
	}

	/**
	 * @public
	 */
	updateBoundingBox() {
		this.BoundingBox.MinEdge.set(0, 0, 0);
		this.BoundingBox.MaxEdge.set(0, 0, 0);

		if (this.LocalBuffers.length) {
			var mbuffer = this.LocalBuffers[0]; // as MeshBuffer;
			mbuffer.recalculateBoundingBox();
			this.BoundingBox.MinEdge = mbuffer.Box.MinEdge.clone();
			this.BoundingBox.MaxEdge = mbuffer.Box.MaxEdge.clone();

			for (var i = 1; i < this.LocalBuffers.length; ++i) {
				mbuffer = this.LocalBuffers[i]; // as MeshBuffer;

				mbuffer.recalculateBoundingBox();

				if (mbuffer.Transformation == null) {
					this.BoundingBox.addInternalPointByVector(mbuffer.Box.MinEdge);
					this.BoundingBox.addInternalPointByVector(mbuffer.Box.MaxEdge);
				}

				else {
					var newbox = mbuffer.Box.clone();
					mbuffer.Transformation.transformBoxEx(newbox);

					this.BoundingBox.addInternalPointByVector(newbox.MinEdge);
					this.BoundingBox.addInternalPointByVector(newbox.MaxEdge);
				}
			}
		}
	}

	/**
	 * @public
	 */
	buildAll_GlobalAnimatedMatrices(joint, parentJoint) {
		if (joint == null) {
			for (var i = 0; i < this.RootJoints.length; ++i) {
				var root = this.RootJoints[i];
				this.buildAll_GlobalAnimatedMatrices(root, null);
			}
			return;
		}

		else {
			// Find global matrix
			if (parentJoint == null || joint.GlobalSkinningSpace)
				joint.GlobalAnimatedMatrix = joint.LocalAnimatedMatrix.clone();

			else
				joint.GlobalAnimatedMatrix = parentJoint.GlobalAnimatedMatrix.multiply(joint.LocalAnimatedMatrix);

		}

		for (var j = 0; j < joint.Children.length; ++j)
			this.buildAll_GlobalAnimatedMatrices(joint.Children[j], joint);
	}

	/**
	 * @public
	 */
	skinMesh(animateNormals) {
		if (!this.HasAnimation)
			return;

		this.skinDoesNotMatchJointPositions = false;
		this.buildAll_GlobalAnimatedMatrices(null, null);

		var i = 0;
		var j = 0;
		var mbuffer;

		// rigid animation
		for (i = 0; i < this.AllJoints.length; ++i) {
			var joint = this.AllJoints[i]; // as SkinnedMeshJoint;
			for (j = 0; j < joint.AttachedMeshes.length; ++j) {
				mbuffer = this.LocalBuffers[joint.AttachedMeshes[j]];
				mbuffer.Transformation = joint.GlobalAnimatedMatrix.clone();
			}
		}

		// clear skinning helper array
		for (i = 0; i < this.LocalBuffers.length; ++i) {
			//var buf:Vector.<Boolean> = Vertices_Moved[i];
			var buf = this.Vertices_Moved[i];;

			for (j = 0; j < buf.length; ++j)
				buf[j] = false;
		}

		// start skinning with root joints
		for (i = 0; i < this.RootJoints.length; ++i) {
			var root = this.RootJoints[i];
			this.skinJoint(root, null, animateNormals);
		}
	}

	/**
	 * @public
	 */
	skinJoint(joint, parentJoint, animateNormals) {
		if (joint.Weights.length) {
			//Find this joints pull on vertices...
			var jointVertexPull = joint.GlobalAnimatedMatrix.multiply(joint.GlobalInversedMatrix);

			var thisVertexMove = new CL3D.Vect3d();
			var thisNormalMove = new CL3D.Vect3d();

			var buffersUsed = this.LocalBuffers;
			var mbuffer;
			var vtx;

			//Skin Vertices Positions and Normals...
			for (var i = 0; i < joint.Weights.length; ++i) {
				var weight = joint.Weights[i]; // SkinnedMeshWeight


				// Pull this vertex...
				jointVertexPull.transformVect2(thisVertexMove, weight.StaticPos);

				if (animateNormals)
					jointVertexPull.rotateVect2(thisNormalMove, weight.StaticNormal);

				mbuffer = buffersUsed[weight.buffer_id];
				vtx = mbuffer.Vertices[weight.vertex_id];

				if (!this.Vertices_Moved[weight.buffer_id][weight.vertex_id]) {
					this.Vertices_Moved[weight.buffer_id][weight.vertex_id] = true;

					vtx.Pos = thisVertexMove.multiplyWithScal(weight.strength);

					if (animateNormals)
						vtx.Normal = thisNormalMove.multiplyWithScal(weight.strength);
				}

				else {
					vtx.Pos.addToThis(thisVertexMove.multiplyWithScal(weight.strength));

					if (animateNormals)
						vtx.Normal.addToThis(thisNormalMove.multiplyWithScal(weight.strength));
				}
			}
		}

		// skin childen
		for (var j = 0; j < joint.Children.length; ++j)
			this.skinJoint(joint.Children[j], joint, animateNormals);
	}

	/**
	 * @public
	 */
	getNamedAnimationRangeByName(thename) {
		if (!thename)
			return null;

		var count = this.NamedAnimationRanges.length;
		var lwrname = thename.toLowerCase();

		for (var j = 0; j < count; ++j) {
			var n = this.NamedAnimationRanges[j];
			if (n.Name && n.Name.toLowerCase() == lwrname)
				return n;
		}

		return null;
	}

	/**
	 * @public
	 */
	addNamedAnimationRange(n) {
		this.NamedAnimationRanges.push(n);
	}

	/**
	 * @public
	 * Used to see by the loader if this model already has been loaded before
	 */
	containsData(buf) {
		return this.AllJoints.length > 0 ||
			this.LocalBuffers.length > 0;
	}
};
