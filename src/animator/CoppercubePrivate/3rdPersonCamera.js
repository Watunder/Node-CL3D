/////////////////////////////////////////////////////////////////////////////////////////
// Animator3rdPersonCamera
/////////////////////////////////////////////////////////////////////////////////////////

import * as CL3D from "../../main.js";

/**
 * @constructor
 * @class
 * @private
 * @extends CL3D.Animator
 */
export class Animator3rdPersonCamera extends CL3D.Animator {
    constructor(scene) {
        super();

        this.lastAnimTime = 0;
        this.SMGr = scene;

        this.SceneNodeIDToFollow = -1;
        this.FollowSmoothingSpeed = 15;
        this.AdditionalRotationForLooking = new CL3D.Vect3d();
        this.FollowMode = 0;
        this.TargetHeight = 0;
        this.CollidesWithWorld = false;
        this.World = 0;

        // runtime variables
        this.LastAnimationTime = 0.0;
        this.InitialDeltaToObject = new CL3D.Vect3d();
        this.DeltaToCenterOfFollowObject = new CL3D.Vect3d();
        this.NodeToFollow = null;
        this.TriedToLinkWithNode = false;

        this.firstUpdate = true;
    }

    /**
     * Returns the type of the animator.
     * For the AnimatorTimer, this will return '3rdpersoncamera'.
     * @private
     */
    getType() {
        return '3rdpersoncamera';
    }

    /**
     * @private
     */
    createClone(node, newManager, oldNodeId, newNodeId) {
        var a = new CL3D.Animator3rdPersonCamera(this.SMGr);
        a.SceneNodeIDToFollow = this.SceneNodeIDToFollow;
        a.FollowSmoothingSpeed = this.FollowSmoothingSpeed;
        a.AdditionalRotationForLooking = this.AdditionalRotationForLooking.clone();
        a.FollowMode = this.FollowMode;
        a.TargetHeight = this.TargetHeight;
        a.CollidesWithWorld = this.CollidesWithWorld;
        a.World = this.World;

        return a;
    }

