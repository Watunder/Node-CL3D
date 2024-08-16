// ---------------------------------------------------------------------
// Action Shoot
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @public
 * @constructor
 * @class
 */
export class ActionShoot extends CL3D.Action {
	constructor() {
        super();

		this.ShootType = 0;
		this.Damage = 0;
		this.BulletSpeed = 0.0;
		this.SceneNodeToUseAsBullet = -1;
		this.WeaponRange = 100.0;
		this.Type = 'Shoot';
		this.SceneNodeToShootFrom = -1;
		this.ShootToCameraTarget = false;
		this.AdditionalDirectionRotation = null;
		this.ActionHandlerOnImpact = null;
		this.ShootDisplacement = new CL3D.Vect3d();
	}

	/**
	 * @public
	 */
	createClone(oldNodeId, newNodeId) {
		var a = new CL3D.ActionShoot();
		a.ShootType = this.ShootType;
		a.Damage = this.Damage;
		a.BulletSpeed = this.BulletSpeed;
		a.SceneNodeToUseAsBullet = this.SceneNodeToUseAsBullet;
		a.WeaponRange = this.WeaponRange;
		a.SceneNodeToShootFrom = this.SceneNodeToShootFrom;
		a.ShootToCameraTarget = this.ShootToCameraTarget;
		a.AdditionalDirectionRotation = this.AdditionalDirectionRotation;
		a.ActionHandlerOnImpact = this.ActionHandlerOnImpact ? this.ActionHandlerOnImpact.createClone(oldNodeId, newNodeId) : null;
		a.ShootDisplacement = this.ShootDisplacement.clone();

		if (a.SceneNodeToUseAsBullet == oldNodeId)
			a.SceneNodeToUseAsBullet = newNodeId;
		if (a.SceneNodeToShootFrom == oldNodeId)
			a.SceneNodeToShootFrom = newNodeId;

		return a;
	}

	/**
	 * @public
	 */
	execute(currentNode, sceneManager) {
		if (!currentNode || !sceneManager)
			return;

		// calculate ray, depending on how we were shot: If shot by an AI, use its target.
		// it not, use the active camera and shoot into the center of the screen.
		var ray = new CL3D.Line3d();
		var rayFound = false;
		var shooterNode = null;
		var cam = null; // temp variable, used multiple times below

		var ainodes = sceneManager.getAllSceneNodesWithAnimator('gameai');

		if (this.SceneNodeToShootFrom != -1) {
			var userSpecifiedNode = sceneManager.getSceneNodeFromId(this.SceneNodeToShootFrom);

			if (userSpecifiedNode != null) {
				rayFound = true;
				shooterNode = userSpecifiedNode;

				// ray.Start = userSpecifiedNode.getTransformedBoundingBox().getCenter();
				ray.Start = userSpecifiedNode.getBoundingBox().getCenter();
				ray.Start.addToThis(this.ShootDisplacement);
				userSpecifiedNode.AbsoluteTransformation.transformVect(ray.Start);

				cam = sceneManager.getActiveCamera();

				if (this.ShootToCameraTarget && cam) {
					// in order to shoot to the camera target, we need to collide the camera with the world and
					// all AIs to test were to shoot at
					var lookLine = new CL3D.Line3d();
					lookLine.Start = cam.getAbsolutePosition();
					lookLine.End = cam.getTarget();
					var lineVct = lookLine.getVector();
					lineVct.setLength(this.WeaponRange);
					lookLine.End = lookLine.Start.add(lineVct);

					this.shortenRayToClosestCollisionPointWithWorld(lookLine, ainodes, this.WeaponRange, sceneManager);
					this.shortenRayToClosestCollisionPointWithAIAnimator(lookLine, ainodes, this.WeaponRange, shooterNode, sceneManager);

					// now simply shoot from shooter node center to ray end
					ray.End = lookLine.End;
				}

				else {
					// set ray end based on rotation of scene node and add AdditionalDirectionRotation
					var matrot = userSpecifiedNode.AbsoluteTransformation;

					if (this.AdditionalDirectionRotation) {
						var matrot2 = new CL3D.Matrix4();
						matrot2.setRotationDegrees(this.AdditionalDirectionRotation);
						matrot = matrot.multiply(matrot2);
					}

					ray.End.set(1, 0, 0);
					matrot.rotateVect(ray.End);
					ray.End.addToThis(ray.Start);
				}
			}
		}

		else if (currentNode != null) {
			shooterNode = currentNode;

			var shootingAI = currentNode.getAnimatorOfType('gameai');
			if (shootingAI && shootingAI.isCurrentlyShooting()) {
				ray = shootingAI.getCurrentlyShootingLine();
				rayFound = true;
			}
		}

		if (!rayFound) {
			cam = sceneManager.getActiveCamera();
			if (cam) {
				shooterNode = cam;
				ray.Start = cam.getAbsolutePosition();
				ray.End = cam.getTarget();
				rayFound = true;
			}
		}

		if (!rayFound)
			return; // no current node?



		// normalize ray to weapon range
		var vect = ray.getVector();
		vect.setLength(this.WeaponRange);
		ray.End = ray.Start.add(vect);

		// get all game ai nodes and get the world from them, to
		// shorten the shoot distance again until the nearest wall
		this.shortenRayToClosestCollisionPointWithWorld(ray, ainodes, this.WeaponRange, sceneManager);

		// decide if we do a bullet or direct shot
		if (this.ShootType == 1) //ESIT_BULLET)
		{
			var bulletTemplate = null;

			if (this.SceneNodeToUseAsBullet != -1)
				bulletTemplate = sceneManager.getSceneNodeFromId(this.SceneNodeToUseAsBullet);

			if (bulletTemplate) {
				// create bullet now
				var cloned = bulletTemplate.createClone(sceneManager.getRootSceneNode(), -1, -1);
				sceneManager.getRootSceneNode().addChild(cloned);

				if (cloned != null) {
					cloned.Pos = ray.Start;
					cloned.updateAbsolutePosition();
					cloned.Visible = true;
					cloned.Id = -1;
					cloned.Name = "";

					// rotate to target
					var rotvect = ray.getVector();
					rotvect = rotvect.getHorizontalAngle();
					cloned.Rot = rotvect;

					// move to target
					var speed = this.BulletSpeed;
					if (speed == 0) speed = 1.0;

					var anim = new CL3D.AnimatorFlyStraight();
					anim.Start = ray.Start;
					anim.End = ray.End;
					anim.TimeForWay = ray.getLength() / speed;
					anim.DeleteMeAfterEndReached = true;
					anim.recalculateImidiateValues();

					anim.TestShootCollisionWithBullet = true;
					anim.ShootCollisionNodeToIgnore = shooterNode; //currentNode;
					anim.ShootCollisionDamage = this.Damage;
					anim.DeleteSceneNodeAfterEndReached = true;
					anim.ActionToExecuteOnEnd = this.ActionHandlerOnImpact;
					anim.ExecuteActionOnEndOnlyIfTimeSmallerThen = this.WeaponRange / speed;

					cloned.addAnimator(anim);
				}
			}
		}

		else if (this.ShootType == 0) //EST_DIRECT)
		{
			// directly hit the target instead of creating a bullet
			// only check the nearest collision point with all the nodes
			// and take the nearest hit node as target
			var bestDistance = this.WeaponRange;
			var bestHitNode = this.shortenRayToClosestCollisionPointWithAIAnimator(ray, ainodes, this.WeaponRange, shooterNode, sceneManager);

			if (bestHitNode != null) {
				sceneManager.LastBulletImpactPosition = ray.End.clone();

				// finally found a node to hit. Hit it.
				var targetanimAi = bestHitNode.getAnimatorOfType('gameai');

				if (targetanimAi)
					targetanimAi.OnHit(this.Damage, bestHitNode);
			}

		} // end direct shot
	}

