/**
 * @filesource   Fullscreen.js
 * @created      10.08.2020
 * @author       smiley <smiley@chillerlan.net>
 * @copyright    2020 smiley
 * @license      MIT
 */

// noinspection ES6PreferShortImport
import {Control, DomEvent, DomUtil} from '../../node_modules/leaflet/dist/leaflet-src.esm';

// https://github.com/Leaflet/Leaflet.fullscreen
export default class Fullscreen extends Control{

	options = {
		position: 'topleft',
		title   : {
			'false': 'View Fullscreen',
			'true' : 'Exit Fullscreen',
		},
	};

	onAdd(map){
		let container = DomUtil.create('div', 'leaflet-control-fullscreen leaflet-bar leaflet-control');

		this.link = DomUtil.create('a', 'leaflet-control-fullscreen-button leaflet-bar-part', container);
		this.link.href = '#';

		this._map = map;
		this._map.on('fullscreenchange', this._toggleTitle, this);
		this._toggleTitle();

		DomEvent.on(this.link, 'click', this._click, this);

		return container;
	}

	_click(e){
		DomEvent.stopPropagation(e);
		DomEvent.preventDefault(e);
		this._map.toggleFullscreen(this.options);
	}

	_toggleTitle(){
		this.link.title = this.options.title[this._map.isFullscreen()];
	}

}

