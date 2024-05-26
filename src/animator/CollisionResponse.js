//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

import * as CL3D from "../main.js";

/**
 * Special scene node animator for doing automatic collision detection and response.<br/>
 * <br/>
 * This {@link SceneNode} animator can be attached to any single {@link SceneNode} and will then prevent it from moving
 * through specified collision geometry (e.g. walls and floors of the) world, as well as having it fall under 
 * gravity. This animator provides a simple implementation of first person shooter cameras. Attach it to a camera, 
 * and the camera will behave as the player control in a first person shooter game: The camera stops and slides at 
 * walls, walks up stairs, falls down if there is no floor under it, and so on.<br/>
 * <br/>
 * The animator will treat any change in the position of its target scene node as movement, including changing the .Pos attribute,
 * as movement. If you want to teleport the target scene node manually to a location without it being effected by 
 * collision geometry, then call reset() after changing the position of the node.<br/>
 * <br/>
 * The algorithm used here is a very fast but simple one. Sometimes, it is possible to get stuck in the geometry when moving.
 * To prevent this, always place the object at a position so that the yellow ellipsoid isn't colliding with a wall in the beginning,
 * so that it is not stuck. <br/>
 * If the object gets stuck during movement, then the problem might be the 3d collision mesh: One needs to be a bit careful 
 * when modelling the static geometry the object collides against. The geometry should be closed, and there should not be any 
 * one sided polygons sticking out anywhere, those are usually the places where one gets stuck. <br/>
 * Also, if the points of vertices which should be together are not exactly at the same point could cause problems.
 * If the used 3d modelling software supports a feature like 'Merge Points' to make neighbour vertices be exactly at the same place, it is
 * recommended to do this, it also usually helps.
 * @constructor
 * @public
 * @extends CL3D.Animator
 * @class Scene node animator making {@link CL3D.SceneNode}s move using autoamtic collision detection and response
 * @param {CL3D.Vect3d} radius 3d vector describing the radius of the scene node as ellipsoid.	
 * @param {CL3D.Vect3d} translation Set translation of the collision ellipsoid. By default, the ellipsoid for collision 
 * detection is created around the center of the scene node, which means that the ellipsoid surrounds it completely. 
 * If this is not what you want, you may specify a translation for the ellipsoid.
 * @param {CL3D.TriangleSelector} world Representing the world, the collision geometry, represented by a {@link TriangleSelector}.
 * @param {Number} slidingspeed (optional) A very small value, set to 0.0005 for example. This affects how the ellipsoid is moved 
 * when colliding with a wall. Affects movement smoothness and friction. If set to a too big value, this will also may cause the 
 * ellipsoid to be stuck.
 */
export class AnimatorCollisionResponse extends CL3D.Animator {
	constructor(radius, translation, world, slidingspeed) {
		super();

		this.Radius = radius;
		this.AffectedByGravity = true;
		this.Translation = translation;
		this.World = world;
		this.SlidingSpeed = slidingspeed;
		this.UseFixedSlidingSpeed = false;
		this.Node = null;
		this.LastAnimationTime = null;
		this.LastPosition = new CL3D.Vect3d(0, 0, 0);
		this.Falling = false;
		this.FallStartTime = 0;
		this.JumpForce = 0;
		this.UseInclination = false;

		if (this.Radius == null)
			this.Radius = new CL3D.Vect3d(30, 50, 30);
		if (this.Translation == null)
			this.Translation = new CL3D.Vect3d(0, 0, 0);
		if (this.SlidingSpeed == null)
			this.SlidingSpeed = 0.0005;

		this.reset();
	}

	/**
	 * Returns the type of the animator.
	 * For the AnimatorCollisionResponse, this will return 'collisionresponse'.
	 * @public
	 */
	getType() {
		return 'collisionresponse';
	}

	/**
	 * @private
	 */
	createClone(node, newManager, oldNodeId, newNodeId) {
		var a = new CL3D.AnimatorCollisionResponse();
		a.Radius = this.Radius.clone();
		a.AffectedByGravity = this.AffectedByGravity;
		a.Translation = this.Translation.clone();
		a.LastPosition = this.LastPosition.clone();
		a.UseInclination = this.UseInclination;
		a.World = this.World;
		return a;
	}

