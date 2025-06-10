import { isBrowser, isNode } from '../utils/environment.js';

/**
 * @returns {Number} the ratio of the resolution in physical pixels and in pixels for the current display device.
 */
let getDevicePixelRatioImpl = () => { return; }

if (isNode) {
    await import('nc-screen').then(async (module) => {
        getDevicePixelRatioImpl = () => {
            return module.default.getInfo().isRetina && 2.0;
        }
    })
}
else if (isBrowser) {
    getDevicePixelRatioImpl = () => {
        return globalThis.devicePixelRatio;
    }
}


export const getDevicePixelRatio = () => {
    return getDevicePixelRatioImpl() || 1.0;
}
