import * as CL3D from "../main.js";
import { saveFile } from "../share/saveFile.js";

export class FlaceSaver {
    constructor() {
        this.Data = new CL3D.BinaryStream();
    }

    saveDocumentToFile(filepath) {
        this.saveHeader();

        let pos = 0;

        pos = this.startTag(1);
        {
            let pos = this.startTag(1004);
            {
                this.Data.writeInt32LE(0);
            }
            this.endTag(pos);

            this.savePublishSettings();

            for (let index = 0; index < (CL3D.gDocument.Scenes.length); ++index) {
                this.Data.write(new Uint8Array(18)); // unknown data definition
                let pos = this.startTag(2);
                {
                    this.Data.writeInt32LE(0);
                    this.saveSceneParams(CL3D.gDocument.Scenes[index]);
                    let pos = this.startTag(8);
                    {
                        let pos = this.startTag(9);
                        {
                            if (CL3D.gDocument.Scenes[index])
                                this.saveSceneNode(CL3D.gDocument.Scenes[index], CL3D.gDocument.Scenes[index].RootNode, 0);
                        }
                        this.endTag(pos);
                    }
                    this.endTag(pos);
                }
                this.endTag(pos);
            }
        }
        this.endTag(pos);

        pos = this.startTag(12);
        {
            this.saveEmbeddedFiles();
        }
        this.endTag(pos);

        saveFile(filepath, this.Data.buffer);
    }

    ArrayBufferToString(buffer) {
        let data = "";
        let array = new Uint8Array(buffer);
        for (let index = 0; index < array.byteLength; index++) data += String.fromCharCode(array[index]);
        return data;
    }

    StringToUint8Array(str) {
        let buf = new ArrayBuffer(str.length);
        let bufView = new Uint8Array(buf);
        for (let index = 0; index < str.length; index++) {
            bufView[index] = str.charCodeAt(index);
        }
        return bufView;
    }

    StringToUint16Array(str) {
        let buf = new ArrayBuffer(str.length * 2);
        let bufView = new Uint16Array(buf);
        for (let index = 0; index < str.length; index++) {
            bufView[index] = str.charCodeAt(index);
        }
        return bufView;
    }

    saveString(str) {
        let buffer = this.StringToUint8Array(str);
        this.Data.writeUInt32LE(buffer.length).write(buffer);
    }

    rgbToInt = function (r, g, b) {
        r = r & 0xff;
        g = g & 0xff;
        b = b & 0xff;

        return (r << 16) | (g << 8) | b;
    }

    /**
     * @param {CL3D.Vect2d} vect2d
     */
    write2DVectF(vect2d) {
        this.Data.writeFloat32LE(vect2d.X);
        this.Data.writeFloat32LE(vect2d.Y);
    }

    /**
     * @param {CL3D.Vect3d} vect3d
     */
    write3DVectF(vect3d) {
        this.Data.writeFloat32LE(vect3d.X);
        this.Data.writeFloat32LE(vect3d.Y);
        this.Data.writeFloat32LE(vect3d.Z);
    }

    /**
     * @param {CL3D.Box3d} box3d
     */
    write3DBoxF(box3d) {
        this.write3DVectF(box3d.MinEdge);
        this.write3DVectF(box3d.MaxEdge);
    }

    /**
     * @param {CL3D.Matrix4} mat4
     */
    writeExistingMatrix(mat4) {
        let array = mat4.asArray();
        for (let index = 0; index < 16; ++index) {
            this.Data.writeFloat32LE(array[index]);
        }
    }

    startTag(value) {
        let tag = value;
        console.log(tag)
        this.Data.writeUShortLE(tag);
        let pos = this.Data.offset;
        this.Data.writeUInt32LE();
        return pos;
    }

    endTag(pos) {
        //console.log(`tag:${this.Data.view.getInt16(pos - 2, true)} size:${this.Data.length - pos - 4}`);
        this.Data.view.setUint32(pos, this.Data.length - pos - 4, true);
    }

    startFlag() {
        let pos = this.Data.offset;
        this.Data.writeInt32LE();
        return pos;
    }

    endFlag(pos, value) {
        this.Data.view.setUint32(pos, value, true);
    }

    saveHeader() {
        this.Data.write(this.StringToUint16Array("flce"));
        this.Data.write(this.StringToUint16Array("0650"));
        this.Data.writeUInt32LE();
    }

    saveEmbeddedFiles() {
        // mesh cache

        // exrension script
        for (let index = 0; index < (CL3D.gDocument.Scripts.length); ++index) {
            let pos = this.startTag(13);
            {
                let flag = 0;
                let pos = this.startFlag();
                {
                    this.saveString("");
                    this.saveString(CL3D.gDocument.Scripts[index]);
                    flag += 8;
                }
                this.endFlag(pos, flag);
            }
            this.endTag(pos);
        }
    }

    savePublishSettings() {
        // do nothing
    }

    /**
     * @param {CL3D.ActionHandler} actionHandler
     */
    saveActionHandler(actionHandler) {
        if (actionHandler) {
            this.Data.writeInt32LE(1);

            let pos = this.startTag(29);
            {
                let pos = this.startTag(30);
                {
                    for (let index = 0; index < actionHandler.Actions.length; ++index) {
                        this.saveAction(actionHandler.Actions[index]);
                    }
                }
                this.endTag(pos);
            }
            this.endTag(pos);
        }
        else this.Data.writeInt32LE(0);
    }