	/**
	 * Resets the collision system. Use this for example to make it possible to set a scene node postition
	 * while moving through walls: Simply change the position of the scene node and call reset() to this
	 * animator afterwards.
	 * @public
	 */
	reset() {
		this.Node = null;
		this.LastAnimationTime = CL3D.CLTimer.getTime();
	}

	/**
	 * Sets the triangle selector representing the world collision data
	 * @public
	 */
	setWorld(selector) {
		this.World = selector;
	}

	/**
	 * Returns the triangle selector representing the world collision data
	 * @public
	 */
	getWorld() {
		return this.World;
	}

	/**
	 * Returns if the scene node attached to this animator is currently falling
	 * @public
	 */
	isFalling() {
		return this.Falling;
	}

	/**
	 * Animates the scene node it is attached to and returns true if scene node was modified.
	 * @public
	 * @param {CL3D.SceneNode} n The Scene node which needs to be animated this frame.
	 * @param {Integer} timeMs The time in milliseconds since the start of the scene.
	 */
	animateNode(n, timeMs) {
		var difftime = (timeMs - this.LastAnimationTime);

		if (!this.World)
			return false;

		if (difftime > 150) difftime = 150;
		if (difftime == 0)
			return false;

		this.LastAnimationTime = timeMs;

		if (!(this.Node === n)) {
			this.Node = n;
			this.LastPosition = n.Pos.clone();
			return false;
		}

		var pos = n.Pos.clone();
		var vel = n.Pos.substract(this.LastPosition);

		var gravity = new CL3D.Vect3d(0.0, -0.1 * n.scene.Gravity, 0.0);
		if (!this.AffectedByGravity)
			gravity.Y = 0.0;

		var gravityPerFrame = gravity.multiplyWithScal(difftime);

		// calculate acceleration of gravity when falling
		if (!this.Falling) {
			gravityPerFrame.multiplyThisWithScal(0.001); // disable acceleration of gravity
		}

		else {
			var fact = ((timeMs - this.FallStartTime) / 1000.0);
			if (fact > 5) fact = 5;
			gravityPerFrame.multiplyThisWithScal(fact);
		}

		// jump
		if (this.JumpForce > 0) {
			vel.Y += (this.JumpForce * 0.001 * difftime);

			this.JumpForce -= difftime;
			if (this.JumpForce < 0) this.JumpForce = 0;
		}

		// now finally collide
		var force = vel.add(gravityPerFrame);

		if (!force.equalsZero()) {
			if (!this.UseFixedSlidingSpeed)
				this.SlidingSpeed = this.Radius.getLength() * 0.001; //0.000001;


			//this.SlidingSpeed = force.getLength() * 0.0001;
			var cam = null;
			if (n && n.getType() == 'camera')
				cam = n;

			var camvect;
			if (cam)
				camvect = cam.Target.substract(cam.Pos);

			var triangle = new CL3D.Triangle3d();
			var objFalling = new Object(); // used for passing the object falling value by reference
			objFalling.N = 0;

			this.World.setNodeToIgnore(n);

			pos = this.getCollisionResultPosition(
				this.World, this.LastPosition.substract(this.Translation), this.Radius, vel,
				triangle, objFalling, this.SlidingSpeed, gravityPerFrame);

			this.World.setNodeToIgnore(null);

			pos.addToThis(this.Translation);

			if (objFalling.N < 0.5) {
				this.Falling = false;
			}

			else {
				if (!this.Falling)
					this.FallStartTime = timeMs;

				this.Falling = true;
			}

			if (n.Pos.equals(pos)) {
				this.LastPosition = n.Pos.clone();
				return false;
			}

			n.Pos = pos.clone();

			// rotate object if inclination is enabled (for vehicles)
			if (this.UseInclination) {
				if (!this.Falling) {
					if (!(triangle.pointA.equalsZero() && triangle.pointB.equalsZero() && triangle.pointC.equalsZero())) {
						// rotate triangle with rotation of car 
						var rot = n.Rot.Y;
						var center = triangle.pointA.add(triangle.pointB).add(triangle.pointC);
						center.multiplyThisWithScal(1.0 / 3.0);

						triangle.pointA.X -= center.X;
						triangle.pointA.Z -= center.Z;
						triangle.pointB.X -= center.X;
						triangle.pointB.Z -= center.Z;
						triangle.pointC.X -= center.X;
						triangle.pointC.Z -= center.Z;

						triangle.pointA.rotateXZBy(rot);
						triangle.pointB.rotateXZBy(rot);
						triangle.pointC.rotateXZBy(rot);

						triangle.pointA.X += center.X;
						triangle.pointA.Z += center.Z;
						triangle.pointB.X += center.X;
						triangle.pointB.Z += center.Z;
						triangle.pointC.X += center.X;
						triangle.pointC.Z += center.Z;

						// get rotation of triangle normal
						var nrm = triangle.getNormal();
						var wantedRot = new CL3D.Vect3d();

						wantedRot.X = Math.atan2(nrm.Z, nrm.Y) * CL3D.RADTODEG;
						wantedRot.Y = n.Rot.Y;
						wantedRot.Z = -Math.atan2(nrm.X, nrm.Y) * CL3D.RADTODEG;

						n.Rot = wantedRot;
					}
				}
			}

			if (cam && camvect) {
				var bAnimateTarget = true;
				for (var i = 0; i < n.Animators.length; ++i) {
					var a = n.Animators[i];
					if (a && a.getType() == 'cameramodelviewer') {
						bAnimateTarget = false;
						break;
					}
				}

				if (bAnimateTarget)
					cam.Target = n.Pos.add(camvect);
			}
		}

		var changed = this.LastPosition.equals(n.Pos);
		this.LastPosition = n.Pos.clone();
		return false; // || this.Falling;
	}

