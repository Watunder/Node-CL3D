/////////////////////////////////////////////////////////////////////////////////////////
// Keyboard controlled animator
/////////////////////////////////////////////////////////////////////////////////////////

import * as CL3D from "../../main.js";

/**
 * @constructor
 * @class
 * @private
 * @extends CL3D.Animator
 */
export class AnimatorKeyboardControlled extends CL3D.Animator {
    constructor(scene, engine) {
        super();

        this.lastAnimTime = 0;
        this.SMGr = scene;

        this.MoveSpeed = 0;
        this.RunSpeed = 0;
        this.RotateSpeed = 0;
        this.JumpSpeed = 0;
        this.PauseAfterJump = false;

        this.UseAcceleration = false;
        this.AccelerationSpeed = 0;
        this.DecelerationSpeed = 0;

        this.FollowSmoothingSpeed = 15;
        this.AdditionalRotationForLooking = new CL3D.Vect3d();

        this.StandAnimation = "";
        this.WalkAnimation = "";
        this.JumpAnimation = "";
        this.RunAnimation = "";

        this.LastAnimationTime = CL3D.CLTimer.getTime();
        this.LastJumpTime = this.LastAnimationTime;
        this.WasMovingLastFrame = false;
        this.ShiftIsDown = false;

        this.Registered = false;

        this.leftKeyDown = false;
        this.rightKeyDown = false;
        this.upKeyDown = false;
        this.downKeyDown = false;
        this.jumpKeyDown = false;

        this.AcceleratedSpeed = 0;
        this.AccelerationIsForward = false;

        this.firstUpdate = true;
        this.DisableWithoutActiveCamera = false;

        this.Engine = engine;
        engine.registerAnimatorForKeyUp(this);
        engine.registerAnimatorForKeyDown(this);
    }

    /**
     * Returns the type of the animator.
     * For the AnimatorTimer, this will return 'keyboardcontrolled'.
     * @private
     */
    getType() {
        return 'keyboardcontrolled';
    }

    /**
     * @private
     */
    createClone(node, newManager, oldNodeId, newNodeId) {
        var a = new CL3D.AnimatorKeyboardControlled(this.SMGr, this.Engine);
        a.MoveSpeed = this.MoveSpeed;
        a.RunSpeed = this.RunSpeed;
        a.RotateSpeed = this.RotateSpeed;
        a.JumpSpeed = this.JumpSpeed;
        a.FollowSmoothingSpeed = this.FollowSmoothingSpeed;
        a.AdditionalRotationForLooking = this.AdditionalRotationForLooking ? this.AdditionalRotationForLooking.clone() : null;
        a.StandAnimation = this.StandAnimation;
        a.WalkAnimation = this.WalkAnimation;
        a.JumpAnimation = this.JumpAnimation;
        a.RunAnimation = this.RunAnimation;
        a.UseAcceleration = this.UseAcceleration;
        a.AccelerationSpeed = this.AccelerationSpeed;
        a.DecelerationSpeed = this.DecelerationSpeed;
        a.DisableWithoutActiveCamera = this.DisableWithoutActiveCamera;

        return a;
    }

    /**
     * @private
     */
    setKeyBool(down, code) {
        code = code.toLowerCase();
        if (code == "a" || code == "left" || code == "arrowleft") {
            this.leftKeyDown = down;

            // fix chrome key down problem (key down sometimes doesn't arrive)
            if (down) this.rightKeyDown = false;
            return true;
        }

        if (code == "d" || code == "right" || code == "arrowright") {
            this.rightKeyDown = down;

            // fix chrome key down problem (key down sometimes doesn't arrive)
            if (down) this.leftKeyDown = false;
            return true;
        }

        if (code == "w" || code == "up" || code == "arrowup") {
            this.upKeyDown = down;

            // fix chrome key down problem (key down sometimes doesn't arrive)
            if (down) this.downKeyDown = false;
            return true;
        }

        if (code == "s" || code == "down" || code == "arrowdown") {
            this.downKeyDown = down;

            // fix chrome key down problem (key down sometimes doesn't arrive)
            if (down) this.upKeyDown = false;
            return true;
        }

        if (code == "space" || code == " ") {
            // jump key
            this.jumpKeyDown = down;
            return true;
        }

        return false;
    }

    /**
     * @private
     */
    onKeyDown(event) {
        this.ShiftIsDown = (event.shiftKey == 1);
        return this.setKeyBool(true, event.key);
    }

