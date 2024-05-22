export default {
	input: {
        'cl3d': './src/main.js', 
    },
	output: {
        format: 'esm',
		dir: './dist/',
        entryFileNames: '[name].mjs',
	}
};