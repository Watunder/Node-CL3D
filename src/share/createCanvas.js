let createCanvasImpl = () => { }

if (typeof globalThis.HTMLCanvasElement == "undefined") {
    await import('canvas').then(async (module) => {
        createCanvasImpl = (width, height) => {
            return module.default.createCanvas(width, height);
        }
    })
}
else {
    createCanvasImpl = (width, height) => {
        return Object.assign(document.createElement('canvas'), { width: width, height: height });
    }
}

/**
 * @param {Number=} width 
 * @param {Number=} height 
 * @returns {HTMLCanvasElement}
 */
export const createCanvas = (width, height) => {
    return createCanvasImpl(width, height);
}
