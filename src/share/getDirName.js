import { isBrowser, isNode } from '../utils/environment.js';

/**
 * @returns {String}
 */
let getDirNameImpl = () => { return; }

if (isNode) {
    await import('path').then(async (module) => {
        getDirNameImpl = () => {
            const __filename = import.meta.url;
            const __dirname = module.default.dirname(__filename);

            return __dirname;
        }
    });
}
else if (isBrowser) {
    getDirNameImpl = () => {
        const __filename = globalThis.location.href;
        const __dirname = __filename.slice(0, __filename.lastIndexOf("/"));
        return __dirname;
    }
}

export const getDirName = () => {
    return getDirNameImpl();
}
