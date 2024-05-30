let loadImageImpl = () => { }

if (typeof globalThis.Image == "undefined") {
    await import('canvas').then(async (module) => {
        loadImageImpl = (src, options) => {
            return module.default.loadImage(src, options)
        }
    })
}
else {
    loadImageImpl = (src, options) => {
        return new Promise(function (resolve, reject) {
            const image = Object.assign(document.createElement('img'), options)

            function cleanup() {
                image.onload = null
                image.onerror = null
            }

            image.onload = function () { cleanup(); resolve(image) }
            image.onerror = function () { cleanup(); reject(new Error('Failed to load the image "' + src + '"')) }

            image.src = src
        })
    }
}

export const loadImage = async (src, options) => {
    return loadImageImpl(src, options);
}
