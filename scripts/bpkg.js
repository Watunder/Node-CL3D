import bpkg from 'bpkg';
import fs from 'fs';

const packageConfig = [
    JSON.parse(fs.readFileSync('../package.json', { encoding: 'utf-8' }))
];

packageConfig.some(({ dependencies }) => {
    Object.keys(dependencies).forEach(async (module) => {
        await bpkg({
            input: `../node_modules/${module}`,
            output: `../dist/bpkg/${module}.js`,
            ignoreMissing: true,
            collectBindings: false,
            target: 'esm',
        });
    });
});