/////////////////////////////////////////////////////////////////////////////////////////
// CopperCube Variable
// not really an animator, but needed only for coppercube
/////////////////////////////////////////////////////////////////////////////////////////

import * as CL3D from "../../main.js";

/**
 * @private
 * Array containing instances of CL3D.CopperCubeVariable. A container for holding coppercube variables, which
 * can also be set and changed using the Actions in the editor.
 */
export const CopperCubeVariables = new Array();

/**
 * Interface class for accessing CopperCube variables, which can be set and changed using the Actions and
 * Behaviors in the CopperCube editor. Use the static function CL3D.CopperCubeVariable.getVariable to get an
 * instance of a variable.
 * @constructor
 * @class Interface class for accessing CopperCube variables
 * @public
 */
export class CopperCubeVariable {
    constructor() {
        this.Name = '';
        this.StringValue = '';
        this.ActiveValueType = 0; // 0=string, 1=int, 2=float
        this.IntValue = 0;
        this.FloatValue = 0.0;
    }
   
    /**
     * Static function, returns the instance of an existing CopperCube variable or creates one if not existing.
     * @public
     * @param n {String} Name of the variable
     * @param createIfNotExisting {Boolean} if the variable is not found, it will be created if this is set to true.
     * @param scene {CL3D.Scene} The current scene. This parameter is optional, this can be 0. It is used for getting runtime variables such as #player1.health
     * @returns {CL3D.CopperCubeVariable} Returns instance of the variable or null if not found
     */
    static getVariable(n, createIfNotExisting, scene) {
        if (n == null)
            return null;

        var toFind = n.toLowerCase();
        var ar = CL3D.CopperCubeVariables;

        for (var i = 0; i < ar.length; ++i) {
            var v = ar[i];
            if (v != null && v.getName().toLowerCase() == toFind)
                return v;
        }

        // for temporary virtual variables like "#player.health", create one now
        var tmpvar = CL3D.CopperCubeVariable.createTemporaryVariableIfPossible(n, scene);
        if (tmpvar)
            return tmpvar;

        // not found, so create new
        if (createIfNotExisting == true) {
            var nv = new CL3D.CopperCubeVariable();
            nv.setName(n);
            ar.push(nv);

            return nv;
        }

        return null;
    }
        
    /**
     * @private
     * Creates a coppercube variable of the type "#player.health" with the correct expected content
     */
    static createTemporaryVariableIfPossible(varname, scene) {
        var ret = CL3D.CopperCubeVariable.getSceneNodeAndAttributeNameFromTemporaryVariableName(varname, scene);
        if (ret == null)
            return null;

        var nv = new CL3D.CopperCubeVariable();
        nv.setName(varname);
        nv.setValueAsInt(0);
        var node = ret.node;

        if (ret.attrname == 'health' && node != null) {
            var gameai = node.getAnimatorOfType('gameai');
            if (gameai != null)
                nv.setValueAsInt(gameai.Health);
        }

        else if (ret.attrname == 'movementspeed' && node != null) {
            var an = node.getAnimatorOfType('gameai');
            var an2 = node.getAnimatorOfType('keyboardcontrolled');
            var an3 = node.getAnimatorOfType('camerafps');

            if (an3)
                nv.setValueAsFloat(an3.MoveSpeed);

            else if (an2)
                nv.setValueAsFloat(an2.MoveSpeed);

            else if (an)
                nv.setValueAsFloat(an.MovementSpeed);
        }

        else if (ret.attrname == 'damage' && node != null) {
            var theaction = node.findActionOfType('Shoot');
            if (theaction)
                nv.setValueAsInt(theaction.Damage);
        }

        else if (ret.attrname == 'colsmalldistance' && node != null) {
            var acr = node.getAnimatorOfType('collisionresponse');
            if (acr != null)
                nv.setValueAsFloat(acr.SlidingSpeed);
        }

        else if (ret.attrname == 'soundvolume') {
            nv.setValueAsFloat(CL3D.gSoundManager.getGlobalVolume() * 100.0);
        }

        return nv;
    }
        
