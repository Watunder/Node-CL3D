import path from 'path';
import terser from '@rollup/plugin-terser';
import replace from "@rollup/plugin-replace";
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

const dynamaticImportings = [
    {
        builtinModules: [
            'child_process',
            'module'
        ],
        externalModules: [
            'canvas',
            'nc-screen',
            '@kmamal/gl',
            'file-fetch'
        ]
    }
];

let replacedImportings = {};
if (dynamaticImportings.some(({ externalModules }) => {
    for (let i = 0; i < externalModules.length; ++i) {
        replacedImportings[`'${externalModules[i]}'`] = `import('./bpkg/${externalModules[i]}.js')`;
    }
}));

export default [
    {
        input: './src/main.js',
        onwarn,
        plugins: [
            generateDTS.plugin(),
        ],
        output: {
            format: 'esm',
            file: './dist/cl3d.js'
        },
        external: [
            ...dynamaticImportings[0].builtinModules,
            ...dynamaticImportings[0].externalModules,
        ]
    },
    {
        input: './dist/cl3d.js',
        plugins: [
            replace({
                delimiters: ['import\\(', '\\)'],
                values: replacedImportings,
                preventAssignment: true
            })
        ],
        output: {
            format: 'esm',
            dir: './dist/bundle'
        },
        external: [
            ...dynamaticImportings[0].builtinModules
        ]
    }
]