    /**
     * @param {CL3D.Action} action
     */
    saveAction(action) {
        let type = action.Type;
        let flag = 0;
        let pos = 0;
        //console.log(`Action - ${type}`);
        switch (type) {
            case "MakeSceneNodeInvisible":
                this.Data.writeInt32LE(0);
                this.Data.writeInt32LE(action.InvisibleMakeType);
                this.Data.writeInt32LE(action.SceneNodeToMakeInvisible);
                this.Data.writeBoolean(action.ChangeCurrentSceneNode);
                this.Data.writeInt32LE();
                break;
            case "ChangeSceneNodePosition":
                this.Data.writeInt32LE(1);
                this.Data.writeInt32LE(action.PositionChangeType);
                this.Data.writeInt32LE(action.SceneNodeToChangePosition);
                this.Data.writeBoolean(action.ChangeCurrentSceneNode);
                this.write3DVectF(action.Vector);
                if (action.PositionChangeType == 4) this.write3DVectF(action.Area3DEnd);
                this.Data.writeBoolean(action.RelativeToCurrentSceneNode);
                this.Data.writeInt32LE(action.SceneNodeRelativeTo);
                flag = 0;
                pos = this.startFlag();
                {
                    if (action.UseAnimatedMovement) {
                        flag += 1;
                        this.Data.writeInt32LE(action.TimeNeededForMovementMs);
                    }
                }
                this.endFlag(pos, flag);
                break;
            case "ChangeSceneNodeRotation":
                this.Data.writeInt32LE(2);
                this.Data.writeInt32LE(action.RotationChangeType);
                this.Data.writeInt32LE(action.SceneNodeToChangeRotation);
                this.Data.writeBoolean(action.ChangeCurrentSceneNode);
                this.write3DVectF(action.Vector);
                flag = 0;
                pos = this.startFlag();
                {
                    if (action.RotateAnimated) {
                        flag += 1;
                        this.Data.writeInt32LE(action.TimeNeededForRotationMs);
                    }
                }
                this.endFlag(pos, flag);
                break;
            case "ChangeSceneNodeScale":
                this.Data.writeInt32LE(3);
                this.Data.writeInt32LE(action.ScaleChangeType);
                this.Data.writeInt32LE(action.SceneNodeToChangeScale);
                this.Data.writeBoolean(action.ChangeCurrentSceneNode);
                this.write3DVectF(action.Vector);
                this.Data.writeInt32LE();
                break;
            case "ChangeSceneNodeTexture":
                this.Data.writeInt32LE(4);
                this.Data.writeInt32LE(action.TextureChangeType);
                this.Data.writeInt32LE(action.SceneNodeToChange);
                this.Data.writeBoolean(action.ChangeCurrentSceneNode);
                this.saveString(action.TheTexture.Name);
                if (action.TextureChangeType == 1) this.Data.writeInt32LE(action.IndexToChange);
                this.Data.writeInt32LE();
                break;
            case "PlaySound":
                this.Data.writeInt32LE(5);
                flag = 0;
                pos = this.startFlag();
                {
                    if (action.PlayLooped) {
                        flag += 1;
                    }
                }
                this.endFlag(pos, flag);
                this.saveString(action.TheSound.Name);
                this.Data.writeFloat32LE(action.MinDistance);
                this.Data.writeFloat32LE(action.MaxDistance);
                this.Data.writeFloat32LE(action.Volume);
                this.Data.writeBoolean(action.PlayAs2D);
                this.Data.writeInt32LE(action.SceneNodeToPlayAt);
                this.Data.writeBoolean(action.PlayAtCurrentSceneNode);
                this.write3DVectF(action.Position3D);
                break;
            case "StopSound":
                this.Data.writeInt32LE(6);
                this.Data.writeInt32LE(action.SoundChangeType);
                break;
            case "ExecuteJavaScript":
                this.Data.writeInt32LE(7);
                this.Data.writeInt32LE();
                this.saveString(action.JScript);
                break;
            case "OpenWebpage":
                this.Data.writeInt32LE(8);
                this.Data.writeInt32LE();
                this.saveString(action.Webpage);
                this.saveString(action.Target);
                break;
            case "SetSceneNodeAnimation":
                this.Data.writeInt32LE(9);
                this.Data.writeInt32LE(action.SceneNodeToChangeAnim);
                this.Data.writeBoolean(action.ChangeCurrentSceneNode);
                this.Data.writeBoolean(action.Loop);
                this.saveString(action.AnimName);
                this.Data.writeInt32LE();
                break;
            case "SwitchToScene":
                this.Data.writeInt32LE(10);
                this.saveString(action.SceneName);
                this.Data.writeInt32LE();
                break;
            case "SetActiveCamera":
                this.Data.writeInt32LE(11);
                this.Data.writeInt32LE(action.CameraToSetActive);
                this.Data.writeInt32LE();
                break;
            case "SetCameraTarget":
                this.Data.writeInt32LE(12);
                this.Data.writeInt32LE(action.PositionChangeType);
                this.Data.writeInt32LE(action.SceneNodeToChangePosition);
                this.Data.writeBoolean(action.ChangeCurrentSceneNode);
                this.write3DVectF(action.Vector);
                this.Data.writeBoolean(action.RelativeToCurrentSceneNode);
                this.Data.writeInt32LE(action.SceneNodeRelativeTo);
                flag = 0;
                pos = this.startFlag();
                {
                    if (action.UseAnimatedMovement) {
                        flag += 1;
                        this.Data.writeInt32LE(action.TimeNeededForMovementMs);
                    }
                }
                this.endFlag(pos, flag);
                break;
            case "Shoot":
                this.Data.writeInt32LE(13);
                this.Data.writeInt32LE(action.ShootType);
                this.Data.writeInt32LE(action.Damage);
                this.Data.writeFloat32LE(action.BulletSpeed);
                this.Data.writeInt32LE(action.SceneNodeToUseAsBullet);
                this.Data.writeFloat32LE(action.WeaponRange);
                flag = 0;
                pos = this.startFlag();
                {
                    if (action.SceneNodeToShootFrom) {
                        flag += 1;
                        this.Data.writeInt32LE(action.SceneNodeToShootFrom);
                        this.Data.writeBoolean(action.ShootToCameraTarget);
                        this.write3DVectF(action.AdditionalDirectionRotation);
                    }
                    if (action.ActionHandlerOnImpact) {
                        flag += 2;
                        this.saveActionHandler(action.ActionHandlerOnImpact);
                    }
                    if (action.ShootDisplacement) {
                        flag += 4;
                        this.write3DVectF(action.ShootDisplacement);
                    }
                }
                break;
            case "QuitApplication":
                this.Data.writeInt32LE(14);
                // TODO
                break;
            case "SetOverlayText":
                this.Data.writeInt32LE(15);
                this.Data.writeInt32LE();
                this.Data.writeInt32LE(action.SceneNodeToChange);
                this.Data.writeBoolean(action.ChangeCurrentSceneNode);
                this.saveString(action.Text);
                break;
            case "SetOrChangeAVariable":
                this.Data.writeInt32LE(16);
                this.Data.writeInt32LE();
                this.saveString(action.VariableName);
                this.Data.writeInt32LE(action.Operation);
                this.Data.writeInt32LE(action.ValueType);
                this.saveString(action.Value);
                break;
            case "IfVariable":
                this.Data.writeInt32LE(17);
                flag = 0;
                pos = this.startFlag();
                {
                    this.saveString(action.VariableName);
                    this.Data.writeInt32LE(action.ComparisonType);
                    this.Data.writeInt32LE(action.ValueType);
                    this.saveString(action.Value);
                    this.saveActionHandler(action.TheActionHandler);

                    if (action.TheElseActionHandler) {
                        flag += 1;
                        this.saveActionHandler(action.TheElseActionHandler);
                    }
                }
                this.endFlag(pos, flag);
                break;
            case "RestartBehaviors":
                this.Data.writeInt32LE(18);
                this.Data.writeInt32LE(action.SceneNodeToRestart);
                this.Data.writeBoolean(action.ChangeCurrentSceneNode);
                this.Data.writeInt32LE();
                break;
            case "StoreLoadVariable":
                this.Data.writeInt32LE(19);
                this.Data.writeInt32LE();
                this.saveString(action.VariableName);
                this.Data.writeBoolean(action.Load);
                break;
            case "RestartScene":
                this.Data.writeInt32LE(20);
                this.Data.writeInt32LE();
                this.saveString(action.SceneName);
                break;
            case "CloneSceneNode":
                this.Data.writeInt32LE(21);
                this.Data.writeInt32LE(action.SceneNodeToClone);
                this.Data.writeBoolean(action.CloneCurrentSceneNode);
                this.Data.writeInt32LE();
                this.saveActionHandler(action.TheActionHandler);
                break;
            case "DeleteSceneNode":
                this.Data.writeInt32LE(22);
                this.Data.writeInt32LE(action.SceneNodeToDelete);
                this.Data.writeBoolean(action.DeleteCurrentSceneNode);
                this.Data.writeInt32LE(action.TimeAfterDelete);
                this.Data.writeInt32LE();
                break;
            case "ExtensionScript":
                this.Data.writeInt32LE(23);
                this.saveString(action.JsClassName);
                this.Data.writeInt32LE();
                this.saveExtensionScriptProperties(action.Properties);
                break;
            case "PlayMovie":
                this.Data.writeInt32LE(24);
                flag = 0;
                pos = this.startFlag();
                {
                    if (action.PlayLooped) {
                        flag += 1;
                    }
                }
                this.endFlag(pos, flag);
                this.Data.writeInt32LE(action.Command);
                this.saveString(action.VideoFileName);
                this.Data.writeInt32LE();
                this.Data.writeInt32LE(action.SceneNodeToPlayAt);
                this.Data.writeBoolean(action.PlayAtCurrentSceneNode);
                this.Data.writeInt32LE(action.MaterialIndex);
                this.saveActionHandler(action.ActionHandlerFinished);
                this.saveActionHandler(action.ActionHandlerFailed);
                break;
            case "StopSpecificSound":
                this.Data.writeInt32LE(25);
                this.Data.writeInt32LE();
                this.saveString(action.TheSound.Name);
                break;
        }
    }

