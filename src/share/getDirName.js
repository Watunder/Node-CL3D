let getDirNameImpl = () => { }

if (typeof globalThis.location == "undefined") {
    await import('path').then(async (module) => {
        getDirNameImpl = () => {
            const __filename = import.meta.url;
            const __dirname = module.dirname(__filename);
    
            return __dirname;
        }
    });
}
else {
    getDirNameImpl = () => {
        const __filename = globalThis.location.href;
        const __dirname = __filename.slice(0, __filename.lastIndexOf("/"));
        return __dirname;
    }
}

/**
 * @returns {String}
 */
export const getDirName = () => {
    return getDirNameImpl();
}
