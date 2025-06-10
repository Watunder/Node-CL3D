import path from 'path';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import { generateDTS } from '@typhonjs-build-test/esm-d-ts';

const onwarn = (warning, rollupWarn) => {
    const ignoredWarnings = [
        {
            ignoredCode: 'CIRCULAR_DEPENDENCY',
            ignoredPath: './src/main.js',
        }
    ];

    if (!ignoredWarnings.some(({ ignoredCode, ignoredPath }) => (
        warning.code === ignoredCode &&
        warning.ids.includes(path.resolve(ignoredPath))))
    ) {
        rollupWarn(warning)
    }
}

const imports = [
    {
        builtinModules: [
            'child_process',
            'module',
            'events',
            'path',
            'fs'
        ],
        externalModules: [
            'canvas',
            'nc-screen',
            'file-fetch',
            '3d-core-raub',
            '@napi-rs/canvas'
        ],
        optionalModules: []
    }
];

let replacedImportings = {};
if (imports.some(({ externalModules }) => {
    for (let i = 0; i < externalModules.length; ++i) {
        replacedImportings[`'${externalModules[i]}'`] = `import("./bpkg/${externalModules[i]}.js")`;
    }
}));

export default [
    {
        input: './src/main.js',
        onwarn,
        plugins: [
            generateDTS.plugin()
        ],
        output: {
            format: 'esm',
            file: './dist/cl3d.js'
        },
        external: [
            ...imports[0].builtinModules,
            ...imports[0].externalModules,
            ...imports[0].optionalModules
        ]
    },
    {
        input: './dist/cl3d.js',
        plugins: [
            replace({
                delimiters: ['import\\(', '\\)'],
                values: replacedImportings,
                preventAssignment: true
            }),
            replace({
                values: {
                    GLSL: '',
                },
                preventAssignment: true
            }),
            terser()
        ],
        output: {
            format: 'esm',
            dir: './dist/bundle',
            chunkFileNames: '[name].js'
        },
        external: [
            ...imports[0].builtinModules,
            ...imports[0].optionalModules
        ]
    }
]