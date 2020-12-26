/**
 * @filesource   GW2Map.js
 * @created      09.08.2020
 * @author       smiley <smiley@chillerlan.net>
 * @copyright    2020 smiley
 * @license      MIT
 */

import GeoJSONFeatureCollection from './util/GeoJSONFeatureCollection';
import GW2MapDataset from './GW2MapDataset';
import GW2GeoJSON from './GW2GeoJSON';
import GW2ContinentRect from './GW2ContinentRect';
import {GW2MAP_I18N} from './i18n/i18n';
import LabelMarker from './leaflet-ext/LabelMarker';
import LabelIcon from './leaflet-ext/LabelIcon';
import PrototypeElement from './util/PrototypeElement';
import Utils from './util/Utils';
// noinspection ES6PreferShortImport
import {
	Circle, Control, CRS, DivIcon, GeoJSON, Icon, LatLngBounds, Map, Marker, TileLayer
} from '../node_modules/leaflet/dist/leaflet-src.esm';

export default class GW2Map{

	// common default settings for all maps
	options = {
		containerClassName: 'gw2map',
		linkboxClassName  : 'gw2map-linkbox',
		navClassName      : 'gw2map-nav',
		lang              : 'en',
		attributionText   : ' &copy; <a href="http://www.arena.net/" target="_blank">ArenaNet</a>',
		padding           : 0.5,
		defaultZoom       : 4,
		minZoom           : 0,
		maxZoom           : 7,
		mapAttribution    : true,
		fullscreenControl : true,
		coordView         : true,
		apiBase           : 'https://api.guildwars2.com',
		tileBase          : 'https://tiles.guildwars2.com',
		tileExt           : 'jpg',
		errorTile         : 'data:image/png;base64,'
			+'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAAAAAB5Gfe6AAAAVElEQVR42u3BAQEAAACAkP6v7ggKAAAA'
			+'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
			+'GAEPAAEccgnDAAAAAElFTkSuQmCC',
		colors            : {
			map_poly   : 'rgba(255, 255, 255, 0.5)',
			region_poly: 'rgba(255, 155, 255, 0.5)',
			sector_poly: 'rgba(40, 140, 25, 0.5)',
			task_poly  : 'rgba(250, 250, 30, 0.5)',
			event_poly : 'rgba(210, 125, 40, 0.5)',
		},
		initLayers: [
			'region_label',
			'map_label',
			'waypoint_icon',
			'unlock_icon',
		],
		linkboxExclude: [],
	};

	// per-map options parsed from the container's dataset
	dataset = {};
	layers  = {};
	tileLayers = {};
	layerControls;
	linkbox;
	container;
	map;
	viewRect;
	i18n;

	/**
	 * GW2Map constructor.
	 *
	 * @param {HTMLElement} container
	 * @param {string}      id
	 * @param {Object}      options
	 * @returns {GW2Map}
	 */
	constructor(container, id, options){
		this.container = container;
		this.id        = id;
		this.options   = Utils.extend(this.options, options);
		this.dataset   = new GW2MapDataset(this.container.dataset, this.options).getData();
		this.i18n      = GW2MAP_I18N[this.options.lang] || GW2MAP_I18N['en'];

		// limit maxZoom for continent 2 (PvP)
		if(this.dataset.continentId === 2){
			this.options.maxZoom = 6;
		}

		// adjust maxZoom if a dataset value is given
		if(this.dataset.maxZoom){
			this.options.maxZoom = this.dataset.maxZoom;
		}
	}

	/**
	 * initializes the map
	 *
	 * @returns {GW2Map}
	 * @public
	 */
	init(){

		// create an optional linkbox container and add it besides the map
		if(this.dataset.linkbox){
			this.linkbox = document.createElement('div');
			this.linkbox.className = this.options.navClassName;
			this.linkbox.style = 'max-height:'+this.container.clientHeight+'px;';
			this.container.className += ' '+this.options.linkboxClassName;
			this.container.parentNode.insertBefore(this.linkbox, this.container.nextSibling);
		}

		// i hate the Promise/fetch API so much don't @ me
		Promise.all(this._getApiRequestURLs().map(url =>
			fetch(url)
				// check the response
				.then(response => {
					//resolve if it's OK
					if(response.ok){
						return Promise.resolve(response);
					}
					// reject the promise on error
					return Promise.reject(new Error(response.statusText));
				})
				// fetch the response data
				.then(response => response.json())
		))
		.then(responses => this._parseApiResponses(responses))
		.then(featureCollections => this._renderFloor(featureCollections))
		.catch(error => console.log('(╯°□°）╯彡┻━┻ ', error))

		return this;
	}

