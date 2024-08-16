import * as CL3D from "../main.js";
import { getDirName } from "../share/getDirName.js";

export class FlaceLoader {
	constructor () {
		this.Data = this.Document = null;
		this.Filename = "";
		this.CurrentTagSize = 0;
		this.NextTagPos = 0;
		this.CursorControl = null;
		this.TheTextureManager = null;
		this.PathRoot = "";
		this.StoredFileContent = null;
		this.TheMeshCache = null;
		this.LoadedAReloadAction = false;
		this.trailingUTF8Bytes = [
			0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
			0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
			0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
			0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
			0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
			0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
			1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
			2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2, 3,3,3,3,3,3,3,3,4,4,4,4,5,5,5,5,
		];
	}

	/**
	 * @param {ArrayBuffer} buffer
	 * @returns
	 */
	ArrayBufferToString(buffer)
	{
		let data = "";
		let array = new Uint8Array(buffer);
		for(let index = 0; index < array.byteLength; index++) data += String.fromCharCode(array[index]);
		return data;
	}

	StringToUint8Array(str)
	{
		let buf = new ArrayBuffer(str.length);
		let bufView = new Uint8Array(buf);
		for (let index=0; index < str.length; index++) {
		  bufView[index] = str.charCodeAt(index);
		}
		return bufView;
	}

	StringToUint16Array(str)
	{
		let buf = new ArrayBuffer(str.length*2);
		let bufView = new Uint16Array(buf);
		for (let index=0; index < str.length; index++) {
		  bufView[index] = str.charCodeAt(index);
		}
		return bufView;
	}

	/**
	 * @param {ArrayBuffer|String} filecontent
	 * @param {String} filename
	 * @param {CL3D.TextureManager} textureManager
	 * @param {CL3D.MeshCache} meshCache
	 * @param {CL3D.CopperLicht} cursorControl
	 * @param {Boolean} copyRootNodeChildren
	 * @param {CL3D.SceneNode} newRootNodeChildrenParent
	 * @returns
	 */
	async loadFile(filecontent, filename, textureManager, meshCache, cursorControl, copyRootNodeChildren, newRootNodeChildrenParent)
	{
		this.CopyRootNodeChildren = copyRootNodeChildren;
		this.NewRootNodeChildrenParent = newRootNodeChildrenParent;

		this.Filename = filename;
		this.TheTextureManager = textureManager;
		this.TheMeshCache = meshCache;
		this.CursorControl = cursorControl;
		this.TheTextureManager != null && CL3D.ScriptingInterface.getScriptingInterface().setTextureManager(this.TheTextureManager);

		let loadedfile = null;
		
		if(typeof filecontent == 'string')
		{
			loadedfile = filecontent;
		}
		else if(filecontent instanceof ArrayBuffer)
		{
			if(this.Filename.indexOf(".ccbz") != -1 || this.Filename.indexOf(".ccp") != -1)
			{
				loadedfile = this.ArrayBufferToString(filecontent);
			}
		}
		if(loadedfile == null || loadedfile.length == 0)
		{
			console.log("Error: Could not load file '" + this.Filename + "'");
			return null;
		}
		if(this.Filename.indexOf(".ccbz") != -1) loadedfile = JSInflate.inflate(loadedfile);
		else if(this.Filename.indexOf(".ccbjs") != -1) loadedfile = CL3D.base64decode(loadedfile);
		this.Document = new CL3D.CCDocument;
		this.setRootPath();
		this.Data = new CL3D.StringBinary(loadedfile);
		if(!await this.parseFile()) return null;
		this.StoredFileContent = loadedfile;
		return this.Document;
	}

	setRootPath()
	{
		let path = this.Filename;
		let end = path.lastIndexOf("/");
		if(end == -1)
			end = path.lastIndexOf("\\");
		if(end != -1) path = path.substring(0, end + 1);
		this.PathRoot = path;
	}