    /**
     * @param {CL3D.Animator} animator
     */
    saveAnimator(animator) {
        let type = animator.getType();
        let flag = 0;
        let pos = 0;
        //console.log(`Animator - ${type}`);
        switch (type) {
            case "rotation":
                this.Data.writeInt32LE(100);
                this.write3DVectF(animator.Rotation);
                break;
            case "flystraight":
                this.Data.writeInt32LE(101);
                this.write3DVectF(animator.Start);
                this.write3DVectF(animator.End);
                this.Data.writeInt32LE(animator.TimeForWay);
                this.Data.writeBoolean(animator.Loop);
                break;
            case "flycircle":
                this.Data.writeInt32LE(102);
                this.write3DVectF(animator.Center);
                this.write3DVectF(animator.Direction);
                this.Data.writeFloat32LE(animator.Radius);
                this.Data.writeFloat32LE(animator.Speed);
                break;
            case "collisionresponse":
                this.Data.writeInt32LE(103);
                this.write3DVectF(animator.Radius);
                this.Data.writeFloat32LE();
                this.Data.writeFloat32LE(animator.AffectedByGravity);
                this.Data.writeFloat32LE();
                this.write3DVectF(animator.Translation);
                flag = 0;
                pos = this.startFlag();
                {
                    this.Data.writeInt32LE();
                    this.Data.writeInt32LE();
                    this.Data.writeFloat32LE(animator.SlidingSpeed);
                    if (animator.UseInclination) {
                        flag += 1;
                    }
                }
                this.endFlag(pos, flag);
                break;
            case "camerafps":
                this.Data.writeInt32LE(104);
                this.Data.writeFloat32LE(animator.MaxVerticalAngle);
                this.Data.writeFloat32LE(animator.MoveSpeed);
                this.Data.writeFloat32LE(animator.RotateSpeed);
                this.Data.writeFloat32LE(animator.JumpSpeed);
                this.Data.writeBoolean(animator.NoVerticalMovement);
                flag = 0;
                pos = this.startFlag();
                {
                    if (animator.moveByMouseMove == false && animator.moveByMouseDown == true) {
                        flag += 1;
                    }
                    if (animator.MoveSmoothing > 0) {
                        flag += 2;
                        this.Data.writeInt32LE(animator.MoveSmoothing);
                    }
                    if (animator.ChildrenDontUseZBuffer) {
                        flag += 4;
                    }
                }
                this.endFlag(pos, flag);
                break;
            case "cameramodelviewer":
                this.Data.writeInt32LE(105);
                this.Data.writeFloat32LE(animator.Radius);
                this.Data.writeFloat32LE(animator.RotateSpeed);
                this.Data.writeBoolean(animator.NoVerticalMovement);
                flag = 0;
                pos = this.startFlag();
                {
                    if (animator.SlideAfterMovementEnd) {
                        flag += 2;
                        this.Data.writeFloat32LE(animator.SlidingSpeed);
                    }
                    if (animator.AllowZooming) {
                        falg += 4;
                        this.Data.writeFloat32LE(animator.MinZoom);
                        this.Data.writeFloat32LE(animator.MaxZoom);
                        this.Data.writeFloat32LE(animator.ZoomSpeed);
                    }
                }
                this.endFlag(pos, flag);
                break;
            case "followpath":
                this.Data.writeInt32LE(106);
                this.Data.writeInt32LE(animator.TimeNeeded);
                this.Data.writeBoolean(animator.LookIntoMovementDirection);
                this.saveString(animator.PathToFollow);
                this.Data.writeBoolean(animator.OnlyMoveWhenCameraActive);
                this.write3DVectF(animator.AdditionalRotation);
                this.Data.writeByte(animator.EndMode);
                this.saveString(animator.CameraToSwitchTo);
                flag = 0;
                pos = this.startFlag();
                {
                    if (animator.TimeDisplacement) {
                        flag += 1;
                        this.Data.writeInt32LE(TimeDisplacement);
                    }
                    if (animator.EndMode == 3 || animator.EndMode == 4) {
                        this.saveActionHandler(animator.TheActionHandler);
                    }
                }
                this.endFlag(pos, flag);
                break;
            case "onclick":
                this.Data.writeInt32LE(107);
                this.Data.writeBoolean(animator.BoundingBoxTestOnly);
                this.Data.writeBoolean(animator.CollidesWithWorld);
                this.Data.writeInt32LE();
                this.saveActionHandler(animator.TheActionHandler);
                break;
            case "onproximity":
                this.Data.writeInt32LE(108);
                this.Data.writeInt32LE(animator.EnterType);
                this.Data.writeInt32LE(animator.ProximityType);
                this.Data.writeFloat32LE(animator.Range);
                this.Data.writeInt32LE(animator.SceneNodeToTest);
                flag = 0;
                pos = this.startFlag();
                {
                    if (animator.AreaType == 1) {
                        flag += 1;
                        this.write3DVectF(animator.RangeBox);
                    }
                }
                this.endFlag(pos, flag);
                this.saveActionHandler(animator.TheActionHandler);
                break;
            case "animatetexture":
                this.Data.writeInt32LE(109);
                this.Data.writeInt32LE(animator.TextureChangeType);
                this.Data.writeInt32LE(animator.TimePerFrame);
                this.Data.writeInt32LE(animator.TextureIndexToChange);
                this.Data.writeBoolean(animator.Loop);
                let tanimcount = animator.Textures.length;
                this.Data.writeInt32LE(tanimcount);
                for (let index = 0; index < tanimcount; ++index) {
                    this.saveString(animator.Textures[index].Name);
                }
                break;
            case "onmove":
                this.Data.writeInt32LE(110);
                this.Data.writeBoolean(animator.BoundingBoxTestOnly);
                this.Data.writeBoolean(animator.CollidesWithWorld);
                this.Data.writeInt32LE();
                this.saveActionHandler(animator.ActionHandlerOnLeave);
                this.saveActionHandler(animator.ActionHandlerOnEnter);
                break;
            case "timer":
                this.Data.writeInt32LE(111);
                this.Data.writeInt32LE(animator.TickEverySeconds);
                this.Data.writeInt32LE();
                this.saveActionHandler(animator.TheActionHandler);
                break;
            case "keypress":
                this.Data.writeInt32LE(112);
                this.Data.writeInt32LE(animator.KeyPressType);
                this.Data.writeInt32LE(animator.KeyCode);
                this.Data.writeBoolean(animator.IfCameraOnlyDoIfActive);
                this.Data.writeInt32LE();
                this.saveActionHandler(animator.TheActionHandler);
                break;
            case "gameai":
                this.Data.writeInt32LE(113);
                this.Data.writeInt32LE(animator.AIType);
                this.Data.writeFloat32LE(animator.MovementSpeed);
                this.Data.writeFloat32LE(animator.ActivationRadius);
                this.Data.writeBoolean(animator.CanFly);
                this.Data.writeInt32LE(animator.Health);
                this.saveString(animator.Tags);
                this.saveString(animator.AttacksAIWithTags);
                this.Data.writeBoolean(animator.PatrolRadius);
                this.Data.writeInt32LE(animator.RotationSpeedMs);
                this.write3DVectF(animator.AdditionalRotationForLooking);
                this.saveString(animator.StandAnimation);
                this.saveString(animator.WalkAnimation);
                this.saveString(animator.DieAnimation);
                this.saveString(animator.AttackAnimation);
                if (animator.AIType == 3) this.Data.writeInt32LE(animator.PathIdToFollow);
                flag = 0;
                pos = this.startFlag();
                {
                    if (animator.PatrolWaitTimeMs) {
                        animator.PatrolWaitTimeMs = 1E4;
                        if (animator.MovementSpeed != 0) animator.PatrolWaitTimeMs = animator.PatrolRadius / (animator.MovementSpeed / 1E3);
                        this.Data.writeInt32LE(animator.PatrolWaitTimeMs);
                    }
                    else {
                        flag += 1;
                        this.Data.writeInt32LE();
                    }
                }
                this.endFlag(pos, flag);
                this.saveActionHandler(animator.ActionHandlerOnAttack);
                this.saveActionHandler(animator.ActionHandlerOnActivate);
                this.saveActionHandler(animator.ActionHandlerOnHit);
                this.saveActionHandler(animator.ActionHandlerOnDie);
                break;
            case "3rdpersoncamera":
                this.Data.writeInt32LE(114);
                this.Data.writeInt32LE(animator.SceneNodeIDToFollow);
                this.write3DVectF(animator.AdditionalRotationForLooking);
                this.Data.writeInt32LE(animator.FollowMode);
                this.Data.writeFloat32LE(animator.FollowSmoothingSpeed);
                this.Data.writeFloat32LE(animator.TargetHeight);
                flag = 0;
                pos = this.startFlag();
                {
                    if (animator.CollidesWithWorld) {
                        flag += 1;
                    }
                }
                this.endFlag(pos, flag);
                break;
            case "keyboardcontrolled":
                this.Data.writeInt32LE(115);
                this.Data.writeInt32LE();
                this.Data.writeFloat32LE(animator.RunSpeed);
                this.Data.writeFloat32LE(animator.MoveSpeed);
                this.Data.writeFloat32LE(animator.RotateSpeed);
                this.Data.writeFloat32LE(animator.JumpSpeed);
                this.write3DVectF(animator.AdditionalRotationForLooking);
                this.saveString(animator.StandAnimation);
                this.saveString(animator.WalkAnimation);
                this.saveString(animator.JumpAnimation);
                this.saveString(animator.RunAnimation);
                flag = 0;
                pos = this.startFlag();
                {
                    if (animator.DisableWithoutActiveCamera) {
                        flag += 1;
                    }
                    if (animator.UseAcceleration) {
                        flag += 2;
                        this.Data.writeFloat32LE(animator.AccelerationSpeed);
                        this.Data.writeFloat32LE(animator.DecelerationSpeed);
                    }
                    if (animator.PauseAfterJump) {
                        flag += 4;
                    }
                }
                this.endFlag(pos, flag);
                break;
            case "onfirstframe":
                this.Data.writeInt32LE(116);
                this.Data.writeBoolean(animator.AlsoOnReload);
                this.Data.writeInt32LE();
                this.saveActionHandler(animator.TheActionHandler);
                break;
            case "extensionscript":
                this.Data.writeInt32LE(117);
                this.saveString(animator.JsClassName);
                this.Data.writeInt32LE();
                this.saveExtensionScriptProperties(animator.Properties);
                break;
        }
    }

