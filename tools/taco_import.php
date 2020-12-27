<?php
/**
 * @filesource   taco_import.php
 * @created      27.12.2020
 * @author       smiley <smiley@chillerlan.net>
 * @copyright    2020 smiley
 * @license      MIT
 */

require_once __DIR__.'/TacoConvert.php';
require_once __DIR__.'/polyline_simplify.php';


$taco = new TacoImport(__DIR__.'/maps.json');
$data = $taco->readTrl('Tricksy_Trekksa_right.trl');

var_dump(simplify($data['coords'], 6, true));