	/**
	 * @returns {[string]}
	 * @private
	 */
	_getApiRequestURLs(){
		let params = new URLSearchParams();
		// @todo: optional wiki param (does this actually do anything?)
		params.append('wiki', '1');
		params.append('lang', this.dataset.language);

		let query = '?' + params.toString();

		// build the API URL for the requested floor
		let url = this.options.apiBase + '/v2/continents/' + this.dataset.continentId + '/floors/' + this.dataset.floorId
			+ (this.dataset.regionId ? '/regions/' + this.dataset.regionId : '')
			+ (this.dataset.regionId && this.dataset.mapId ? '/maps/' + this.dataset.mapId : '')
			+ query;

		let urls = [url];

		// add events
		if(this.dataset.events){
			urls.push(this.options.apiBase + '/v1/event_details.json' + query);
		}

		// ugly workaround for PoF maps with incorrect default floor
		if(this.dataset.continentId === 1 && this.dataset.floorId !== 49 && !this.dataset.mapId && (
			// empty region & no includemaps = full worldmap
			(!this.dataset.regionId && !this.dataset.includeMaps.length)
			// crystal desert region from wrong floor
			|| this.dataset.regionId === 12
			// optional map array contains PoF maps
			|| [ // public maps
				1210,1211,1215,1226,1228,1248,1271,1288,1301,1317,
				// instances
				1209,1212,1214,1217,1222,1223,1224,1227,1231,1232,1234,1236,1240,1241,1242,1243,1244,1245,1250,1252,
				1253,1257,1260,1265,1266,1276,1281,1282,1289,1292,1294,1295,1297,1299,1300,1302,1318,1323
			].filter(m => Utils.in_array(m, this.dataset.includeMaps)).length > 0
		)){
			urls.push(this.options.apiBase + '/v2/continents/1/floors/49' + query)
		}

		return urls;
	}

	/**
	 * @param {[*]} responses
	 * @returns {*}
	 * @private
	 */
	_parseApiResponses(responses){
		// main data is always the first response
		let floordata = responses[0];

		// determine the map bounds for the tile getter
		this.viewRect = this._getMapBounds(floordata)

		let events, floor49;
		// in case of 2 responses, the second is either events or floor 49 / region 12
		if(responses.length === 2){
			if(responses[1].events){
				events = responses[1].events
			}
			else if(responses[1].id){
				floor49 = responses[1].regions['12']
			}
		}
		// 3 responses: 2nd = events, 3rd = floor 49
		else if(responses.length === 3){
			events   = responses[1].events;
			floor49  = responses[2].regions['12'];
		}

		// now merge the floor 49 data
		if(this.dataset.floorId === 1 && floor49 && floordata.regions){
			// if the region is already in the floor 1 response (1263,1268 why???), merge the maps
			if(floordata.regions['12']){
				Object.keys(floor49.maps).forEach(k => floordata.regions['12'].maps[k] = floor49.maps[k])
			}
			// otherwise just add the whole region
			else{
				floordata.regions['12'] = floor49;
			}
		}

		// transform the response to GeoJSON feature collections - polyfill for https://github.com/arenanet/api-cdi/pull/62
		return new GW2GeoJSON(floordata, events, this.dataset).getCollections();
	}

	/**
	 * @param floordata
	 * @returns {number[][]}
	 * @private
	 */
	_getMapBounds(floordata){

		if(this.dataset.customRect){
			return this.dataset.customRect;
		}

		if(floordata.continent_rect){
			return floordata.continent_rect;
		}

		if(floordata.clamped_view){
			return floordata.clamped_view;
		}

		if(floordata.texture_dims){
			return [[0, 0], floordata.texture_dims];
		}

		return [[0, 0], [49152, 49152]];
	}