	/**
	 * @private
	 */
	getCollisionResultPosition(selector, //:TriangleSelector,
		position, //:Vect3d, 
		radius, //:Vect3d, 
		velocity, //:Vect3d, 
		triout, //:Triangle3d, 
		outFalling, //:FloatRef, 
		slidingSpeed, //:Number,
		gravity) {
		if (!selector || radius.X == 0 || radius.Y == 0 || radius.Z == 0)
			return position;

		// now collide ellipsoid with world
		var colData = new Object(); //var colData:CollisionData = new CollisionData();
		colData.R3Position = position.clone();
		colData.R3Velocity = velocity.clone();
		colData.eRadius = radius.clone();
		colData.nearestDistance = 99999999.9; //FLT_MAX;
		colData.selector = selector;
		colData.slidingSpeed = slidingSpeed;
		colData.triangleHits = 0;
		colData.intersectionPoint = new CL3D.Vect3d();

		var eSpacePosition = colData.R3Position.divideThroughVect(colData.eRadius);
		var eSpaceVelocity = colData.R3Velocity.divideThroughVect(colData.eRadius);

		// iterate until we have our final position
		var finalPos = this.collideWithWorld(0, colData, eSpacePosition, eSpaceVelocity);
		outFalling.N = 0;

		// add gravity
		if (!gravity.equalsZero()) {
			colData.R3Position = finalPos.multiplyWithVect(colData.eRadius);
			colData.R3Velocity = gravity.clone();
			colData.triangleHits = 0;

			eSpaceVelocity = gravity.divideThroughVect(colData.eRadius);

			finalPos = this.collideWithWorld(0, colData, finalPos, eSpaceVelocity);

			outFalling.N = (colData.triangleHits == 0) ? 1 : 0;

			if (outFalling.N < 0.5 && colData.intersectionTriangle) {
				// collision thinks we are not falling because we collided with a poly.
				// now test if that poly has its normal vector up, so this is right.
				var normal = colData.intersectionTriangle.getNormal();
				normal.normalize();
				if (!(Math.abs(normal.Y) > Math.abs(normal.X) &&
					Math.abs(normal.Y) > Math.abs(normal.Z))) {
					outFalling.N = 1.0;
				}
			}
		}

		if (colData.triangleHits && triout != null) {
			// note: be careful to keep the reference and only overwrite the points
			// instead of triout = colData.intersectionTriangle; do this:
			triout.pointA = colData.intersectionTriangle.pointA.clone();
			triout.pointB = colData.intersectionTriangle.pointB.clone();
			triout.pointC = colData.intersectionTriangle.pointC.clone();

			triout.pointA.multiplyThisWithVect(colData.eRadius);
			triout.pointB.multiplyThisWithVect(colData.eRadius);
			triout.pointC.multiplyThisWithVect(colData.eRadius);
		}

		finalPos.multiplyThisWithVect(colData.eRadius);
		return finalPos;
	}

