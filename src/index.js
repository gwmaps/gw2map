/**
 * widget-map-floors
 * https://github.com/GW2Wiki/widget-map-floors
 *
 * Created by Smiley on 11.06.2016.
 * https://github.com/codemasher
 * https://wiki.guildwars2.com/wiki/User:Smiley-1
 *
 * scripts & libraries used:
 *
 * https://leafletjs.com/
 * http://vanilla-js.com/
 *
 * https://twitter.com/StephaneWithAnE/status/739920657853517825
 *
 * @filesource   index.js
 * @created      09.08.2020
 * @author       smiley <smiley@chillerlan.net>
 * @copyright    2020 smiley
 * @license      MIT
 */

'use strict';

import GW2Map from './GW2Map';
import GW2MapWiki from './GW2MapWiki';
import AntPath from './leaflet-ext/AntPath';
import CoordView from './leaflet-ext/CoordView';
import Fullscreen from './leaflet-ext/Fullscreen';
import Utils from './util/Utils';
// noinspection ES6PreferShortImport
import {
	bind, Circle, CircleMarker, DomEvent, DomUtil, GeoJSON, Map, Path, point, Polygon, Polyline, Popup,
} from '../node_modules/leaflet/dist/leaflet-src.esm';

(($options, $containers) => {
	$containers = $containers || document.getElementsByClassName($options.containerClassName);

	// no map, no scripts.
	if(!$containers.length){
		return;
	}

	$options = Utils.extend({
		scriptContainerId : 'gw2map-script',
		localTiles        : false,
		localTileRects    : [],
	}, $options);

	// ogogog
	window.addEventListener('load', () => {

		Map.mergeOptions({
			fullscreenControl: false,
			coordView        : true,
		});

		// noinspection JSUnusedLocalSymbols
		Map.include({

			isFullscreen: function(){
				return this._isFullscreen || false;
			},

			toggleFullscreen: function(options){
				let container = this.getContainer();

				if(this.isFullscreen()){
					if(options && options.pseudoFullscreen){
						this._disablePseudoFullscreen(container);
					}
					else if(document.exitFullscreen){
						document.exitFullscreen();
					}
					else if(document.mozCancelFullScreen){
						document.mozCancelFullScreen();
					}
					else if(document.webkitCancelFullScreen){
						document.webkitCancelFullScreen();
					}
					else if(document.msExitFullscreen){
						document.msExitFullscreen();
					}
					else{
						this._disablePseudoFullscreen(container);
					}
				}
				else{
					if(options && options.pseudoFullscreen){
						this._enablePseudoFullscreen(container);
					}
					else if(container.requestFullscreen){
						container.requestFullscreen();
					}
					else if(container.mozRequestFullScreen){
						container.mozRequestFullScreen();
					}
					else if(container.webkitRequestFullscreen){
						container.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
					}
					else if(container.msRequestFullscreen){
						container.msRequestFullscreen();
					}
					else{
						this._enablePseudoFullscreen(container);
					}
				}

			},

			_enablePseudoFullscreen: function(container){
				DomUtil.addClass(container, 'leaflet-pseudo-fullscreen');
				this._setFullscreen(true);
				this.fire('fullscreenchange');
			},

			_disablePseudoFullscreen: function(container){
				DomUtil.removeClass(container, 'leaflet-pseudo-fullscreen');
				this._setFullscreen(false);
				this.fire('fullscreenchange');
			},

			_setFullscreen: function(fullscreen){
				this._isFullscreen = fullscreen;
				let container = this.getContainer();

				if(fullscreen){
					DomUtil.addClass(container, 'leaflet-fullscreen-on');
				}
				else{
					DomUtil.removeClass(container, 'leaflet-fullscreen-on');
				}

				this.invalidateSize();
			},

			_onFullscreenChange: function(e){
				let fullscreenElement =
						document.fullscreenElement ||
						document.mozFullScreenElement ||
						document.webkitFullscreenElement ||
						document.msFullscreenElement;

				if(fullscreenElement === this.getContainer() && !this._isFullscreen){
					this._setFullscreen(true);
					this.fire('fullscreenchange');
				}
				else if(fullscreenElement !== this.getContainer() && this._isFullscreen){
					this._setFullscreen(false);
					this.fire('fullscreenchange');
				}
			},

		});

		Map.addInitHook(function(){

			// Fullscreen
			if(this.options.fullscreenControl){
				this.fullscreenControl = new Fullscreen(this.options.fullscreenControl);
				this.addControl(this.fullscreenControl);
			}

			let fullscreenchange;

			if('onfullscreenchange' in document){
				fullscreenchange = 'fullscreenchange';
			}
			else if('onmozfullscreenchange' in document){
				fullscreenchange = 'mozfullscreenchange';
			}
			else if('onwebkitfullscreenchange' in document){
				fullscreenchange = 'webkitfullscreenchange';
			}
			else if('onmsfullscreenchange' in document){
				fullscreenchange = 'MSFullscreenChange';
			}

			if(fullscreenchange){
				let onFullscreenChange = bind(this._onFullscreenChange, this);

				this.whenReady(function(){
					DomEvent.on(document, fullscreenchange, onFullscreenChange);
				});

				this.on('unload', function(){
					DomEvent.off(document, fullscreenchange, onFullscreenChange);
				});
			}

			// CoordView
			if (this.options.coordView) {
				new CoordView().addTo(this);
			}

		});


		// auto center popups and align div/html icons
		Popup.include({
			_getAnchor: function(){
				let anchor = this._source && this._source._getPopupAnchor
					? this._source._getPopupAnchor()
					: [0, 0];

				if(typeof anchor === 'string' && anchor.toLowerCase() === 'auto'){
					let style = {left: 0, top: 0, width: 0};

					// is the layer active?
					if(this._source._icon){
						style = window.getComputedStyle(this._source._icon);
					}

					anchor = [
						Utils.intval(style.left) + Math.round(Utils.intval(style.width) / 2),
						Utils.intval(style.top)
					];
				}

				return point(anchor);
			}
		});


		// Add AntPath to polylines
		GeoJSON.include({

			_pathTypes: [Circle, CircleMarker, Polygon, Polyline],

			addLayer: function(layer){

				if(layer instanceof Path){
					let type = this._guessPathType(layer);
					let o = layer.options;
					let p = layer.feature.properties;

					if((o.antPath || p.antPath) && type){
						let ll    = type instanceof Circle ? layer.getLatLng() : layer.getLatLngs();
						let popup = layer.getPopup();

						// allow setting antPath options from the feature's properties
						if(p.antPath){
							['antColor', 'antOpacity', 'antDashArray'].forEach(e => o[e] = p[e] || o[e] || null);
						}

						layer = new AntPath(ll, o, type);

						if(popup){
							layer.bindPopup(popup);
						}
					}
				}

				this._layers[this.getLayerId(layer)] = layer;

				if(this._map){
					this._map.addLayer(layer);
				}

				return this;
			},

			_guessPathType: function(layer){

				for(let i = 0; i < this._pathTypes.length; i++){
					if(layer instanceof this._pathTypes[i]){
						return this._pathTypes[i];
					}
				}

				return false;
			}

		});


		// save the GW2Map objects for later usage
		// noinspection JSMismatchedCollectionQueryUpdate
		let maps = [];

		Object.keys($containers).forEach(id => {
			let gw2map = $options.localTiles
				? new GW2MapWiki($containers[id], id, $options)
				: new GW2Map($containers[id], id, $options);

			maps[id] = gw2map.init();
		});

//		console.log(maps);
	});

})(GW2MapOptions, GW2MapContainers);