	/**
	 * parses the floor data and rencers it on the map
	 *
	 * @param {*} featureCollections
	 * @protected
	 */
	_renderFloor(featureCollections){

		// the map object
		this.map = new Map(this.container, {
			crs               : CRS.Simple,
			minZoom           : this.options.minZoom,
			maxZoom           : this.options.maxZoom,
			zoomControl       : this.dataset.mapControls,
			attributionControl: this.dataset.mapControls && this.options.mapAttribution,
			fullscreenControl : this.dataset.mapControls && this.options.fullscreenControl,
			coordView         : this.options.coordView,
		});

		// the tile layer(s) @todo: map levels?
		this.tileLayers /* ['floor 1'] */ = new TileLayer('{tilebase}/{continentId}/{floorId}/{z}/{x}/{y}.{tileExt}', {
			minZoom     : this.options.minZoom,
			maxZoom     : this.options.maxZoom,
			errorTileUrl: this.options.errorTile,
			attribution : this.i18n.attribution + this.options.attributionText,
			bounds      : new LatLngBounds([
				this.map.unproject([this.viewRect[0][0], this.viewRect[1][1]], this.options.maxZoom),
				this.map.unproject([this.viewRect[1][0], this.viewRect[0][1]], this.options.maxZoom)
			]),
			tilebase    : this.options.tileBase,
			continentId : this.dataset.continentId,
			floorId     : this.dataset.customFloor || this.dataset.floorId,
			tileExt     : this.options.tileExt,
		}).addTo(this.map);

		// add the layer controls
		if(this.dataset.mapControls){
			this.layerControls = new Control.Layers(/* this.tileLayers */).addTo(this.map);
		}

		// set map center
		let center;
		let coords = this.dataset.centerCoords || [];

		// if coords are given, check if they're valid
		if(coords.length === 2 && coords[0] > 0 && coords[0] <= 49152 && coords[1] > 0 && coords[1] <= 49152){
			center = this._p2ll(coords);
		}
		// else get center from the map bounds
		else{
			let rect   = new GW2ContinentRect(this.viewRect).getBounds();
			let bounds = new LatLngBounds(this._p2ll(rect[0]), this._p2ll(rect[1])).pad(this.options.padding);
			center     = bounds.getCenter();
		}

		this.map.setView(center, this.dataset.zoom);

		// create overlay panes
		let panes      = Object.keys(featureCollections);
		let initLayers = this.dataset.initLayers || this.options.initLayers || panes;

		panes.forEach(pane => this._createPane(featureCollections[pane], pane, initLayers));

		// add an event to adjust icon sizes on zoom
		this.map.on('zoomend', ev => this._zoomEndEvent());
		// invoke once to set the icon zoom on the newly created map
		this._zoomEndEvent();
	}

	/**
	 * handles leaflet's zoomEnd event, adjusts icon sizes and label positions
	 *
	 * @protected
	 */
	_zoomEndEvent(){
		let zoom = this.map.getZoom();

		Object.keys(this.layers).forEach(layer => {
			let el = this.layers[layer].options.pane;

			if(zoom >= 5){
				PrototypeElement.removeClassName(el, 'half');
			}
			else if(zoom < 5 && zoom >= 3){
				PrototypeElement.removeClassName(el, 'quarter');
				PrototypeElement.addClassName(el, 'half');
			}

			else if(zoom < 3 && zoom >= 1){
				PrototypeElement.removeClassName(el, 'half');
				PrototypeElement.removeClassName(el, 'invis');
				PrototypeElement.addClassName(el, 'quarter');
			}
			else if(zoom < 1){
				PrototypeElement.removeClassName(el, 'quarter');
				PrototypeElement.addClassName(el, 'invis');
			}

			// i hate this.
			if(Utils.in_array(layer, ['region_label', 'map_label', 'sector_label'])){
				Object.keys(el.children).forEach(c => {
					let origin = window.getComputedStyle(el.children[c]).perspectiveOrigin.split(' ');

					el.children[c].style.left = '-'+origin[0];
					el.children[c].style.top  = '-'+origin[1];
				});
			}

		});

	}