	/**
	 * @private
	 */
	collideWithWorld(recursionDepth, //:int,
		colData, //:CollisionData, 
		pos, //:Vect3d, 
		vel) {
		var veryCloseDistance = colData.slidingSpeed;

		// original collision detection code. will sometimes cause objects to get stuck.
		//if (recursionDepth > 5)
		//	return pos.clone();
		// new, sloppy collision detection, preventing getting stuck.		
		if (recursionDepth > 5) {
			var velshort = vel.clone();
			velshort.setLength(veryCloseDistance);
			return pos.add(velshort);
		}

		colData.velocity = vel.clone();
		colData.normalizedVelocity = vel.clone();
		colData.normalizedVelocity.normalize();
		colData.basePoint = pos.clone();
		colData.foundCollision = false;
		colData.nearestDistance = 99999999.9; //FLT_MAX;




		//------------------ collide with world
		// get all triangles with which we might collide
		var box = new CL3D.Box3d();
		colData.R3Position.copyTo(box.MinEdge);
		colData.R3Position.copyTo(box.MaxEdge);
		box.addInternalPointByVector(colData.R3Position.add(colData.R3Velocity));
		box.MinEdge.substractFromThis(colData.eRadius);
		box.MaxEdge.addToThis(colData.eRadius);

		var triangles = new Array();

		var scaleMatrix = new CL3D.Matrix4();
		scaleMatrix.setScaleXYZ(1.0 / colData.eRadius.X, 1.0 / colData.eRadius.Y, 1.0 / colData.eRadius.Z);

		colData.selector.getTrianglesInBox(box, scaleMatrix, triangles);

		for (var i = 0; i < triangles.length; ++i)
			this.testTriangleIntersection(colData, triangles[i]);

		//---------------- end collide with world
		if (!colData.foundCollision)
			return pos.add(vel);

		// original destination point
		var destinationPoint = pos.add(vel);
		var newBasePoint = pos.clone();

		// only update if we are not already very close
		// and if so only move very close to intersection, not to the
		// exact point
		if (colData.nearestDistance >= veryCloseDistance) {
			var v = vel.clone();
			v.setLength(colData.nearestDistance - veryCloseDistance);
			newBasePoint = colData.basePoint.add(v);

			v.normalize();
			colData.intersectionPoint.substractFromThis(v.multiplyWithScal(veryCloseDistance));
		}

		// calculate sliding plane
		var slidePlaneOrigin = colData.intersectionPoint.clone();
		var slidePlaneNormal = newBasePoint.substract(colData.intersectionPoint);
		slidePlaneNormal.normalize();
		var slidingPlane = new CL3D.Plane3d();
		slidingPlane.setPlane(slidePlaneOrigin, slidePlaneNormal);

		var newDestinationPoint = destinationPoint.substract(slidePlaneNormal.multiplyWithScal(slidingPlane.getDistanceTo(destinationPoint)));

		// generate slide vector
		var newVelocityVector = newDestinationPoint.substract(colData.intersectionPoint);

		if (newVelocityVector.getLength() < veryCloseDistance)
			return newBasePoint;

		return this.collideWithWorld(recursionDepth + 1, colData, newBasePoint, newVelocityVector);
	}

