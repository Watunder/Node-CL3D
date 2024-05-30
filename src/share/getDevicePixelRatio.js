let getDevicePixelRatioImpl = () => { }

if (typeof globalThis.devicePixelRatio == "undefined") {
    await import('nc-screen').then(async (module) => {
        getDevicePixelRatioImpl = () => {
            return module.default.getInfo().isRetina && 2.0;
        }
    })
}
else {
    getDevicePixelRatioImpl = () => {
        return globalThis.devicePixelRatio;
    }
}

/**
 * @returns {Number} the ratio of the resolution in physical pixels and in pixels for the current display device.
 */
export const getDevicePixelRatio = () => {
    return getDevicePixelRatioImpl() || 1.0;
}
