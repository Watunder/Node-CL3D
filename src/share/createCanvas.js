import { isBrowser, isNode } from '../utils/environment.js';

/**
 * @param {Number} width 
 * @param {Number} height 
 * @returns {HTMLCanvasElement|import('@napi-rs/canvas').Canvas}
 */
let createCanvasImpl = (width, height) => { return; }

if (isNode) {
    await import('3d-core-raub').then(async (module) => {
        createCanvasImpl = (width, height) => {
            return module.default.skia.createCanvas(width, height);
        }
    })
}
else if (isBrowser) {
    createCanvasImpl = (width, height) => {
        return Object.assign(document.createElement('canvas'), { width: width, height: height });
    }
}


export const createCanvas = (width, height) => {
    return createCanvasImpl(width, height);
}
