/**
 * @filesource   GW2GeoJSON.js
 * @created      09.08.2020
 * @author       smiley <smiley@chillerlan.net>
 * @copyright    2020 smiley
 * @license      MIT
 */

import GW2ContinentRect from './GW2ContinentRect';
import {GW2W_POI_NAMES, GW2W_HEROPOINT_NAMES, GW2W_MASTERY_NAMES, GW2W_SECTOR_NAMES} from './i18n/poi-names';
import {GW2MAP_EXTRA_LAYERS} from './data/extra-layers';
import Utils from './util/Utils';
import GeoJSONFeatureCollection from './util/GeoJSONFeatureCollection';

export default class GW2GeoJSON{

	// fixed sort order for the main overlays
	featureCollections = {
		landmark_icon: null,
		waypoint_icon: null,
		heropoint_icon: null,
		task_icon: null,
		task_poly: null,
		vista_icon: null,
		unlock_icon: null,
		masterypoint_icon: null,
		adventure_icon: null,
		jumpingpuzzle_icon: null,
		region_label: null,
		map_label: null,
		sector_label: null,
		sector_poly: null,
		event_icon: null,
		event_poly: null,
	};

	map_rects = {};
	floordata;
	event_details;
	includeMaps;
	language;

	// @todo: deletme
	worldmap = [
		15,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,34,35,39,50,51,53,54,62,65,73,91,139,218,326,335,807,873,922,
		988,1015,1041,1043,1045,1052,1069,1147,1149,1156,1165,1175,1178,1185,1188,1195,1203,1210,1211,1215,1226,1228,
		1248,1263,1268,1271,1288,1301,1310,1317,1323,1330,1343,1371
	];

	/**
	 * GW2GeoJSON constructor
	 *
	 * @param {*} floordata
	 * @param {*} event_details
	 * @param {GW2MapDataset.dataset} dataset
	 */
	constructor(floordata, event_details, dataset){
		this.floordata     = floordata;
		this.event_details = event_details;
		this.dataset       = dataset;


		// @todo: deletme
		if((!this.dataset.extraLayers || !this.dataset.extraLayers.length) && this.dataset.continentId === 1
			&& Utils.in_array(this.dataset.floorId, [1,2,3,4]) && !this.dataset.regionId){
			this.dataset.extraLayers = Object.keys(GW2MAP_EXTRA_LAYERS);
		}

		if(this.dataset.continentId === 1 && this.dataset.floorId === 1
			&& !this.dataset.regionId && !this.dataset.includeMaps.length){
			this.dataset.includeMaps = this.worldmap;
		}

		this.extraMarkers  = ['adventure_icon', 'jumpingpuzzle_icon', 'masterypoint_icon'].concat(this.dataset.extraLayers);
	}

	/**
	 * @param {string} layer
	 * @param {string|number} id
	 * @param {number} mapID
	 * @param {string} name
	 * @param {*} properties
	 * @param {*} geometry
	 * @param {string} [geometryType]
	 * @returns {GW2GeoJSON}
	 * @protected
	 */
	_addFeature(layer, id, mapID, name, properties, geometry, geometryType){

		if(!this.featureCollections[layer] || !(this.featureCollections[layer] instanceof GeoJSONFeatureCollection)){
			this.featureCollections[layer] = new GeoJSONFeatureCollection();
		}

		this.featureCollections[layer]
			.addFeature(Utils.extend({
				name     : (name || ''),
				mapID    : mapID,
				layertype: 'icon',
			}, properties))
			.setID(id)
			.setGeometry(geometry, geometryType)
		;

		return this;
	}

	/**
	 * @returns {*}
	 */
	getCollections(){

		// a response to floors
		if(this.floordata.regions){
			this._continent(this.floordata.regions);
		}
		// a regions response
		else if(this.floordata.maps){
			this._region(this.floordata);
		}
		// an actual map response
		else if(this.floordata.points_of_interest){
			this._map(this.floordata);
		}

		// render optional event data
		if(this.dataset.events && this.event_details){
			this._events();
		}

		return this.featureCollections;
	}

	/**
	 * @param {*} continent
	 * @returns {GW2GeoJSON}
	 * @protected
	 */
	_continent(continent){
		Object.keys(continent).forEach(regionID => this._region(continent[regionID]));

		return this;
	}