    /**
     * @param {CL3D.Material} mat
     */
    saveMaterial(mat) {
        this.Data.writeInt32LE(mat.Type);
        this.Data.writeInt32LE();
        this.Data.writeInt32LE();
        this.Data.writeInt32LE();
        this.Data.writeInt32LE();
        this.Data.writeFloat32LE();
        this.Data.writeInt32LE();
        this.Data.writeInt32LE();
        this.Data.writeBoolean();
        this.Data.writeBoolean();
        this.Data.writeBoolean(mat.Lighting);
        this.Data.writeBoolean(mat.ZWriteEnabled);
        this.Data.writeByte();
        this.Data.writeBoolean(mat.BackfaceCulling);
        this.Data.writeBoolean();
        this.Data.writeBoolean();
        this.Data.writeBoolean();
        for (let index = 0; index < 4; ++index) {
            switch (index) {
                case 0:
                    mat.Tex1 ? this.saveString(mat.Tex1.Name) : this.saveString("");
                    break;
                case 1:
                    mat.Tex2 ? this.saveString(mat.Tex2.Name) : this.saveString("");
                    break;
                default:
                    this.saveString("");
                    break;
            }
            this.Data.writeBoolean();
            this.Data.writeBoolean();
            this.Data.writeBoolean();
            switch (index) {
                case 0:
                    this.Data.writeShortLE(mat.ClampTexture1);
                    break;
                case 1:
                    break;
            }
        }
    }

