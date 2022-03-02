/**
 * @created      10.08.2020
 * @author       smiley <smiley@chillerlan.net>
 * @copyright    2020 smiley
 * @license      MIT
 */

// noinspection ES6PreferShortImport
import {FeatureGroup, Util} from '../../node_modules/leaflet/dist/leaflet-src.esm';

// leaflet-ant-path, but different
// https://github.com/rubenspgcavalcante/leaflet-ant-path

export default class AntPath extends FeatureGroup{

	_antOptions = {
		interactive: false,
		className: 'leaflet-ant-path',
		color: 'rgb(255, 255, 255)',
		opacity: 0.7,
		dashArray: [10 ,20],
	};

	_optionsMap = {
		antColor: 'color',
		antOpacity: 'opacity',
		antDashArray: 'dashArray',
	};

	_latLng = null;
	_antLayers = {main: null, ants: null};

	constructor(latLng, options, type){
		super();

		this._latLng = latLng;

		this._parseOptions(options);
		this._add(type);
	}

	_parseOptions(options){
		this.options = Util.extend(this.options, options || {});

		Object.keys(this._optionsMap).forEach(k => {
			if(this.options[k]){
				this._antOptions[this._optionsMap[k]] = this.options[k];

				delete this.options[k];
			}
		});

		delete this.options.antPath;

		this._antOptions.pane = this.options.pane;
	}

	_add(type){
		this._antLayers.ants = new type(this._latLng, this._antOptions);
		this._antLayers.main = new type(this._latLng, this.options);

		this.addLayer(this._antLayers.ants);
		this.addLayer(this._antLayers.main);
	}

}