    /**
     * Animates the scene node it is attached to and returns true if scene node was modified.
     * @private
     * @param {CL3D.SceneNode} n The Scene node which needs to be animated this frame.
     * @param {Integer} timeMs The time in milliseconds since the start of the scene.
     */
    animateNode(node, timeMs) {
        var timeDiff = timeMs - this.lastAnimTime;
        if (timeDiff > 250)
            timeDiff = 250;
        this.lastAnimTime = timeMs;

        var bChanged = false;

        if (node == null)
            return false;

        var camera = node;

        this.linkWithNode(node.scene);

        if (!this.NodeToFollow)
            return false;

        var bChanged = false;

        var oldTarget = camera.Target.clone();

        camera.Target = this.NodeToFollow.getAbsolutePosition();
        camera.Target.addToThis(this.DeltaToCenterOfFollowObject);
        camera.Target.Y += this.TargetHeight;

        if (!camera.Target.equals(oldTarget))
            bChanged = true;

        if (this.firstUpdate) {
            this.NodeToFollow.updateAbsolutePosition();
            camera.updateAbsolutePosition();

            this.DeltaToCenterOfFollowObject = this.NodeToFollow.getBoundingBox().getExtent();
            this.DeltaToCenterOfFollowObject.Y = this.DeltaToCenterOfFollowObject.Y / 2;
            this.DeltaToCenterOfFollowObject.X = 0;
            this.DeltaToCenterOfFollowObject.Z = 0;

            this.lastAnimTime = timeMs;
            this.firstUpdate = false;
        }

        if (!(camera.scene.getActiveCamera() === camera))
            return false;

        if (this.InitialDeltaToObject.equalsZero()) {
            this.InitialDeltaToObject = this.NodeToFollow.getAbsolutePosition().substract(camera.getAbsolutePosition());

            // this line didn't work with scale
            //this.NodeToFollow.AbsoluteTransformation.inverseRotateVect(this.InitialDeltaToObject);
            // this one does
            var matrotinit = new CL3D.Matrix4();
            matrotinit.setRotationDegrees(this.NodeToFollow.Rot);
            matrotinit.inverseRotateVect(this.InitialDeltaToObject);
        }

        var currentRot = this.NodeToFollow.Rot;

        var matrot = new CL3D.Matrix4();
        matrot.setRotationDegrees(currentRot);

        var matrot2 = new CL3D.Matrix4();
        matrot2.setRotationDegrees(this.AdditionalRotationForLooking);
        matrot = matrot.multiply(matrot2);

        // animate camera position
        var finalpos = camera.Pos.clone();

        switch (this.FollowMode) {
            case 0: //ECFM_FIXED:
                // don't change position
                break;
            case 2: //ECFM_FOLLOW_FIXED:
                {
                    // only add position
                    finalpos = this.NodeToFollow.getAbsolutePosition().substract(this.InitialDeltaToObject);
                }
                break;
            case 1: //ECFM_FOLLOW:
                {
                    // add position and rotation
                    var newdelta = this.InitialDeltaToObject.clone();
                    matrot.rotateVect(newdelta);

                    var desiredPos = this.NodeToFollow.getAbsolutePosition().substract(newdelta);
                    var distanceToDesiredPos = camera.getAbsolutePosition().getDistanceTo(desiredPos);
                    var userSetDefaultCameraDistance = this.InitialDeltaToObject.getLength();

                    var bTooFarAway = distanceToDesiredPos > userSetDefaultCameraDistance * 2.2;

                    if (CL3D.equals(this.FollowSmoothingSpeed, 0.0) || bTooFarAway) {
                        // smoothing speed is disabled or camera is too far away from the object
                        // directly set position of camera		
                        finalpos = desiredPos;
                    }

                    else {
                        // move camera position smoothly to desired position
                        // the more away the distance is, the faster move toward the new target
                        var distanceToMove = Math.sqrt(distanceToDesiredPos) * (timeDiff / 1000.0) * this.FollowSmoothingSpeed;
                        if (distanceToMove > distanceToDesiredPos)
                            distanceToMove = distanceToDesiredPos;

                        var moveVect = desiredPos.substract(camera.Pos);
                        moveVect.setLength(distanceToMove);
                        moveVect.addToThis(camera.Pos);

                        finalpos = moveVect;
                    }
                }
                break;
        }

        // collide with world
        if (this.CollidesWithWorld &&
            this.World != null &&
            !camera.Pos.equals(finalpos)) {
            this.World.setNodeToIgnore(this.NodeToFollow);

            var ray = new CL3D.Line3d();

            ray.Start = camera.Target.clone();
            ray.End = finalpos.clone();

            var rayVect = ray.getVector();
            var wantedDistanceToTarget = rayVect.getLength();
            var distanceToNextWall = this.InitialDeltaToObject.getLength() / 10.0;

            rayVect.setLength(distanceToNextWall);
            ray.End.addToThis(rayVect);

            var triangle = new CL3D.Triangle3d();

            var pos = this.World.getCollisionPointWithLine(ray.Start, ray.End, true, triangle, true);
            if (pos != null) {
                // ensure final collision position is at least distanceToNextWall away from the collision point.
                var collisionVect = pos.substract(ray.Start);
                var collisionVectLen = collisionVect.getLength();
                if (collisionVectLen < distanceToNextWall) collisionVectLen = distanceToNextWall;
                collisionVectLen -= distanceToNextWall;
                if (collisionVectLen > wantedDistanceToTarget) collisionVectLen = wantedDistanceToTarget;

                collisionVect.setLength(collisionVectLen);
                finalpos = ray.Start.add(collisionVect);
            }

            this.World.setNodeToIgnore(null);
        }

        // set final position
        if (!camera.Pos.equals(finalpos)) {
            bChanged = true;
            camera.Pos = finalpos;
        }

        return bChanged;
    }

    /**
     * @private
     */
    linkWithNode(smgr) {
        if (this.TriedToLinkWithNode)
            return;

        if (this.SceneNodeIDToFollow == -1)
            return;

        if (smgr == null)
            return;

        var node = smgr.getSceneNodeFromId(this.SceneNodeIDToFollow);
        if (node && !(node === this.NodeToFollow)) {
            this.NodeToFollow = node;
            this.firstUpdate = true;
        }

        this.TriedToLinkWithNode = true;
    }
};