	/**
	 * @param {*} region
	 * @returns {GW2GeoJSON}
	 * @protected
	 */
	_region(region){

		this._addFeature('region_label', region.id, -1, region.name, {
			type     : 'region',
			layertype: 'label',
		}, region.label_coord);
		/*
		this._addFeature('region_poly', region.id, -1, region.name, {
			type     : 'region',
			layertype: 'poly',
		}, new GW2ContinentRect(region.continent_rect).getPoly(), 'Polygon');
		*/
		Object.keys(region.maps).forEach(mapID => {
			let map = region.maps[mapID];
			map.id  = Utils.intval(mapID);

//			console.log('map', map.id, map.name);
			// @todo
			if(this.dataset.includeMaps.length > 0){
				if(!Utils.in_array(map.id, this.dataset.includeMaps)){
					return this;
				}
			}

			this._map(map);
		});

		return this;
	}

	/**
	 * @param {*} map
	 * @returns {GW2GeoJSON}
	 * @protected
	 */
	_map(map){
		let rect = new GW2ContinentRect(map.continent_rect, map.map_rect);
		this.map_rects[map.id] = rect;

		// hack for Labyrinthine Cliffs (922) which has the label set at [0, 0]
		if(!map.label_coord || map.label_coord[0] === 0 || map.label_coord[1] === 0){
			map.label_coord = null;
		}

		// https://github.com/arenanet/api-cdi/issues/334
		this._addFeature('map_label', map.id, map.id, map.name, {
			min_level     : map.min_level,
			max_level     : map.max_level,
			type          : 'map',
			layertype     : 'label',
		}, map.label_coord || rect.getCenter());

		this
			._sectors(map.sectors, map.id)
			._poi(map.points_of_interest, map.id)
			._task(map.tasks, map.id)
			._heropoint(map.skill_challenges, map.id)
			._masteryPoint(map.mastery_points, map.id)
			._adventure(map.adventures || [], map.id)
		;

		if(this.extraMarkers.length){
			this.extraMarkers.forEach(layer => {

				if(!Utils.isset(() => GW2MAP_EXTRA_LAYERS[layer].data[map.id])){
					return;
				}

				this._extra(GW2MAP_EXTRA_LAYERS[layer], layer, map.id);
			});
		}

		return this;
	}

	/**
	 * @param {*} extra
	 * @param {string} layer
	 * @param {number} mapID
	 * @returns {GW2GeoJSON}
	 * @protected
	 */
	_extra(extra, layer, mapID){

		extra.data[mapID].forEach(e => {

			let extraOptions = {
				type       : e.type || extra.type,
				layertype  : e.layertype || extra.layertype || 'icon',
				icon       : e.icon || extra.icon || null,
				className  : e.className || extra.className,
				color      : e.color || extra.color,
				description: e.description || extra.description || null
			};

			if(e.antPath || extra.antPath){
				extraOptions.antPath = e.antPath || extra.antPath;
				extraOptions.antColor = e.antColor || extra.antColor;
				extraOptions.antOpacity = e.antOpacity || extra.antOpacity;
				extraOptions.antDashArray = e.antDashArray || extra.antDashArray;
			}

			this._addFeature(
				layer,
				e.id,
				mapID,
				(e.name || extra.name),
				extraOptions,
				e.coord,
				(e.featureType ||extra.featureType || 'Point')
			);
		});

	}

	/**
	 * @param {*} sectors
	 * @param {number} mapID
	 * @returns {GW2GeoJSON}
	 * @protected
	 */
	_sectors(sectors, mapID){

		Object.keys(sectors).forEach(sectorId =>{
			let sector = sectors[sectorId];

			// allow custom names for wiki disambuguation etc.
			if(Utils.isset(() => GW2W_SECTOR_NAMES[sectorId][this.dataset.language])){
				sector.name = GW2W_SECTOR_NAMES[sectorId][this.dataset.language];
			}

			this._addFeature('sector_label', sector.id, mapID, sector.name, {
				chat_link: sector.chat_link,
				level    : sector.level,
				type     : 'sector',
				layertype: 'label',
			}, sector.coord);

			this._addFeature('sector_poly', sector.id, mapID, sector.name, {
				type     : 'sector',
				layertype: 'poly',
			}, [sector.bounds], 'Polygon');
		});

		return this;
	}

