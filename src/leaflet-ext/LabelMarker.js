/**
 * @filesource   LabelMarker.js
 * @created      10.08.2020
 * @author       smiley <smiley@chillerlan.net>
 * @copyright    2020 smiley
 * @license      MIT
 */

// noinspection ES6PreferShortImport
import {Marker, DomUtil} from '../../node_modules/leaflet/dist/leaflet-src.esm';

// i hate this so much. all of it. but it's necessary :(
export default class LabelMarker extends Marker{

	_initIcon(){
		let classToAdd = 'leaflet-zoom-' + (this._zoomAnimated ? 'animated' : 'hide');
		let icon       = this.options.icon.createIcon(this._icon);
		let addIcon    = false;

		// if we're not reusing the icon, remove the old one and init new one
		if(icon !== this._icon){

			if(this._icon){
				this._removeIcon();
			}

			addIcon = true;

			if(this.options.title){
				icon.title = this.options.title;
			}

		}

		DomUtil.addClass(icon, classToAdd);

		if(this.options.keyboard){
			icon.tabIndex = '0';
		}

		this._icon = icon;

		if(this.options.riseOnHover){
			this.on({
				mouseover: this._bringToFront,
				mouseout : this._resetZIndex,
			});
		}

		if(this.options.opacity < 1){
			this._updateOpacity();
		}


		if(addIcon){
			this.getPane().appendChild(this._icon);
			// set icon styles after the node is appended to properly get the computed dimensions
			this.options.icon._setIconStyles(this._icon, 'icon');
		}

		this._initInteraction();
	}

}
