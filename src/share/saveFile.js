import { isBrowser, isNode } from "../utils/environment.js";

/**
 * @param {String} filepath
 * @param {any} data
 */
let saveFileImpl = (filepath, data) => {
	return;
};

if (isNode) {
	await import("fs").then(async (module) => {
		saveFileImpl = (filepath, data) => {
			module.default.writeFileSync(filepath, data);
		};
	});
} else if (isBrowser) {
	saveFileImpl = (filepath, data) => {
		const element = document.createElement("a");
		element.href = URL.createObjectURL(new Blob([data]));
		element.download = filepath;
		element.click();
		URL.revokeObjectURL(element.href);
	};
}

export const saveFile = (filepath, data) => {
	return saveFileImpl(filepath, data);
};