	/**
	 * @param {*} pois
	 * @param {number} mapID
	 * @returns {GW2GeoJSON}
	 * @protected
	 */
	_poi(pois, mapID){

		Object.keys(pois).forEach(poiID =>{
			let poi = pois[poiID];

			if(Utils.isset(() => GW2W_POI_NAMES[poi.type][poiID][this.dataset.language])){
				poi.name = GW2W_POI_NAMES[poi.type][poiID][this.dataset.language];
			}

			this._addFeature(poi.type + '_icon', poi.id || null, mapID, null, {
				name     : poi.name || poi.id ||  '',
				type     : poi.type,
				chat_link: poi.chat_link || false,
//				floor    : poi.floor, // ???
				icon     : poi.icon
			}, poi.coord);
		});

		return this;
	}

	/**
	 * @param {*} tasks
	 * @param {number} mapID
	 * @returns {GW2GeoJSON}
	 * @protected
	 */
	_task(tasks, mapID){

		Object.keys(tasks).forEach(taskID =>{
			let task = tasks[taskID];

			this._addFeature('task_icon', task.id, mapID, task.objective, {
				chat_link: task.chat_link,
				level    : task.level,
				type     : 'task',
			}, task.coord);

			this._addFeature('task_poly', task.id, mapID, task.objective, {
				type     : 'task',
				layertype: 'poly',
			}, [task.bounds], 'Polygon');

		});

		return this;
	}

	/**
	 * @param {*} heropoints
	 * @param {number} mapID
	 * @returns {GW2GeoJSON}
	 * @protected
	 */
	_heropoint(heropoints, mapID){

		if(!heropoints.length){
			return this;
		}

		heropoints.forEach(heropoint =>{
			let name = '';

			if(Utils.isset(() => GW2W_HEROPOINT_NAMES[heropoint.id][this.dataset.language])){
				name = GW2W_HEROPOINT_NAMES[heropoint.id][this.dataset.language];
			}

			// https://github.com/arenanet/api-cdi/issues/329
			this._addFeature('heropoint_icon', heropoint.id, mapID, name, {
				type     : 'heropoint',
			}, heropoint.coord)
		});

		return this;
	}

	/**
	 * @param {*} masterypoints
	 * @param {number} mapID
	 * @returns {GW2GeoJSON}
	 * @protected
	 */
	_masteryPoint(masterypoints, mapID){

		if(!masterypoints.length){
			return this;
		}

		masterypoints.forEach(masterypoint =>{
			let name = '';

			if(Utils.isset(() => GW2W_MASTERY_NAMES[masterypoint.id][this.dataset.language])){
				name = GW2W_MASTERY_NAMES[masterypoint.id][this.dataset.language];
			}

			this._addFeature('masterypoint_icon', masterypoint.id, mapID, name, {
				region   : masterypoint.region,
				type     : 'masterypoint',
			}, masterypoint.coord)
		});

		return this;
	}

	/**
	 * @param {*} adventures
	 * @param {number} mapID
	 * @returns {GW2GeoJSON}
	 * @protected
	 */
	_adventure(adventures, mapID){

		if(!adventures.length){
			return this;
		}

		adventures.forEach(adventure =>{
			this._addFeature('adventure_icon', null, mapID, adventure.name, {
				description: adventure.description || '',
				type       : 'adventure',
			}, adventure.coord);
		});

		return this;
	}

	/**
	 * parse and render additional GW2 event data
	 *
	 * @link https://github.com/arenanet/api-cdi/pull/61
	 *
	 * @returns {GW2GeoJSON}
	 * @protected
	 */
	_events(){
		let maps = Object.keys(this.map_rects).map(m => parseInt(m, 10));

		Object.keys(this.event_details).forEach(id => {
			let event = this.event_details[id];

			if(!Utils.in_array(event.map_id, maps)){
				delete this.event_details[id];

				return;
			}

			let map_rect = this.map_rects[event.map_id];

			this._addFeature('event_icon', id, event.map_id, event.name, {
				icon     : event.icon
					? 'https://render.guildwars2.com/file/'+event.icon.signature+'/'+event.icon.file_id+'.png'
					: null,
				flags    : event.flags,
				type     : 'event',
				layertype: 'icon',
			}, map_rect.scaleCoords(event.location.center));

			if(event.location.type === 'poly'){
				this._addFeature('event_poly', id, event.map_id, event.name, {
					type     : 'event',
					layertype: 'poly',
				}, [event.location.points.map(point => map_rect.scaleCoords(point))], 'Polygon');
			}
			else{
				this._addFeature('event_poly', id, event.map_id, event.name, {
					type     : 'event',
					layertype: 'poly',
					radius   : map_rect.scaleLength(event.location.radius),
				}, map_rect.scaleCoords(event.location.center), 'Point');
			}

		});

	}

}
