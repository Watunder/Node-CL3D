/////////////////////////////////////////////////////////////////////////////////////////
// Game AI Animator
/////////////////////////////////////////////////////////////////////////////////////////

import * as CL3D from "../../main.js";
    
/**
 * @constructor
 * @class
 * @private
 * @extends CL3D.Animator
 */
export class AnimatorGameAI extends CL3D.Animator {
    constructor(scene, engine) {
        // constants for the commands (from coppercube editor):
        // private static const EMT_PLAYER:int = 0;
        // private static const EMT_STAND_STILL:int = 1;
        // private static const EMT_RANDOMLY_PATROL:int = 2;
        // private static const EMT_DO_NOTHING:int = 0;
        // private static const EMT_REACH_POSITION:int = 1;
        // private static const EMT_ATTACK_ITEM:int = 2;
        // private static const EMT_DIE_AND_STOP:int = 3;
        // private static const EAT_STAND:int = 0;
        // private static const EAT_WALK:int = 1;
        // private static const EAT_ATTACK:int = 2;
        // private static const EAT_DIE:int = 3;
        this.AIType = 0;
        this.MovementSpeed = 0;
        this.ActivationRadius = 0;
        this.CanFly = false;
        this.Health = 100;
        this.PatrolWaitTimeMs = 3000;
        this.PathIdToFollow = -1;
        this.Tags = "";
        this.AttacksAIWithTags = "";
        this.PatrolRadius = 100;
        this.RotationSpeedMs = 0;
        this.AdditionalRotationForLooking = new CL3D.Vect3d();
        this.StandAnimation = "";
        this.WalkAnimation = "";
        this.DieAnimation = "";
        this.AttackAnimation = "";

        this.ActionHandlerOnAttack = null;
        this.ActionHandlerOnActivate = null;
        this.ActionHandlerOnHit = null;
        this.ActionHandlerOnDie = null;

        // runtime data
        this.CurrentCommand = 0;

        this.NextAttackTargetScanTime = 0;
        this.LastPatrolStartTime = 0;

        this.CurrentCommandTargetPos = null;
        this.CurrentCommandStartTime = 0;
        this.CurrentCommandTicksDone = 0;
        this.CurrentCommandExpectedTickCount = 0;
        this.BeginPositionWhenStartingCurrentCommand = 0;
        this.HandleCurrentCommandTargetNode = null;
        this.AttackCommandExecuted = false;
        this.Activated = false;
        this.CurrentlyShooting = false; // flag to be queried shoot action
        this.CurrentlyShootingLine = new CL3D.Line3d(); // data to be queried shoot action
        this.NextPathPointToGoTo = 0;

        this.World = null;
        this.TheObject = null;
        this.TheSceneManager = scene;
        this.LastTime = 0;
        this.StartPositionOfActor = new CL3D.Vect3d();

        this.NearestSceneNodeFromAIAnimator_NodeOut = null;
        this.NearestSceneNodeFromAIAnimator_maxDistance = 0;

    }
        
    /**
     * Returns the type of the animator.
     * For the AnimatorGameAI, this will return 'gameai'.
     * @private
     */
    getType() {
        return 'gameai';
    }
        
    /**
     * @private
     */
    createClone(node, newManager, oldNodeId, newNodeId) {
        var a = new CL3D.AnimatorGameAI(this.TheSceneManager);
        a.AIType = this.AIType;
        a.MovementSpeed = this.MovementSpeed;
        a.ActivationRadius = this.ActivationRadius;
        a.CanFly = this.CanFly;
        a.Health = this.Health;
        a.Tags = this.Tags;
        a.AttacksAIWithTags = this.AttacksAIWithTags;
        a.PatrolRadius = this.PatrolRadius;
        a.RotationSpeedMs = this.RotationSpeedMs;
        a.PathIdToFollow = this.PathIdToFollow;
        a.PatrolWaitTimeMs = this.PatrolWaitTimeMs;
        a.AdditionalRotationForLooking = this.AdditionalRotationForLooking ? this.AdditionalRotationForLooking.clone() : null;
        a.StandAnimation = this.StandAnimation;
        a.WalkAnimation = this.WalkAnimation;
        a.DieAnimation = this.DieAnimation;
        a.AttackAnimation = this.AttackAnimation;

        a.ActionHandlerOnAttack = this.ActionHandlerOnAttack ? this.ActionHandlerOnAttack.createClone(oldNodeId, newNodeId) : null;
        a.ActionHandlerOnActivate = this.ActionHandlerOnActivate ? this.ActionHandlerOnActivate.createClone(oldNodeId, newNodeId) : null;
        a.ActionHandlerOnHit = this.ActionHandlerOnHit ? this.ActionHandlerOnHit.createClone(oldNodeId, newNodeId) : null;
        a.ActionHandlerOnDie = this.ActionHandlerOnDie ? this.ActionHandlerOnDie.createClone(oldNodeId, newNodeId) : null;

        return a;
    }
        