	async parseFile()
	{
		let magic = this.Data.readSI32();
		let version = this.Data.readSI32();
		let len = this.Data.readUI32();
		if(magic != 1701014630) return false;

		for(let index = 0; this.Data.bytesAvailable() > 0;)
		{
			let tag = this.readTag();
			++index;
			if(index == 1 && tag != 1) return false;
			switch (tag)
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
					this.SkipToNextTag();
			}
		}
		return true;
	}

	SkipToNextTag()
	{
		this.Data.seek(this.NextTagPos, true);
	}

	readTag()
	{
		let tag = 0;
		tag = this.Data.readUnsignedShort();
		this.CurrentTagSize = this.Data.readUnsignedInt();
		this.NextTagPos = this.Data.getPosition() + this.CurrentTagSize;
		return tag;
	}

	ReadMatrix()
	{
		let mat4 = new CL3D.Matrix4(false);
		this.ReadIntoExistingMatrix(mat4);
		return mat4;
	}

	/**
	 * @param {CL3D.Matrix4} mat4
	 */
	ReadIntoExistingMatrix(mat4)
	{
		for(let index = 0; index < 16; ++index) mat4.setByIndex(index, this.Data.readFloat());
	}

	ReadQuaternion()
	{
		let quat = new CL3D.Quaternion;
		quat.W = this.Data.readFloat();
		quat.X = this.Data.readFloat();
		quat.Y = this.Data.readFloat();
		quat.Z = this.Data.readFloat();
		return quat;
	}

	readUTFBytes(sourceEnd)
	{
		let sourceRead = 0;
		let chars = [];
		let offsetsFromUTF8 = [0, 12416, 925824, 63447168, 4194836608, 2181570688];
		let bytes = [];
		for(let index = 0; index < sourceEnd; ++index) bytes.push(this.Data.readNumber(1));
		for(; sourceRead < sourceEnd;)
		{
			let ch = 0;
			let extraBytesToRead = this.trailingUTF8Bytes[bytes[sourceRead]];
			if(sourceRead + extraBytesToRead >= sourceEnd) return chars.join("");
			for(let z = extraBytesToRead; z >= 0; --z)
			{
				ch += bytes[sourceRead];
				++sourceRead;
				if(z != 0) ch <<= 6
			}
			if(sourceRead > sourceEnd) break;
			ch -= offsetsFromUTF8[extraBytesToRead];
			if(ch < 1114111) chars.push(this.fixedFromCharCode(ch));
			else return chars.join("");
		}
		return chars.join("");
	}

	ReadString()
	{
		let int = this.Data.readUnsignedInt();
		if(int > 104857600) return "";
		if(int <= 0) return "";
		return this.readUTFBytes(int);
	}

	fixedFromCharCode(int)
	{
		if(int > 65535)
		{
			int -= 65536;
			return String.fromCharCode(55296 + (int >> 10), 56320 + (int & 1023));
		}
		else return String.fromCharCode(int);
	}

	readDocument()
	{
		for(let nextTagPos = this.NextTagPos; this.Data.bytesAvailable() > 0 && this.Data.getPosition() < nextTagPos;) switch (this.readTag())
		{
			case 1004:
				this.Document.CurrentScene = this.Data.readInt();
				break;
			case 20:
				this.readPublishSettings();
				break;
			case 2:
				let flacescene = null;
				switch (this.Data.readInt())
				{
					case 0:
						flacescene = new CL3D.Free3dScene;
						this.readFreeScene(flacescene);
						break;
					case 1:
						/// TODO
						break;
					default:
						this.SkipToNextTag()
				}
				this.Document.addScene(flacescene);
				break;
			default:
				this.SkipToNextTag();
		}
	}

	readDocument2()
	{
		for(let nextTagPos = this.NextTagPos; this.Data.bytesAvailable() > 0 && this.Data.getPosition() < nextTagPos;) switch (this.readTag())
		{
			case 2:
				let flacescene = null;
				switch (this.Data.readInt())
				{
					case 0:
						flacescene = new class {
							constructor() {
								this.RootNode = null;
								this.CurrentScene = CL3D.gDocument.getCurrentScene();
								this.registerSceneNodeAnimatorForEvents = this.CurrentScene.registerSceneNodeAnimatorForEvents;
								this.RegisteredSceneNodeAnimatorsForEventsList = this.CurrentScene.RegisteredSceneNodeAnimatorsForEventsList;
							}

							getRootSceneNode() {
								return this.CurrentScene.RootNode;
							}
						};

						// @ts-ignore
						this.readFreeScene2(flacescene);
						break;
					default:
						this.SkipToNextTag()
				}
				this.Document.addScene(flacescene);
				break;
			default:
				this.SkipToNextTag();
		}
	}

	/**
	 * @param {ArrayBuffer|String} filecontent
	 * @param {CL3D.Free3dScene} scene
	 * @param {Number} sceneindex
	 * @param {String} filename
	 * @param {CL3D.TextureManager} textureManager
	 * @param {CL3D.MeshCache} meshCache
	 * @param {CL3D.CopperLicht} cursorControl
	 * @returns
	 */
	reloadScene(filecontent, scene, sceneindex, filename, textureManager, meshCache, cursorControl)
	{
		this.Filename = filename;
		this.TheTextureManager = textureManager;
		this.TheMeshCache = meshCache;
		this.CursorControl = cursorControl;
		this.Data = new CL3D.StringBinary(filecontent);
		this.setRootPath();
		this.Data.readSI32();
		this.Data.readSI32();
		this.Data.readUI32();
		let loadedSceneCount = -1;
		let tag = this.readTag();
		if(tag != 1) return null;
		for(let nextTagPos = this.NextTagPos; this.Data.bytesAvailable() > 0 && this.Data.getPosition() < nextTagPos;)
		{
			tag = this.readTag();
			switch (tag)
			{
				case 2:
					let sceneType = this.Data.readInt();
					++loadedSceneCount;
					if(loadedSceneCount == sceneindex)
					{
						let flacescene = null;
						switch (sceneType)
						{
							case 0:
								flacescene = new CL3D.Free3dScene;
								this.readFreeScene(flacescene);
								break;
							case 1:
								/// TODO
								break;
							default:
								this.SkipToNextTag();
						}
						return flacescene;
					}
					else this.SkipToNextTag();
				default:
					this.SkipToNextTag();
			}
		}
		return null;
	}

	readPublishSettings()
	{
		this.Data.readInt(); // Target
		this.Document.ApplicationTitle = this.ReadString();
		let flag = 0;
		for(let nextTagPos = this.NextTagPos; this.Data.bytesAvailable() > 0 && this.Data.getPosition() < nextTagPos;) switch (this.readTag())
		{
			case 35:
				this.Data.readInt();
				this.Data.readInt();
				this.Data.readInt();
				this.Data.readInt();
				flag = this.Data.readInt();
				if((flag & 1) != 0) this.Document.WaitUntilTexturesLoaded = true;
				if((flag & 16) != 0) console.log(`CL3D.Global_PostEffectsDisabled = true`)
				this.SkipToNextTag();
				break;
			case 37:
				flag = this.Data.readInt();
				this.Data.readInt();
				if((flag & 1) != 0)
					if(CL3D.gCCDebugInfoEnabled) console.log(`CL3D.gCCDebugInfoEnabled = true`);
				if((flag & 2) != 0)
				{
					this.Data.readInt();
					this.ReadString()
				}(flag & 4) != 0 && this.ReadString();
				break;
			default:
				this.SkipToNextTag();
		}
	}

	/**
	 * @param {CL3D.Free3dScene} scene
	 */
	readFreeScene(scene)
	{
		let nextTagPos = this.NextTagPos;
		for(this.readScene(scene); this.Data.bytesAvailable() > 0 && this.Data.getPosition() < nextTagPos;) switch (this.readTag())
		{
			case 1007:
				scene.DefaultCameraPos = this.Read3DVectF();
				scene.DefaultCameraTarget = this.Read3DVectF();
				break;
			case 8:
				this.ReadSceneGraph(scene);
				break;
			case 1008:
				scene.Gravity = this.Data.readFloat();
				break;
			case 1009:
				scene.FogEnabled = this.Data.readBoolean();
				scene.FogDensity = this.Data.readFloat();
				scene.FogColor = this.Data.readInt();
				break;
			case 1010:
				this.Data.readBoolean();
				scene.WindSpeed = this.Data.readFloat();
				scene.WindStrength = this.Data.readFloat();
				break;
			case 1011:
				scene.ShadowMappingEnabled = this.Data.readBoolean();
				scene.ShadowMapBias1 = this.Data.readFloat();
				scene.ShadowMapBias2 = this.Data.readFloat();
				scene.ShadowMapBackFaceBias = this.Data.readFloat();
				scene.ShadowMapOpacity = this.Data.readFloat();
				scene.ShadowMapCameraViewDetailFactor = this.Data.readFloat();
				break;
			case 1012:
				if (this.CopyRootNodeChildren)
				{
					this.SkipToNextTag();
				}
				else
				{
					for(let index = 0; index < 6; ++index) scene.PostEffectData[index].Active = this.Data.readBoolean();
					scene.PE_bloomBlurIterations = this.Data.readInt();
					scene.PE_bloomTreshold = this.Data.readFloat();
					scene.PE_blurIterations = this.Data.readInt();
					scene.PE_colorizeColor = this.Data.readInt();
					scene.PE_vignetteIntensity = this.Data.readFloat();
					scene.PE_vignetteRadiusA = this.Data.readFloat();
					scene.PE_vignetteRadiusB = this.Data.readFloat();
				}
				break;
			default:
				this.SkipToNextTag();
		}
	}

	/**
	 * @param {CL3D.Free3dScene} scene
	 */
	readFreeScene2(scene)
	{
		let nextTagPos = this.NextTagPos;
		for(this.readScene(scene); this.Data.bytesAvailable() > 0 && this.Data.getPosition() < nextTagPos;) switch (this.readTag())
		{
			case 8:
				this.ReadSceneGraph(scene);
				break;
			default:
				this.SkipToNextTag();
		}
	}

	Read3DVectF()
	{
		let vect3d = new CL3D.Vect3d;
		vect3d.X = this.Data.readFloat();
		vect3d.Y = this.Data.readFloat();
		vect3d.Z = this.Data.readFloat();
		return vect3d;
	}

	ReadColorF()
	{
		let color = new CL3D.ColorF;
		color.R = this.Data.readFloat();
		color.G = this.Data.readFloat();
		color.B = this.Data.readFloat();
		color.A = this.Data.readFloat();
		return color;
	}

	ReadColorFAsInt()
	{
		let A = this.Data.readFloat(),
			R = this.Data.readFloat(),
			G = this.Data.readFloat(),
			B = this.Data.readFloat();
		if(A > 1) A = 1;
		if(R > 1) R = 1;
		if(G > 1) G = 1;
		if(B > 1) B = 1;
		return CL3D.createColor(A * 255, R * 255, G * 255, B * 255);
	}

	Read2DVectF()
	{
		let vect2d = new CL3D.Vect2d;
		vect2d.X = this.Data.readFloat();
		vect2d.Y = this.Data.readFloat();
		return vect2d;
	}

	Read3DBoxF()
	{
		let box3d = new CL3D.Box3d;
		box3d.MinEdge = this.Read3DVectF();
		box3d.MaxEdge = this.Read3DVectF();
		return box3d;
	}

	readScene(scene)
	{
		if(this.readTag() == 26)
		{
			if (this.CopyRootNodeChildren)
			{
				scene.Name = this.ReadString();
				let folder = new CL3D.DummyTransformationSceneNode();
				folder.Name = scene.Name;
				//folder.Visible = false;
				this.NewRootNodeChildrenParent.addChild(folder);
				scene.RootNode = folder;
				this.SkipToNextTag();
			}
			else
			{
				scene.Name = this.ReadString();
				scene.BackgroundColor = this.Data.readInt();
			}
		}
		else this.JumpBackFromTagReading();
	}

	JumpBackFromTagReading()
	{
		this.Data._offset -= 10;
	}

	/**
	 * @param {CL3D.Free3dScene} scene
	 */
	ReadSceneGraph(scene)
	{
		for(let nextTagPos = this.NextTagPos; this.Data.bytesAvailable() > 0 && this.Data.getPosition() < nextTagPos;) switch (this.readTag())
		{
			case 9:
				this.ReadSceneNode(scene, scene.RootNode, 0);
				break;
			default:
				this.SkipToNextTag();
		}
	}

	/**
	 * @param {Object} params
	 */
	AddSceneNodeParams(node, params)
	{
		node.Type = params.nodeType;
		node.Pos = params.pos;
		node.Rot = params.rot;
		node.Scale = params.scale;
		node.Visible = params.bIsVisible;
		node.Name = params.name;
		node.Culling = params.culling;
		node.Id = params.nodeId;
		node.scene = params.scene;
	}

	/**
	 * @param {CL3D.Free3dScene} scene
	 * @param {CL3D.SceneNode} node
	 * @param {Number} depth
	 */
	ReadSceneNode(scene, node, depth)
	{
		if(node != null)
		{
			let nextTagPos = this.NextTagPos;
			let lastCreatedSceneNode = null;
			let materialCountRead = 0;
			let params = {
				nodeType: this.Data.readInt(),
				nodeId: this.Data.readInt(),
				name: this.ReadString(),
				pos: this.Read3DVectF(),
				rot: this.Read3DVectF(),
				scale: this.Read3DVectF(),
				bIsVisible: this.Data.readBoolean(),
				culling: this.Data.readInt()
			};

			if(depth == 0)
			{
				if (!this.CopyRootNodeChildren)
				{
					node.Visible = params.bIsVisible;
					node.Name = params.name;
					node.Culling = params.culling;
				}
			}
			for(; this.Data.bytesAvailable() > 0 && this.Data.getPosition() < nextTagPos;) switch (this.readTag())
			{
				case 9:
					this.ReadSceneNode(scene, lastCreatedSceneNode ? lastCreatedSceneNode : node, depth + 1);
					break;
				case 10:
					switch (params.nodeType)
					{
						case 2037085030:
							lastCreatedSceneNode = new CL3D.SkyBoxSceneNode;
							this.AddSceneNodeParams(lastCreatedSceneNode, params);
							this.readFlaceMeshNode(lastCreatedSceneNode);
							node.addChild(lastCreatedSceneNode);
							lastCreatedSceneNode.updateAbsolutePosition();
							break;
						case 1752395110:
							lastCreatedSceneNode = new CL3D.MeshSceneNode;
							this.AddSceneNodeParams(lastCreatedSceneNode, params);
							this.readFlaceMeshNode(lastCreatedSceneNode);
							node.addChild(lastCreatedSceneNode);
							lastCreatedSceneNode.updateAbsolutePosition();
							break;
						case 1835950438:
							lastCreatedSceneNode = new CL3D.AnimatedMeshSceneNode;
							this.AddSceneNodeParams(lastCreatedSceneNode, params);
							this.readFlaceAnimatedMeshNode(lastCreatedSceneNode);
							node.addChild(lastCreatedSceneNode);
							lastCreatedSceneNode.updateAbsolutePosition();
							break;
						case 1953526632:
							lastCreatedSceneNode = new CL3D.HotspotSceneNode(this.CursorControl, null);
							this.AddSceneNodeParams(lastCreatedSceneNode, params);
							this.readFlaceHotspotNode(lastCreatedSceneNode);
							node.addChild(lastCreatedSceneNode);
							lastCreatedSceneNode.updateAbsolutePosition();
							break;
						case 1819042406:
							lastCreatedSceneNode = new CL3D.BillboardSceneNode;
							this.AddSceneNodeParams(lastCreatedSceneNode, params);
							this.readFlaceBillBoardNode(lastCreatedSceneNode);
							node.addChild(lastCreatedSceneNode);
							lastCreatedSceneNode.updateAbsolutePosition();
							break;
						case 1835098982:
							lastCreatedSceneNode = new CL3D.CameraSceneNode;
							this.AddSceneNodeParams(lastCreatedSceneNode, params);
							this.readFlaceCameraNode(lastCreatedSceneNode);
							node.addChild(lastCreatedSceneNode);
							lastCreatedSceneNode.updateAbsolutePosition();
							break;
						case 1751608422:
							lastCreatedSceneNode = new CL3D.LightSceneNode;
							this.AddSceneNodeParams(lastCreatedSceneNode, params);
							this.readFlaceLightNode(lastCreatedSceneNode);
							node.addChild(lastCreatedSceneNode);
							lastCreatedSceneNode.updateAbsolutePosition();
							break;
						case 1935946598:
							lastCreatedSceneNode = new CL3D.SoundSceneNode;
							this.AddSceneNodeParams(lastCreatedSceneNode, params);
							this.readFlace3DSoundNode(lastCreatedSceneNode);
							node.addChild(lastCreatedSceneNode);
							lastCreatedSceneNode.updateAbsolutePosition();
							break;
						case 1752461414:
							lastCreatedSceneNode = new CL3D.PathSceneNode;
							this.AddSceneNodeParams(lastCreatedSceneNode, params);
							this.readFlacePathNode(lastCreatedSceneNode);
							node.addChild(lastCreatedSceneNode);
							lastCreatedSceneNode.updateAbsolutePosition();
							break;
						case 1954112614:
							lastCreatedSceneNode = new CL3D.DummyTransformationSceneNode;
							this.AddSceneNodeParams(lastCreatedSceneNode, params);
							lastCreatedSceneNode.Box = this.Read3DBoxF();
							this.ReadIntoExistingMatrix(lastCreatedSceneNode.RelativeTransformationMatrix);
							node.addChild(lastCreatedSceneNode);
							lastCreatedSceneNode.updateAbsolutePosition();
							break;
						case 1868837478:
							lastCreatedSceneNode = new CL3D.Overlay2DSceneNode(this.CursorControl);
							this.AddSceneNodeParams(lastCreatedSceneNode, params);
							this.readFlace2DOverlay(lastCreatedSceneNode);
							node.addChild(lastCreatedSceneNode);
							lastCreatedSceneNode.updateAbsolutePosition();
							break;
						case 1668575334:
							lastCreatedSceneNode = new CL3D.ParticleSystemSceneNode;
							this.AddSceneNodeParams(lastCreatedSceneNode, params);
							this.readParticleSystemSceneNode(lastCreatedSceneNode);
							node.addChild(lastCreatedSceneNode);
							lastCreatedSceneNode.updateAbsolutePosition();
							break;
						case 1835283046:
							lastCreatedSceneNode = new CL3D.Mobile2DInputSceneNode(this.CursorControl, scene);
							this.AddSceneNodeParams(lastCreatedSceneNode, params);
							this.readFlace2DMobileInput(lastCreatedSceneNode);
							node.addChild(lastCreatedSceneNode);
							lastCreatedSceneNode.updateAbsolutePosition();
							break;
						case 1920103526:
							lastCreatedSceneNode = new CL3D.TerrainSceneNode;
							this.AddSceneNodeParams(lastCreatedSceneNode, params);
							lastCreatedSceneNode.Box = this.Read3DBoxF();
							node.addChild(lastCreatedSceneNode);
							lastCreatedSceneNode.updateAbsolutePosition();
							this.SkipToNextTag();
							break;
						case 1920235366:
							lastCreatedSceneNode = new CL3D.WaterSurfaceSceneNode;
							this.AddSceneNodeParams(lastCreatedSceneNode, params);
							this.readWaterNode(lastCreatedSceneNode);
							node.addChild(lastCreatedSceneNode);
							lastCreatedSceneNode = lastCreatedSceneNode
							lastCreatedSceneNode.updateAbsolutePosition();
							break;
						default:
							if(depth == 0 && !this.CopyRootNodeChildren) scene.AmbientLight = this.ReadColorF();
							this.SkipToNextTag();
							break
					}
					break;
				case 11:
					let mat = this.ReadMaterial();
					lastCreatedSceneNode && lastCreatedSceneNode.getMaterial(materialCountRead) && lastCreatedSceneNode.getMaterial(materialCountRead).setFrom(mat);
					++materialCountRead;
					break;
				case 25:
					if(lastCreatedSceneNode == null && depth == 0) lastCreatedSceneNode = scene.getRootSceneNode();
					this.ReadAnimator(lastCreatedSceneNode, scene);
					break;
				default:
					this.SkipToNextTag();
			}
			lastCreatedSceneNode && lastCreatedSceneNode.onDeserializedWithChildren();
		}
	}

	/**
	 * @param {CL3D.MeshSceneNode} node
	 */
	readFlaceMeshNode(node)
	{
		let nextTagPos = this.NextTagPos;
		node.Box = this.Read3DBoxF();
		this.Data.readBoolean();
		node.ReceivesStaticShadows = this.Data.readBoolean();
		node.DoesCollision = this.Data.readBoolean();
		node.OccludesLight = this.Data.readBoolean();
		for(; this.Data.bytesAvailable() > 0 && this.Data.getPosition() < nextTagPos;) switch (this.readTag())
		{
			case 14:
				node.OwnedMesh = this.ReadMesh();
				break;
			default:
				this.SkipToNextTag();
		}
	}

	ReadMesh()
	{
		let mesh = new CL3D.Mesh;
		mesh.Box = this.Read3DBoxF();
		for(let nextTagPos = this.NextTagPos; this.Data.bytesAvailable() > 0 && this.Data.getPosition() < nextTagPos;) switch (this.readTag())
		{
			case 15:
				let buffer = this.ReadMeshBuffer();
				buffer != null && mesh.AddMeshBuffer(buffer);
				break;
			default:
				this.SkipToNextTag();
		}
		return mesh;
	}

	ReadMeshBuffer()
	{
		let buffer = new CL3D.MeshBuffer;
		buffer.Box = this.Read3DBoxF();
		for(let nextTagPos = this.NextTagPos; this.Data.bytesAvailable() > 0 && this.Data.getPosition() < nextTagPos;) switch (this.readTag())
		{
			case 11:
				buffer.Mat = this.ReadMaterial();
				break;
			case 16:
				let indicesCount = Math.floor(this.CurrentTagSize / 2);
				for(let index = 0; index < indicesCount; ++index) buffer.Indices.push(this.Data.readShort());
				break;
			case 17:
				let verticesCount = Math.floor(this.CurrentTagSize / 36);
				for(let index = 0; index < verticesCount; ++index)
				{
					let vertex3d = new CL3D.Vertex3D;
					vertex3d.Pos = this.Read3DVectF();
					vertex3d.Normal = this.Read3DVectF();
					vertex3d.Color = this.Data.readInt();
					vertex3d.TCoords = this.Read2DVectF();
					vertex3d.TCoords2 = new CL3D.Vect2d;
					buffer.Vertices.push(vertex3d);
				}
				break;
			case 18:
				let tCoordsVerticesCount = Math.floor(this.CurrentTagSize / 44);
				for(let index = 0; index < tCoordsVerticesCount; ++index)
				{
					let vertex3d = new CL3D.Vertex3D;
					vertex3d.Pos = this.Read3DVectF();
					vertex3d.Normal = this.Read3DVectF();
					vertex3d.Color = this.Data.readInt();
					vertex3d.TCoords = this.Read2DVectF();
					vertex3d.TCoords2 = this.Read2DVectF();
					buffer.Vertices.push(vertex3d);
				}
				break;
			case 19:
				let TangentsVerticesCount = this.CurrentTagSize / 60;
				buffer.Tangents = [];
				buffer.Binormals = [];
				for(let index = 0; index < TangentsVerticesCount; ++index)
				{
					let vertex3d = new CL3D.Vertex3D;
					vertex3d.Pos = this.Read3DVectF();
					vertex3d.Normal = this.Read3DVectF();
					vertex3d.Color = this.Data.readInt();
					vertex3d.TCoords = this.Read2DVectF();
					vertex3d.TCoords2 = new CL3D.Vect2d;
					buffer.Tangents.push(this.Read3DVectF());
					buffer.Binormals.push(this.Read3DVectF());
					buffer.Vertices.push(vertex3d);
				}
				break;
			default:
				this.SkipToNextTag();
		}
		return buffer;
	}

	ReadMaterial()
	{
		let mat = new CL3D.Material;
		mat.Type = this.Data.readInt();
		this.Data.readInt();
		this.Data.readInt();
		this.Data.readInt();
		this.Data.readInt();
		this.Data.readFloat();
		this.Data.readInt();
		this.Data.readInt();
		this.Data.readBoolean();
		this.Data.readBoolean();
		mat.Lighting = this.Data.readBoolean();
		mat.ZWriteEnabled = this.Data.readBoolean();
		this.Data.readByte();
		mat.BackfaceCulling = this.Data.readBoolean();
		this.Data.readBoolean();
		this.Data.readBoolean();
		this.Data.readBoolean();
		for(let index = 0; index < 4; ++index)
		{
			let texture = this.ReadTextureRef();
			switch (index)
			{
				case 0:
					mat.Tex1 = texture;
					break;
				case 1:
					mat.Tex2 = texture;
					break;
			}
			this.Data.readBoolean();
			this.Data.readBoolean();
			this.Data.readBoolean();
			if(this.Data.readShort() != 0) switch (index)
			{
				case 0:
					mat.ClampTexture1 = true;
					break;
				case 1:
					break;
			}
		}
		return mat;
	}

	ReadFileStrRef()
	{
		return this.ReadString();
	}

	ReadSoundRef()
	{
		let sound = this.PathRoot + this.ReadFileStrRef();
		return CL3D.gSoundManager.getSoundFromSoundName(sound, true);
	}

	ReadTextureRef()
	{
		let texturePath = "";
		let texture = this.ReadFileStrRef();
		if (this.Filename.indexOf(".ccp") != -1) texturePath = texture;
		else texturePath = this.PathRoot + texture;
		if(this.TheTextureManager != null && texture != "") return this.TheTextureManager.getTexture(texturePath, true);
		return null;
	}

	/**
	 * @ignore
	 * @param {CL3D.HotspotSceneNode} node
	 */
	readFlaceHotspotNode(node)
	{
		let nextTagPos = this.NextTagPos;
		node.Box = this.Read3DBoxF();
		node.Width = this.Data.readInt();
		node.Height = this.Data.readInt();
		for(; this.Data.bytesAvailable() > 0 && this.Data.getPosition() < nextTagPos;) switch (this.readTag())
		{
			case 3:
				this.readHotspotData(node);
				break;
			default:
				this.SkipToNextTag();
		}
	}

	/**
	 * @ignore
	 * @param {CL3D.HotspotSceneNode} node
	 */
	readHotspotData(node)
	{
		let nextTagPos = this.NextTagPos;
		node.caption = this.ReadString();
		node.TheTexture = this.ReadTextureRef();
		this.Read2DVectF();
		this.Data.readInt();
		node.dateLimit = this.ReadString();
		node.useDateLimit = this.Data.readBoolean();
		for(; this.Data.bytesAvailable() > 0 && this.Data.getPosition() < nextTagPos;) switch (this.readTag())
		{
			case 6:
				node.bExecuteJavaScript = true;
				node.executeJavaScript = this.ReadString();
				break;
			case 4:
				node.bGotoScene = true;
				node.gotoScene = this.ReadString();
				break;
			case 5:
				node.bOpenWebsite = true;
				node.website = this.ReadString();
				node.websiteTarget = this.ReadString();
				break;
			default:
				this.SkipToNextTag();
		}
	}

	/**
	 * @param {CL3D.CameraSceneNode} node
	 */
	readFlaceCameraNode(node)
	{
		node.Box = this.Read3DBoxF();
		node.Target = this.Read3DVectF();
		node.UpVector = this.Read3DVectF();
		node.Fovy = this.Data.readFloat();
		node.Aspect = this.Data.readFloat();
		node.ZNear = this.Data.readFloat();
		node.ZFar = this.Data.readFloat();
		node.Active = this.Data.readBoolean();
		node.recalculateProjectionMatrix();
	}

	/**
	 * @param {CL3D.WaterSurfaceSceneNode} node
	 */
	readWaterNode(node)
	{
		this.Data.readInt();
		node.Details = this.Data.readInt();
		node.WaterFlowDirection.X = this.Data.readFloat();
		node.WaterFlowDirection.Y = this.Data.readFloat();
		node.WaveLength = this.Data.readFloat();
		node.WaveHeight = this.Data.readFloat();
		node.WaterColor = this.Data.readInt();
		node.ColorWhenUnderwater = this.Data.readBoolean();
		node.UnderWaterColor = this.Data.readInt();
		this.readFlaceMeshNode(node);
	}

	/**
	 * @param {CL3D.LightSceneNode} node
	 */
	readFlaceLightNode(node)
	{
		node.Box = this.Read3DBoxF();
		if(this.Data.readInt() == 2) node.LightData.IsDirectional = true;
		node.LightData.Color = this.ReadColorF();
		this.ReadColorF();
		this.Data.readBoolean();
		node.LightData.Direction = this.Read3DVectF();
		node.LightData.Radius = this.Data.readFloat();
		if(node.LightData.Radius != 0) node.LightData.Attenuation = 1 / node.LightData.Radius;
	}

	/**
	 * @param {CL3D.BillboardSceneNode} node
	 */
	readFlaceBillBoardNode(node)
	{
		node.MeshBuffer.Box = this.Read3DBoxF();
		node.Box = node.MeshBuffer.Box;
		node.SizeX = this.Data.readFloat();
		node.SizeY = this.Data.readFloat();
		node.IsVertical = (this.Data.readByte() & 2) != 0;
	}

	/**
	 * @param {CL3D.SoundSceneNode} node
	 */
	readFlace3DSoundNode(node)
	{
		node.Box = this.Read3DBoxF();
		node.TheSound = this.ReadSoundRef();
		node.MinDistance = this.Data.readFloat();
		node.MaxDistance = this.Data.readFloat();
		node.PlayMode = this.Data.readInt();
		node.DeleteWhenFinished = this.Data.readBoolean();
		node.MaxTimeInterval = this.Data.readInt();
		node.MinTimeInterval = this.Data.readInt();
		node.Volume = this.Data.readFloat();
		node.PlayAs2D = this.Data.readBoolean();
		this.Data.readInt();
	}

	/**
	 * @param {CL3D.PathSceneNode} node
	 */
	readFlacePathNode(node)
	{
		node.Box = this.Read3DBoxF();
		node.Tightness = this.Data.readFloat();
		node.IsClosedCircle = this.Data.readBoolean();
		this.Data.readInt();
		let countNodes = this.Data.readInt();
		for(let index = 0; index < countNodes; ++index) node.Nodes.push(this.Read3DVectF());
	}

	/**
	 * @param {CL3D.ParticleSystemSceneNode} node
	 */
	readParticleSystemSceneNode(node)
	{
		node.Direction = this.Read3DVectF();
		node.MaxAngleDegrees = this.Data.readInt();
		node.EmittArea = this.Read3DVectF();
		node.MinLifeTime = this.Data.readInt();
		node.MaxLifeTime = this.Data.readInt();
		node.MaxParticles = this.Data.readInt();
		node.MinParticlesPerSecond = this.Data.readInt();
		node.MaxParticlesPerSecond = this.Data.readInt();
		node.MinStartColor = this.Data.readInt();
		node.MaxStartColor = this.Data.readInt();
		node.MinStartSizeX = this.Data.readFloat();
		node.MinStartSizeY = this.Data.readFloat();
		node.MaxStartSizeX = this.Data.readFloat();
		node.MaxStartSizeY = this.Data.readFloat();
		let flag = this.Data.readInt();
		if(flag & 1)
		{
			node.FadeOutAffector = true;
			node.FadeOutTime = this.Data.readInt();
			node.FadeTargetColor = this.Data.readInt()
		}
		else node.FadeOutAffector = false;
		if(flag & 2)
		{
			node.GravityAffector = true;
			node.GravityAffectingTime = this.Data.readInt();
			node.Gravity = this.Read3DVectF();
		}
		else node.GravityAffector = false;
		if(flag & 4)
		{
			node.ScaleAffector = true;
			node.ScaleToX = this.Data.readFloat();
			node.ScaleToY = this.Data.readFloat();
		}
		else node.ScaleAffector = false;
	}

	/**
	 * @param {CL3D.Mobile2DInputSceneNode} node
	 */
	readFlace2DMobileInput(node)
	{
		this.Data.readInt();
		node.SizeModeIsAbsolute = this.Data.readBoolean();
		if(node.SizeModeIsAbsolute)
		{
			node.PosAbsoluteX = this.Data.readInt();
			node.PosAbsoluteY = this.Data.readInt();
			node.SizeAbsoluteWidth = this.Data.readInt();
			node.SizeAbsoluteHeight = this.Data.readInt();
		}
		else
		{
			node.PosRelativeX = this.Data.readFloat();
			node.PosRelativeY = this.Data.readFloat();
			node.SizeRelativeWidth = this.Data.readFloat();
			node.SizeRelativeHeight = this.Data.readFloat();
		}
		node.ShowBackGround = this.Data.readBoolean();
		node.BackGroundColor = this.Data.readInt();
		node.Texture = this.ReadTextureRef();
		node.TextureHover = this.ReadTextureRef();
		node.RetainAspectRatio = this.Data.readBoolean();
		node.CursorTex = this.ReadTextureRef();
		node.InputMode = this.Data.readInt();
		if(node.InputMode == 1) node.KeyCode = this.Data.readInt();
	}

	/**
	 * @param {CL3D.Overlay2DSceneNode} node
	 */
	readFlace2DOverlay(node)
	{
		if(this.Data.readInt() & 1) node.BlurImage = true;
		node.SizeModeIsAbsolute = this.Data.readBoolean();
		if(node.SizeModeIsAbsolute)
		{
			node.PosAbsoluteX = this.Data.readInt();
			node.PosAbsoluteY = this.Data.readInt();
			node.SizeAbsoluteWidth = this.Data.readInt();
			node.SizeAbsoluteHeight = this.Data.readInt();
		}
		else
		{
			node.PosRelativeX = this.Data.readFloat();
			node.PosRelativeY = this.Data.readFloat();
			node.SizeRelativeWidth = this.Data.readFloat();
			node.SizeRelativeHeight = this.Data.readFloat();
		}
		node.ShowBackGround = this.Data.readBoolean();
		node.BackGroundColor = this.Data.readInt();
		node.Texture = this.ReadTextureRef();
		node.TextureHover = this.ReadTextureRef();
		node.RetainAspectRatio = this.Data.readBoolean();
		node.DrawText = this.Data.readBoolean();
		node.TextAlignment = this.Data.readByte();
		node.Text = this.ReadString();
		node.FontName = this.ReadString();
		node.TextColor = this.Data.readInt();
		node.AnimateOnHover = this.Data.readBoolean();
		node.OnHoverSetFontColor = this.Data.readBoolean();
		node.HoverFontColor = this.Data.readInt();
		node.OnHoverSetBackgroundColor = this.Data.readBoolean();
		node.HoverBackgroundColor = this.Data.readInt();
		node.OnHoverDrawTexture = this.Data.readBoolean();
	}

	/**
	 * @param {CL3D.SceneNode} node
	 * @param {CL3D.Scene} scene
	 * @returns
	 */
	ReadAnimator(node, scene)
	{
		if(node)
		{
			let animator = null;
			let flag = 0;
			let type = this.Data.readInt();
			switch (type)
			{
				case 100:
					animator = new CL3D.AnimatorRotation;
					animator.Rotation = this.Read3DVectF();
					break;
				case 101:
					animator = new CL3D.AnimatorFlyStraight;
					animator.Start = this.Read3DVectF();
					animator.End = this.Read3DVectF();
					animator.TimeForWay = this.Data.readInt();
					animator.Loop = this.Data.readBoolean();
					animator.recalculateImidiateValues();
					break;
				case 102:
					animator = new CL3D.AnimatorFlyCircle;
					animator.Center = this.Read3DVectF();
					animator.Direction = this.Read3DVectF();
					animator.Radius = this.Data.readFloat();
					animator.Speed = this.Data.readFloat();
					animator.init();
					break;
				case 103:
					animator = new CL3D.AnimatorCollisionResponse;
					animator.Radius = this.Read3DVectF();
					this.Data.readFloat();
					animator.AffectedByGravity = !CL3D.equals(this.Data.readFloat(), 0);
					this.Data.readFloat();
					animator.Translation = this.Read3DVectF();
					flag = this.Data.readInt();
					this.Data.readInt();
					this.Data.readInt();
					if(flag & 1) animator.UseInclination = true;
					animator.SlidingSpeed = this.Data.readFloat();
					break;
				case 104:
					animator = new CL3D.AnimatorCameraFPS(node, this.CursorControl);
					animator.MaxVerticalAngle = this.Data.readFloat();
					animator.MoveSpeed = this.Data.readFloat();
					animator.RotateSpeed = this.Data.readFloat();
					animator.JumpSpeed = this.Data.readFloat();
					animator.NoVerticalMovement = this.Data.readBoolean();
					flag = this.Data.readInt();
					if(flag & 1)
					{
						animator.moveByMouseMove = false;
						animator.moveByMouseDown = true;
					}
					else
					{
						animator.moveByMouseMove = true;
						animator.moveByMouseDown = false;
					}
					if(flag & 2) animator.MoveSmoothing = this.Data.readInt();
					if(flag & 4) animator.ChildrenDontUseZBuffer = true;
					if(node.getType() == "camera")
					{
						animator.targetZoomValue = CL3D.radToDeg(node.Fovy);
						animator.maxZoom = node.targetZoomValue + 10;
						animator.zoomSpeed = (node.maxZoom - node.minZoom) / 50;
					}
					break;
				case 105:
					animator = new CL3D.AnimatorCameraModelViewer(node, this.CursorControl);
					animator.Radius = this.Data.readFloat();
					animator.RotateSpeed = this.Data.readFloat();
					animator.NoVerticalMovement = this.Data.readBoolean();
					flag = this.Data.readInt();
					if(flag & 2)
					{
						animator.SlideAfterMovementEnd = true;
						animator.SlidingSpeed = this.Data.readFloat();
					}
					if(flag & 4)
					{
						animator.AllowZooming = true;
						animator.MinZoom = this.Data.readFloat();
						animator.MaxZoom = this.Data.readFloat();
						animator.ZoomSpeed = this.Data.readFloat();
					}
					break;
				case 106:
					animator = new CL3D.AnimatorFollowPath(scene);
					animator.TimeNeeded = this.Data.readInt();
					animator.LookIntoMovementDirection = this.Data.readBoolean();
					animator.PathToFollow = this.ReadString();
					animator.OnlyMoveWhenCameraActive = this.Data.readBoolean();
					animator.AdditionalRotation = this.Read3DVectF();
					animator.EndMode = this.Data.readByte();
					animator.CameraToSwitchTo = this.ReadString();
					flag = this.Data.readInt();
					if(flag & 1) animator.TimeDisplacement = this.Data.readInt();
					if(animator.EndMode == 3 || animator.EndMode == 4) animator.TheActionHandler = this.ReadActionHandlerSection(scene);
					break;
				case 107:
					animator = new CL3D.AnimatorOnClick(scene, this.CursorControl);
					animator.BoundingBoxTestOnly = this.Data.readBoolean();
					animator.CollidesWithWorld = this.Data.readBoolean();
					this.Data.readInt();
					animator.TheActionHandler = this.ReadActionHandlerSection(scene);
					break;
				case 108:
					animator = new CL3D.AnimatorOnProximity(scene);
					animator.EnterType = this.Data.readInt();
					animator.ProximityType = this.Data.readInt();
					animator.Range = this.Data.readFloat();
					animator.SceneNodeToTest = this.Data.readInt();
					flag = this.Data.readInt();
					if(flag & 1)
					{
						animator.AreaType = 1;
						animator.RangeBox = this.Read3DVectF()
					}
					animator.TheActionHandler = this.ReadActionHandlerSection(scene);
					break;
				case 109:
					animator = new CL3D.AnimatorAnimateTexture;
					animator.TextureChangeType = this.Data.readInt();
					animator.TimePerFrame = this.Data.readInt();
					animator.TextureIndexToChange = this.Data.readInt();
					animator.Loop = this.Data.readBoolean();
					let tanimcount = this.Data.readInt();
					animator.Textures = [];
					for(let index = 0; index < tanimcount; ++index) animator.Textures.push(this.ReadTextureRef());
					break;
				case 110:
					animator = new CL3D.AnimatorOnMove(scene, this.CursorControl);
					animator.BoundingBoxTestOnly = this.Data.readBoolean();
					animator.CollidesWithWorld = this.Data.readBoolean();
					this.Data.readInt();
					animator.ActionHandlerOnLeave = this.ReadActionHandlerSection(scene);
					animator.ActionHandlerOnEnter = this.ReadActionHandlerSection(scene);
					break;
				case 111:
					animator = new CL3D.AnimatorTimer(scene);
					animator.TickEverySeconds = this.Data.readInt();
					this.Data.readInt();
					animator.TheActionHandler = this.ReadActionHandlerSection(scene);
					break;
				case 112:
					animator = new CL3D.AnimatorOnKeyPress(scene, this.CursorControl);
					animator.KeyPressType = this.Data.readInt();
					animator.KeyCode = this.Data.readInt();
					animator.IfCameraOnlyDoIfActive = this.Data.readBoolean();
					this.Data.readInt();
					animator.TheActionHandler = this.ReadActionHandlerSection(scene);
					break;
				case 113:
					animator = new CL3D.AnimatorGameAI(scene);
					animator.AIType = this.Data.readInt();
					animator.MovementSpeed = this.Data.readFloat();
					animator.ActivationRadius = this.Data.readFloat();
					animator.CanFly = this.Data.readBoolean();
					animator.Health = this.Data.readInt();
					animator.Tags = this.ReadString();
					animator.AttacksAIWithTags = this.ReadString();
					animator.PatrolRadius = this.Data.readFloat();
					animator.RotationSpeedMs = this.Data.readInt();
					animator.AdditionalRotationForLooking = this.Read3DVectF();
					animator.StandAnimation = this.ReadString();
					animator.WalkAnimation = this.ReadString();
					animator.DieAnimation = this.ReadString();
					animator.AttackAnimation = this.ReadString();
					if(animator.AIType == 3) animator.PathIdToFollow = this.Data.readInt();
					flag = this.Data.readInt();
					if(flag & 1) animator.PatrolWaitTimeMs = this.Data.readInt();
					else
					{
						animator.PatrolWaitTimeMs = 1E4;
						if(animator.MovementSpeed != 0) animator.PatrolWaitTimeMs = animator.PatrolRadius / (animator.MovementSpeed / 1E3);
					}
					animator.ActionHandlerOnAttack = this.ReadActionHandlerSection(scene);
					animator.ActionHandlerOnActivate = this.ReadActionHandlerSection(scene);
					animator.ActionHandlerOnHit = this.ReadActionHandlerSection(scene);
					animator.ActionHandlerOnDie = this.ReadActionHandlerSection(scene);
					break;
				case 114:
					animator = new CL3D.Animator3rdPersonCamera;
					animator.SceneNodeIDToFollow = this.Data.readInt();
					animator.AdditionalRotationForLooking = this.Read3DVectF();
					animator.FollowMode = this.Data.readInt();
					animator.FollowSmoothingSpeed = this.Data.readFloat();
					animator.TargetHeight = this.Data.readFloat();
					flag = this.Data.readInt();
					animator.CollidesWithWorld = flag & 1 ? true : false;
					break;
				case 115:
					animator = new CL3D.AnimatorKeyboardControlled(scene, this.CursorControl);
					this.Data.readInt();
					animator.RunSpeed = this.Data.readFloat();
					animator.MoveSpeed = this.Data.readFloat();
					animator.RotateSpeed = this.Data.readFloat();
					animator.JumpSpeed = this.Data.readFloat();
					animator.AdditionalRotationForLooking = this.Read3DVectF();
					animator.StandAnimation = this.ReadString();
					animator.WalkAnimation = this.ReadString();
					animator.JumpAnimation = this.ReadString();
					animator.RunAnimation = this.ReadString();
					flag = this.Data.readInt();
					if(flag & 1) animator.DisableWithoutActiveCamera = true;
					if(flag & 2)
					{
						animator.UseAcceleration = true;
						animator.AccelerationSpeed = this.Data.readFloat();
						animator.DecelerationSpeed = this.Data.readFloat();
					}
					if(flag & 4) animator.PauseAfterJump = true;
					break;
				case 116:
					animator = new CL3D.AnimatorOnFirstFrame(scene);
					animator.AlsoOnReload = this.Data.readBoolean();
					this.Data.readInt();
					animator.TheActionHandler = this.ReadActionHandlerSection(scene);
					break;
				case 117:
					animator = new CL3D.AnimatorExtensionScript(scene);
					animator.JsClassName = this.ReadString();
					this.Data.readInt();
					this.ReadExtensionScriptProperties(animator.Properties, scene);
					break;
				default:
					animator = CL3D.Extensions.readAnimator(this, type, node, scene);
					animator || this.SkipToNextTag();
					return;
			}
			animator && node.addAnimator(animator);
		}
		else this.SkipToNextTag();
	}

	/**
	 * @param {Array} props
	 * @param {CL3D.Scene} scene
	 */
	ReadExtensionScriptProperties(props, scene)
	{
		let propCount = this.Data.readInt()
		for(let index = 0; index < propCount; ++index)
		{
			let prop = new CL3D.ExtensionScriptProperty;
			prop.Type = this.Data.readInt();
			prop.Name = this.ReadString();
			switch (prop.Type)
			{
				case 1:
					prop.FloatValue = this.Data.readFloat();
					break;
				case 2:
					prop.StringValue = this.ReadString();
					break;
				case 6:
					prop.VectorValue = this.Read3DVectF();
					break;
				case 7:
					prop.TextureValue = this.ReadTextureRef();
					break;
				case 9:
					prop.ActionHandlerValue = this.ReadActionHandlerSection(scene);
					break;
				case 0:
				case 4:
				case 5:
				case 8:
				case 3:
				default:
					prop.IntValue = this.Data.readInt();
					break;
			}
			props.push(prop);
		}
	}

	/**
	 * @param {CL3D.Scene} scene
	 * @returns
	 */
	ReadActionHandlerSection(scene)
	{
		if(this.Data.readInt())
		{
			let actionHandler = new CL3D.ActionHandler(scene);
			this.ReadActionHandler(actionHandler, scene);
			return actionHandler;
		}
		return null;
	}

	/**
	 * @param {CL3D.ActionHandler} actionHandler
	 * @param {CL3D.Scene} scene
	 */
	ReadActionHandler(actionHandler, scene)
	{
		let tag = this.readTag();
		if(tag != 29) this.SkipToNextTag();
		else
			for(let nextTagPos = this.NextTagPos; this.Data.bytesAvailable() > 0 && this.Data.getPosition() < nextTagPos;)
			{
				let tag = this.readTag();
				if(tag == 30) {
					let action = this.ReadAction(this.Data.readInt(), scene);
				  	if(action) actionHandler.addAction(action);
				}
				else this.SkipToNextTag();
			}
	}

	async readEmbeddedFiles()
	{
		for(let nextTagPos = this.NextTagPos; this.Data.bytesAvailable() > 0 && this.Data.getPosition() < nextTagPos;) switch (this.readTag())
		{
			case 13:
				let flag = this.Data.readInt(),
					name = this.ReadString(),
					filesize = this.Data.readInt();
				if(flag & 4)
				{
					let mesh = this.TheMeshCache.getMeshFromName(name);
					if (mesh) mesh.containsData() ? this.SkipToNextTag() : this.readSkinnedMesh(mesh, filesize);
				}
				else if(flag & 8)
				{
					let code = "";
					try
					{
						code = this.readUTFBytes(filesize);
					}
					catch (error)
					{
						console.log("error reading script: " + error);
					}

					code = code.replaceAll("__dirname", getDirName());
					code != null && await CL3D.ScriptingInterface.getScriptingInterface().importCode(code);
				}
				this.SkipToNextTag();
				break;
			default:
				this.SkipToNextTag();
		}
	}

	/**
	 * @param {CL3D.AnimatedMeshSceneNode} node
	 */
	readFlaceAnimatedMeshNode(node)
	{
		node.Box = this.Read3DBoxF();
		this.Data.readBoolean();
		this.Data.readInt();
		let startFrame = this.Data.readInt(),
			endFrame = this.Data.readInt();
		node.FramesPerSecond = this.Data.readFloat();
		this.Data.readByte();
		node.Looping = this.Data.readBoolean();
		let flag = this.Data.readInt();
		if(flag == 0)
		{
			node.BlendTimeMs = 250;
			node.AnimationBlendingEnabled = true;
		}
		else if(flag & 1)
		{
			node.BlendTimeMs = this.Data.readInt();
			node.AnimationBlendingEnabled = node.BlendTimeMs > 0;
		}
		node.setMesh(this.ReadAnimatedMeshRef(node));
		node.StartFrame = startFrame;
		node.EndFrame = endFrame;
		if(flag & 2)
		{
			let dummyCount = this.Data.readInt();
			for(let index = 0; index < dummyCount; ++index)
			{
				let dummy = new CL3D.SAnimatedDummySceneNodeChild;
				dummy.NodeIDToLink = this.Data.readInt();
				dummy.JointIdx = this.Data.readInt();
				node.AnimatedDummySceneNodes.push(dummy);
			}
		}
	}

	/**
	 * @param {CL3D.AnimatedMeshSceneNode} nodeToLink
	 * @returns
	 */
	ReadAnimatedMeshRef(nodeToLink)
	{
		let name = this.ReadFileStrRef(),
			mesh = this.TheMeshCache.getMeshFromName(name);
		if(mesh == null)
		{
			mesh = new CL3D.SkinnedMesh;
			mesh.Name = name;;
			this.TheMeshCache.addMesh(mesh);
		}
		if(nodeToLink != null && mesh != null)
		{
			if(mesh.AnimatedMeshesToLink == null) mesh.AnimatedMeshesToLink = [];
			mesh.AnimatedMeshesToLink.push(nodeToLink);
		}
		return mesh;
	}

	/**
	 * @param {CL3D.SkinnedMesh|CL3D.SkinnedMeshJoint} mesh
	 * @param {Number} size
	 */
	readSkinnedMesh(mesh, size)
	{
		if(mesh != null)
		{
			let flag = this.Data.readInt();
			mesh.DefaultFPS = this.Data.readFloat();
			if(flag & 1) mesh.StaticCollisionBoundingBox = this.Read3DBoxF();
			let nextTagPos = this.NextTagPos;
			let endSkinnedMeshPos = this.Data.getPosition() + size;
			let loadedJoints = [];
			for(let index = 0; this.Data.bytesAvailable() > 0 && this.Data.getPosition() < nextTagPos && this.Data.getPosition() < endSkinnedMeshPos;)
			{
				let tag = this.readTag();
				if(tag == 33)
				{
					let joint = new CL3D.SkinnedMeshJoint;
					joint.Name = this.ReadString();
					joint.LocalMatrix = this.ReadMatrix();
					joint.GlobalInversedMatrix = this.ReadMatrix();
					mesh.AllJoints.push(joint);

					let parentIndex = this.Data.readInt();
					loadedJoints.push(joint);
					parentIndex >= 0 && parentIndex < loadedJoints.length && loadedJoints[parentIndex].Children.push(joint);

					let attachedMeshesCount = this.Data.readInt();
					for(let index = 0; index < attachedMeshesCount; ++index) joint.AttachedMeshes.push(this.Data.readInt());

					let keycount = this.Data.readInt();
					for(index = 0; index < keycount; ++index)
					{
						let posKey = new CL3D.SkinnedMeshPositionKey;
						posKey.frame = this.Data.readFloat();
						posKey.position = this.Read3DVectF();
						joint.PositionKeys.push(posKey);
					}

					keycount = this.Data.readInt();
					for(index = 0; index < keycount; ++index)
					{
						let scaleKey = new CL3D.SkinnedMeshScaleKey;
						scaleKey.frame = this.Data.readFloat();
						scaleKey.scale = this.Read3DVectF();
						joint.ScaleKeys.push(scaleKey);
					}

					keycount = this.Data.readInt();
					for(index = 0; index < keycount; ++index)
					{
						let rotKey = new CL3D.SkinnedMeshRotationKey;
						rotKey.frame = this.Data.readFloat();
						rotKey.rotation = this.ReadQuaternion();
						joint.RotationKeys.push(rotKey);
					}

					keycount = this.Data.readInt();
					for(index = 0; index < keycount; ++index)
					{
						let weight = new CL3D.SkinnedMeshWeight;
						weight.buffer_id = this.Data.readUnsignedShort();
						weight.vertex_id = this.Data.readInt();
						weight.strength = this.Data.readFloat();
						joint.Weights.push(weight);
					}
				}
				else if(tag == 15)
				{
					let buffer = this.ReadMeshBuffer();
					buffer != null && mesh.AddMeshBuffer(buffer);
				}
				else if(tag == 34)
				{
					let range = new CL3D.NamedAnimationRange;
					range.Name = this.ReadString();
					range.Begin = this.Data.readFloat();
					range.End = this.Data.readFloat();
					range.FPS = this.Data.readFloat();
					mesh.addNamedAnimationRange(range);
				}
				else this.SkipToNextTag();
			}
			try
			{
				mesh.finalize();
			}
			catch (error)
			{
				console.log("error finalizing skinned mesh: " + error);
			}
			if(mesh.AnimatedMeshesToLink && mesh.AnimatedMeshesToLink.length)
			{
				for(let index = 0; index < mesh.AnimatedMeshesToLink.length; ++index) {
					let node = mesh.AnimatedMeshesToLink[index];
					if (node) node.setFrameLoop(node.StartFrame, node.EndFrame);
				}

				mesh.AnimatedMeshesToLink = null;
			}
		}
	}

	/**
	 * @param {Number} actionType
	 * @param {CL3D.Scene} scene
	 * @returns
	 */
	ReadAction(actionType, scene)
	{
		let action = null;
		let flag = 0;
		switch (actionType)
		{
			case 0:
				action = new CL3D.ActionMakeSceneNodeInvisible;
				action.InvisibleMakeType = this.Data.readInt();
				action.SceneNodeToMakeInvisible = this.Data.readInt();
				action.ChangeCurrentSceneNode = this.Data.readBoolean();
				this.Data.readInt();
				return action;
			case 1:
				action = new CL3D.ActionChangeSceneNodePosition;
				action.PositionChangeType = this.Data.readInt();
				action.SceneNodeToChangePosition = this.Data.readInt();
				action.ChangeCurrentSceneNode = this.Data.readBoolean();
				action.Vector = this.Read3DVectF();
				if(action.PositionChangeType == 4) action.Area3DEnd = this.Read3DVectF();
				action.RelativeToCurrentSceneNode = this.Data.readBoolean();
				action.SceneNodeRelativeTo = this.Data.readInt();
				flag = this.Data.readInt();
				if(flag & 1)
				{
					action.UseAnimatedMovement = true;
					action.TimeNeededForMovementMs = this.Data.readInt()
				}
				return action;
			case 2:
				action = new CL3D.ActionChangeSceneNodeRotation;
				action.RotationChangeType = this.Data.readInt();
				action.SceneNodeToChangeRotation = this.Data.readInt();
				action.ChangeCurrentSceneNode = this.Data.readBoolean();
				action.Vector = this.Read3DVectF();
				action.RotateAnimated = false;
				flag = this.Data.readInt();
				if(flag & 1)
				{
					action.RotateAnimated = true;
					action.TimeNeededForRotationMs = this.Data.readInt()
				}
				return action;
			case 3:
				action = new CL3D.ActionChangeSceneNodeScale;
				action.ScaleChangeType = this.Data.readInt();
				action.SceneNodeToChangeScale = this.Data.readInt();
				action.ChangeCurrentSceneNode = this.Data.readBoolean();
				action.Vector = this.Read3DVectF();
				this.Data.readInt();
				return action;
			case 4:
				action = new CL3D.ActionChangeSceneNodeTexture;
				action.TextureChangeType = this.Data.readInt();
				action.SceneNodeToChange = this.Data.readInt();
				action.ChangeCurrentSceneNode = this.Data.readBoolean();
				action.TheTexture = this.ReadTextureRef();
				if(action.TextureChangeType == 1) action.IndexToChange = this.Data.readInt();
				this.Data.readInt();
				return action;
			case 5:
				action = new CL3D.ActionPlaySound;
				flag = this.Data.readInt();
				action.PlayLooped = (flag & 1) != 0;
				action.TheSound = this.ReadSoundRef();
				action.MinDistance = this.Data.readFloat();
				action.MaxDistance = this.Data.readFloat();
				action.Volume = this.Data.readFloat();
				action.PlayAs2D = this.Data.readBoolean();
				action.SceneNodeToPlayAt = this.Data.readInt();
				action.PlayAtCurrentSceneNode = this.Data.readBoolean();
				action.Position3D = this.Read3DVectF();
				return action;
			case 6:
				action = new CL3D.ActionStopSound;
				action.SoundChangeType = this.Data.readInt();
				return action;
			case 7:
				action = new CL3D.ActionExecuteJavaScript;
				this.Data.readInt();
				action.JScript = this.ReadString();
				return action;
			case 8:
				action = new CL3D.ActionOpenWebpage;
				this.Data.readInt();
				action.Webpage = this.ReadString();
				action.Target = this.ReadString();
				return action;
			case 9:
				action = new CL3D.ActionSetSceneNodeAnimation;
				action.SceneNodeToChangeAnim = this.Data.readInt();
				action.ChangeCurrentSceneNode = this.Data.readBoolean();
				action.Loop = this.Data.readBoolean();
				action.AnimName = this.ReadString();
				this.Data.readInt();
				return action;
			case 10:
				action = new CL3D.ActionSwitchToScene(this.CursorControl);
				action.SceneName = this.ReadString();
				this.Data.readInt();
				return action;
			case 11:
				action = new CL3D.ActionSetActiveCamera(this.CursorControl);
				action.CameraToSetActive = this.Data.readInt();
				this.Data.readInt();
				return action;
			case 12:
				action = new CL3D.ActionSetCameraTarget;
				action.PositionChangeType = this.Data.readInt();
				action.SceneNodeToChangePosition = this.Data.readInt();
				action.ChangeCurrentSceneNode = this.Data.readBoolean();
				action.Vector = this.Read3DVectF();
				action.RelativeToCurrentSceneNode = this.Data.readBoolean();
				action.SceneNodeRelativeTo = this.Data.readInt();
				flag = this.Data.readInt();
				if(flag & 1)
				{
					action.UseAnimatedMovement = true;
					action.TimeNeededForMovementMs = this.Data.readInt()
				}
				return action;
			case 13:
				action = new CL3D.ActionShoot;
				action.ShootType = this.Data.readInt();
				action.Damage = this.Data.readInt();
				action.BulletSpeed = this.Data.readFloat();
				action.SceneNodeToUseAsBullet = this.Data.readInt();
				action.WeaponRange = this.Data.readFloat();
				flag = this.Data.readInt();
				if(flag & 1)
				{
					action.SceneNodeToShootFrom = this.Data.readInt();
					action.ShootToCameraTarget = this.Data.readBoolean();
					action.AdditionalDirectionRotation = this.Read3DVectF()
				}
				if(flag & 2) action.ActionHandlerOnImpact = this.ReadActionHandlerSection(scene);
				if(flag & 4) action.ShootDisplacement = this.Read3DVectF();
				return action;
			case 14:
				/// TODO
				// quit application
				this.SkipToNextTag();
				return null;
			case 15:
				action = new CL3D.ActionSetOverlayText;
				this.Data.readInt();
				action.SceneNodeToChange = this.Data.readInt();
				action.ChangeCurrentSceneNode = this.Data.readBoolean();
				action.Text = this.ReadString();
				return action;
			case 16:
				action = new CL3D.ActionSetOrChangeAVariable;
				this.Data.readInt();
				action.VariableName = this.ReadString();
				action.Operation = this.Data.readInt();
				action.ValueType = this.Data.readInt();
				action.Value = this.ReadString();
				return action;
			case 17:
				action = new CL3D.ActionIfVariable;
				flag = this.Data.readInt();
				action.VariableName = this.ReadString();
				action.ComparisonType = this.Data.readInt();
				action.ValueType = this.Data.readInt();
				action.Value = this.ReadString();
				action.TheActionHandler = this.ReadActionHandlerSection(scene);
				if(flag & 1) action.TheElseActionHandler = this.ReadActionHandlerSection(scene);
				return action;
			case 18:
				action = new CL3D.ActionRestartBehaviors;
				action.SceneNodeToRestart = this.Data.readInt();
				action.ChangeCurrentSceneNode = this.Data.readBoolean();
				this.Data.readInt();
				return action;
			case 19:
				action = new CL3D.ActionStoreLoadVariable;
				this.Data.readInt();
				action.VariableName = this.ReadString();
				action.Load = this.Data.readBoolean();
				return action;
			case 20:
				action = new CL3D.ActionRestartScene(this.CursorControl);
				this.Data.readInt();
				action.SceneName = this.ReadString();
				this.LoadedAReloadAction = true;
				return action;
			case 22:
				action = new CL3D.ActionCloneSceneNode;
				action.SceneNodeToClone = this.Data.readInt();
				action.CloneCurrentSceneNode = this.Data.readBoolean();
				this.Data.readInt();
				action.TheActionHandler = this.ReadActionHandlerSection(scene);
				return action;
			case 23:
				action = new CL3D.ActionDeleteSceneNode;
				action.SceneNodeToDelete = this.Data.readInt();
				action.DeleteCurrentSceneNode = this.Data.readBoolean();
				action.TimeAfterDelete = this.Data.readInt();
				this.Data.readInt();
				return action;
			case 24:
				action = new CL3D.ActionExtensionScript;
				action.JsClassName = this.ReadString();
				this.Data.readInt();
				this.ReadExtensionScriptProperties(action.Properties, scene);
				return action;
			case 25:
				action = new CL3D.ActionPlayMovie(this.CursorControl);
				flag = this.Data.readInt();
				action.PlayLooped = (flag & 1) != 0;
				action.Command = this.Data.readInt();
				action.VideoFileName = this.ReadString();
				this.Data.readInt();
				action.SceneNodeToPlayAt = this.Data.readInt();
				action.PlayAtCurrentSceneNode = this.Data.readBoolean();
				action.MaterialIndex = this.Data.readInt();
				action.ActionHandlerFinished = this.ReadActionHandlerSection(scene);
				action.ActionHandlerFailed = this.ReadActionHandlerSection(scene);
				return action;
			case 26:
				action = new CL3D.ActionStopSpecificSound;
				this.Data.readInt();
				action.TheSound = this.ReadSoundRef();
				return action;
			default:
				this.SkipToNextTag();
		}
		return null;
	}
};
