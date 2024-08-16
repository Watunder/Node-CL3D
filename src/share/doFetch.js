let doFetchImpl = () => { }

if (typeof globalThis.Image == "undefined") {
    await import('file-fetch').then(async (module) => {
        doFetchImpl = (input, init) => {
            return module.default(input, init);
        }
    });
}
else {
    doFetchImpl = (input, init) => {
        return fetch(input, init);
    }
}

/**
 * 
 * @param {string | URL | globalThis.Request} input This defines the resource that you wish to fetch.
 * @param {RequestInit=} init An object containing any custom settings you want to apply to the request.
 * @returns {Promise<Response>}
 */
export const doFetch = (input, init) => {
    return doFetchImpl(input, init);
}
