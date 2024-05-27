import terser from '@rollup/plugin-terser';
import { generateDTS } from '@typhonjs-build-test/esm-d-ts';

export default {
	input: {
        'cl3d': './src/main.js',
    },
	output: {
        format: 'esm',
		dir: './dist/',
        entryFileNames: '[name].mjs',
	},
    plugins: [
        terser(),
        generateDTS.plugin(),
    ]
};