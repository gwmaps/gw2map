/**
 * @filesource   CoordView.js
 * @created      10.08.2020
 * @author       smiley <smiley@chillerlan.net>
 * @copyright    2020 smiley
 * @license      MIT
 */

// noinspection ES6PreferShortImport
import {Control, DomEvent, DomUtil} from '../../node_modules/leaflet/dist/leaflet-src.esm';

// coordinate view with selectable input (eases gw2wiki use)

export default class CoordView extends Control{

	options = {
		position: 'bottomleft',
	};

	onAdd(map){
		let container     = DomUtil.create('div', 'leaflet-control-coordview leaflet-control');
		let input         = DomUtil.create('input');
		input.type        = 'text';
		input.placeholder = '<coords>';
		input.readOnly    = true;

		container.appendChild(input);

		DomEvent.disableClickPropagation(container);
		DomEvent.on(input, 'click', ev => ev.target.select());

		map.on('click', ev => {
			let point = map.project(ev.latlng, map.options.maxZoom);

			input.value = '['+Math.round(point.x)+', '+Math.round(point.y)+']';

			// ckeckbox: copy to clipboard
			// navigator.clipboard.writeText(input.value);
		});

		return container;
	}
}

