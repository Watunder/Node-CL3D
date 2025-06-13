import { isBrowser, isNode } from '../utils/environment.js';

/**
 * @param {Number} width 
 * @param {Number} height 
 * @param {WebGLContextAttributes&import('3d-core-raub').TInitOpts} options 
 * @param {HTMLCanvasElement} canvas 
 * @returns {WebGLRenderingContext|WebGL2RenderingContext|{gl:import('webgl-raub'), window:import('glfw-raub').Document, glfw:import('glfw-raub')}}
 */
let createContextImpl = (width, height, options, canvas) => { return; }

if (isNode) {
    await import('3d-core-raub').then(async (module) => {
        createContextImpl = (width, height, options) => {
            const { gl, window, glfw } = module.default.init({
                width: width,
                height: height,
                vsync: true,
                msaa: 4,
                mode: options.mode || 'windowed',
                autoEsc: true,
                autoFullscreen: true,
                ...options
            });
            return { gl, window, glfw };
        }
    });
}
else if (isBrowser) {
    createContextImpl = (width, height, options, canvas) => {
        width = width | 0;
        height = height | 0;
        if (!(width > 0 && height > 0)) {
            return null;
        }

        if (!canvas) {
            return null;
        }

        /**
         * @type WebGLRenderingContext
         */
        let gl;
        canvas.width = width;
        canvas.height = height;

        try {
            gl = canvas.getContext('webgl2', options);
        } catch (e) {
            console.log(e);
        }

        const _getExtension = gl.getExtension;
        const extDestroy = {
            destroy: function () {
                const loseContext = _getExtension.call(gl, 'WEBGL_lose_context');
                if (loseContext) {
                    loseContext.loseContext();
                }
            }
        }

        const extResize = {
            resize: function (w, h) {
                canvas.width = w;
                canvas.height = h;
            }
        }

        const _supportedExtensions = gl.getSupportedExtensions().slice();
        _supportedExtensions.push(
            'STACKGL_destroy_context',
            'STACKGL_resize_drawingbuffer');
        gl.getSupportedExtensions = function () {
            return _supportedExtensions.slice();
        }

        gl.getExtension = function (extName) {
            const name = extName.toLowerCase();
            if (name === 'stackgl_resize_drawingbuffer') {
                return extResize;
            }
            if (name === 'stackgl_destroy_context') {
                return extDestroy;
            }
            return _getExtension.call(gl, extName);
        }

        return gl || null;
    }
}

export const createContext = (width, height, options, canvas) => {
    return createContextImpl(width, height, options, canvas);
}
