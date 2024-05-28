let endProgramImpl = () => { }

if (typeof globalThis.open == "undefined") {
    endProgramImpl = (url) => {
        process.exit();
    }
}
else {
    endProgramImpl = (url) => {
        globalThis.close();
    }
}

export const endProgram = (url) => {
    return endProgramImpl(url);
}
