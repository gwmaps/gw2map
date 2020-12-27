<?php
/**
 * Class TacoConvert
 *
 * @filesource   TacoConvert.php
 * @created      09.08.2020
 * @author       smiley <smiley@chillerlan.net>
 * @copyright    2020 smiley
 * @license      MIT
 */

class TacoImport{

	protected stdClass $maps;

	/**
	 * TacoImport constructor.
	 *
	 * @param string $mapsJsonFile path to a local copy of api.guildwars2.com/v1/maps.json
	 *
	 * @throws \Exception
	 */
	public function __construct(string $mapsJsonFile){

		$maps = json_decode(file_get_contents($mapsJsonFile));

		if(!isset($maps->maps)){
			throw new Exception('invalid maps.json');
		}

		$this->maps = $maps->maps;
	}

	/**
	 * Reads a TacO .trl file
	 *
	 * @param string $trl path to the .trl file
	 *
	 * @return array
	 */
	public function readTrl(string $trl):array{
		$fh      = fopen($trl, 'rb');
		$version = unpack('L', fread($fh, 4));
		$mapid   = unpack('Lid', fread($fh, 4))['id'];
		$map     = $this->maps->{$mapid};
		$coords  = [];

		while(true){
			$raw = fread($fh, 12);

			if(strlen($raw) === 0 || feof($fh)){
				break;
			}

			$v        = unpack('gx/gy/gz', $raw);
			$coords[] = $this::recalc_coords($map->continent_rect, $map->map_rect, [$v['x']/0.0254, $v['z']/0.0254]);
		}

		fclose($fh);

		return [
			'map_id' => $mapid,
			'coords' => $coords,
		];
	}

	/**
	 * recalculates the given coordinate from map to world coordinates
	 * don't look at it. really! it will melt your brain and make your eyes bleed!
	 *
	 * continent_rect and map_rect from e.g. api.guildwars2.com/v1/maps.json, coordinate data from gw2 mumble link
	 *
	 * @see https://wiki.guildwars2.com/wiki/API:1/event_details#Coordinate_recalculation
	 * @see https://wiki.guildwars2.com/wiki/API:MumbleLink
	 *
	 * @param array $cr continent_rect
	 * @param array $mr map_rect
	 * @param array $p  point
	 *
	 * @return int[]
	 */
	public static function recalc_coords(array $cr, array $mr, array $p):array{
		return [
			(int)round($cr[0][0] + ($cr[1][0] - $cr[0][0]) * ($p[0] - $mr[0][0]) / ($mr[1][0] - $mr[0][0])),
			(int)round($cr[0][1] + ($cr[1][1] - $cr[0][1]) * (1 - ($p[1] - $mr[0][1]) / ($mr[1][1] - $mr[0][1]))),
		];
	}

}
