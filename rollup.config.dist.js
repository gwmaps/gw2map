import json from '@rollup/plugin-json';
import {babel} from '@rollup/plugin-babel';
import {terser} from 'rollup-plugin-terser';

export default {
	input: 'src/index.js',
	output: {
		file: 'dist/gw2map.js',
		format: 'es',
		sourcemap: false,
	},
	plugins: [
		json({
			preferConst: true
		}),
		babel({
			babelHelpers: 'bundled'
		}),
		terser({
			format: {
				comments: false,
				keep_quoted_props: true,
//				max_line_len: 130,
				quote_style: 3,
				preamble: `/*
 * includes portions of Leaflet, a JS library for interactive maps. http://leafletjs.com
 * (c) 2010-2019 Vladimir Agafonkin, (c) 2010-2011 CloudMade
 */
`,
			},
		}),
	],
};
