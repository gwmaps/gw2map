<?php
/**
 *
 * @filesource   update_maps.php
 * @created      27.12.2020
 * @author       smiley <smiley@chillerlan.net>
 * @copyright    2020 smiley
 * @license      MIT
 */

$maps = json_decode(file_get_contents('https://api.guildwars2.com/v1/maps.json'));

$m = [];

foreach($maps->maps as $id => $map){
	// unset unnecessary values
	unset($maps->maps->{$id}->map_name);
	unset($maps->maps->{$id}->region_name);
	unset($maps->maps->{$id}->continent_name);
	unset($maps->maps->{$id}->type);
	unset($maps->maps->{$id}->floors);
	unset($maps->maps->{$id}->min_level);
	unset($maps->maps->{$id}->max_level);
	unset($maps->maps->{$id}->default_floor);
}

file_put_contents(__DIR__.'/maps.json', json_encode($maps));
