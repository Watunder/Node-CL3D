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

const imports = [
    {
        builtinModules: [
            'child_process',
            'module',
            'path'
        ],
        externalModules: [
            'canvas',
            'nc-screen',
            '@kmamal/gl',
            '@kmamal/sdl',
            'file-fetch'
        ],
        optionalModules: [
            '3d-core-raub',
            'image-raub'
        ]
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
            generateDTS.plugin(),
            //terser(),
            replace({
                delimiters: ['\\b', '\\b(?!\\.)'],
                'process.env.SDL_ENV': true,
                'process.env.RAUB_ENV': false,
                preventAssignment: true
            })
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
            })
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