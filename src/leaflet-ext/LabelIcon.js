/**
 * @created      10.08.2020
 * @author       smiley <smiley@chillerlan.net>
 * @copyright    2020 smiley
 * @license      MIT
 */

// noinspection ES6PreferShortImport
import {DivIcon, point} from '../../node_modules/leaflet/dist/leaflet-src.esm';

export default class LabelIcon extends DivIcon{

	_setIconStyles(img, name){
		img.className = 'leaflet-marker-icon ' + (this.options.className || '');

		let sizeOption = this.options.iconSize;
		let anchor     = this.options.iconAnchor;

		if(typeof sizeOption === 'number'){
			sizeOption = [sizeOption, sizeOption];
		}

		let size = point(sizeOption);

		if(anchor && anchor.toString().toLowerCase() === 'auto'){
			let origin = window.getComputedStyle(img).perspectiveOrigin.split(' ');

			img.style.left = '-'+origin[0];
			img.style.top = '-'+origin[1];
		}
		else{
			anchor = point(anchor || size && size.divideBy(2, true));

			if(anchor){
				img.style.marginLeft = (-anchor.x) + 'px';
				img.style.marginTop  = (-anchor.y) + 'px';
			}
		}

		if(size){
			img.style.width  = size.x + 'px';
			img.style.height = size.y + 'px';
		}

	}

}
