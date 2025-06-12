import { isBrowser, isNode } from '../utils/environment.js';

/**
 * @param {string|Buffer} src 
 * @param {any} options 
 * @returns {Promise<Image|{width?:number, height?:number}>}
 */
let loadImageImpl = (src, options) => { return; }

if (isNode) {
    await import('3d-core-raub').then(async (module) => {
        loadImageImpl = (src, options) => {
            return module.default.skia.loadImage(src, options);
        }
    });
}
else if (isBrowser) {
    loadImageImpl = (src, options) => {
        return new Promise(function (resolve, reject) {
            const image = Object.assign(document.createElement('img'), options);

            function cleanup() {
                image.onload = null;
                image.onerror = null;
            }

            image.onload = () => { cleanup(); resolve(image) }
            image.onerror = () => { cleanup(); reject(new Error('Failed to load the image "' + src + '"')) }

            image.src = src;
        })
    }
}

export const loadImage = (src, options) => {
    return loadImageImpl(src, options);
}