    /**
     * @param {CL3D.Free3dScene} scene
     */
    saveSceneParams(scene) {
        let pos = 0;

        pos = this.startTag(26);
        {
            this.saveString(scene.Name);
            this.Data.writeInt32LE(scene.BackgroundColor || this.rgbToInt(65, 65, 65));
        }
        this.endTag(pos);

        pos = this.startTag(1007);
        {
            this.write3DVectF(scene.DefaultCameraPos);
            this.write3DVectF(scene.DefaultCameraTarget);
        }
        this.endTag(pos);

        pos = this.startTag(1008);
        {
            this.Data.writeFloat32LE(scene.Gravity);
        }
        this.endTag(pos);

        pos = this.startTag(1009);
        {
            this.Data.writeBoolean(scene.FogEnabled);
            this.Data.writeFloat32LE(scene.FogDensity);
            this.Data.writeInt32LE(scene.FogColor);
        }
        this.endTag(pos);

        pos = this.startTag(1010);
        {
            this.Data.writeBoolean(false);
            this.Data.writeFloat32LE(scene.WindSpeed);
            this.Data.writeFloat32LE(scene.WindStrength);
        }
        this.endTag(pos);

        pos = this.startTag(1011);
        {
            this.Data.writeBoolean(scene.ShadowMappingEnabled);
            this.Data.writeFloat32LE(scene.ShadowMapBias1);
            this.Data.writeFloat32LE(scene.ShadowMapBias2);
            this.Data.writeFloat32LE(scene.ShadowMapBackFaceBias);
            this.Data.writeFloat32LE(scene.ShadowMapOpacity);
            this.Data.writeFloat32LE(scene.ShadowMapCameraViewDetailFactor);
        }
        this.endTag(pos);

        pos = this.startTag(1012);
        {
            for (let index = 0; index < 6; ++index)
                this.Data.writeBoolean(false);
            this.Data.writeInt32LE(scene.PE_bloomBlurIterations);
            this.Data.writeFloat32LE(scene.PE_bloomTreshold);
            this.Data.writeInt32LE(scene.PE_blurIterations);
            this.Data.writeInt32LE(scene.PE_colorizeColor);
            this.Data.writeFloat32LE(scene.PE_vignetteIntensity);
            this.Data.writeFloat32LE(scene.PE_vignetteRadiusA);
            this.Data.writeFloat32LE(scene.PE_vignetteRadiusB);
        }
        this.endTag(pos);
    }