	/**
	 * creates a layer pane and adds data to it
	 *
	 * @param {GeoJSONFeatureCollection} featureCollection
	 * @param {string} pane
	 * @param {string[]}initLayers
	 * @protected
	 */
	_createPane(featureCollection, pane, initLayers){

		if(!(featureCollection instanceof GeoJSONFeatureCollection)){
			return;
		}

		let geojson = featureCollection.getJSON()

		// don't create empty layers
		if(!geojson.features.length){
			return;
		}

		let name = '<span class="gw2map-layer-control '+ pane +'">&nbsp;</span> ' + this.i18n.layers[pane];

		// create the pane if it doesn't exist
		if(!this.layers[pane]){
			this.layers[pane] = new GeoJSON(geojson, {
				pane          : this.map.createPane(pane),
				coordsToLatLng: coords => this._p2ll(coords),
				pointToLayer  : (feature, coords) => this._pointToLayer(feature, coords, pane),
				onEachFeature : (feature, layer) => this._onEachFeature(feature, layer, pane),
				style         : (feature) => this._layerStyle(feature, pane),
			});

			this.layerControls.addOverlay(this.layers[pane], name)
		}
		// otherwise just add the data
		else{
			this.layers[pane].addData(geojson);
		}

		// optionally show that layer on the map
		if(Utils.in_array(pane, initLayers)){
			this.layers[pane].addTo(this.map);
		}
	}

	/**
	 * prepares the infobox/popup content
	 *
	 * @link  http://leafletjs.com/reference-1.6.0.html#geojson-oneachfeature
	 * @param {*}      feature
	 * @param {Layer}  layer
	 * @param {string} pane
	 * @protected
	 */
	_onEachFeature(feature, layer, pane){
		let p       = feature.properties;
		let content = '';

		// add icon
		if(p.layertype === 'icon'){
			content += p.icon
				? '<img class="gw2map-popup-icon gw2map-layer-control" src="' + p.icon + '" alt="' + p.name + '"/>'
				: '<span class="gw2map-layer-control ' + pane + '" ></span>';
		}

		// add name, normalize to wiki article names if possible
		if(p.name){

			if(!Utils.in_array(p.type, ['vista'])){
				//noinspection RegExpRedundantEscape
				let wikiname = p.name.toString()
					.replace(/\.$/, '')
					.replace(/\s/g, '_')
					.replace(/(Mount\:_|Raid—|Schlachtzug\:_)/, ''); // @todo: i18n

				content += '<a class="gw2map-wikilink" href="'
					+ this.i18n.wiki + encodeURIComponent(wikiname)
					+ '" target="_blank">' + p.name + '</a>';
			}
			else{
				content += p.name;
			}

		}

		// add content level
		if(p.level){
			content += ' (' + p.level + ')';
		}
		else if(p.min_level && p.max_level){
			content += ' (' + (p.min_level === p.max_level ? p.max_level : p.min_level + '-' + p.max_level) + ')';
		}

		// create a chatlink input
		if(p.chat_link){

			if(content){
				content += '<br>';
			}

			content += '<input class="gw2map-chatlink" type="text" value="' + p.chat_link
				+ '" readonly="readonly" onclick="this.select();return false;" />';
		}

		// add a description text with parsed wiki links
		if(p.description){

			if(content){
				content += '<br>';
			}

			content += '<div class="gw2map-description">' + this._parseWikilinks(p.description) + '</div>';
		}

		// finally bind the popup
		if(content){
			layer.bindPopup(content);
		}

		// create optional linkbox navigation links
		if(this.dataset.linkbox && Utils.in_array(feature.geometry.type, ['Point', 'MultiPoint'])){
			this._linkboxItem(feature, layer, pane)
		}
	}

