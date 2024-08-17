// ----------------------------------------------------------------------------------------------
// Animator for moving cursor position of Mobile2DInputSceneNode
// ----------------------------------------------------------------------------------------------
// moved to coppercubeprivate.js since it is needing the animator definition first

import * as CL3D from "../../main.js";

/**
* @constructor
* @extends CL3D.Animator
* @class  Scene node animator which animated a mobile input 2d node
* @public
*/
export class AnimatorMobileInput extends CL3D.Animator {
    constructor(engine, scene, obj) {
        super();

        this.SMGr = scene;
        this.Obj = obj;
        this.engine = engine;
        this.MouseDown = false;
        scene.registerSceneNodeAnimatorForEvents(this);

        this.KeyDown = new Array();
        for (var i = 0; i < 255; ++i)
            this.KeyDown.push(false);

        this.CoordArray = new Array();
        this.CoordArray.push(new CL3D.Vect2d(-1, 0)); // left
        this.CoordArray.push(new CL3D.Vect2d(0, -1)); // up
        this.CoordArray.push(new CL3D.Vect2d(1, 0)); // right
        this.CoordArray.push(new CL3D.Vect2d(0, 1)); // down
    }

    /**
     * Returns the type of the animator.
     * For the AnimatorOnClick, this will return 'mobileinput'.
     * @public
     */
    getType() {
        return 'mobileinput';
    }

    /**
     * @public
     */
    animateNode(n, timeMs) {
        var ret = false;

        if (this.Obj.InputMode == 1) // specific key
        {
            this.postKey(this.MouseDown && this.Obj.MouseOverButton, this.Obj.KeyCode);
        }

        else {
            // cursor key mode
            var len = Math.sqrt(this.Obj.CursorPosX * this.Obj.CursorPosX + this.Obj.CursorPosY * this.Obj.CursorPosY);
            var minLen = 0.3;

            if (len < minLen || !this.MouseDown) {
                if (!this.MouseDown) {
                    ret = (this.Obj.CursorPosX != 0 && this.Obj.CursorPosY != 0);
                    this.Obj.CursorPosX = 0;
                    this.Obj.CursorPosY = 0;
                }

                this.postKey(false, 37);
                this.postKey(false, 38);
                this.postKey(false, 39);
                this.postKey(false, 40);
            }

            else {
                for (var i = 0; i < 4; ++i) {
                    var distanceX = this.CoordArray[i].X - this.Obj.CursorPosX;
                    var distanceY = this.CoordArray[i].Y - this.Obj.CursorPosY;

                    var isPointInside = Math.sqrt(distanceX * distanceX + distanceY * distanceY) < 1;
                    this.postKey(isPointInside, 37 + i);
                }
            }
        }

        return ret;
    }

    /**
     * @public
     */
    postKey(down, key) {
        if (this.KeyDown[key] == down)
            return;

        this.KeyDown[key] = down;

        var e = { keyCode: key};

        if (down)
            this.engine.handleKeyDown(e);

        else
            this.engine.handleKeyUp(e);
    }

    /**
     * @public
     */
    onMouseUp(event) {
        this.MouseDown = false;
    }

    /**
     * @public
     */
    onMouseDown(event) {
        this.MouseDown = true;
    }
    
    /**
     * @public
     */
    onMouseMove(event) {
        if (this.MouseDown && this.Obj.MouseOverButton &&
            this.Obj.RealWidth != 0 && this.Obj.RealHeight != 0) {
            var x = this.engine.getMousePosXFromEvent(event) - this.Obj.RealPosX;
            var y = this.engine.getMousePosYFromEvent(event) - this.Obj.RealPosY;

            this.Obj.CursorPosX = x / this.Obj.RealWidth;
            this.Obj.CursorPosY = y / this.Obj.RealHeight;

            this.Obj.CursorPosX = CL3D.clamp(this.Obj.CursorPosX, 0.0, 1.0);
            this.Obj.CursorPosY = CL3D.clamp(this.Obj.CursorPosY, 0.0, 1.0);

            // move coordinates from 0..1 to -1..1 range
            this.Obj.CursorPosX = (this.Obj.CursorPosX * 2.0) - 1.0;
            this.Obj.CursorPosY = (this.Obj.CursorPosY * 2.0) - 1.0;
        }
    }
};
