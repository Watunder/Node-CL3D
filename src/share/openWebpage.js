import { isBrowser, isNode } from '../utils/environment.js';

/**
 * @param {String} url 
 */
let openWebpageImpl = (url) => { return; }

if (isNode) {
    await import('child_process').then(async (module) => {
        openWebpageImpl = (url) => {
            module.default.exec("start " + url);
        }
    })
}
else if (isBrowser) {
    openWebpageImpl = (url) => {
        globalThis.open(url);
    }
}

export const openWebpage = (url) => {
    return openWebpageImpl(url);
}