    /**
     * Animates the scene node it is attached to and returns true if scene node was modified.
     * @private
     * @param {CL3D.SceneNode} n The Scene node which needs to be animated this frame.
     * @param {Integer} timeMs The time in milliseconds since the start of the scene.
     */
    animateNode(node, timeMs) {
        if (node == null || this.TheSceneManager == null)
            return false;

        var diff = timeMs - this.LastTime;
        if (diff > 150) diff = 150;
        this.LastTime = timeMs;

        var characterSize = 0;
        var changedNode = false;

        if (!(this.TheObject === node)) {
            this.TheObject = node;
            node.updateAbsolutePosition();
            this.StartPositionOfActor = node.getAbsolutePosition();
        }

        var currentPos = node.getAbsolutePosition();

        if (this.CurrentCommand == 3) //EMT_DIE_AND_STOP)
        {
            // do nothing
        }

        else if (this.CurrentCommand == 1) //EMT_REACH_POSITION)
        {
            // check if we reached the position
            characterSize = this.getCharacterWidth(node);
            if (this.CurrentCommandTargetPos.substract(currentPos).getLength() < characterSize) {
                // target reached.
                this.CurrentCommand = 0; //EMT_DO_NOTHING;
                this.setAnimation(node, 0); //EAT_STAND);
                changedNode = true;
            }

            else {
                // not reached position yet
                // check if we possibly hit a wall. This can be done easily by getting the moving speed and 
                // checking the start position and start time
                var cancelled = false;

                if (this.CurrentCommandTicksDone > 2) {
                    var expectedLengthMoved = this.CurrentCommandTicksDone * (this.MovementSpeed / 1000.0);
                    var lengthMoved = this.BeginPositionWhenStartingCurrentCommand.substract(currentPos).getLength();

                    if (lengthMoved * 1.2 < expectedLengthMoved) {
                        // cancel movement, moved twice as long as we should have already.
                        this.CurrentCommand = 0; //EMT_DO_NOTHING;
                        this.setAnimation(node, 0); //EAT_STAND);
                        cancelled = true;
                    }
                }

                if (!cancelled) {
                    // move on to the position
                    this.CurrentCommandTicksDone += diff;

                    var movementVec = this.CurrentCommandTargetPos.substract(currentPos);
                    movementVec.setLength((this.MovementSpeed / 1000.0) * diff);

                    if (!this.CanFly)
                        movementVec.Y = 0;

                    node.Pos.addToThis(movementVec);
                }

                // additionally, animate looking direction
                changedNode = this.animateRotation(node, (timeMs - this.CurrentCommandStartTime),
                    this.CurrentCommandTargetPos.substract(currentPos), this.RotationSpeedMs);
            }
        }

        else if (this.CurrentCommand == 2) //EMT_ATTACK_ITEM)
        {
            // attack enemy in the middle of the animation
            this.CurrentCommandTicksDone += diff;

            if (!this.AttackCommandExecuted &&
                this.CurrentCommandTicksDone > (this.CurrentCommandExpectedTickCount / 2)) {
                // execute attack action
                this.CurrentlyShooting = true;

                if (this.ActionHandlerOnAttack)
                    this.ActionHandlerOnAttack.execute(node);

                this.CurrentlyShooting = false;
                this.AttackCommandExecuted = true;
                changedNode = true;
            }

            if (this.CurrentCommandTicksDone > this.CurrentCommandExpectedTickCount) {
                // finished
                this.CurrentCommand = 0; //EMT_DO_NOTHING;
            }

            else {
                // rotate to attack target
                changedNode = this.animateRotation(node, (timeMs - this.CurrentCommandStartTime),
                    this.CurrentCommandTargetPos.substract(currentPos),
                    Math.min(this.RotationSpeedMs, this.CurrentCommandExpectedTickCount));
            }
        }

        else if (this.CurrentCommand == 0) //EMT_DO_NOTHING)
        {
            // see if we can check for the target
            // now do high level ai calculation here
            if (this.AIType == 1 || //EMT_STAND_STILL ||
                this.AIType == 2 || //EMT_RANDOMLY_PATROL) 
                this.AIType == 3) {
                var attackTargetNode = this.scanForAttackTargetIfNeeded(timeMs, currentPos);
                if (attackTargetNode != null) {
                    // found an attack target
                    var weaponDistance = this.getAttackDistanceFromWeapon();

                    if (!this.Activated && this.ActionHandlerOnActivate)
                        this.ActionHandlerOnActivate.execute(node);
                    this.Activated = true;
                    changedNode = true;

                    if (attackTargetNode.getAbsolutePosition().getDistanceTo(currentPos) < weaponDistance) {
                        // attack target is in distance to be attacked by our weapon. Attack now, but
                        // first check if there is a wall between us.
                        if (this.isNodeVisibleFromNode(attackTargetNode, node)) {
                            // attack target is visible, attack now
                            this.CurrentlyShootingLine.Start = node.getTransformedBoundingBox().getCenter();
                            this.CurrentlyShootingLine.End = attackTargetNode.getTransformedBoundingBox().getCenter();

                            this.attackTarget(node, attackTargetNode, attackTargetNode.getAbsolutePosition(), currentPos, timeMs);
                        }

                        else {
                            // attack target is not visible. move to it.
                            this.moveToTarget(node, attackTargetNode.getAbsolutePosition(), currentPos, timeMs);
                        }
                    }

                    else {
                        // attack target is not in distance to be attacked by the weapon. move to it.
                        this.moveToTarget(node, attackTargetNode.getAbsolutePosition(), currentPos, timeMs);
                    }
                }

                else {
                    // no attack target found. Do something idle, maybe patrol a bit.
                    if (this.AIType == 2 || this.AIType == 3) //EMT_RANDOMLY_PATROL or EMT_FOLLOW_PATH_ROUTE)
                    {
                        if (!this.LastPatrolStartTime || timeMs > this.LastPatrolStartTime + this.PatrolWaitTimeMs) {
                            characterSize = this.getCharacterWidth(node);
                            var newPos = null;

                            if (this.AIType == 3) {
                                // find next path point to go to
                                var path = null;

                                if (this.PathIdToFollow != -1 && this.TheSceneManager != null)
                                    path = this.TheSceneManager.getSceneNodeFromId(this.PathIdToFollow);

                                if (path != null && path.getType() == 'path') {
                                    if (this.NextPathPointToGoTo >= path.getPathNodeCount())
                                        this.NextPathPointToGoTo = 0;

                                    newPos = path.getPathNodePosition(this.NextPathPointToGoTo);
                                }

                                ++this.NextPathPointToGoTo;
                            }

                            else {
                                // find random position to patrol to
                                var walklen = this.PatrolRadius;
                                this.LastPatrolStartTime = timeMs;
                                newPos = new CL3D.Vect3d((Math.random() - 0.5) * walklen,
                                    (Math.random() - 0.5) * walklen,
                                    (Math.random() - 0.5) * walklen);

                                newPos.addToThis(this.StartPositionOfActor);

                                if (!this.CanFly)
                                    newPos.Y = this.StartPositionOfActor.Y;
                            }

                            if (!(newPos.substract(currentPos).getLength() < characterSize)) {
                                // move to patrol target
                                this.moveToTarget(node, newPos, currentPos, timeMs);
                                changedNode = true;
                            }
                        }
                    }
                }
            }
        }

        return changedNode;
    }
        
