//+ Nikolaus Gebhardt
// This file is part of the CopperLicht library, copyright by Nikolaus Gebhardt

/**
 * A class rendering a simple 3d cube, used for testing purposes.
 * Example showing how to add this to the current scene:
 * @constructor
 * @extends CL3D.MeshSceneNode 
 * @class A class rendering a simple cube of default size 10 with one material.
 * @param size Size of the cube, default this is 10.
 * @example
 * // add a cube to the scene
 * var cubenode = new CL3D.CubeSceneNode();
 * scene.getRootSceneNode().addChild(cubenode);
 *
 * // set material texture of the cube:
 * cubenode.getMaterial(0).Tex1 = 
 *    engine.getTextureManager().getTexture("crate_wood.jpg", true);
 */
CL3D.CubeSceneNode = function(sizex, sizey, sizez)
{
	if (sizex == null)
		sizex = 10;
	
	if (sizey == null)
		sizey = sizex;	
		
	if (sizez == null)
		sizez = sizey;		
		
	this.OwnedMesh = new CL3D.Mesh();
	var buf = new CL3D.MeshBuffer();
	
	var indices = [0,2,1,   0,3,2,   1,5,4,   1,2,5,   4,6,7,     4,5,6, 
                   7,3,0,   7,6,3,   9,5,2,   9,8,5,   0,11,10,   0,10,7]; 
	// front side
	
	
	this.OwnedMesh.AddMeshBuffer(buf);	
	
	var clr = CL3D.createColor(255,255,255,255);
	
	var vertices = new Array();
	
	vertices.push(this.createVertex(0,0,0, -1,-1,-1, clr, 0, 1));
	vertices.push(this.createVertex(1,0,0,  1,-1,-1, clr, 1, 1));
	vertices.push(this.createVertex(1,1,0,  1, 1,-1, clr, 1, 0));
	vertices.push(this.createVertex(0,1,0, -1, 1,-1, clr, 0, 0));
	vertices.push(this.createVertex(1,0,1,  1,-1, 1, clr, 0, 1));
	vertices.push(this.createVertex(1,1,1,  1, 1, 1, clr, 0, 0));
	vertices.push(this.createVertex(0,1,1, -1, 1, 1, clr, 1, 0));
	vertices.push(this.createVertex(0,0,1, -1,-1, 1, clr, 1, 1));
	vertices.push(this.createVertex(0,1,1, -1, 1, 1, clr, 0, 1));
	vertices.push(this.createVertex(0,1,0, -1, 1,-1, clr, 1, 1));
	vertices.push(this.createVertex(1,0,1,  1,-1, 1, clr, 1, 0));
	vertices.push(this.createVertex(1,0,0,  1,-1,-1, clr, 0, 0));
	
	for (var i=0; i<12; ++i)
	{
		var v = vertices[i].Pos;
		v.X *= sizex;
		v.Y *= sizey;
		v.Z *= sizez;
		v.X -= sizex * 0.5;
		v.Y -= sizey * 0.5;
		v.Z -= sizez * 0.5;
		
		vertices[i].Normal.normalize();
	}
	
	// duplicate so that vertices have correct normals
	
	if (true) 
	{	
		var outvertices = buf.Vertices;
		var outindices = buf.Indices;
		var plane = new CL3D.Plane3d();
		
		for (var i=0; i<indices.length; i += 3)
		{
			var cln1 = CL3D.cloneVertex3D(vertices[indices[i]]);
			var cln2 = CL3D.cloneVertex3D(vertices[indices[i+1]]);
			var cln3 = CL3D.cloneVertex3D(vertices[indices[i+2]]);
			
			plane.setPlaneFrom3Points(cln1.Pos, cln2.Pos, cln3.Pos);
			cln1.Normal = plane.Normal.clone();
			cln2.Normal = plane.Normal.clone();
			cln3.Normal = plane.Normal.clone();
			
			outvertices.push(cln1);
			outvertices.push(cln2);
			outvertices.push(cln3);
			
			buf.Indices.push(i);
			buf.Indices.push(i+1);
			buf.Indices.push(i+2);
		}
	}
	else
	{
		buf.Indices = indices;
		buf.Vertices = vertices;
	}
	
	// calculate box
	
	buf.recalculateBoundingBox();
	this.OwnedMesh.Box = buf.Box.clone();
	
	this.init();
}
CL3D.CubeSceneNode.prototype = new CL3D.MeshSceneNode();

/**
 * @private
 */
CL3D.CubeSceneNode.prototype.createVertex = function(x, y, z, nx, ny, nz, clr, s, t)
{
	var vtx = new CL3D.Vertex3D(true);
	vtx.Pos.X = x;
	vtx.Pos.Y = y;
	vtx.Pos.Z = z;
	vtx.Normal.X = nx;
	vtx.Normal.Y = ny;
	vtx.Normal.Z = nz;
	vtx.TCoords.X = s;
	vtx.TCoords.Y = t;
	return vtx;
}
	
/**
 * @private
 */
CL3D.CubeSceneNode.prototype.createClone = function(newparent, oldNodeId, newNodeId)
{
	var c = new CL3D.CubeSceneNode();
	this.cloneMembers(c, newparent, oldNodeId, newNodeId);
		
	c.OwnedMesh = this.OwnedMesh;
		
	c.ReadonlyMaterials = this.ReadonlyMaterials;
	c.DoesCollision = this.DoesCollision;
			
	if (this.Box)
		c.Box = this.Box.clone();
	
	return c;
}