let getSdlInfoImpl = () => { }

if (typeof globalThis.Image == "undefined") {
    await import('@kmamal/sdl').then(async (module) => {
        getSdlInfoImpl = () => {
            return module.default.info;
        }
    })
}

export const getSdlInfo = () => {
    return getSdlInfoImpl();
}
