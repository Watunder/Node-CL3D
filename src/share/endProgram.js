import { isBrowser, isNode } from '../utils/environment.js';

let endProgramImpl = () => { return; }

if (isNode) {
    endProgramImpl = () => {
        process.exit();
    }
}
else if (isBrowser) {
    endProgramImpl = () => {
        globalThis.close();
    }
}

export const endProgram = () => {
    return endProgramImpl();
}