    /**
     * @param {CL3D.SceneNode} node
     */
    saveSceneNodeParams(node) {
        this.Data.writeInt32LE(node.Type);
        this.Data.writeInt32LE(node.Id);
        this.saveString(node.Name);
        this.write3DVectF(node.Pos);
        this.write3DVectF(node.Rot);
        this.write3DVectF(node.Scale);
        this.Data.writeBoolean(node.Visible);
        this.Data.writeInt32LE(node.Culling);
        console.log(node.Name, node.Type);
    }

    /**
     * @param {CL3D.ColorF} color
     */
    saveColorF(color) {
        this.Data.writeFloatLE(color.R);
        this.Data.writeFloat32LE(color.G);
        this.Data.writeFloat32LE(color.B);
        this.Data.writeFloat32LE(color.A);
    }

    /**
     * @param {CL3D.Free3dScene} scene
     * @param {CL3D.SceneNode} node
     * @param {Number} depth
     */
    saveSceneNode(scene, node, depth) {
        if (depth == 0) {
            this.saveSceneNodeParams(node);

            let pos = 0;

            pos = this.startTag(10);
            {
                this.saveColorF(scene.AmbientLight);
            }
            this.endTag(pos);

            if (node.Animators.length > 0) {
                for (let index = 0; index < node.Animators.length; ++index) {
                    pos = this.startTag(25);
                    {
                        this.saveAnimator(node.Animators[index]);
                    }
                    this.endTag(pos);
                }
            }

            this.saveSceneNode(scene, node, depth + 1);
        }
        else if (node.Children != null) {
            let currentNode = null;
            let childrenCount = node.Children.length;
            for (let index = 0; index < childrenCount; ++index) {
                currentNode = node.Children[index];

                let pos = 0;

                pos = this.startTag(9);
                {
                    this.saveSceneNodeParams(currentNode);

                    let pos = 0;

                    pos = this.startTag(10)
                    {
                        switch (currentNode.Type) {
                            case 2037085030:
                                this.saveFlaceMeshNode(currentNode);
                                console.log("SkyBoxSceneNode");
                                break;
                            case 1752395110:
                                this.saveFlaceMeshNode(currentNode);
                                console.log("MeshSceneNode");
                                break;
                            case 1835950438:
                                this.saveFlaceAnimatedMeshNode(currentNode);
                                console.log("AnimatedMeshSceneNode");
                                break;
                            case 1953526632:
                                this.saveFlaceHotspotNode(currentNode);
                                console.log("HotspotSceneNode");
                                break;
                            case 1819042406:
                                this.saveFlaceBillBoardNode(currentNode);
                                console.log("BillboardSceneNode");
                                break;
                            case 1835098982:
                                this.saveFlaceCameraNode(currentNode);
                                console.log("CameraSceneNode");
                                break;
                            case 1751608422:
                                this.saveFlaceLightNode(currentNode);
                                console.log("LightSceneNode");
                                break;
                            case 1935946598:
                                this.saveFlaceSoundNode(currentNode);
                                console.log("SoundSceneNode");
                                break;
                            case 1752461414:
                                this.saveFlacePathNode(currentNode);
                                console.log("PathSceneNode");
                                break;
                            case 1954112614:
                                this.saveDummyTransformationNode(currentNode);
                                console.log("DummyTransformationSceneNode");
                                break;
                            case 1868837478:
                                this.saveFlaceOverlay2DNode(currentNode);
                                console.log("Overlay2DSceneNode");
                                break;
                            case 1668575334:
                                console.log("ParticleSystemSceneNode");
                                break;
                            case 1835283046:
                                console.log("Mobile2DInputSceneNode");
                                break;
                            case 1920103526:
                                console.log("TerrainSceneNode");
                                break;
                            case 1920235366:
                                console.log("WaterSurfaceSceneNode");
                                break;
                            default:
                                console.log("");
                                break;
                        }
                    }
                    this.endTag(pos);

                    if (currentNode.Animators.length > 0) {
                        for (let index = 0; index < currentNode.Animators.length; ++index) {
                            pos = this.startTag(25);
                            {
                                this.saveAnimator(currentNode.Animators[index]);
                            }
                            this.endTag(pos);
                        }
                    }

                    if (currentNode.MeshBuffer) {
                        pos = this.startTag(11);
                        {
                            this.saveMaterial(currentNode.MeshBuffer.Mat);
                        }
                        this.endTag(pos);
                        this.Data.write(new Uint8Array(18)); // unknown data definition
                    }
                    else if (currentNode.OwnedMesh && currentNode.OwnedMesh.MeshBuffers.length > 0) {
                        for (let index = 0; index < currentNode.OwnedMesh.MeshBuffers.length; ++index) {
                            pos = this.startTag(11);
                            {
                                this.saveMaterial(currentNode.OwnedMesh.MeshBuffers[index].Mat);
                            }
                            this.endTag(pos);
                            this.Data.write(new Uint8Array(18)); // unknown data definition
                        }
                    }

                    if (currentNode.Children.length > 0) {
                        this.saveSceneNode(scene, currentNode, depth + 1);
                    }
                }
                this.endTag(pos);
            }
        }
    }