	/**
	 * a simple parser that allows creating links in popup texts using wikicode: [[article]] and [[article|name]]
	 *
	 * @param {string} str
	 * @returns {string}
	 * @protected
	 */
	_parseWikilinks(str){
		// noinspection RegExpRedundantEscape
		return str
			.replace(/\[\[([^\]\|]+)\]\]/gi, '<a href="' + this.i18n.wiki + '$1" target="_blank">$1</a>')
			.replace(/\[\[([^\|]+)(\|)([^\]]+)\]\]/gi, '<a href="' + this.i18n.wiki + '$1" target="_blank">$3</a>');
	}

	/**
	 * creates a clickable navigation item for the optional linkbox
	 *
	 * @param {*}       feature
	 * @param {Layer}   layer
	 * @param {string}  pane
	 * @protected
	 */
	_linkboxItem(feature, layer, pane){
		let p = feature.properties;

		if(Utils.in_array(pane, this.options.linkboxExclude) || p.mapID === -1){
			return;
		}

		let navid = 'gw2map-navbox-map-' + p.mapID;
		let nav   = document.getElementById(navid);

		if(!nav){
			nav           = document.createElement('div');
			nav.id        = navid;
			nav.className = 'gw2map-navbox';
			this.linkbox.appendChild(nav);
		}

		let paneContentID =  'gw2map-navbox-' + p.mapID + '-' + pane;
		let paneContent   = document.getElementById(paneContentID);

		if(!paneContent && pane !== 'map_label'){
			paneContent    = document.createElement('div');
			paneContent.id = paneContentID;
			nav.appendChild(paneContent);
		}

		let item = document.createElement('span');

		if(pane !== 'map_label'){
			item.innerHTML = '<span class="gw2map-layer-control ' + pane + '"></span>';
		}

		item.innerHTML += (p.name || p.id || '-');

		if(typeof layer.getLatLng === 'function'){

			item.addEventListener('click', ev => {
				let latlng = layer.getLatLng();
				this.map
					.panTo(latlng)
					.openPopup(layer.getPopup(), latlng);
			});

			// insert the map label as first item
			pane === 'map_label'
				? nav.insertBefore(item, nav.firstChild)
				: paneContent.appendChild(item);
		}

	}

	/**
	 * handle layer icons/markers
	 *
	 * @link  http://leafletjs.com/reference-1.6.0.html#geojson-pointtolayer
	 * @param {*}      feature
	 * @param {LatLng} coords
	 * @param {string} pane
	 * @protected
	 */
	_pointToLayer(feature, coords, pane){
		let icon;
		let p = feature.properties;

		// create a circle on event markers if a radius is given
		if(p.layertype === 'poly' && p.type === 'event' && p.radius){
			return new Circle(coords, p.radius);
		}

		// common settings for all markers
		let iconParams = {
			pane: pane,
			iconSize   : null,
			popupAnchor: 'auto',
			// temporarily adding the "completed" classname
			// https://discordapp.com/channels/384735285197537290/384735523521953792/623750587921465364
			// @todo: include type/layertype only when non-empty
			className: 'gw2map-' + p.layertype + ' gw2map-' + p.type + '-' + p.layertype + ' completed'
		};

		// icon url is given via the geojson feature
		if(p.icon){
			iconParams.iconUrl = p.icon;

			if(p.className){
				iconParams.className += ' ' + p.className;
			}

			icon = new Icon(iconParams);
		}
		// the icon is actually a label text
		else if(p.layertype === 'label'){
			iconParams.html       = p.name;
			iconParams.iconAnchor = 'auto';

			icon = new LabelIcon(iconParams);

			return new LabelMarker(coords, {
				pane: pane,
				title: p.name,
				icon: icon
			});
		}
		// else create a div icon with a classname depending on the type
		else{
//			console.log(p);

			if(p.type === 'masterypoint'){
				iconParams.className += ' ' + p.region.toLowerCase()
			}
			else if(p.type === 'heropoint'){
				iconParams.className += p.id.split('-')[0] === '0' ? ' core' : ' expac';
			}
			else if(p.type === 'marker' && p.className){
				iconParams.className += ' ' + p.className
			}

			icon = new DivIcon(iconParams);
		}

		// finally create the marker
		return new Marker(coords, {
			pane: pane,
			title: p.layertype === 'icon' ? p.name : null,
			icon: icon
		});
	}

	/**
	 * Polygon/Polyline styles
	 *
	 * @link  http://leafletjs.com/reference-1.6.0.html#geojson-style
	 * @param {*}      feature
	 * @param {string} pane
	 * @protected
	 */
	_layerStyle(feature, pane){
		let p = feature.properties;

		if(Utils.in_array(pane, ['region_poly', 'map_poly', 'sector_poly', 'task_poly', 'event_poly'])){
			return {
				pane: pane,
				stroke: true,
				opacity: 0.6,
				color: this.options.colors[pane] || 'rgb(255, 255, 255)',
				weight: 2,
				interactive: false,
			}
		}

		return {
			pane: pane,
			stroke: true,
			opacity: 0.6,
			color: p.color || 'rgb(255, 255, 255)',
			weight: 3,
			interactive: true,
		}
	}

	/**
	 * @param {[*,*]} coords
	 * @returns {LatLng}
	 * @protected
	 */
	_p2ll(coords){
		return this.map.unproject(coords, this.options.maxZoom);
	}

}
