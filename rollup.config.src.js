import json from '@rollup/plugin-json';

export default {
	input: 'src/index.js',
	output: {
		file: 'dist/gw2map-src.js',
		format: 'es',
		sourcemap: true,
	},
	plugins: [
		json({
			preferConst: true,
		}),
	],
};
