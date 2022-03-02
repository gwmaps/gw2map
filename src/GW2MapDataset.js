/**
 * @created      09.08.2020
 * @author       smiley <smiley@chillerlan.net>
 * @copyright    2020 smiley
 * @license      MIT
 */

import Utils from './util/Utils';

export default class GW2MapDataset{

	//noinspection RegExpRedundantEscape
	metadata = {
		continentId : {type: 'int',   default: 1},
		floorId     : {type: 'int',   default: 1},
		regionId    : {type: 'int',   default: null},
		mapId       : {type: 'int',   default: null},
		customFloor : {type: 'int',   default: null},
		language    : {type: 'int',   default: 'en'},
		zoom        : {type: 'int',   default: -1},
		maxZoom     : {type: 'int',   default: 8},
		tileAdjust  : {type: 'int',   default: 0},
		mapControls : {type: 'bool',  default: true},
		linkbox     : {type: 'bool',  default: false},
		events      : {type: 'bool',  default: false},
		initLayers  : {type: 'array', default: null, regex: /^([a-z_,\s]+)$/i},
		extraLayers : {type: 'array', default: null, regex: /^([a-z_,\s]+)$/i},
		centerCoords: {type: 'array', default: null, regex: /^([\[\]\s\d\.,]+)$/},
		customRect  : {type: 'array', default: null, regex: /^([\[\]\s\d\.,]+)$/},
		includeMaps : {type: 'array', default: [],   regex: /^([\s\d,]+)$/},
	};

	dataset = {};

	/**
	 * @param {Object} dataset
	 * @param {Object} options
	 */
	constructor(dataset, options){
		this.options = options;

		this._parse(dataset);
	}

	/**
	 * @returns {Object}
	 */
	getData(){
		return this.dataset;
	}

	/**
	 * @param {Object} dataset
	 * @private
	 */
	_parse(dataset){

		Object.keys(this.metadata).forEach(k => {

			if(typeof dataset[k] === 'undefined' || dataset[k] === ''){
				this.dataset[k] = this.metadata[k].default;
			}
			else{
				['int', 'bool', 'array', 'string'].forEach(t => {
					if(this.metadata[k].type === t){
						this.dataset[k] = this['_parse_'+t](dataset[k], this.metadata[k]);
					}
				});
			}

			if(typeof this['_parse_'+k] === 'function'){

				if(this.dataset[k] === null || this.dataset[k] === this.metadata[k]){
					return this.metadata[k];
				}

				this.dataset[k] = this['_parse_'+k](this.dataset[k], this.metadata[k]);
			}
		});

	}

	/**
	 * @param {Object} data
	 * @returns {number}
	 * @private
	 */
	_parse_int(data){
		return Utils.intval(data);
	}

	/**
	 * @param {Object} data
	 * @returns {boolean}
	 * @private
	 */
	_parse_bool(data){
		return ['1', 'true', 't', 'yes', 'y'].includes(data.toLowerCase());
	}

	/**
	 * @param {Object} data
	 * @param {Object} meta
	 * @returns {*}
	 * @private
	 */
	_parse_array(data, meta){
		let match = data.match(meta.regex);

		if(match){
			return match
		}

		return meta.default;
	}

	/**
	 * @param {Object} data
	 * @param {Object} meta
	 * @returns {*}
	 * @private
	 */
	_parse_string(data, meta){
		return this._parse_array(data, meta);
	}

	/**
	 * @param {Object} data
	 * @param {Object} meta
	 * @returns {number}
	 * @private
	 */
	_parse_continentId(data, meta){
		return [1, 2].includes(data) ? data : meta.default;
	}

	/**
	 * @param {Object} data
	 * @param {Object} meta
	 * @returns {number}
	 * @private
	 */
	_parse_regionId(data, meta){
		return data > 0 ? data : meta.default;
	}

	/**
	 * @param {Object} data
	 * @param {Object} meta
	 * @returns {number}
	 * @private
	 */
	_parse_mapId(data, meta){
		return data > 0 ? data : meta.default;
	}

	/**
	 * @param {Object} data
	 * @param {Object} meta
	 * @returns {string}
	 * @private
	 */
	_parse_language(data, meta){
		return ['de', 'en', 'es', 'fr', 'zh'][data] || this.options.lang;
	}

	/**
	 * @param {Object} data
	 * @returns {number}
	 * @private
	 */
	_parse_zoom(data){
		return (data < this.options.minZoom || data > this.options.maxZoom) ? this.options.defaultZoom : data
	}

	/**
	 * @param {Object} data
	 * @param {Object} meta
	 * @returns {number|null}
	 * @private
	 */
	_parse_maxZoom(data, meta){
		return [6, 7].includes(data) ? data : meta.default;
	}

	/**
	 * @param {Object} data
	 * @param {Object} meta
	 * @returns {[]}
	 * @private
	 */
	_parse_includeMaps(data, meta){

		if(!data[0]){
			return  meta.default;
		}

		let ret = [];

		data[0].replace(/[^\d,]/g, '').split(',').forEach(v => {
			if(v){
				ret.push(Utils.intval(v));
			}
		});

		return ret
	}

	/**
	 * @param {Object} data
	 * @param {Object} meta
	 * @returns {number[][]}
	 * @private
	 */
	_parse_customRect(data, meta){
		data = JSON.parse(data[0]);

		if(data.length < 2 || data[0].length < 2 || data[1].length < 2){
			return meta.default;
		}

		return data;
	}

	/**
	 * @param {Object} data
	 * @param {Object} meta
	 * @returns {number[]}
	 * @private
	 */
	_parse_centerCoords(data, meta){
		data = JSON.parse(data[0]);

		if(data.length < 2 || typeof data[0] !== 'number' || typeof data[1] !== 'number'){
			return meta.default;
		}

		return data;
	}

	/**
	 * @param {Object} data
	 * @param {Object} meta
	 * @returns {string[]}
	 * @private
	 */
	_parse_extraLayers(data, meta){
		let ret = [];

		data[0].replace(/\s/g, '').split(',').forEach(v => {
			if(v){
				ret.push(v.toLowerCase());
			}
		});

		return ret;
	}

	/**
	 * @param {Object} data
	 * @param {Object} meta
	 * @returns {string[]}
	 * @private
	 */
	_parse_initLayers(data, meta){
		return this._parse_extraLayers(data, meta);
	}

	/**
	 * @param {Object} data
	 * @returns {number}
	 * @private
	 */
	_parse_tileAdjust(data){
		return data < 0 ? 0 : data;
	}

}