    /**
     * returns if rotation changed, returns true/false
     * @private
     */
    animateRotation(node, timeSinceStartRotation,
        lookvector, rotationSpeedMs) {
        if (!node)
            return false;

        var isCamera = (node.getType() == 'camera');
        if (isCamera)
            return false;

        if (!this.CanFly)
            lookvector.Y = 0;

        var matrot = new CL3D.Matrix4();
        matrot.setRotationDegrees(lookvector.getHorizontalAngle());
        var matrot2 = new CL3D.Matrix4();
        matrot2.setRotationDegrees(this.AdditionalRotationForLooking);
        matrot = matrot.multiply(matrot2);

        // matrot now is the wanted rotation, now interpolate with the current rotation
        var wantedRot = matrot.getRotationDegrees();
        var currentRot = node.Rot.clone();

        var interpol = Math.min(timeSinceStartRotation, rotationSpeedMs) / rotationSpeedMs;
        interpol = CL3D.clamp(interpol, 0.0, 1.0);

        //node->setRotation(wantedRot.getInterpolated(currentRot, interpol));
        wantedRot.multiplyThisWithScal(CL3D.DEGTORAD);
        currentRot.multiplyThisWithScal(CL3D.DEGTORAD);

        var q1 = new CL3D.Quaternion();
        q1.setFromEuler(wantedRot.X, wantedRot.Y, wantedRot.Z);

        var q2 = new CL3D.Quaternion();
        q2.setFromEuler(currentRot.X, currentRot.Y, currentRot.Z);

        q2.slerp(q2, q1, interpol);
        q2.toEuler(wantedRot);

        wantedRot.multiplyThisWithScal(CL3D.RADTODEG);

        if (node.Rot.equals(wantedRot))
            return false;

        node.Rot = wantedRot;
        return true;
    }
        