    /**
     * @private
     * Saves the content of a coppercube variable of the type "#player.health" back into the correct scene node
     */
    static saveContentOfPotentialTemporaryVariableIntoSource(thevar, scene) {
        var ret = CL3D.CopperCubeVariable.getSceneNodeAndAttributeNameFromTemporaryVariableName(thevar.Name, scene);
        if (ret == null)
            return;

        var node = ret.node;

        if (ret.attrname == 'health' && node != null) {
            var gameai = node.getAnimatorOfType('gameai');
            if (gameai != null) {
                var healthBefore = gameai.Health;
                var healthNew = thevar.getValueAsInt();
                var damage = healthBefore - healthNew;

                if (damage > 0)
                    gameai.OnHit(damage, node);

                else
                    gameai.Health = healthNew;
            }
        }

        else if (ret.attrname == 'movementspeed' && node != null) {
            var an = node.getAnimatorOfType('gameai');
            var an2 = node.getAnimatorOfType('keyboardcontrolled');
            var an3 = node.getAnimatorOfType('camerafps');

            if (an3)
                an3.MoveSpeed = thevar.getValueAsFloat();

            else if (an2)
                an2.MoveSpeed = thevar.getValueAsFloat();

            else if (an)
                an.MovementSpeed = thevar.getValueAsFloat();
        }

        else if (ret.attrname == 'damage' && node != null) {
            var theaction = node.findActionOfType('Shoot');
            if (theaction)
                theaction.Damage = thevar.getValueAsInt();
        }

        else if (ret.attrname == 'damage' && node != null) {
            var theaction = node.findActionOfType('Shoot');
            if (theaction)
                theaction.Damage = thevar.getValueAsInt();
        }

        else if (ret.attrname == 'colsmalldistance' && node != null) {
            var acr = node.getAnimatorOfType('collisionresponse');
            if (acr != null) {
                acr.SlidingSpeed = thevar.getValueAsInt();
                acr.UseFixedSlidingSpeed = true;
            }
        }

        else if (ret.attrname == 'soundvolume') {
            CL3D.gSoundManager.setGlobalVolume(thevar.getValueAsFloat() / 100.0);
        }
    }
        
    /**
     * @private
     * Parses the variable name of the type "#player.health" and returns attribute name and scene node in the scene
     */
    static getSceneNodeAndAttributeNameFromTemporaryVariableName(varname, scene) {
        if (varname.length == 0 || scene == null)
            return null;

        // temporary virtual variables have the layout like "#player.health"
        if (varname[0] != '#')
            return null;

        var pos = varname.indexOf('.');
        if (pos == -1)
            return null;

        // get attibute name
        var attrname = varname.substr(pos + 1, varname.length - pos);
        if (attrname.length == 0)
            return null;

        // find scene node	
        var sceneNodeName = varname.substr(1, pos - 1);
        var node = null;

        if (sceneNodeName == 'system') {
            // system variable
        }

        else {
            node = scene.getSceneNodeFromName(sceneNodeName);

            if (node == null)
                return null;
        }

        // return
        var retobj = new Object(); // used for passing scene node and attribute name back if available
        retobj.node = node;
        retobj.attrname = attrname;
        return retobj;
    }
        
    /**
     * Returns if this variable is a string
     * @public
     */
    isString() {
        return this.ActiveValueType == 0;
    }
        
    /**
     * Returns if this variable is a float value
     * @public
     */
    isFloat() {
        return this.ActiveValueType == 2;
    }
        
    /**
     * Returns if this variable is an int value
     * @public
     */
    isInt() {
        return this.ActiveValueType == 1;
    }
        
    /**
     * Returns the name of the variable
     * @public
     */
    getName() {
        return this.Name;
    }
        
    /**
     * Sets the name of the variable
     * @public
     * @param n Name
     */
    setName(n) {
        this.Name = n;
    }
        
    /**
     * @private
     */
    setAsCopy(copyFrom) {
        if (copyFrom == null)
            return;

        this.ActiveValueType = copyFrom.ActiveValueType;

        this.StringValue = copyFrom.StringValue;
        this.IntValue = copyFrom.IntValue;
        this.FloatValue = copyFrom.FloatValue;
    }
        
    /**
     * Returns the value of the variable as string
     * @public
     */
    getValueAsString() {
        switch (this.ActiveValueType) {
            case 1: // int
                return String(this.IntValue);
            case 2: // float
                if ((this.FloatValue % 1) == 0.0)
                    return String(this.FloatValue);

                else
                    return this.FloatValue.toFixed(6);
        }

        return this.StringValue;
    }
        
    /**
     * Returns the value of the variable as int
     * @public
     */
    getValueAsInt() {
        switch (this.ActiveValueType) {
            case 0: // string
                return Math.floor(this.StringValue);
            case 1: // int
                return this.IntValue;
            case 2: // float
                return this.FloatValue;
        }

        return 0;
    }
        
    /**
     * Returns the value of the variable as float
     * @public
     */
    getValueAsFloat() {
        switch (this.ActiveValueType) {
            case 0: // string
                return Number(this.StringValue);
            case 1: // int
                return this.IntValue;
            case 2: // float
                return this.FloatValue;
        }

        return 0;
    }
        
    /**
     * Sets the value of the variable as string
     * @public
     * @param v the new value
     */
    setValueAsString(v) {
        this.ActiveValueType = 0;
        this.StringValue = v;
    }
        
    /**
     * Sets the value of the variable as int
     * @public
     * @param v the new value
     */
    setValueAsInt(v) {
        this.ActiveValueType = 1;
        this.IntValue = v;
    }
        
    /**
     * Sets the value of the variable as float
     * @public
     * @param v the new value
     */
    setValueAsFloat(v) {
        this.ActiveValueType = 2;
        this.FloatValue = v;
    }
};
