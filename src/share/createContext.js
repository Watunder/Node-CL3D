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

        return gl || null;
    }
}

export const createContext = (width, height, options, canvas) => {
    return createContextImpl(width, height, options, canvas);
}
