let openWebpageImpl = () => { }

if (typeof globalThis.open == "undefined") {
    await import('child_process').then(async (module) => {
        openWebpageImpl = (url) => {
            module.default.exec("start " + url);
        }
    })
}
else {
    openWebpageImpl = (url) => {
        globalThis.open(url);
    }
}

export const openWebpage = (url) => {
    return openWebpageImpl(url);
}
