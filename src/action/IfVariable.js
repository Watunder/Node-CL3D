// ---------------------------------------------------------------------
// Action IfVariable
// ---------------------------------------------------------------------

import * as CL3D from "../main.js";

/**
 * @private
 * @constructor
 * @class
 */
export class ActionIfVariable extends CL3D.Action {
	constructor() {
        super();

		// variables set in loader
		// this.VariableName = this.ReadString();
		// this.ComparisonType = this.Data.readInt();
		// this.ValueType = this.Data.readInt();
		// this.Value = this.ReadString();
		// this.TheActionHandler
		this.Type = 'IfVariable';
	}

	/**
	 * @private
	 */
	createClone(oldNodeId, newNodeId) {
		var a = new CL3D.ActionIfVariable();
		a.VariableName = this.VariableName;
		a.ComparisonType = this.ComparisonType;
		a.ValueType = this.ValueType;
		a.Value = this.Value;
		a.TheActionHandler = this.TheActionHandler ? this.TheActionHandler.createClone(oldNodeId, newNodeId) : null;
		a.TheElseActionHandler = this.TheElseActionHandler ? this.TheElseActionHandler.createClone(oldNodeId, newNodeId) : null;
		return a;
	}

	/**
	 * @private
	 */
	execute(currentNode, sceneManager) {
		if (!currentNode || !sceneManager)
			return;

		if (this.VariableName == null)
			return;

		var var1 = CL3D.CopperCubeVariable.getVariable(this.VariableName, true, sceneManager);
		if (var1 == null) // should not happen since the function above creates if not found
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

		var execute = false;

		switch (this.ComparisonType) {
			case 0: //EO_EQUAL:
			case 1: //EO_NOT_EQUAL:
				{
					if (var1.isString() && var2.isString())
						// string compare
						execute = var1.getValueAsString() == var2.getValueAsString();

					else
						// number compare
						execute = CL3D.equals(var1.getValueAsFloat(), var2.getValueAsFloat());

					if (this.ComparisonType == 1) //EO_NOT_EQUAL)
						execute = !execute;
					break;
				}
			case 2: //EO_BIGGER_THAN:
				{
					execute = var1.getValueAsFloat() > var2.getValueAsFloat();
				}
				break;
			case 3: //EO_SMALLER_THAN:
				{
					execute = var1.getValueAsFloat() < var2.getValueAsFloat();
				}
				break;
		}

		if (execute) {
			if (this.TheActionHandler)
				this.TheActionHandler.execute(currentNode);
		}

		else {
			if (this.TheElseActionHandler)
				this.TheElseActionHandler.execute(currentNode);
		}
	}
};
