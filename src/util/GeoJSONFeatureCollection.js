/**
 * @filesource   GeoJSONFeatureCollection.js
 * @created      09.08.2020
 * @author       smiley <smiley@chillerlan.net>
 * @copyright    2020 smiley
 * @license      MIT
 */

import GeoJSONFeature from './GeoJSONFeature';

export default class GeoJSONFeatureCollection{

	/**
	 * GeoJSONFeatureCollection constructor
	 */
	constructor(){
		this.json = {
			type:     'FeatureCollection',
			features: [],
		};
	}

	/**
	 * @returns {{type: string, features: Array}|*}
	 */
	getJSON(){
		this.json.features.forEach((feature, i) => this.json.features[i] = feature.getJSON());

		return this.json;
	}

	/**
	 * @param type
	 * @param properties
	 * @returns {GeoJSONFeatureCollection}
	 */
	setCRS(type, properties){
		this.json.crs = {
			type:       type,
			properties: properties,
		};

		return this;
	}

	/**
	 * @param properties
	 * @returns {GeoJSONFeature}
	 */
	addFeature(properties){
		let feature = new GeoJSONFeature(properties);
		this.json.features.push(feature);

		return feature;
	}
}