    /**
     * @param {CL3D.ExtensionScriptProperty[]} props
     */
    saveExtensionScriptProperties(props) {
        const propCount = props.length;
        this.Data.writeInt32LE(propCount);
        for (let index = 0; index < propCount; ++index) {
            const prop = props[index];

            this.Data.writeInt32LE(prop.Type);
            this.saveString(prop.Name);

            switch (prop.Type) {
                case 1:
                    this.Data.writeFloat32LE(prop.FloatValue);
                    break;
                case 2:
                    this.saveString(prop.StringValue);
                    break;
                case 6:
                    this.write3DVectF(prop.VectorValue);
                    break;
                case 7:
                    this.saveString(prop.TextureValue);
                    break;
                case 9:
                    this.saveActionHandler(prop.ActionHandlerValue);
                    break;
                case 0:
                case 4:
                case 5:
                case 8:
                case 3:
                default:
                    this.Data.writeInt32LE(prop.IntValue);
                    break;
            }
        }
    }

    /**
     * @param {CL3D.Mesh} mesh
     */
    saveMesh(mesh) {
        this.write3DBoxF(mesh.Box);
        const meshBufferCount = mesh.GetMeshBuffers().length;
        for (let index = 0; index < meshBufferCount; ++index) {
            let pos = this.startTag(15);
            {
                this.saveMeshBuffer(mesh.GetMeshBuffers()[index]);
            }
            this.endTag(pos);
        }
    }

    /**
     * @param {CL3D.MeshBuffer} buffer
     */
    saveMeshBuffer(buffer) {
        this.write3DBoxF(buffer.Box);

        let pos = 0;

        const indicesCount = buffer.Indices.length;
        if (indicesCount) {
            pos = this.startTag(16);
            {
                for (let index = 0; index < indicesCount; ++index) {
                    this.Data.writeShortLE(buffer.Indices[index]);
                }
            }
            this.endTag(pos);
        }

        const verticesCount = buffer.Vertices.length;
        if (verticesCount) {
            //17
            pos = this.startTag(18);
            {
                for (let index = 0; index < verticesCount; ++index) {
                    this.write3DVectF(buffer.Vertices[index].Pos);
                    this.write3DVectF(buffer.Vertices[index].Normal);
                    this.Data.writeInt32LE(buffer.Vertices[index].Color);
                    this.write2DVectF(buffer.Vertices[index].TCoords);
                    this.write2DVectF(buffer.Vertices[index].TCoords2);
                }
            }
            this.endTag(pos);

            if (buffer.Tangents && buffer.Binormals) {
                pos = this.startTag(19);
                {
                    for (let index = 0; index < verticesCount; ++index) {
                        this.write3DVectF(buffer.Vertices[index].Pos);
                        this.write3DVectF(buffer.Vertices[index].Normal);
                        this.Data.writeInt32LE(buffer.Vertices[index].Color);
                        this.write2DVectF(buffer.Vertices[index].TCoords);
                        this.write3DVectF(buffer.Tangents[index]);
                        this.write3DVectF(buffer.Binormals[index]);
                    }
                }
                this.endTag(pos);
            }
        }
    }

    /**
     * @param {CL3D.AnimatedMeshSceneNode} node
     */
    saveAnimatedMeshRef(node) {
        this.saveString("");
    }

    /**
     * @param {CL3D.MeshSceneNode} node
     */
    saveFlaceMeshNode(node) {
        this.write3DBoxF(node.Box);
        this.Data.writeBoolean();
        this.Data.writeBoolean(node.ReceivesStaticShadows);
        this.Data.writeBoolean(node.DoesCollision);
        this.Data.writeBoolean(node.OccludesLight);
        if (node.OwnedMesh) {
            let pos = this.startTag(14);
            {
                this.saveMesh(node.OwnedMesh);
            }
            this.endTag(pos);
        }
    }

