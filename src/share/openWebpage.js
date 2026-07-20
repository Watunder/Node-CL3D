import { isBrowser, isNode } from "../utils/environment.js";

/**
 * @param {String} url
 */
let openWebpageImpl = (url) => {
	return;
};

if (isNode) {
	await import("child_process").then(async (module) => {
		openWebpageImpl = (url) => {
			let command = "";
			if (process.platform === "win32") {
				command = "start";
			} else if (process.platform === "darwin") {
				command = "open";
			} else {
				command = "xdg-open";
			}
			module.default.exec(`${command} ${url}`);
		};
	});
} else if (isBrowser) {
	openWebpageImpl = (url) => {
		globalThis.open(url);
	};
}

export const openWebpage = (url) => {
	return openWebpageImpl(url);
};
