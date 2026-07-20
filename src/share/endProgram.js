import * as CL3D from "../main.js";
import { isBrowser, isNode } from "../utils/environment.js";

let endProgramImpl = () => {
	return;
};

if (isNode) {
	endProgramImpl = () => {
		const engine = CL3D.ScriptingInterface.getScriptingInterface().Engine;
		if (engine != null && engine.getRenderer()) {
			engine.getRenderer().glfw.terminate();
			process.exit(0);
		}
	};
} else if (isBrowser) {
	endProgramImpl = () => {
		globalThis.close();
	};
}

export const endProgram = () => {
	return endProgramImpl();
};
