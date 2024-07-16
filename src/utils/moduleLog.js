import { getDirName } from "../share/getDirName.js";
import { doFetch } from "../share/doFetch.js";

globalThis.moduleLog = async (moduleName, exportName) => {
    const __dirName = getDirName();
    const modulePath = `${__dirName}/${moduleName}`;

    await doFetch(modulePath).then((response) => {
        if (!response.ok)
            throw new Error(`Could not open file '${modulePath}' (status: ${response.status})`);
    })

    const module = await import(modulePath);

    return console.log({ [exportName]: module[exportName] });
}
