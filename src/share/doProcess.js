let doProcessImpl = () => { }

if (typeof globalThis.process == "undefined") {
    doProcessImpl = () => {
        return {
            env: {
                SDL_ENV: '',
                RAUB_ENV: ''
            }
        };
    }
}
else {
    doProcessImpl = () => {
        return process;
    }
}

/**
 * @returns {NodeJS.Process}
 */
export const doProcess = () => {
    return doProcessImpl();
}
