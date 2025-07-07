import { isBrowser, isNode } from '../utils/environment.js';

/**
 * @param {String} filepath 
 * @param {any} data 
 */
let saveFileImpl = (filepath, data) => { return; }

if (isNode) {
    await import('fs').then(async (module) => {
        saveFileImpl = (filepath, data) => {
            module.default.writeFileSync(filepath, data);
        }
    });
}
else if (isBrowser) {
    saveFileImpl = (filepath, data) => {
        let blob = new Blob([data]);

        let element = document.createElement("save-file");

        element.href = URL.createObjectURL(blob);
        element.download = filepath;
        element.click();
    }
}

export const saveFile = (filepath, data) => {
    return saveFileImpl(filepath, data);
}
