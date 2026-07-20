import { isBrowser, isNode } from "../utils/environment.js";

/**
 * @returns {Number} the ratio of the resolution in physical pixels and in pixels for the current display device.
 */
let getDevicePixelRatioImpl = () => 1.0;

if (isNode) {
	// TODO
} else if (isBrowser) {
	getDevicePixelRatioImpl = () => {
		return globalThis.devicePixelRatio || 1.0;
	};
}

export const getDevicePixelRatio = () => {
	return getDevicePixelRatioImpl();
};