    /**
     * @param {CL3D.AnimatedMeshSceneNode} node
     */
    saveFlaceAnimatedMeshNode(node) {
        this.write3DBoxF(node.Box);
        this.Data.writeBoolean();
        this.Data.writeInt32LE();
        this.Data.writeInt32LE(node.StartFrame);
        this.Data.writeInt32LE(node.EndFrame);
        this.Data.writeFloat32LE(node.FramesPerSecond);
        this.Data.writeByte();
        this.Data.writeBoolean(node.Looping);
        let flag = 0;
        let pos = this.startFlag();
        {
            if (node.BlendTimeMs != 250) {
                this.Data.writeInt32LE(node.BlendTimeMs);
                flag += 1;
            }

            this.saveAnimatedMeshRef(node);

            const dummyCount = node.AnimatedDummySceneNodes.length;
            if (dummyCount) {
                this.Data.writeInt32LE(dummyCount);
                for (let index = 0; index < dummyCount; ++index) {
                    this.Data.writeInt32LE(node.AnimatedDummySceneNodes[index].NodeIDToLink);
                    this.Data.writeInt32LE(node.AnimatedDummySceneNodes[index].JointIdx);
                }
                flag += 2;
            }
        }
        this.endFlag(pos, flag);
    }

    /**
     * @param {CL3D.HotspotSceneNode} node
     */
    saveFlaceHotspotNode(node) {
        // do nothing
    }

    /**
     * @param {CL3D.BillboardSceneNode} node
     */
    saveFlaceBillBoardNode(node) {
        this.write3DBoxF(node.MeshBuffer.Box);
        this.Data.writeFloat32LE(node.SizeX);
        this.Data.writeFloat32LE(node.SizeY);
        this.Data.writeByte(node.IsVertical + 1);
    }

    /**
     * @param {CL3D.CameraSceneNode} node
     */
    saveFlaceCameraNode(node) {
        this.write3DBoxF(node.Box);
        this.write3DVectF(node.Target);
        this.write3DVectF(node.UpVector);
        this.Data.writeFloat32LE(node.Fovy);
        this.Data.writeFloat32LE(node.Aspect);
        this.Data.writeFloat32LE(node.ZNear);
        this.Data.writeFloat32LE(node.ZFar);
        this.Data.writeBoolean(node.Active);
    }

    /**
     * @param {CL3D.LightSceneNode} node
     */
    saveFlaceLightNode(node) {
        this.write3DBoxF(node.Box);
        node.LightData.IsDirectional ? this.Data.writeInt32LE(2) : this.Data.writeInt32LE(0);
        this.saveColorF(node.LightData.Color);
        this.saveColorF(new CL3D.ColorF());
        this.Data.writeBoolean();
        this.write3DVectF(node.LightData.Direction);
        this.Data.writeFloat32LE(node.LightData.Radius);
    }

    /**
     * @param {CL3D.SoundSceneNode} node
     */
    saveFlaceSoundNode(node) {
        this.write3DBoxF(node.Box);
        this.saveString(node.TheSound);
        this.Data.writeFloat32LE(node.MinDistance);
        this.Data.writeFloat32LE(node.MaxDistance);
        this.Data.writeInt32LE(node.PlayMode);
        this.Data.writeBoolean(node.DeleteWhenFinished);
        this.Data.writeInt32LE(node.MaxTimeInterval);
        this.Data.writeInt32LE(node.MinTimeInterval);
        this.Data.writeFloat32LE(node.Volume);
        this.Data.writeBoolean(node.PlayAs2D);
        this.Data.writeInt32LE();
    }

    /**
     * @param {CL3D.PathSceneNode} node
     */
    saveFlacePathNode(node) {
        this.write3DBoxF(node.Box);
        this.Data.writeFloat32LE(node.Tightness);
        this.Data.writeBoolean(node.IsClosedCircle);
        this.Data.writeInt32LE();
        const countNodes = node.Nodes.length;
        this.Data.writeInt32LE(countNodes);
        for (let index = 0; index < countNodes; ++index) {
            this.write3DVectF(node.Nodes[index]);
        }
    }

    /**
     * @param {CL3D.DummyTransformationSceneNode} node
     */
    saveDummyTransformationNode(node) {
        this.write3DBoxF(node.Box);
        this.writeExistingMatrix(node.RelativeTransformationMatrix);
    }

    /**
     * @param {CL3D.Overlay2DSceneNode} node
     */
    saveFlaceOverlay2DNode(node) {
        node.BlurImage ? this.Data.writeInt32LE(1) : this.Data.writeInt32LE(0);
        this.Data.writeBoolean(node.SizeModeIsAbsolute);
        if (node.SizeModeIsAbsolute) {
            this.Data.writeInt32LE(node.PosAbsoluteX);
            this.Data.writeInt32LE(node.PosAbsoluteY);
            this.Data.writeInt32LE(node.SizeAbsoluteWidth);
            this.Data.writeInt32LE(node.SizeAbsoluteHeight);
        }
        else {
            this.Data.writeFloat32LE(node.PosRelativeX);
            this.Data.writeFloat32LE(node.PosRelativeY);
            this.Data.writeFloat32LE(node.SizeRelativeWidth);
            this.Data.writeFloat32LE(node.SizeRelativeHeight);
        }
        this.Data.writeBoolean(node.ShowBackGround);
        this.Data.writeInt32LE(node.BackGroundColor);
        node.Texture ? this.saveString(node.Texture.Name) : this.saveString("");
        node.TextureHover ? this.saveString(node.TextureHover.Name) : this.saveString("");
        this.Data.writeBoolean(node.RetainAspectRatio);
        this.Data.writeBoolean(node.DrawText);
        this.Data.writeByte(node.TextAlignment);
        this.saveString(node.Text);
        this.saveString(node.FontName);
        this.Data.writeInt32LE(node.TextColor);
        this.Data.writeBoolean(node.AnimateOnHover);
        this.Data.writeBoolean(node.OnHoverSetFontColor);
        this.Data.writeInt32LE(node.HoverFontColor);
        this.Data.writeBoolean(node.OnHoverSetBackgroundColor);
        this.Data.writeInt32LE(node.HoverBackgroundColor);
        this.Data.writeBoolean(node.OnHoverDrawTexture);
    }
};
