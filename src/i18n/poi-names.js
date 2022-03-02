/**
 * Translations for POIs, wiki additions & disambiguation
 *
 * additional wiki data from:
 * @link https://wiki.guildwars2.com/index.php?title=Widget%3AWorld_map%2Fdata.js&type=revision&diff=1893473&oldid=1876153
 *
 * @created      12.08.2020
 * @author       smiley <smiley@chillerlan.net>
 * @copyright    2020 smiley
 * @license      MIT
 */

import {i18n_poi_unlock} from './poi-unlock.json';
import {i18n_poi_vista} from './poi-vista.json';
import {i18n_poi_waypoint} from './poi-waypoint.json';

import {i18n_heropoint_names} from './names-heropoint.json';
import {i18n_mastery_names} from './names-mastery.json';
import {i18n_sector_names} from './names-sector.json';

const GW2W_POI_NAMES = {
	unlock  : i18n_poi_unlock,
	vista   : i18n_poi_vista,
	waypoint: i18n_poi_waypoint,
};

const GW2W_HEROPOINT_NAMES = i18n_heropoint_names;
const GW2W_MASTERY_NAMES = i18n_mastery_names;
const GW2W_SECTOR_NAMES = i18n_sector_names;


export {GW2W_POI_NAMES, GW2W_HEROPOINT_NAMES, GW2W_MASTERY_NAMES, GW2W_SECTOR_NAMES};
