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
        return globalThis.location.href;
    }
}

export const getDirName = () => {
    return getDirNameImpl();
}
