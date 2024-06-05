import * as CL3D from "../main.js";

export class FlaceLoader {
	constructor () {
		this.Data = this.Document = null;
		this.Filename = "";
		this.NextTagPos = 0;
		this.CursorControl = this.TheTextureManager = null;
		this.PathRoot = "";
		this.StoredFileContent = this.TheMeshCache = null;
		this.LoadedAReloadAction = false;

		this.trailingUTF8Bytes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5];
	}

	ArrayBufferToString(a)
	{
		var b = "";
		a = new Uint8Array(a);
		for(var c = 0; c < a.byteLength; c++) b += String.fromCharCode(a[c]);
		return b
	}

	async loadFile(a, b, c, e, f, g, h)
	{
		this.CopyRootNodeChildren = g;
		this.NewRootNodeChildrenParent = h;

		this.Filename = b;
		this.TheTextureManager = c;
		this.CursorControl = f;
		this.TheMeshCache = e;
		this.TheTextureManager != null && CL3D.ScriptingInterface.getScriptingInterface().setTextureManager(c);
		if(a != null && b.indexOf(".ccbz") != -1) a = this.ArrayBufferToString(a);
		if(a == null || a.length == 0)
		{
			console.log("Error: Could not load file '" + b + "'");
			a = navigator.appVersion;
			a != null && a.indexOf("Chrome") != -1 && console.log("<i>For using local files with Chrome, run the file from a web server<br/>Or use Firefox instead. Or run it from CopperCube.</i>", true);
			return null
		}
		if(b.indexOf(".ccbz") != -1) a = JSInflate.inflate(a);
		else if(b.indexOf(".ccbjs") != -1) a = CL3D.base64decode(a);
		this.Document = b = new CL3D.CCDocument;
		this.setRootPath();
		this.Data = new CL3D.BinaryStream(a);
		if(!await this.parseFile()) return null;
		this.StoredFileContent = a;
		return b
	}

	setRootPath()
	{
		var a = this.Filename,
			b = a.lastIndexOf("/");
		if(b == -1)
			b = a.lastIndexOf("\\");
		if(b != -1) a = a.substring(0, b + 1);
		this.PathRoot = a
	}

	async parseFile()
	{
		if(this.Data.readSI32() != 1701014630) return false;
		this.Data.readSI32();
		this.Data.readUI32();
		for(var a = 0; this.Data.bytesAvailable() > 0;)
		{
			var b = this.readTag();
			++a;
			if(a == 1 && b != 1) return false;
			switch (b)
			{
				case 1:
					if (this.CopyRootNodeChildren)
					{
						this.readDocument2();
					}
					else
					{
						this.readDocument();
					}
					break;
				case 12:
					await this.readEmbeddedFiles();
					break;
				default:
					this.SkipToNextTag()
			}
		}
		return true
	}

	SkipToNextTag()
	{
		this.Data.seek(this.NextTagPos, true)
	}

	readTag()
	{
		var a = 0;
		a = this.Data.readUnsignedShort();
		var b = 0;
		this.CurrentTagSize = b = this.Data.readUnsignedInt();
		this.NextTagPos = this.Data.getPosition() + b;
		return a
	}

	ReadMatrix()
	{
		var a = new CL3D.Matrix4(false);
		this.ReadIntoExistingMatrix(a);
		return a
	}

	ReadIntoExistingMatrix(a)
	{
		for(var b = 0; b < 16; ++b) a.setByIndex(b, this.Data.readFloat())
	}

	ReadQuaternion()
	{
		var a = new CL3D.Quaternion;
		a.W = this.Data.readFloat();
		a.X = this.Data.readFloat();
		a.Y = this.Data.readFloat();
		a.Z = this.Data.readFloat();
		return a
	}

	readUTFBytes(a)
	{
		for(var b = 0,
			c = [], e = [0, 12416, 925824, 63447168, 4194836608, 2181570688], f = [], g = 0; g < a; ++g) f.push(this.Data.readNumber(1));
		for(; b < a;)
		{
			g = 0;
			var i = this.trailingUTF8Bytes[f[b]];
			if(b + i >= a) return c.join("");
			for(var h = i; h >= 0; --h)
			{
				g += f[b];
				++b;
				if(h != 0) g <<= 6
			}
			if(b > a) break;
			g -= e[i];
			if(g < 1114111) c.push(this.fixedFromCharCode(g));
			else return c.join("")
		}
		return c.join("")
	}

	ReadString()
	{
		var a = this.Data.readUnsignedInt();
		if(a > 104857600) return "";
		if(a <= 0) return "";
		return this.readUTFBytes(a)
	}

	fixedFromCharCode(a)
	{
		if(a > 65535)
		{
			a -= 65536;
			return String.fromCharCode(55296 + (a >> 10), 56320 + (a & 1023))
		}
		else return String.fromCharCode(a)
	}

	readDocument()
	{
		for(var a = this.NextTagPos; this.Data.bytesAvailable() > 0 && this.Data.getPosition() < a;) switch (this.readTag())
		{
			case 1004:
				this.Document.CurrentScene = this.Data.readInt();
				break;
			case 20:
				this.readPublishSettings();
				break;
			case 2:
				var b = null;
				switch (this.Data.readInt())
				{
					case 0:
						b = new CL3D.Free3dScene;
						this.readFreeScene(b);
						break;
					case 1:
						/// TODO
						break;
					default:
						this.SkipToNextTag()
				}
				this.Document.addScene(b);
				break;
			default:
				this.SkipToNextTag()
		}
	}

	readDocument2()
	{
		for(var a = this.NextTagPos; this.Data.bytesAvailable() > 0 && this.Data.getPosition() < a;) switch (this.readTag())
		{
			case 2:
				var b = null;
				switch (this.Data.readInt())
				{
					case 0:
						b = {}; //temp
						b.CurrentScene = CL3D.gDocument.getCurrentScene();
						b.getRootSceneNode = function(){return b.CurrentScene.RootNode};
						b.registerSceneNodeAnimatorForEvents = b.CurrentScene.registerSceneNodeAnimatorForEvents;
						b.RegisteredSceneNodeAnimatorsForEventsList = b.CurrentScene.RegisteredSceneNodeAnimatorsForEventsList;
						b.RootNode = null;
						this.readFreeScene2(b);
						break;
					default:
						this.SkipToNextTag()
				}
				this.Document.addScene(b);
				break;
			default:
				this.SkipToNextTag()
		}
	}

	reloadScene(a, b, c, e, f, g, i)
	{
		this.Filename = e;
		this.TheTextureManager = f;
		this.CursorControl = i;
		this.TheMeshCache = g;
		this.Data = new CL3D.BinaryStream(a);
		this.setRootPath();
		this.Data.readSI32();
		this.Data.readSI32();
		this.Data.readUI32();
		a = -1;
		e = this.readTag();
		if(e != 1) return null;
		for(b = this.NextTagPos; this.Data.bytesAvailable() > 0 && this.Data.getPosition() < b;)
		{
			e = this.readTag();
			switch (e)
			{
				case 2:
					e = this.Data.readInt();
					++a;
					if(a == c)
					{
						c = null;
						switch (e)
						{
							case 0:
								c = new CL3D.Free3dScene;
								this.readFreeScene(c);
								break;
							case 1:
								/// TODO
								break;
							default:
								this.SkipToNextTag()
						}
						return c
					}
					else this.SkipToNextTag();
				default:
					this.SkipToNextTag()
			}
		}
		return null
	}

	readPublishSettings()
	{
		this.Data.readInt();
		this.Document.ApplicationTitle = this.ReadString();
		for(var a = this.NextTagPos; this.Data.bytesAvailable() > 0 && this.Data.getPosition() < a;) switch (this.readTag())
		{
			case 35:
				this.Data.readInt();
				this.Data.readInt();
				this.Data.readInt();
				this.Data.readInt();
				var b = this.Data.readInt();
				if((b & 1) != 0) this.Document.WaitUntilTexturesLoaded = true;
				if((b & 16) != 0) console.log(CL3D.Global_PostEffectsDisabled, " = true")
				this.SkipToNextTag();
				break;
			case 37:
				b = this.Data.readInt();
				this.Data.readInt();
				if((b & 1) != 0)
					if(CL3D.gCCDebugInfoEnabled) console.log(CL3D.gCCDebugInfoEnabled, " = true");
				if((b & 2) != 0)
				{
					this.Data.readInt();
					this.ReadString()
				}(b & 4) != 0 && this.ReadString();
				break;
			default:
				this.SkipToNextTag()
		}
	}

	readFreeScene(a)
	{
		var b = this.NextTagPos;
		for(this.readScene(a); this.Data.bytesAvailable() > 0 && this.Data.getPosition() < b;) switch (this.readTag())
		{
			case 1007:
				a.DefaultCameraPos = this.Read3DVectF();
				a.DefaultCameraTarget = this.Read3DVectF();
				break;
			case 8:
				this.ReadSceneGraph(a);
				break;
			case 1008:
				a.Gravity = this.Data.readFloat();
				break;
			case 1009:
				a.FogEnabled = this.Data.readBoolean();
				a.FogDensity = this.Data.readFloat();
				a.FogColor = this.Data.readInt();
				break;
			case 1010:
				this.Data.readBoolean();
				a.WindSpeed = this.Data.readFloat();
				a.WindStrength = this.Data.readFloat();
				break;
			case 1011:
				a.ShadowMappingEnabled = this.Data.readBoolean();
				a.ShadowMapBias1 = this.Data.readFloat();
				a.ShadowMapBias2 = this.Data.readFloat();
				a.ShadowMapBackfaceBias = this.Data.readFloat();
				a.ShadowMapOpacity = this.Data.readFloat();
				a.ShadowMapCameraViewDetailFactor = this.Data.readFloat();
				break;
			case 1012:
				if (this.CopyRootNodeChildren)
				{
					this.SkipToNextTag();
				}
				else
				{
					for(var c = 0; c < 6; ++c) a.PostEffectData[c].Active = this.Data.readBoolean();
					a.PE_bloomBlurIterations = this.Data.readInt();
					a.PE_bloomTreshold = this.Data.readFloat();
					a.PE_blurIterations = this.Data.readInt();
					a.PE_colorizeColor = this.Data.readInt();
					a.PE_vignetteIntensity = this.Data.readFloat();
					a.PE_vignetteRadiusA = this.Data.readFloat();
					a.PE_vignetteRadiusB = this.Data.readFloat();
				}
				break;
			default:
				this.SkipToNextTag()
		}
	}

	readFreeScene2(a)
	{
		var b = this.NextTagPos;
		for(this.readScene(a); this.Data.bytesAvailable() > 0 && this.Data.getPosition() < b;) switch (this.readTag())
		{
			case 8:
				this.ReadSceneGraph(a);
				break;
			default:
				this.SkipToNextTag()
		}
	}

	Read3DVectF()
	{
		var a = new CL3D.Vect3d;
		a.X = this.Data.readFloat();
		a.Y = this.Data.readFloat();
		a.Z = this.Data.readFloat();
		return a
	}

	ReadColorF()
	{
		var a = new CL3D.ColorF;
		a.R = this.Data.readFloat();
		a.G = this.Data.readFloat();
		a.B = this.Data.readFloat();
		a.A = this.Data.readFloat();
		return a
	}

	ReadColorFAsInt()
	{
		var a = this.Data.readFloat(),
			b = this.Data.readFloat(),
			c = this.Data.readFloat(),
			e = this.Data.readFloat();
		if(a > 1) a = 1;
		if(b > 1) b = 1;
		if(c > 1) c = 1;
		if(e > 1) e = 1;
		return CL3D.createColor(e * 255, a * 255, b * 255, c * 255)
	}

	Read2DVectF()
	{
		var a = new CL3D.Vect2d;
		a.X = this.Data.readFloat();
		a.Y = this.Data.readFloat();
		return a
	}

	Read3DBoxF()
	{
		var a = new CL3D.Box3d;
		a.MinEdge = this.Read3DVectF();
		a.MaxEdge = this.Read3DVectF();
		return a
	}

	readScene(a)
	{
		if(this.readTag() == 26)
		{
			if (this.CopyRootNodeChildren)
			{
				a.Name = this.ReadString();
				var folder = new CL3D.DummyTransformationSceneNode();
				folder.Name = a.Name;
				//folder.Visible = false;
				this.NewRootNodeChildrenParent.addChild(folder);
				a.RootNode = folder;
				this.SkipToNextTag();
			}
			else
			{
				a.Name = this.ReadString();
				a.BackgroundColor = this.Data.readInt()
			}
		}
		else this.JumpBackFromTagReading()
	}

	JumpBackFromTagReading()
	{
		this.Data.position -= 10
	}

	ReadSceneGraph(a)
	{
		for(var b = this.NextTagPos; this.Data.bytesAvailable() > 0 && this.Data.getPosition() < b;) switch (this.readTag())
		{
			case 9:
				this.ReadSceneNode(a, a.RootNode, 0);
				break;
			default:
				this.SkipToNextTag()
		}
	}

	ReadSceneNode(a, b, c)
	{
		if(b != null)
		{
			var e = this.NextTagPos,
				f = this.Data.readInt(),
				g = this.Data.readInt(),
				i = this.ReadString(),
				h = this.Read3DVectF(),
				j = this.Read3DVectF(),
				m = this.Read3DVectF(),
				k = this.Data.readBoolean(),
				l = this.Data.readInt(),
				d = null,
				o = 0;
			if(c == 0)
			{
				if (!this.CopyRootNodeChildren)
				{
					b.Visible = k;
					b.Name = i;
					b.Culling = l
				}
			}
			for(; this.Data.bytesAvailable() > 0 && this.Data.getPosition() < e;) switch (this.readTag())
			{
				case 9:
					this.ReadSceneNode(a, d ? d : b, c + 1);
					break;
				case 10:
					switch (f)
					{
						case 2037085030:
							d = new CL3D.SkyBoxSceneNode;
							d.Type = f;
							d.Pos = h;
							d.Rot = j;
							d.Scale = m;
							d.Visible = k;
							d.Name = i;
							d.Culling = l;
							d.Id = g;
							d.scene = a;
							this.readFlaceMeshNode(d);
							b.addChild(d);
							d = d;
							d.updateAbsolutePosition();
							break;
						case 1752395110:
							d = new CL3D.MeshSceneNode;
							d.Type = f;
							d.Pos = h;
							d.Rot = j;
							d.Scale = m;
							d.Visible = k;
							d.Name = i;
							d.Culling = l;
							d.Id = g;
							d.scene = a;
							this.readFlaceMeshNode(d);
							b.addChild(d);
							d = d;
							d.updateAbsolutePosition();
							break;
						case 1835950438:
							d = new CL3D.AnimatedMeshSceneNode;
							d.Type = f;
							d.Pos = h;
							d.Rot = j;
							d.Scale = m;
							d.Visible = k;
							d.Name = i;
							d.Culling = l;
							d.Id = g;
							d.scene = a;
							this.readFlaceAnimatedMeshNode(d);
							b.addChild(d);
							d = d;
							d.updateAbsolutePosition();
							break;
						case 1953526632:
							d = new CL3D.HotspotSceneNode(this.CursorControl, null);
							d.Type = f;
							d.Pos = h;
							d.Rot = j;
							d.Scale = m;
							d.Visible = k;
							d.Name = i;
							d.Culling = l;
							d.Id = g;
							d.scene = a;
							this.readFlaceHotspotNode(d);
							b.addChild(d);
							d = d;
							d.updateAbsolutePosition();
							break;
						case 1819042406:
							d = new CL3D.BillboardSceneNode;
							d.Type = f;
							d.Pos = h;
							d.Rot = j;
							d.Scale = m;
							d.Visible = k;
							d.Name = i;
							d.Culling = l;
							d.Id = g;
							d.scene = a;
							this.readFlaceBillBoardNode(d);
							b.addChild(d);
							d = d;
							d.updateAbsolutePosition();
							break;
						case 1835098982:
							d = new CL3D.CameraSceneNode;
							d.Type = f;
							d.Pos = h;
							d.Rot = j;
							d.Scale = m;
							d.Visible = k;
							d.Name = i;
							d.Culling = l;
							d.scene = a;
							d.Id = g;
							this.readFlaceCameraNode(d);
							b.addChild(d);
							d = d;
							d.updateAbsolutePosition();
							break;
						case 1751608422:
							d = new CL3D.LightSceneNode;
							d.Type = f;
							d.Pos = h;
							d.Rot = j;
							d.Scale = m;
							d.Visible = k;
							d.Name = i;
							d.Culling = l;
							d.Id = g;
							d.scene = a;
							this.readFlaceLightNode(d);
							b.addChild(d);
							d = d;
							d.updateAbsolutePosition();
							break;
						case 1935946598:
							d = new CL3D.SoundSceneNode;
							d.Type = f;
							d.Pos = h;
							d.Rot = j;
							d.Scale = m;
							d.Visible = k;
							d.Name = i;
							d.Culling = l;
							d.Id = g;
							d.scene = a;
							this.readFlace3DSoundNode(d);
							b.addChild(d);
							d = d;
							d.updateAbsolutePosition();
							break;
						case 1752461414:
							d = new CL3D.PathSceneNode;
							d.Type = f;
							d.Pos = h;
							d.Rot = j;
							d.Scale = m;
							d.Visible = k;
							d.Name = i;
							d.Culling = l;
							d.Id = g;
							d.scene = a;
							this.readFlacePathNode(d);
							b.addChild(d);
							d = d;
							d.updateAbsolutePosition();
							break;
						case 1954112614:
							d = new CL3D.DummyTransformationSceneNode;
							d.Type = f;
							d.Pos = h;
							d.Rot = j;
							d.Scale = m;
							d.Visible = k;
							d.Name = i;
							d.Culling = l;
							d.Id = g;
							d.scene = a;
							d.Box = this.Read3DBoxF();
							for(var n = 0; n < 16; ++n) d.RelativeTransformationMatrix.setByIndex(n, this.Data.readFloat());
							b.addChild(d);
							d = d;
							d.updateAbsolutePosition();
							break;
						case 1868837478:
							d = new CL3D.Overlay2DSceneNode(this.CursorControl);
							d.Type = f;
							d.Pos = h;
							d.Rot = j;
							d.Scale = m;
							d.Visible = k;
							d.Name = i;
							d.Culling = l;
							d.Id = g;
							d.scene = a;
							this.readFlace2DOverlay(d);
							b.addChild(d);
							d = d;
							d.updateAbsolutePosition();
							break;
						case 1668575334:
							d = new CL3D.ParticleSystemSceneNode;
							d.Type = f;
							d.Pos = h;
							d.Rot = j;
							d.Scale = m;
							d.Visible = k;
							d.Name = i;
							d.Culling = l;
							d.Id = g;
							d.scene = a;
							this.readParticleSystemSceneNode(d);
							b.addChild(d);
							d = d;
							d.updateAbsolutePosition();
							break;
						case 1835283046:
							d = new CL3D.Mobile2DInputSceneNode(this.CursorControl, a);
							d.Type = f;
							d.Pos = h;
							d.Rot = j;
							d.Scale = m;
							d.Visible = k;
							d.Name = i;
							d.Culling = l;
							d.Id = g;
							d.scene = a;
							this.readFlace2DMobileInput(d);
							b.addChild(d);
							d = d;
							d.updateAbsolutePosition();
							break;
						case 1920103526:
							d = new CL3D.TerrainSceneNode;
							d.Type = f;
							d.Pos = h;
							d.Rot = j;
							d.Scale = m;
							d.Visible = k;
							d.Name = i;
							d.Culling = l;
							d.Id = g;
							d.scene = a;
							d.Box = this.Read3DBoxF();
							b.addChild(d);
							d = d;
							d.updateAbsolutePosition();
							this.SkipToNextTag();
							break;
						case 1920235366:
							d = new CL3D.WaterSurfaceSceneNode;
							d.Type = f;
							d.Pos = h;
							d.Rot = j;
							d.Scale = m;
							d.Visible = k;
							d.Name = i;
							d.Culling = l;
							d.Id = g;
							d.scene = a;
							this.readWaterNode(d);
							b.addChild(d);
							d = d;
							d.updateAbsolutePosition();
							break;
						default:
							if(c == 0 && !this.CopyRootNodeChildren) a.AmbientLight = this.ReadColorF();
							this.SkipToNextTag();
							break
					}
					break;
				case 11:
					n = this.ReadMaterial();
					d && d.getMaterial(o) && d.getMaterial(o).setFrom(n);
					++o;
					break;
				case 25:
					n = d;
					if(n == null && c == 0) n = a.getRootSceneNode();
					this.ReadAnimator(n, a);
					break;
				default:
					this.SkipToNextTag()
			}
			d && d.onDeserializedWithChildren()
		}
	}

	readFlaceMeshNode(a)
	{
		var b = this.NextTagPos;
		a.Box = this.Read3DBoxF();
		this.Data.readBoolean();
		a.ReceivesStaticShadows = this.Data.readBoolean();
		a.DoesCollision = this.Data.readBoolean();
		for(a.OccludesLight = this.Data.readBoolean(); this.Data.bytesAvailable() > 0 && this.Data.getPosition() < b;) switch (this.readTag())
		{
			case 14:
				var c = this.ReadMesh();
				a.OwnedMesh = c;
				break;
			default:
				this.SkipToNextTag()
		}
	}

	ReadMesh()
	{
		var a = new CL3D.Mesh;
		a.Box = this.Read3DBoxF();
		for(var b = this.NextTagPos; this.Data.bytesAvailable() > 0 && this.Data.getPosition() < b;) switch (this.readTag())
		{
			case 15:
				var c = this.ReadMeshBuffer();
				c != null && a.AddMeshBuffer(c);
				break;
			default:
				this.SkipToNextTag()
		}
		return a
	}

	ReadMeshBuffer()
	{
		var a = new CL3D.MeshBuffer;
		a.Box = this.Read3DBoxF();
		for(var b = this.NextTagPos; this.Data.bytesAvailable() > 0 && this.Data.getPosition() < b;) switch (this.readTag())
		{
			case 11:
				a.Mat = this.ReadMaterial();
				break;
			case 16:
				for(var c = Math.floor(this.CurrentTagSize / 2), e = 0; e < c; ++e) a.Indices.push(this.Data.readShort());
				break;
			case 17:
				c = Math.floor(this.CurrentTagSize / 36);
				for(e = 0; e < c; ++e)
				{
					var f = new CL3D.Vertex3D;
					f.Pos = this.Read3DVectF();
					f.Normal = this.Read3DVectF();
					f.Color = this.Data.readInt();
					f.TCoords = this.Read2DVectF();
					f.TCoords2 = new CL3D.Vect2d;
					a.Vertices.push(f)
				}
				break;
			case 18:
				c = Math.floor(this.CurrentTagSize / 44);
				for(e = 0; e < c; ++e)
				{
					f = new CL3D.Vertex3D;
					f.Pos = this.Read3DVectF();
					f.Normal = this.Read3DVectF();
					f.Color = this.Data.readInt();
					f.TCoords = this.Read2DVectF();
					f.TCoords2 = this.Read2DVectF();
					a.Vertices.push(f)
				}
				break;
			case 19:
				c = this.CurrentTagSize / 60;
				a.Tangents = [];
				a.Binormals = [];
				for(e = 0; e < c; ++e)
				{
					f = new CL3D.Vertex3D;
					f.Pos = this.Read3DVectF();
					f.Normal = this.Read3DVectF();
					f.Color = this.Data.readInt();
					f.TCoords = this.Read2DVectF();
					f.TCoords2 = new CL3D.Vect2d;
					a.Tangents.push(this.Read3DVectF());
					a.Binormals.push(this.Read3DVectF());
					a.Vertices.push(f)
				}
				break;
			default:
				this.SkipToNextTag()
		}
		return a
	}

	ReadMaterial()
	{
		var a = new CL3D.Material;
		a.Type = this.Data.readInt();
		this.Data.readInt();
		this.Data.readInt();
		this.Data.readInt();
		this.Data.readInt();
		this.Data.readFloat();
		this.Data.readInt();
		this.Data.readInt();
		this.Data.readBoolean();
		this.Data.readBoolean();
		a.Lighting = this.Data.readBoolean();
		a.ZWriteEnabled = this.Data.readBoolean();
		this.Data.readByte();
		a.BackfaceCulling = this.Data.readBoolean();
		this.Data.readBoolean();
		this.Data.readBoolean();
		this.Data.readBoolean();
		for(var b = 0; b < 4; ++b)
		{
			var c = this.ReadTextureRef();
			switch (b)
			{
				case 0:
					a.Tex1 = c;
					break;
				case 1:
					a.Tex2 = c;
					break
			}
			this.Data.readBoolean();
			this.Data.readBoolean();
			this.Data.readBoolean();
			if(this.Data.readShort() != 0) switch (b)
			{
				case 0:
					a.ClampTexture1 = true;
					break;
				case 1:
					break
			}
		}
		return a
	}

	ReadFileStrRef()
	{
		return this.ReadString()
	}

	ReadSoundRef()
	{
		var a = this.PathRoot + this.ReadFileStrRef();
		return CL3D.gSoundManager.getSoundFromSoundName(a, true)
	}

	ReadTextureRef()
	{
		var a = this.ReadFileStrRef(),
			b = this.PathRoot + a;
		if(this.TheTextureManager != null && a != "") return this.TheTextureManager.getTexture(b, true);
		return null
	}

	readFlaceHotspotNode(a)
	{
		var b = this.NextTagPos;
		a.Box = this.Read3DBoxF();
		a.Width = this.Data.readInt();
		for(a.Height = this.Data.readInt(); this.Data.bytesAvailable() > 0 && this.Data.getPosition() < b;) switch (this.readTag())
		{
			case 3:
				this.readHotspotData(a);
				break;
			default:
				this.SkipToNextTag()
		}
	}

	readHotspotData(a)
	{
		var b = this.NextTagPos;
		a.caption = this.ReadString();
		a.TheTexture = this.ReadTextureRef();
		this.Read2DVectF();
		this.Data.readInt();
		a.dateLimit = this.ReadString();
		for(a.useDateLimit = this.Data.readBoolean(); this.Data.bytesAvailable() > 0 && this.Data.getPosition() < b;) switch (this.readTag())
		{
			case 6:
				a.bExecuteJavaScript = true;
				a.executeJavaScript = this.ReadString();
				break;
			case 4:
				a.bGotoScene = true;
				a.gotoScene = this.ReadString();
				break;
			case 5:
				a.bOpenWebsite = true;
				a.website = this.ReadString();
				a.websiteTarget = this.ReadString();
				break;
			default:
				this.SkipToNextTag()
		}
	}

	readFlaceCameraNode(a)
	{
		a.Box = this.Read3DBoxF();
		a.Target = this.Read3DVectF();
		a.UpVector = this.Read3DVectF();
		a.Fovy = this.Data.readFloat();
		a.Aspect = this.Data.readFloat();
		a.ZNear = this.Data.readFloat();
		a.ZFar = this.Data.readFloat();
		a.Active = this.Data.readBoolean();
		a.recalculateProjectionMatrix()
	}

	readWaterNode(a)
	{
		this.Data.readInt();
		a.Details = this.Data.readInt();
		a.WaterFlowDirection.X = this.Data.readFloat();
		a.WaterFlowDirection.Y = this.Data.readFloat();
		a.WaveLength = this.Data.readFloat();
		a.WaveHeight = this.Data.readFloat();
		a.WaterColor = this.Data.readInt();
		a.ColorWhenUnderwater = this.Data.readBoolean();
		a.UnderWaterColor = this.Data.readInt();
		this.readFlaceMeshNode(a)
	}

	readFlaceLightNode(a)
	{
		a.Box = this.Read3DBoxF();
		if(this.Data.readInt() == 2) a.LightData.IsDirectional = true;
		a.LightData.Color = this.ReadColorF();
		this.ReadColorF();
		this.Data.readBoolean();
		a.LightData.Direction = this.Read3DVectF();
		var b = this.Data.readFloat();
		a.LightData.Radius = b;
		if(b != 0) a.LightData.Attenuation = 1 / b
	}

	readFlaceBillBoardNode(a)
	{
		a.MeshBuffer.Box = this.Read3DBoxF();
		a.Box = a.MeshBuffer.Box;
		a.SizeX = this.Data.readFloat();
		a.SizeY = this.Data.readFloat();
		var b = this.Data.readByte();
		a.IsVertical = (b & 2) != 0
	}

	readFlace3DSoundNode(a)
	{
		a.Box = this.Read3DBoxF();
		a.TheSound = this.ReadSoundRef();
		a.MinDistance = this.Data.readFloat();
		a.MaxDistance = this.Data.readFloat();
		a.PlayMode = this.Data.readInt();
		a.DeleteWhenFinished = this.Data.readBoolean();
		a.MaxTimeInterval = this.Data.readInt();
		a.MinTimeInterval = this.Data.readInt();
		a.Volume = this.Data.readFloat();
		a.PlayAs2D = this.Data.readBoolean();
		this.Data.readInt()
	}

	readFlacePathNode(a)
	{
		a.Box = this.Read3DBoxF();
		a.Tightness = this.Data.readFloat();
		a.IsClosedCircle = this.Data.readBoolean();
		this.Data.readInt();
		for(var b = this.Data.readInt(), c = 0; c < b; ++c) a.Nodes.push(this.Read3DVectF())
	}

	readParticleSystemSceneNode(a)
	{
		a.Direction = this.Read3DVectF();
		a.MaxAngleDegrees = this.Data.readInt();
		a.EmittArea = this.Read3DVectF();
		a.MinLifeTime = this.Data.readInt();
		a.MaxLifeTime = this.Data.readInt();
		a.MaxParticles = this.Data.readInt();
		a.MinParticlesPerSecond = this.Data.readInt();
		a.MaxParticlesPerSecond = this.Data.readInt();
		a.MinStartColor = this.Data.readInt();
		a.MaxStartColor = this.Data.readInt();
		a.MinStartSizeX = this.Data.readFloat();
		a.MinStartSizeY = this.Data.readFloat();
		a.MaxStartSizeX = this.Data.readFloat();
		a.MaxStartSizeY = this.Data.readFloat();
		var b = this.Data.readInt();
		if(b & 1)
		{
			a.FadeOutAffector = true;
			a.FadeOutTime = this.Data.readInt();
			a.FadeTargetColor = this.Data.readInt()
		}
		else a.FadeOutAffector = false;
		if(b & 2)
		{
			a.GravityAffector = true;
			a.GravityAffectingTime = this.Data.readInt();
			a.Gravity = this.Read3DVectF()
		}
		else a.GravityAffector = false;
		if(b & 4)
		{
			a.ScaleAffector = true;
			a.ScaleToX = this.Data.readFloat();
			a.ScaleToY = this.Data.readFloat()
		}
		else a.ScaleAffector = false
	}

	readFlace2DMobileInput(a)
	{
		this.Data.readInt();
		a.SizeModeIsAbsolute = this.Data.readBoolean();
		if(a.SizeModeIsAbsolute)
		{
			a.PosAbsoluteX = this.Data.readInt();
			a.PosAbsoluteY = this.Data.readInt();
			a.SizeAbsoluteWidth = this.Data.readInt();
			a.SizeAbsoluteHeight = this.Data.readInt()
		}
		else
		{
			a.PosRelativeX = this.Data.readFloat();
			a.PosRelativeY = this.Data.readFloat();
			a.SizeRelativeWidth = this.Data.readFloat();
			a.SizeRelativeHeight = this.Data.readFloat()
		}
		a.ShowBackGround = this.Data.readBoolean();
		a.BackGroundColor = this.Data.readInt();
		a.Texture = this.ReadTextureRef();
		a.TextureHover = this.ReadTextureRef();
		a.RetainAspectRatio = this.Data.readBoolean();
		a.CursorTex = this.ReadTextureRef();
		a.InputMode = this.Data.readInt();
		if(a.InputMode == 1) a.KeyCode = this.Data.readInt()
	}

	readFlace2DOverlay(a)
	{
		if(this.Data.readInt() & 1) a.BlurImage = true;
		a.SizeModeIsAbsolute = this.Data.readBoolean();
		if(a.SizeModeIsAbsolute)
		{
			a.PosAbsoluteX = this.Data.readInt();
			a.PosAbsoluteY = this.Data.readInt();
			a.SizeAbsoluteWidth = this.Data.readInt();
			a.SizeAbsoluteHeight = this.Data.readInt()
		}
		else
		{
			a.PosRelativeX = this.Data.readFloat();
			a.PosRelativeY = this.Data.readFloat();
			a.SizeRelativeWidth = this.Data.readFloat();
			a.SizeRelativeHeight = this.Data.readFloat()
		}
		a.ShowBackGround = this.Data.readBoolean();
		a.BackGroundColor = this.Data.readInt();
		a.Texture = this.ReadTextureRef();
		a.TextureHover = this.ReadTextureRef();
		a.RetainAspectRatio = this.Data.readBoolean();
		a.DrawText = this.Data.readBoolean();
		a.TextAlignment = this.Data.readByte();
		a.Text = this.ReadString();
		a.FontName = this.ReadString();
		a.TextColor = this.Data.readInt();
		a.AnimateOnHover = this.Data.readBoolean();
		a.OnHoverSetFontColor = this.Data.readBoolean();
		a.HoverFontColor = this.Data.readInt();
		a.OnHoverSetBackgroundColor = this.Data.readBoolean();
		a.HoverBackgroundColor = this.Data.readInt();
		a.OnHoverDrawTexture = this.Data.readBoolean()
	}

	ReadAnimator(a, b)
	{
		if(a)
		{
			var c = null;
			switch (this.Data.readInt())
			{
				case 100:
					b = new CL3D.AnimatorRotation;
					b.Rotation = this.Read3DVectF();
					c = b;
					break;
				case 101:
					b = new CL3D.AnimatorFlyStraight;
					b.Start = this.Read3DVectF();
					b.End = this.Read3DVectF();
					b.TimeForWay = this.Data.readInt();
					b.Loop = this.Data.readBoolean();
					b.recalculateImidiateValues();
					c = b;
					break;
				case 102:
					b = new CL3D.AnimatorFlyCircle;
					b.Center = this.Read3DVectF();
					b.Direction = this.Read3DVectF();
					b.Radius = this.Data.readFloat();
					b.Speed = this.Data.readFloat();
					b.init();
					c = b;
					break;
				case 103:
					b = new CL3D.AnimatorCollisionResponse;
					b.Radius = this.Read3DVectF();
					this.Data.readFloat();
					b.AffectedByGravity = !CL3D.equals(this.Data.readFloat(), 0);
					this.Data.readFloat();
					b.Translation = this.Read3DVectF();
					c = this.Data.readInt();
					this.Data.readInt();
					this.Data.readInt();
					if(c & 1) b.UseInclination = true;
					b.SlidingSpeed = this.Data.readFloat();
					c = b;
					break;
				case 104:
					b = new CL3D.AnimatorCameraFPS(a, this.CursorControl);
					b.MaxVerticalAngle = this.Data.readFloat();
					b.MoveSpeed = this.Data.readFloat();
					b.RotateSpeed = this.Data.readFloat();
					b.JumpSpeed = this.Data.readFloat();
					b.NoVerticalMovement = this.Data.readBoolean();
					c = this.Data.readInt();
					if(c & 1)
					{
						b.moveByMouseMove = false;
						b.moveByMouseDown = true
					}
					else
					{
						b.moveByMouseMove = true;
						b.moveByMouseDown = false
					}
					if(c & 2) b.MoveSmoothing = this.Data.readInt();
					if(c & 4) b.ChildrenDontUseZBuffer = true;
					if(a)
					{
						b.targetZoomValue = CL3D.radToDeg(a.Fovy);
						b.maxZoom = b.targetZoomValue + 10;
						b.zoomSpeed = (b.maxZoom - b.minZoom) / 50
					}
					c = b;
					break;
				case 105:
					b = new CL3D.AnimatorCameraModelViewer(a, this.CursorControl);
					b.Radius = this.Data.readFloat();
					b.RotateSpeed = this.Data.readFloat();
					b.NoVerticalMovement = this.Data.readBoolean();
					c = this.Data.readInt();
					if(c & 2)
					{
						b.SlideAfterMovementEnd = true;
						b.SlidingSpeed = this.Data.readFloat()
					}
					if(c & 4)
					{
						b.AllowZooming = true;
						b.MinZoom = this.Data.readFloat();
						b.MaxZoom = this.Data.readFloat();
						b.ZoomSpeed = this.Data.readFloat()
					}
					c = b;
					break;
				case 106:
					var e = new CL3D.AnimatorFollowPath(b);
					e.TimeNeeded = this.Data.readInt();
					e.LookIntoMovementDirection = this.Data.readBoolean();
					e.PathToFollow = this.ReadString();
					e.OnlyMoveWhenCameraActive = this.Data.readBoolean();
					e.AdditionalRotation = this.Read3DVectF();
					e.EndMode = this.Data.readByte();
					e.CameraToSwitchTo = this.ReadString();
					c = this.Data.readInt();
					if(c & 1) e.TimeDisplacement = this.Data.readInt();
					if(e.EndMode == 3 || e.EndMode == 4) e.TheActionHandler = this.ReadActionHandlerSection(b);
					c = e;
					break;
				case 107:
					c = new CL3D.AnimatorOnClick(b, this.CursorControl);
					c.BoundingBoxTestOnly = this.Data.readBoolean();
					c.CollidesWithWorld = this.Data.readBoolean();
					this.Data.readInt();
					c.TheActionHandler = this.ReadActionHandlerSection(b);
					c = c;
					break;
				case 108:
					e = new CL3D.AnimatorOnProximity(b);
					e.EnterType = this.Data.readInt();
					e.ProximityType = this.Data.readInt();
					e.Range = this.Data.readFloat();
					e.SceneNodeToTest = this.Data.readInt();
					c = this.Data.readInt();
					if(c & 1)
					{
						e.AreaType = 1;
						e.RangeBox = this.Read3DVectF()
					}
					e.TheActionHandler = this.ReadActionHandlerSection(b);
					c = e;
					break;
				case 109:
					b = new CL3D.AnimatorAnimateTexture;
					b.TextureChangeType = this.Data.readInt();
					b.TimePerFrame = this.Data.readInt();
					b.TextureIndexToChange = this.Data.readInt();
					b.Loop = this.Data.readBoolean();
					c = this.Data.readInt();
					b.Textures = [];
					for(e = 0; e < c; ++e) b.Textures.push(this.ReadTextureRef());
					c = b;
					break;
				case 110:
					c = new CL3D.AnimatorOnMove(b, this.CursorControl);
					c.BoundingBoxTestOnly = this.Data.readBoolean();
					c.CollidesWithWorld = this.Data.readBoolean();
					this.Data.readInt();
					c.ActionHandlerOnLeave = this.ReadActionHandlerSection(b);
					c.ActionHandlerOnEnter = this.ReadActionHandlerSection(b);
					c = c;
					break;
				case 111:
					c = new CL3D.AnimatorTimer(b);
					c.TickEverySeconds = this.Data.readInt();
					this.Data.readInt();
					c.TheActionHandler = this.ReadActionHandlerSection(b);
					c = c;
					break;
				case 112:
					c = new CL3D.AnimatorOnKeyPress(b, this.CursorControl);
					c.KeyPressType = this.Data.readInt();
					c.KeyCode = this.Data.readInt();
					c.IfCameraOnlyDoIfActive = this.Data.readBoolean();
					this.Data.readInt();
					c.TheActionHandler = this.ReadActionHandlerSection(b);
					c = c;
					break;
				case 113:
					e = new CL3D.AnimatorGameAI(b);
					e.AIType = this.Data.readInt();
					e.MovementSpeed = this.Data.readFloat();
					e.ActivationRadius = this.Data.readFloat();
					e.CanFly = this.Data.readBoolean();
					e.Health = this.Data.readInt();
					e.Tags = this.ReadString();
					e.AttacksAIWithTags = this.ReadString();
					e.PatrolRadius = this.Data.readFloat();
					e.RotationSpeedMs = this.Data.readInt();
					e.AdditionalRotationForLooking = this.Read3DVectF();
					e.StandAnimation = this.ReadString();
					e.WalkAnimation = this.ReadString();
					e.DieAnimation = this.ReadString();
					e.AttackAnimation = this.ReadString();
					if(e.AIType == 3) e.PathIdToFollow = this.Data.readInt();
					c = this.Data.readInt();
					if(c & 1) e.PatrolWaitTimeMs = this.Data.readInt();
					else
					{
						e.PatrolWaitTimeMs = 1E4;
						if(e.MovementSpeed != 0) e.PatrolWaitTimeMs = e.PatrolRadius / (e.MovementSpeed / 1E3)
					}
					e.ActionHandlerOnAttack = this.ReadActionHandlerSection(b);
					e.ActionHandlerOnActivate = this.ReadActionHandlerSection(b);
					e.ActionHandlerOnHit = this.ReadActionHandlerSection(b);
					e.ActionHandlerOnDie = this.ReadActionHandlerSection(b);
					c = e;
					break;
				case 114:
					b = new CL3D.Animator3rdPersonCamera;
					b.SceneNodeIDToFollow = this.Data.readInt();
					b.AdditionalRotationForLooking = this.Read3DVectF();
					b.FollowMode = this.Data.readInt();
					b.FollowSmoothingSpeed = this.Data.readFloat();
					b.TargetHeight = this.Data.readFloat();
					c = this.Data.readInt();
					b.CollidesWithWorld = c & 1 ? true : false;
					c = b;
					break;
				case 115:
					b = new CL3D.AnimatorKeyboardControlled(b, this.CursorControl);
					this.Data.readInt();
					b.RunSpeed = this.Data.readFloat();
					b.MoveSpeed = this.Data.readFloat();
					b.RotateSpeed = this.Data.readFloat();
					b.JumpSpeed = this.Data.readFloat();
					b.AdditionalRotationForLooking = this.Read3DVectF();
					b.StandAnimation = this.ReadString();
					b.WalkAnimation = this.ReadString();
					b.JumpAnimation = this.ReadString();
					b.RunAnimation = this.ReadString();
					c = this.Data.readInt();
					if(c & 1) b.DisableWithoutActiveCamera = true;
					if(c & 2)
					{
						b.UseAcceleration = true;
						b.AccelerationSpeed = this.Data.readFloat();
						b.DecelerationSpeed = this.Data.readFloat()
					}
					if(c & 4) b.PauseAfterJump = true;
					c = b;
					break;
				case 116:
					c = new CL3D.AnimatorOnFirstFrame(b);
					c.AlsoOnReload = this.Data.readBoolean();
					this.Data.readInt();
					c.TheActionHandler = this.ReadActionHandlerSection(b);
					c = c;
					break;
				case 117:
					c = new CL3D.AnimatorExtensionScript(b);
					c.JsClassName = this.ReadString();
					this.Data.readInt();
					this.ReadExtensionScriptProperties(c.Properties, b);
					c = c;
					break;
				default:
					this.SkipToNextTag();
					return
			}
			c && a.addAnimator(c)
		}
		else this.SkipToNextTag()
	}

	ReadExtensionScriptProperties(a, b)
	{
		for(var c = this.Data.readInt(), e = 0; e < c; ++e)
		{
			var f = new CL3D.ExtensionScriptProperty;
			f.Type = this.Data.readInt();
			f.Name = this.ReadString();
			switch (f.Type)
			{
				case 1:
					f.FloatValue = this.Data.readFloat();
					break;
				case 2:
					f.StringValue = this.ReadString();
					break;
				case 6:
					f.VectorValue = this.Read3DVectF();
					break;
				case 7:
					f.TextureValue = this.ReadTextureRef();
					break;
				case 9:
					f.ActionHandlerValue = this.ReadActionHandlerSection(b);
					break;
				case 0:
				case 4:
				case 5:
				case 8:
				case 3:
				default:
					f.IntValue = this.Data.readInt();
					break
			}
			a.push(f)
		}
	}

	ReadActionHandlerSection(a)
	{
		if(this.Data.readInt())
		{
			var b = new CL3D.ActionHandler(a);
			this.ReadActionHandler(b, a);
			return b
		}
		return null
	}

	ReadActionHandler(a, b)
	{
		var c = this.readTag();
		if(c != 29) this.SkipToNextTag();
		else
			for(var e = this.NextTagPos; this.Data.bytesAvailable() > 0 && this.Data.getPosition() < e;)
			{
				c = this.readTag();
				if(c == 30)(c = this.ReadAction(this.Data.readInt(), b)) && a.addAction(c);
				else this.SkipToNextTag()
			}
	}

	async readEmbeddedFiles()
	{
		for(var a = this.NextTagPos; this.Data.bytesAvailable() > 0 && this.Data.getPosition() < a;) switch (this.readTag())
		{
			case 13:
				var b = this.Data.readInt(),
					c = this.ReadString(),
					e = this.Data.readInt();
				if(b & 4)
				{
					if(b = this.TheMeshCache.getMeshFromName(c)) b.containsData() ? this.SkipToNextTag() : this.readSkinnedMesh(b, e)
				}
				else if(b & 8)
				{
					b = null;
					try
					{
						b = this.readUTFBytes(e)
					}
					catch (f)
					{
						console.log("error reading script: " + f)
					}
					// var blob = new Blob([b], {type: "text/plain;charset=utf-8"});
					// saveAs(blob, c + ".js");
					b != null && await CL3D.ScriptingInterface.getScriptingInterface().importCode(b)
				}
				this.SkipToNextTag();
				break;
			default:
				this.SkipToNextTag()
		}
	}

	readFlaceAnimatedMeshNode(a)
	{
		a.Box = this.Read3DBoxF();
		this.Data.readBoolean();
		this.Data.readInt();
		var b = this.Data.readInt(),
			c = this.Data.readInt();
		a.FramesPerSecond = this.Data.readFloat();
		this.Data.readByte();
		a.Looping = this.Data.readBoolean();
		var e = this.Data.readInt();
		if(e == 0)
		{
			a.BlendTimeMs = 250;
			a.AnimationBlendingEnabled = true
		}
		else if(e & 1)
		{
			a.BlendTimeMs = this.Data.readInt();
			a.AnimationBlendingEnabled = a.BlendTimeMs > 0
		}
		a.setMesh(this.ReadAnimatedMeshRef(a));
		a.StartFrame = b;
		a.EndFrame = c;
		if(e & 2)
		{
			b = this.Data.readInt();
			for(c = 0; c < b; ++c)
			{
				e = new CL3D.SAnimatedDummySceneNodeChild;
				e.NodeIDToLink = this.Data.readInt();
				e.JointIdx = this.Data.readInt();
				a.AnimatedDummySceneNodes.push(e)
			}
		}
	}

	ReadAnimatedMeshRef(a)
	{
		var b = this.ReadFileStrRef(),
			c = this.TheMeshCache.getMeshFromName(b);
		if(c == null)
		{
			c = new CL3D.SkinnedMesh;
			c.Name = b;
			this.TheMeshCache.addMesh(c);
			c = c
		}
		if(a != null && c != null)
		{
			if(c.AnimatedMeshesToLink == null) c.AnimatedMeshesToLink = [];
			c.AnimatedMeshesToLink.push(a)
		}
		return c
	}

	readSkinnedMesh(a, b)
	{
		if(a != null)
		{
			var c = this.Data.readInt();
			a.DefaultFPS = this.Data.readFloat();
			if(c & 1) a.StaticCollisionBoundingBox = this.Read3DBoxF();
			c = this.NextTagPos;
			b = this.Data.getPosition() + b;
			for(var e = [], f = 0; this.Data.bytesAvailable() > 0 && this.Data.getPosition() < c && this.Data.getPosition() < b;)
			{
				var g = this.readTag();
				if(g == 33)
				{
					g = new CL3D.SkinnedMeshJoint;
					g.Name = this.ReadString();
					g.LocalMatrix = this.ReadMatrix();
					g.GlobalInversedMatrix = this.ReadMatrix();
					a.AllJoints.push(g);
					f = this.Data.readInt();
					e.push(g);
					f >= 0 && f < e.length && e[f].Children.push(g);
					f = this.Data.readInt();
					for(var i = 0; i < f; ++i) g.AttachedMeshes.push(this.Data.readInt());
					i = this.Data.readInt();
					for(f = 0; f < i; ++f)
					{
						var h = new CL3D.SkinnedMeshPositionKey;
						h.frame = this.Data.readFloat();
						h.position = this.Read3DVectF();
						g.PositionKeys.push(h)
					}
					i = this.Data.readInt();
					for(f = 0; f < i; ++f)
					{
						h = new CL3D.SkinnedMeshScaleKey;
						h.frame = this.Data.readFloat();
						h.scale = this.Read3DVectF();
						g.ScaleKeys.push(h)
					}
					i = this.Data.readInt();
					for(f = 0; f < i; ++f)
					{
						h = new CL3D.SkinnedMeshRotationKey;
						h.frame = this.Data.readFloat();
						h.rotation = this.ReadQuaternion();
						g.RotationKeys.push(h)
					}
					i = this.Data.readInt();
					for(f = 0; f < i; ++f)
					{
						h = new CL3D.SkinnedMeshWeight;
						h.buffer_id = this.Data.readUnsignedShort();
						h.vertex_id = this.Data.readInt();
						h.strength = this.Data.readFloat();
						g.Weights.push(h)
					}
				}
				else if(g == 15)
				{
					g = this.ReadMeshBuffer();
					g != null && a.AddMeshBuffer(g)
				}
				else if(g == 34)
				{
					g = new CL3D.NamedAnimationRange;
					g.Name = this.ReadString();
					g.Begin = this.Data.readFloat();
					g.End = this.Data.readFloat();
					g.FPS = this.Data.readFloat();
					a.addNamedAnimationRange(g)
				}
				else this.SkipToNextTag()
			}
			try
			{
				a.finalize()
			}
			catch (j)
			{
				console.log("error finalizing skinned mesh: " + j)
			}
			if(a.AnimatedMeshesToLink && a.AnimatedMeshesToLink.length)
			{
				for(f = 0; f < a.AnimatedMeshesToLink.length; ++f)(c = a.AnimatedMeshesToLink[f]) && c.setFrameLoop(c.StartFrame, c.EndFrame);
				a.AnimatedMeshesToLink = null
			}
		}
	}

	ReadAction(a, b)
	{
		var c = 0;
		switch (a)
		{
			case 0:
				c = new CL3D.ActionMakeSceneNodeInvisible;
				c.InvisibleMakeType = this.Data.readInt();
				c.SceneNodeToMakeInvisible = this.Data.readInt();
				c.ChangeCurrentSceneNode = this.Data.readBoolean();
				this.Data.readInt();
				return c;
			case 1:
				b = new CL3D.ActionChangeSceneNodePosition;
				b.PositionChangeType = this.Data.readInt();
				b.SceneNodeToChangePosition = this.Data.readInt();
				b.ChangeCurrentSceneNode = this.Data.readBoolean();
				b.Vector = this.Read3DVectF();
				if(b.PositionChangeType == 4) b.Area3DEnd = this.Read3DVectF();
				b.RelativeToCurrentSceneNode = this.Data.readBoolean();
				b.SceneNodeRelativeTo = this.Data.readInt();
				c = this.Data.readInt();
				if(c & 1)
				{
					b.UseAnimatedMovement = true;
					b.TimeNeededForMovementMs = this.Data.readInt()
				}
				return b;
			case 2:
				b = new CL3D.ActionChangeSceneNodeRotation;
				b.RotationChangeType = this.Data.readInt();
				b.SceneNodeToChangeRotation = this.Data.readInt();
				b.ChangeCurrentSceneNode = this.Data.readBoolean();
				b.Vector = this.Read3DVectF();
				b.RotateAnimated = false;
				c = this.Data.readInt();
				if(c & 1)
				{
					b.RotateAnimated = true;
					b.TimeNeededForRotationMs = this.Data.readInt()
				}
				return b;
			case 3:
				c = new CL3D.ActionChangeSceneNodeScale;
				c.ScaleChangeType = this.Data.readInt();
				c.SceneNodeToChangeScale = this.Data.readInt();
				c.ChangeCurrentSceneNode = this.Data.readBoolean();
				c.Vector = this.Read3DVectF();
				this.Data.readInt();
				return c;
			case 4:
				c = new CL3D.ActionChangeSceneNodeTexture;
				c.TextureChangeType = this.Data.readInt();
				c.SceneNodeToChange = this.Data.readInt();
				c.ChangeCurrentSceneNode = this.Data.readBoolean();
				c.TheTexture = this.ReadTextureRef();
				if(c.TextureChangeType == 1) c.IndexToChange = this.Data.readInt();
				this.Data.readInt();
				return c;
			case 5:
				b = new CL3D.ActionPlaySound;
				c = this.Data.readInt();
				b.PlayLooped = (c & 1) != 0;
				b.TheSound = this.ReadSoundRef();
				b.MinDistance = this.Data.readFloat();
				b.MaxDistance = this.Data.readFloat();
				b.Volume = this.Data.readFloat();
				b.PlayAs2D = this.Data.readBoolean();
				b.SceneNodeToPlayAt = this.Data.readInt();
				b.PlayAtCurrentSceneNode = this.Data.readBoolean();
				b.Position3D = this.Read3DVectF();
				return b;
			case 6:
				c = new CL3D.ActionStopSound;
				c.SoundChangeType = this.Data.readInt();
				return c;
			case 7:
				c = new CL3D.ActionExecuteJavaScript;
				this.Data.readInt();
				c.JScript = this.ReadString();
				return c;
			case 8:
				c = new CL3D.ActionOpenWebpage;
				this.Data.readInt();
				c.Webpage = this.ReadString();
				c.Target = this.ReadString();
				return c;
			case 9:
				c = new CL3D.ActionSetSceneNodeAnimation;
				c.SceneNodeToChangeAnim = this.Data.readInt();
				c.ChangeCurrentSceneNode = this.Data.readBoolean();
				c.Loop = this.Data.readBoolean();
				c.AnimName = this.ReadString();
				this.Data.readInt();
				return c;
			case 10:
				c = new CL3D.ActionSwitchToScene(this.CursorControl);
				c.SceneName = this.ReadString();
				this.Data.readInt();
				return c;
			case 11:
				c = new CL3D.ActionSetActiveCamera(this.CursorControl);
				c.CameraToSetActive = this.Data.readInt();
				this.Data.readInt();
				return c;
			case 12:
				b = new CL3D.ActionSetCameraTarget;
				b.PositionChangeType = this.Data.readInt();
				b.SceneNodeToChangePosition = this.Data.readInt();
				b.ChangeCurrentSceneNode = this.Data.readBoolean();
				b.Vector = this.Read3DVectF();
				b.RelativeToCurrentSceneNode = this.Data.readBoolean();
				b.SceneNodeRelativeTo = this.Data.readInt();
				c = this.Data.readInt();
				if(c & 1)
				{
					b.UseAnimatedMovement = true;
					b.TimeNeededForMovementMs = this.Data.readInt()
				}
				return b;
			case 13:
				a = new CL3D.ActionShoot;
				a.ShootType = this.Data.readInt();
				a.Damage = this.Data.readInt();
				a.BulletSpeed = this.Data.readFloat();
				a.SceneNodeToUseAsBullet = this.Data.readInt();
				a.WeaponRange = this.Data.readFloat();
				c = this.Data.readInt();
				if(c & 1)
				{
					a.SceneNodeToShootFrom = this.Data.readInt();
					a.ShootToCameraTarget = this.Data.readBoolean();
					a.AdditionalDirectionRotation = this.Read3DVectF()
				}
				if(c & 2) a.ActionHandlerOnImpact = this.ReadActionHandlerSection(b);
				if(c & 4) a.ShootDisplacement = this.Read3DVectF();
				return a;
			case 14:
				this.SkipToNextTag();
				return null;
			case 15:
				c = new CL3D.ActionSetOverlayText;
				this.Data.readInt();
				c.SceneNodeToChange = this.Data.readInt();
				c.ChangeCurrentSceneNode = this.Data.readBoolean();
				c.Text = this.ReadString();
				return c;
			case 16:
				c = new CL3D.ActionSetOrChangeAVariable;
				this.Data.readInt();
				c.VariableName = this.ReadString();
				c.Operation = this.Data.readInt();
				c.ValueType = this.Data.readInt();
				c.valueOf = this.ReadString();
				return c;
			case 17:
				a = new CL3D.ActionIfVariable;
				c = this.Data.readInt();
				a.VariableName = this.ReadString();
				a.ComparisonType = this.Data.readInt();
				a.ValueType = this.Data.readInt();
				a.Value = this.ReadString();
				a.TheActionHandler = this.ReadActionHandlerSection(b);
				if(c & 1) a.TheElseActionHandler = this.ReadActionHandlerSection(b);
				return a;
			case 18:
				c = new CL3D.ActionRestartBehaviors;
				c.SceneNodeToRestart = this.Data.readInt();
				c.ChangeCurrentSceneNode = this.Data.readBoolean();
				this.Data.readInt();
				return c;
			case 19:
				c = new CL3D.ActionStoreLoadVariable;
				this.Data.readInt();
				c.VariableName = this.ReadString();
				c.Load = this.Data.readBoolean();
				return c;
			case 20:
				c = new CL3D.ActionRestartScene(this.CursorControl);
				this.Data.readInt();
				c.SceneName = this.ReadString();
				this.LoadedAReloadAction = true;
				return c;
			case 22:
				c = new CL3D.ActionCloneSceneNode;
				c.SceneNodeToClone = this.Data.readInt();
				c.CloneCurrentSceneNode = this.Data.readBoolean();
				this.Data.readInt();
				c.TheActionHandler = this.ReadActionHandlerSection(b);
				return c;
			case 23:
				c = new CL3D.ActionDeleteSceneNode;
				c.SceneNodeToDelete = this.Data.readInt();
				c.DeleteCurrentSceneNode = this.Data.readBoolean();
				c.TimeAfterDelete = this.Data.readInt();
				this.Data.readInt();
				return c;
			case 24:
				c = new CL3D.ActionExtensionScript;
				c.JsClassName = this.ReadString();
				this.Data.readInt();
				this.ReadExtensionScriptProperties(c.Properties, b);
				return c;
			case 25:
				a = new CL3D.ActionPlayMovie(this.CursorControl);
				c = this.Data.readInt();
				a.PlayLooped = (c & 1) != 0;
				a.Command = this.Data.readInt();
				a.VideoFileName = this.ReadString();
				this.Data.readInt();
				a.SceneNodeToPlayAt = this.Data.readInt();
				a.PlayAtCurrentSceneNode = this.Data.readBoolean();
				a.MaterialIndex = this.Data.readInt();
				a.ActionHandlerFinished = this.ReadActionHandlerSection(b);
				a.ActionHandlerFailed = this.ReadActionHandlerSection(b);
				return a;
			case 26:
				c = new CL3D.ActionStopSpecificSound;
				this.Data.readInt();
				c.TheSound = this.ReadSoundRef();
				return c;
			default:
				this.SkipToNextTag()
		}
		return null
	}
};
