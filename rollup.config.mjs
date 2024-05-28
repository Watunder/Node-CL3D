import terser from '@rollup/plugin-terser';
import { generateDTS } from '@typhonjs-build-test/esm-d-ts';

export default [
    {
        input: './src/main.js',
        plugins: [
            terser(),
            generateDTS.plugin()
        ],
        output: {
            format: 'esm',
            file: './dist/cl3d.mjs'
        }
    }
]