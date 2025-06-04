let saveFileImpl = () => { }

if (typeof globalThis.HTMLElement == "undefined") {
    await import('fs').then(async (module) => {
        saveFileImpl = (filepath, data) => {
            module.writeFileSync(filepath, data);
        }
    });
}
else {
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