    /**
     * @private
     */
    moveToTarget(node, target, currentPos, now) {
        this.CurrentCommand = 1; //EMT_REACH_POSITION;
        this.CurrentCommandTargetPos = target;
        this.CurrentCommandStartTime = now;
        this.BeginPositionWhenStartingCurrentCommand = currentPos;
        this.CurrentCommandTicksDone = 0;
        this.CurrentCommandExpectedTickCount = 0; // invalid for this command
        this.setAnimation(node, 1); //EAT_WALK);
    }
        
    /**
     * @private
     */
    attackTarget(node, targetnode, target, currentPos, now) {
        this.CurrentCommand = 2; //EMT_ATTACK_ITEM;
        this.CurrentCommandTargetPos = target;
        this.CurrentCommandStartTime = now;
        this.HandleCurrentCommandTargetNode = targetnode;
        this.BeginPositionWhenStartingCurrentCommand = currentPos;
        this.CurrentCommandTicksDone = 0;
        this.CurrentCommandExpectedTickCount = 500; // seems to be a nice default value
        this.AttackCommandExecuted = false;

        var animDuration = this.setAnimation(node, 2); //EAT_ATTACK);

        if (animDuration != 0) {
            this.CurrentCommandExpectedTickCount = animDuration;
        }
    }
        
    /**
     * @private
     */
    aiCommandCancel(node) {
        this.CurrentCommand = 0; //EMT_DO_NOTHING;
        this.setAnimation(node, 0); //EAT_STAND);
    }
        
    /**
     * @private
     */
    die(node, currentPos, now) {
        this.CurrentCommand = 3; //EMT_DIE_AND_STOP;
        this.CurrentCommandStartTime = now;
        this.BeginPositionWhenStartingCurrentCommand = currentPos;
        this.CurrentCommandTicksDone = 0;
        this.CurrentCommandExpectedTickCount = 500; // seems to be a nice default value

        var animDuration = this.setAnimation(node, 3); //EAT_DIE);
    }
        
    /**
     * @private
     */
    isNodeVisibleFromNode(node1, node2) {
        if (!node1 || !node2)
            return false;

        // instead of checking the positions of the nodes, we use the centers of the boxes of the nodes
        var pos1 = node1.getTransformedBoundingBox().getCenter();
        var pos2 = node2.getTransformedBoundingBox().getCenter();

        // if this is a node with collision box enabled, move the test start position outside of the collision box (otherwise the test would collide with itself)
        if (this.TheObject == node2) {
            if (node2.getType() == 'mesh') {
                if (node2.DoesCollision) {
                    var extendLen = node2.getBoundingBox().getExtent().getLength() * 0.5;
                    var vect = pos2.substract(pos1);
                    vect.normalize();
                    vect.multiplyThisWithScal(extendLen + (extendLen * 0.02));
                    pos1.addToThis(vect);
                }
            }
        }

        return this.isPositionVisibleFromPosition(pos1, pos2);
    }
        
    /**
     * @private
     */
    isPositionVisibleFromPosition(pos1, pos2) {
        if (!this.World || !this.TheSceneManager)
            return true;

        if (this.World.getCollisionPointWithLine(pos1, pos2, true, null, true) != null) {
            return false;
        }

        return true;
    }
        
    /**
     * @private
     */
    getNearestSceneNodeFromAIAnimatorAndDistance(node,
        currentpos,
        tag) {
        if (!node || !node.Visible)
            return;

        // check if the node is in the max distance
        var isMatching = false;
        var dist = currentpos.getDistanceTo(node.getAbsolutePosition());

        if (dist < this.NearestSceneNodeFromAIAnimator_maxDistance) {
            // find ai animator in the node
            var ainode = node.getAnimatorOfType('gameai');

            if (ainode && tag != "" &&
                !(ainode === this) &&
                ainode.isAlive()) {
                // check if animator tags are the ones we need
                isMatching = ainode.Tags.indexOf(tag) != -1;
            }
        }

        if (isMatching) {
            this.NearestSceneNodeFromAIAnimator_maxDistance = dist;
            this.NearestSceneNodeFromAIAnimator_NodeOut = node;
        }

        // search children of the node
        for (var i = 0; i < node.Children.length; ++i) {
            var child = node.Children[i];
            this.getNearestSceneNodeFromAIAnimatorAndDistance(child, currentpos, tag);
        }
    }
        
