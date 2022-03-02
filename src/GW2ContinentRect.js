/**
 * @created      09.08.2020
 * @author       smiley <smiley@chillerlan.net>
 * @copyright    2020 smiley
 * @license      MIT
 */

export default class GW2ContinentRect{

	/**
	 * GW2ContinentRect constructor
	 *
	 * @param continent_rect
	 * @param map_rect
	 */
	constructor(continent_rect, map_rect){
		this.rect     = continent_rect;
		this.map_rect = map_rect;
	}

	/**
	 * returns bounds for L.LatLngBounds()
	 *
	 * @returns {*[]}
	 */
	getBounds(){
		return [
			[this.rect[0][0], this.rect[1][1]],
			[this.rect[1][0], this.rect[0][1]]
		]
	}

	/**
	 * returns the center of the rectangle
	 *
	 * @returns {*[]}
	 */
	getCenter(){
		return [
			Math.round((this.rect[0][0] + this.rect[1][0]) / 2),
			Math.round((this.rect[0][1] + this.rect[1][1]) / 2)
		]
	}

	/**
	 * returns a polygon made of the rectangles corners
	 *
	 * @returns {*[]}
	 */
	getPoly(){
		return [[
			[this.rect[0][0], this.rect[0][1]],
			[this.rect[1][0], this.rect[0][1]],
			[this.rect[1][0], this.rect[1][1]],
			[this.rect[0][0], this.rect[1][1]]
		]]
	}

	/**
	 * Scales coordinates from map to continent coordiante system
	 *
	 * @param {[]} coords  from event_details.json or Mumble Link data.
	 * @param {[]} [r]     map_rect taken from maps.json or map_floor.json
	 * @returns {*[]}
	 */
	scaleCoords(coords, r){
		r = this.map_rect || r;

		return [
			Math.round(this.rect[0][0] + (this.rect[1][0] - this.rect[0][0]) * (coords[0] - r[0][0]) / (r[1][0] - r[0][0])),
			Math.round(this.rect[0][1] + (this.rect[1][1] - this.rect[0][1]) * (1 - (coords[1] - r[0][1]) / (r[1][1] - r[0][1]))),
		]
	}

	/**
	 * Scales length from map to continent coordiante system
	 *
	 * @param {number} length  from event_details.json or Mumble Link data
	 * @param {*[]}    [r]     map_rect taken from maps.json or map_floor.json
	 * @returns {number}
	 */
	scaleLength(length, r){
		// still unsure about the correct values here
		length = length / (1/24);
		r = this.map_rect || r;

		let scalex = (length - r[0][0]) / (r[1][0] - r[0][0]);
		let scaley = (length - r[0][1]) / (r[1][1] - r[0][1]);

		return Math.sqrt((scalex * scalex) + (scaley * scaley));
	}

}