    /**
     * @private
     */
    onKeyUp(event) {
        this.ShiftIsDown = (event.shiftKey == 1);
        return this.setKeyBool(false, event.key);
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

        this.LastAnimationTime = timeMs;

        // disable if user wants disabled without active camera following the object we are controlling
        if (this.DisableWithoutActiveCamera) {
            var cam = node.scene.getActiveCamera();
            if (cam != null) {
                var an = cam.getAnimatorOfType('3rdpersoncamera');
                if (an != null) {
                    if (!(an.NodeToFollow === node))
                        return false;
                }

                else
                    return false;
            }
        }

        // Update rotation
        var currentRot = node.Rot;

        if (this.leftKeyDown) {
            currentRot.Y -= timeDiff * this.RotateSpeed * 0.001;
            bChanged = true;
        }

        if (this.rightKeyDown) {
            currentRot.Y += timeDiff * this.RotateSpeed * 0.001;
            bChanged = true;
        }

        // move forward/backward
        var pos = node.Pos;

        var matrot = new CL3D.Matrix4();
        matrot.setRotationDegrees(currentRot);
        var directionForward = new CL3D.Vect3d(0, 0, 1);

        var matrot2 = new CL3D.Matrix4();
        matrot2.setRotationDegrees(this.AdditionalRotationForLooking);
        matrot = matrot.multiply(matrot2);

        matrot.rotateVect(directionForward);

        var bRun = this.ShiftIsDown;
        var speed = (bRun ? this.RunSpeed : this.MoveSpeed) * timeDiff;
        var origSpeed = 0;

        var bBackward = this.downKeyDown;
        var bForward = this.upKeyDown;

        if (this.UseAcceleration && timeDiff) {
            if (bForward || bBackward) {
                // accelerate normally 
                if (this.AccelerationIsForward != bForward) {
                    // user change direction.
                    if (this.DecelerationSpeed == 0)
                        this.AcceleratedSpeed *= -1.0; //  We need to invert the force so he has to work against it

                    else
                        this.AcceleratedSpeed = 0.0; // no deceleration, stop immediately
                }

                this.AccelerationIsForward = !bBackward;

                origSpeed = speed / timeDiff;
                this.AcceleratedSpeed += (this.AccelerationSpeed) * origSpeed * (timeDiff / 1000.0);
                if (this.AcceleratedSpeed > origSpeed) this.AcceleratedSpeed = origSpeed;

                speed = this.AcceleratedSpeed * timeDiff;
            }

            else {
                // no key pressed, decellerate
                if (this.DecelerationSpeed == 0.0)
                    this.AcceleratedSpeed = 0;

                else {
                    origSpeed = speed / Number(timeDiff);
                    this.AcceleratedSpeed -= (this.DecelerationSpeed) * origSpeed * (timeDiff / 1000.0);
                    if (this.AcceleratedSpeed < 0) this.AcceleratedSpeed = 0;
                    speed = this.AcceleratedSpeed * timeDiff;
                }
            }
        }

        directionForward.setLength(speed);

        if (bForward || bBackward || (this.UseAcceleration && this.AcceleratedSpeed != 0)) {
            var moveVect = directionForward.clone();

            if (bBackward || (!(bForward || bBackward) && !this.AccelerationIsForward))
                moveVect.multiplyThisWithScal(-1.0);

            node.Pos.addToThis(moveVect);
            bChanged = true;
            this.WasMovingLastFrame = true;
        }

        if (bForward || bBackward) {
            this.setAnimation(node, bRun ? 3 : 1, bBackward);

            this.WasMovingLastFrame = true;
            bChanged = true;
        }

        else {
            // no key pressed
            // stand animation, only if not falling
            var bFalling = false;

            var a = node.getAnimatorOfType('collisionresponse');
            if (a)
                bFalling = a.isFalling();

            if (!bFalling && (this.hasAnimationType(node, 1) || this.hasAnimationType(node, 3) || this.hasAnimationType(node, 2)))
                this.setAnimation(node, 0, false);
        }

        // jump
        // For jumping, we find the collision response animator attached to our camera
        // and if it's not falling, we tell it to jump.
        if (this.jumpKeyDown) {
            var b = node.getAnimatorOfType('collisionresponse');
            if (b && !b.isFalling()) {
                var minJumpTime = 0;
                if (this.SMGr && this.SMGr.Gravity != 0)
                    minJumpTime = Math.floor((this.JumpSpeed * (1.0 / this.SMGr.Gravity)) * 2000);

                if (!this.PauseAfterJump ||
                    (this.PauseAfterJump && (timeMs - this.LastJumpTime) > minJumpTime)) {
                    b.jump(this.JumpSpeed);
                    this.setAnimation(node, 2, false);

                    this.LastJumpTime = timeMs;

                    bChanged = true;
                }
            }
        }

        return bChanged;
    }

    /**
     * @private
     */
    getAnimationNameFromType(n) {
        switch (n) {
            case 0: return this.StandAnimation;
            case 1: return this.WalkAnimation;
            case 2: return this.JumpAnimation;
            case 3: return this.RunAnimation;
        }

        return "";
    }

    /**
     * @private
     */
    hasAnimationType(node, animationType) {
        return this.setAnimation(node, animationType, false, true);
    }

    /**
     * @private
     */
    setAnimation(node, animationType, breverse, testIfIsSetOnly) {
        if (!node || node.getType() != 'animatedmesh')
            return false;

        // find mesh and node type
        var animatedMesh = node;

        var skinnedmesh = animatedMesh.Mesh; // as SkinnedMesh;
        if (!skinnedmesh)
            return false;

        // find range for animation
        var range = skinnedmesh.getNamedAnimationRangeByName(this.getAnimationNameFromType(animationType));

        if (range) {
            var wantedFPS = 1.0 * range.FPS;
            if (breverse)
                wantedFPS *= -1.0;

            if (testIfIsSetOnly) {
                return animatedMesh.EndFrame == range.End &&
                    animatedMesh.StartFrame == range.Begin;
            }

            if (!(animatedMesh.EndFrame == range.End &&
                animatedMesh.StartFrame == range.Begin &&
                CL3D.equals(animatedMesh.FramesPerSecond, wantedFPS))) {
                animatedMesh.setFrameLoop(range.Begin, range.End);
                if (wantedFPS)
                    animatedMesh.setAnimationSpeed(wantedFPS);

                animatedMesh.setLoopMode(animationType == 0 || animationType == 1 || animationType == 3);
            }

            return false;
        }

        else {
            // note: temporary bug fix. The flash animation player is
            // not able to stop an animation at (0,0), so we stop at (1,1)
            if (!testIfIsSetOnly) {
                animatedMesh.setFrameLoop(1, 1);
                animatedMesh.setLoopMode(false);
            }
        }

        return false;
    }
};
