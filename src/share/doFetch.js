import { isBrowser, isNode } from '../utils/environment.js';

/**
 * @param {string | URL | globalThis.Request} input This defines the resource that you wish to fetch.
 * @param {RequestInit=} init An object containing any custom settings you want to apply to the request.
 * @returns {Promise<Response>}
 */
let doFetchImpl = (input, init) => { return; }

if (isNode) {
    await import('file-fetch').then(async (module) => {
        doFetchImpl = (input, init) => {
            return module.default(input, init);
        }
    });
}
else if (isBrowser) {
    doFetchImpl = (input, init) => {
        return fetch(input, init);
    }
}


export const doFetch = (input, init) => {
    return doFetchImpl(input, init);
}