    /**
     * @private
     */
    scanForAttackTargetIfNeeded(timems, currentpos) {
        if (this.ActivationRadius <= 0 || !this.TheObject || this.AttacksAIWithTags.length == 0 || !this.TheSceneManager)
            return null;

        if (!this.NextAttackTargetScanTime || timems > this.NextAttackTargetScanTime) {
            this.NearestSceneNodeFromAIAnimator_maxDistance = this.ActivationRadius;
            this.NearestSceneNodeFromAIAnimator_NodeOut = null;

            this.getNearestSceneNodeFromAIAnimatorAndDistance(this.TheSceneManager.getRootSceneNode(),
                currentpos, this.AttacksAIWithTags);

            this.NextAttackTargetScanTime = timems + 500 + (Math.random() * 1000);

            return this.NearestSceneNodeFromAIAnimator_NodeOut;
        }

        return null;
    }
        
    /**
     * @private
     */
    getAttackDistanceFromWeapon() {
        var ret = 1000;

        if (this.ActionHandlerOnAttack) {
            var action = this.ActionHandlerOnAttack.findAction('Shoot');
            if (action)
                ret = action.getWeaponRange();
        }

        return ret;
    }
        
    /**
     * @private
     */
    getCharacterWidth(node) {
        if (node != null)
            return 10;

        var sz = node.getTransformedBoundingBox().getExtent();
        sz.Y = 0;
        return sz.getLength();
    }
        
    /**
     * @private
     */
    getAnimationNameFromType(t) {
        switch (t) {
            case 0: return this.StandAnimation;
            case 1: return this.WalkAnimation;
            case 2: return this.AttackAnimation;
            case 3: return this.DieAnimation;
        }

        return "";
    }
        
    /**
     * @private
     */
    setAnimation(node, animationType) {
        if (!node || node.getType() != 'animatedmesh')
            return 0;

        // find mesh and node type
        var animatedMesh = node;

        var skinnedmesh = animatedMesh.Mesh; // as SkinnedMesh;
        if (!skinnedmesh)
            return 0;

        // find range for animation
        var range = skinnedmesh.getNamedAnimationRangeByName(this.getAnimationNameFromType(animationType));

        if (range) {
            animatedMesh.setFrameLoop(range.Begin, range.End);
            if (range.FPS != 0)
                animatedMesh.setAnimationSpeed(range.FPS);
            animatedMesh.setLoopMode(animationType == 1 || animationType == 0); //animationType == EAT_WALK || animationType == EAT_STAND);

            return (range.End - range.Begin) * range.FPS * 1000;
        }

        else {
            // note: temporary bug fix. The flash animation player is
            // not able to stop an animation at (0,0), so we stop at (1,1)
            animatedMesh.setFrameLoop(1, 1);
            animatedMesh.setLoopMode(false);
        }

        return 0;
    }
        
    /**
     * @private
     */
    isCurrentlyShooting() {
        return this.CurrentlyShooting;
    }
        
    /**
     * @private
     */
    getCurrentlyShootingLine() {
        return this.CurrentlyShootingLine;
    }
        
    /**
     * @private
     */
    isAlive() {
        return this.Health > 0;
    }
        
    /**
     * @private
     */
    OnHit(damage, node) {
        if (!node)
            return;

        if (this.Health == 0)
            return; // already dead

        this.Health -= damage;
        if (this.Health < 0)
            this.Health = 0;

        if (this.Health == 0) {
            if (this.ActionHandlerOnDie != null)
                this.ActionHandlerOnDie.execute(node);

            this.die(node, node.getAbsolutePosition(), 0);
        }

        else {
            if (this.ActionHandlerOnHit != null)
                this.ActionHandlerOnHit.execute(node);
        }
    }
        
    /**
     * @private
     */
    findActionByType(type) {
        var ret = null;

        if (this.ActionHandlerOnAttack) {
            ret = this.ActionHandlerOnAttack.findAction(type);
            if (ret)
                return ret;
        }

        if (this.ActionHandlerOnActivate) {
            ret = this.ActionHandlerOnActivate.findAction(type);
            if (ret)
                return ret;
        }

        if (this.ActionHandlerOnHit) {
            ret = this.ActionHandlerOnHit.findAction(type);
            if (ret)
                return ret;
        }

        if (this.ActionHandlerOnDie) {
            ret = this.ActionHandlerOnDie.findAction(type);
            if (ret)
                return ret;
        }

        return null;
    }
};
