// ---------------------------------------------------------------------
// Action SetOrChangeAVariable
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @public
 * @constructor
 * @class
 */
export class ActionSetOrChangeAVariable extends CL3D.Action {
	constructor() {
        super();

		// variables set in loader
		//this.VariableName = this.ReadString();
		//this.Operation = this.Data.readInt();
		//this.ValueType = this.Data.readInt();
		//this.Value = this.ReadString();
		this.Type = 'SetOrChangeAVariable';
	}

	/**
	 * @public
	 */
	createClone(oldNodeId, newNodeId) {
		var a = new CL3D.ActionSetOrChangeAVariable();
		a.VariableName = this.VariableName;
		a.Operation = this.Operation;
		a.ValueType = this.ValueType;
		a.Value = this.Value;
		return a;
	}
    
	/**
	 * @public
	 */
	execute(currentNode, sceneManager) {
		if (!currentNode || !sceneManager)
			return;

		if (this.VariableName == null)
			return;

		var var1 = CL3D.CopperCubeVariable.getVariable(this.VariableName, true, sceneManager);
		if (var1 == null)
			return;

		var var2 = null;

		if (this.ValueType == 1) //EO_VARIABLE)
		{
			var2 = CL3D.CopperCubeVariable.getVariable(this.Value, false, sceneManager);
			if (var2 == null)
				return; // operand variable not existing
		}

		if (var2 == null) {
			var2 = new CL3D.CopperCubeVariable();
			var2.setValueAsString(this.Value);
		}

		switch (this.Operation) {
			case 0: //EO_SET:
				var1.setAsCopy(var2);
				break;
			case 1: //EO_ADD:
				var1.setValueAsFloat(var1.getValueAsFloat() + var2.getValueAsFloat());
				break;
			case 2: //EO_SUBSTRACT:
				var1.setValueAsFloat(var1.getValueAsFloat() - var2.getValueAsFloat());
				break;
			case 3: //EO_DIVIDE:
				{
					var diva = var2.getValueAsFloat();
					var1.setValueAsFloat((diva != 0) ? (var1.getValueAsFloat() / diva) : 0);
				}
				break;
			case 4: //EO_DIVIDE_INT:
				{
					var divb = var2.getValueAsFloat();
					var1.setValueAsInt((divb != 0) ? Math.floor(var1.getValueAsFloat() / divb) : 0);
				}
				break;
			case 5: //EO_MULTIPLY:
				var1.setValueAsFloat(var1.getValueAsFloat() * var2.getValueAsFloat());
				break;
			case 6: //EO_MULTIPLY_INT:
				var1.setValueAsInt(Math.floor(var1.getValueAsFloat() * var2.getValueAsFloat()));
				break;
		}

		CL3D.CopperCubeVariable.saveContentOfPotentialTemporaryVariableIntoSource(var1, sceneManager);
	}
};
