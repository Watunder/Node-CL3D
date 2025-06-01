import bpkg from 'bpkg';
import fs from 'fs';
import path from 'path';

const packageConfig = [
    JSON.parse(fs.readFileSync('../package.json', { encoding: 'utf-8' }))
];

packageConfig.some(({ dependencies }) => {
    Object.keys(dependencies).forEach(async (module) => {
        await bpkg({
            input: `../node_modules/${module}`,
            output: `../dist/bpkg/${module}.js`,
            collectBindings: false,
            target: 'esm',
        });

        const build_dir = `../node_modules/${module}/build/release`;
        if (fs.existsSync(build_dir)) {
            fs.readdirSync(build_dir).forEach(file => {
                if (/^(?:lib)?[a-zA-Z0-9_.-]+\.(?:dll|dylib|so(?:\.\d+)*)$/.test(file)) {
                    if (!fs.existsSync('../dist/bundle/')) {
                        fs.mkdirSync('../dist/bundle/')
                    }
                    fs.copyFileSync(path.join(build_dir, file), `../dist/bundle/${file}`);
                }
            })
        }
    });
});