	/**
	 * @private
	 */
	testTriangleIntersection(colData, triangle) {
		var trianglePlane = triangle.getPlane();

		// only check front facing polygons
		if (!trianglePlane.isFrontFacing(colData.normalizedVelocity))
			return;

		// get interval of plane intersection
		var t1 = 0; //:Number;
		var t0 = 0; //:Number;
		var embeddedInPlane = false;
		var f = 0; //:Number;


		// calculate signed distance from sphere position to triangle plane
		var signedDistToTrianglePlane = trianglePlane.getDistanceTo(colData.basePoint);

		var normalDotVelocity = trianglePlane.Normal.dotProduct(colData.velocity);

		if (CL3D.iszero(normalDotVelocity)) {
			// sphere is traveling parallel to plane
			if (Math.abs(signedDistToTrianglePlane) >= 1.0)
				return; // no collision possible

			else {
				// sphere is embedded in plane
				embeddedInPlane = true;
				t0 = 0.0;
				t1 = 1.0;
			}
		}

		else {
			normalDotVelocity = 1.0 / normalDotVelocity;

			// N.D is not 0. Calculate intersection interval
			t0 = (-1.0 - signedDistToTrianglePlane) * normalDotVelocity;
			t1 = (1.0 - signedDistToTrianglePlane) * normalDotVelocity;

			// Swap so t0 < t1
			if (t0 > t1) {
				var tmp = t1;
				t1 = t0;
				t0 = tmp;
			}

			// check if at least one value is within the range
			if (t0 > 1.0 || t1 < 0.0)
				return; // both t values are outside 1 and 0, no collision possible


			// clamp to 0 and 1
			t0 = CL3D.clamp(t0, 0.0, 1.0);
			t1 = CL3D.clamp(t1, 0.0, 1.0);
		}

		// at this point we have t0 and t1, if there is any intersection, it
		// is between this interval
		var collisionPoint = new CL3D.Vect3d();
		var foundCollision = false;
		var t = 1.0;

		// first check the easy case: Collision within the triangle;
		// if this happens, it must be at t0 and this is when the sphere
		// rests on the front side of the triangle plane. This can only happen
		// if the sphere is not embedded in the triangle plane.
		if (!embeddedInPlane) {
			var planeIntersectionPoint = (colData.basePoint.substract(trianglePlane.Normal)).add(colData.velocity.multiplyWithScal(t0));

			if (triangle.isPointInsideFast(planeIntersectionPoint)) {
				foundCollision = true;
				t = t0;
				collisionPoint = planeIntersectionPoint.clone();
			}
		}

		// if we havent found a collision already we will have to sweep
		// the sphere against points and edges of the triangle. Note: A
		// collision inside the triangle will always happen before a
		// vertex or edge collision.
		if (!foundCollision) {
			var velocity = colData.velocity.clone();
			var base = colData.basePoint.clone();

			var velocitySqaredLength = velocity.getLengthSQ();
			var a = 0; //:Number;
			var b = 0; //:Number;
			var c = 0; //:Number;
			var newTObj = new Object();
			newTObj.N = 0;

			// for each edge or vertex a quadratic equation has to be solved:
			// a*t^2 + b*t + c = 0. We calculate a,b, and c for each test.
			// check against points
			a = velocitySqaredLength;

			// p1
			b = 2.0 * (velocity.dotProduct(base.substract(triangle.pointA)));
			c = (triangle.pointA.substract(base)).getLengthSQ() - 1.0;
			if (this.getLowestRoot(a, b, c, t, newTObj)) {
				t = newTObj.N;
				foundCollision = true;
				collisionPoint = triangle.pointA.clone();
			}

			// p2
			if (!foundCollision) {
				b = 2.0 * (velocity.dotProduct(base.substract(triangle.pointB)));
				c = (triangle.pointB.substract(base)).getLengthSQ() - 1.0;
				if (this.getLowestRoot(a, b, c, t, newTObj)) {
					t = newTObj.N;
					foundCollision = true;
					collisionPoint = triangle.pointB.clone();
				}
			}

			// p3
			if (!foundCollision) {
				b = 2.0 * (velocity.dotProduct(base.substract(triangle.pointC)));
				c = (triangle.pointC.substract(base)).getLengthSQ() - 1.0;
				if (this.getLowestRoot(a, b, c, t, newTObj)) {
					t = newTObj.N;
					foundCollision = true;
					collisionPoint = triangle.pointC.clone();
				}
			}

			// check against edges:
			// p1 --- p2
			var edge = triangle.pointB.substract(triangle.pointA);
			var baseToVertex = triangle.pointA.substract(base);
			var edgeSqaredLength = edge.getLengthSQ();
			var edgeDotVelocity = edge.dotProduct(velocity);
			var edgeDotBaseToVertex = edge.dotProduct(baseToVertex);

			// calculate parameters for equation
			a = edgeSqaredLength * -velocitySqaredLength +
				edgeDotVelocity * edgeDotVelocity;
			b = edgeSqaredLength * (2.0 * velocity.dotProduct(baseToVertex)) -
				2.0 * edgeDotVelocity * edgeDotBaseToVertex;
			c = edgeSqaredLength * (1.0 - baseToVertex.getLengthSQ()) +
				edgeDotBaseToVertex * edgeDotBaseToVertex;

			// does the swept sphere collide against infinite edge?
			if (this.getLowestRoot(a, b, c, t, newTObj)) {
				f = (edgeDotVelocity * newTObj.N - edgeDotBaseToVertex) / edgeSqaredLength;
				if (f >= 0.0 && f <= 1.0) {
					// intersection took place within segment
					t = newTObj.N;
					foundCollision = true;
					collisionPoint = triangle.pointA.add(edge.multiplyWithScal(f));
				}
			}

			// p2 --- p3
			edge = triangle.pointC.substract(triangle.pointB);
			baseToVertex = triangle.pointB.substract(base);
			edgeSqaredLength = edge.getLengthSQ();
			edgeDotVelocity = edge.dotProduct(velocity);
			edgeDotBaseToVertex = edge.dotProduct(baseToVertex);

			// calculate parameters for equation
			a = edgeSqaredLength * -velocitySqaredLength +
				edgeDotVelocity * edgeDotVelocity;
			b = edgeSqaredLength * (2.0 * velocity.dotProduct(baseToVertex)) -
				2.0 * edgeDotVelocity * edgeDotBaseToVertex;
			c = edgeSqaredLength * (1.0 - baseToVertex.getLengthSQ()) +
				edgeDotBaseToVertex * edgeDotBaseToVertex;

			// does the swept sphere collide against infinite edge?
			if (this.getLowestRoot(a, b, c, t, newTObj)) {
				f = (edgeDotVelocity * newTObj.N - edgeDotBaseToVertex) / edgeSqaredLength;
				if (f >= 0.0 && f <= 1.0) {
					// intersection took place within segment
					t = newTObj.N;
					foundCollision = true;
					collisionPoint = triangle.pointB.add(edge.multiplyWithScal(f));
				}
			}


			// p3 --- p1
			edge = triangle.pointA.substract(triangle.pointC);
			baseToVertex = triangle.pointC.substract(base);
			edgeSqaredLength = edge.getLengthSQ();
			edgeDotVelocity = edge.dotProduct(velocity);
			edgeDotBaseToVertex = edge.dotProduct(baseToVertex);

			// calculate parameters for equation
			a = edgeSqaredLength * -velocitySqaredLength +
				edgeDotVelocity * edgeDotVelocity;
			b = edgeSqaredLength * (2.0 * velocity.dotProduct(baseToVertex)) -
				2.0 * edgeDotVelocity * edgeDotBaseToVertex;
			c = edgeSqaredLength * (1.0 - baseToVertex.getLengthSQ()) +
				edgeDotBaseToVertex * edgeDotBaseToVertex;

			// does the swept sphere collide against infinite edge?
			if (this.getLowestRoot(a, b, c, t, newTObj)) {
				f = (edgeDotVelocity * newTObj.N - edgeDotBaseToVertex) / edgeSqaredLength;
				if (f >= 0.0 && f <= 1.0) {
					// intersection took place within segment
					t = newTObj.N;
					foundCollision = true;
					collisionPoint = triangle.pointC.add(edge.multiplyWithScal(f));
				}
			}
		} // end no collision found


		// set result:  
		if (foundCollision) {
			// distance to collision is t
			var distToCollision = t * colData.velocity.getLength();

			// does this triangle qualify for closest hit?
			if (!colData.foundCollision ||
				distToCollision < colData.nearestDistance) {
				colData.nearestDistance = distToCollision;
				colData.intersectionPoint = collisionPoint.clone();
				colData.foundCollision = true;
				colData.intersectionTriangle = triangle;
				++colData.triangleHits;
			}

		} // end found collision 
	}

	/**
	 * @private
	 */
	getLowestRoot(a, b, c, maxR, outRoot) {
		// check if solution exists
		var determinant = b * b - (4.0 * a * c);

		// if determinant is negative, no solution
		if (determinant < 0.0) return false;

		// calculate two roots: (if det==0 then x1==x2
		// but lets disregard that slight optimization)
		// burningwater: sqrt( 0) is an illegal operation.... smth should be done...
		var sqrtD = Math.sqrt(determinant);

		var r1 = (-b - sqrtD) / (2 * a);
		var r2 = (-b + sqrtD) / (2 * a);

		// sort so x1 <= x2
		if (r1 > r2) {
			var tmp = r2;
			r2 = r1;
			r1 = tmp;
		}

		// get lowest root
		if (r1 > 0 && r1 < maxR) {
			outRoot.N = r1;
			return true;
		}

		// its possible that we want x2, this can happen if x1 < 0
		if (r2 > 0 && r2 < maxR) {
			outRoot.N = r2;
			return true;
		}

		return false;
	}
	
	/**
	 * @private
	 */
	jump(jumpspeed) {
		if (this.JumpForce == 0)
			this.JumpForce = jumpspeed * 100;
	}
};
