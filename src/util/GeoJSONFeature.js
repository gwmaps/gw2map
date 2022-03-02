/**
 * @created      09.08.2020
 * @author       smiley <smiley@chillerlan.net>
 * @copyright    2020 smiley
 * @license      MIT
 */

import Utils from './Utils';

export default class GeoJSONFeature{

	/**
	 * GeoJSONFeature constructor
	 *
	 * @param properties
	 */
	constructor(properties){
		this.json = {
			type:       'Feature',
			geometry:   {
				type       : '',
				coordinates: [],
			},
			properties: properties || {},
		};
	}

	/**
	 * @returns {{type: string, geometry: {type: string, coordinates: Array}, properties: (*|{})}|*}
	 */
	getJSON(){
		return this.json;
	}

	/**
	 * @param id
	 * @returns {GeoJSONFeature}
	 */
	setID(id){

		if(id){
			this.json.id = id; // gmaps
			this.json.properties.id = id; // leaflet
		}

		return this;
	}

	/**
	 * @param coords
	 * @param type
	 * @returns {GeoJSONFeature}
	 */
	setGeometry(coords, type){
		this.json.geometry.coordinates = coords;
		this.json.geometry.type = [
			'Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon', 'GeometryCollection'
		].includes(type) ? type : 'Point';

		return this;
	}

}