	/**
	 * @public
	 */
	shortenRayToClosestCollisionPointWithWorld(ray, ainodes, maxLen, sceneManager) {
		if (ainodes.length != 0) {
			// find world to test against collision so we do not need to do this with every
			// single node, to improve performance
			var animAi = ainodes[0].getAnimatorOfType('gameai');
			if (animAi) {
				var world = animAi.World;
				if (world) {
					var len = CL3D.AnimatorOnClick.prototype.static_getDistanceToNearestCollisionPointWithWorld(sceneManager, ray.Start, ray.End, world, true);

					if (len < maxLen) {
						// shorten our ray because it collides with a world wall
						var vect2 = ray.getVector();
						vect2.setLength(len);
						ray.End = ray.Start.add(vect2);
					}
				}
			}
		}
	}

	/**
	 * @public
	 */
	shortenRayToClosestCollisionPointWithAIAnimator(ray, ainodes, maxLen, toIgnore, sceneManager) {
		var bestDistance = maxLen;
		var bestHitNode = null;

		for (var i = 0; i < ainodes.length; ++i) {
			if (ainodes[i] === toIgnore) // don't collide against myself
				continue;

			var enemyAI = ainodes[i].getAnimatorOfType('gameai');

			if (enemyAI && !enemyAI.isAlive()) // don't test collision against dead items
				continue;

			var collisionDistance = new Object();
			collisionDistance.N = 0;
			if (CL3D.AnimatorOnClick.prototype.static_getCollisionDistanceWithNode(sceneManager, ainodes[i], ray, false,
				false, null, collisionDistance)) {
				if (collisionDistance.N < bestDistance) {
					bestDistance = collisionDistance.N;
					bestHitNode = ainodes[i];
				}
			}
		}

		if (bestHitNode) {
			var vect2 = ray.getVector();
			vect2.setLength(bestDistance);
			ray.End = ray.Start.add(vect2);
		}

		return bestHitNode;
	}

	/**
	 * @public
	 * @constructor
	 * @class
	 */
	getWeaponRange() {
		return this.WeaponRange;
	}
};
