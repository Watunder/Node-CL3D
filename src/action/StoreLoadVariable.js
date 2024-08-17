// ---------------------------------------------------------------------
// Action Store Load Variable
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @public
 * @constructor
 * @class
 */
export class ActionStoreLoadVariable extends CL3D.Action {
    /**
     * @type {boolean}
     */
    Load;
    /**
     * @type {String}
     */
    VariableName;

    constructor() {
        super();

        this.Type = 'StoreLoadVariable';
    }

    /**
     * @param {Number} oldNodeId
     * @param {Number} newNodeId
     */
    createClone(oldNodeId, newNodeId) {
        var a = new CL3D.ActionStoreLoadVariable();
        a.Load = this.Load;
        a.VariableName = this.VariableName;
        return a;
    }

    /**
     * @param {String} cookieName
     * @param {String} value
     * @param {Number} expdays
     */
    setCookie(cookieName, value, expdays) {
        var expdate = new Date();
        expdate.setDate(expdate.getDate() + expdays);
        var cvalue = encodeURIComponent(value) + ("; expires=" + expdate.toUTCString());
        document.cookie = cookieName + "=" + cvalue;
    }

    /**
     * @param {String} cookieName
     */
    getCookie(cookieName) {
        var ARRcookies = document.cookie.split(";");
        for (var i = 0; i < ARRcookies.length; ++i) {
            var cookie = ARRcookies[i];
            var equalspos = cookie.indexOf("=");
            var varname = cookie.substr(0, equalspos);

            varname = varname.replace(/^\s+|\s+$/g, "");

            if (varname == cookieName)
                return unescape(cookie.substr(equalspos + 1));
        }

        return null;
    }

    /**
     * @param {CL3D.SceneNode} currentNode
     * @param {CL3D.Scene} sceneManager
     */
    execute(currentNode, sceneManager) {
        if (this.VariableName == null || this.VariableName == "")
            return;

        var var1 = CL3D.CopperCubeVariable.getVariable(this.VariableName, this.Load, sceneManager);

        if (var1 != null) {
            try {
                if (this.Load) {
                    // load
                    var1.setValueAsString(this.getCookie(var1.getName()));
                }

                else {
                    // save
                    this.setCookie(var1.getName(), var1.getValueAsString(), 99);
                }
            }
            catch (e) {
                //Debug.print("error loading/saving data");
            }
        }
    }
};
