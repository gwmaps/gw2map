<?php
/**
 * @link https://github.com/mourner/simplify-js/blob/master/simplify.js
 *
 * @created      13.08.2020
 * @author       smiley <smiley@chillerlan.net>
 * @copyright    2020 smiley
 * @license      MIT
 */

function simplify(array $points, int $tolerance = 1, bool $highestQuality = true):array{

	if(count($points) < 2){
		return $points;
	}

	$sqTolerance = $tolerance * $tolerance;

	if(!$highestQuality){
		$points = simplifyRadialDistance($points, $sqTolerance);
	}

	$points = simplifyDouglasPeucker($points, $sqTolerance);

	return $points;
}

function getSquareDistance(array $p1, array $p2):int{
	$dx = $p1[0] - $p2[0];
	$dy = $p1[1] - $p2[1];

	return $dx * $dx + $dy * $dy;
}

function getSquareSegmentDistance(array $p, array $p1, array $p2):int{
	$x  = $p1[0];
	$y  = $p1[1];
	$dx = $p2[0] - $x;
	$dy = $p2[1] - $y;

	if($dx !== 0 || $dy !== 0){

		$t = (($p[0] - $x) * $dx + ($p[1] - $y) * $dy) / ($dx * $dx + $dy * $dy);

		if($t > 1){
			$x = $p2[0];
			$y = $p2[1];
		}
		elseif($t > 0){
			$x += $dx * $t;
			$y += $dy * $t;
		}
	}

	$dx = $p[0] - $x;
	$dy = $p[1] - $y;

	return $dx * $dx + $dy * $dy;
}

// distance-based simplification
function simplifyRadialDistance(array $points, int $sqTolerance):array{
	$len       = count($points);
	$prevPoint = $points[0];
	$newPoints = [$prevPoint];
	$point     = null;

	for($i = 1; $i < $len; $i++){
		$point = $points[$i];

		if(getSquareDistance($point, $prevPoint) > $sqTolerance){
			$newPoints[] = $prevPoint = $point;
		}
	}

	if($prevPoint !== $point){
		$newPoints[] = $point;
	}

	return $newPoints;
}

// simplification using optimized Douglas-Peucker algorithm with recursion elimination
function simplifyDouglasPeucker(array $points, int $sqTolerance):array{
	$len     = count($points);
	$markers = array_fill(0, $len - 1, null);
	$first   = 0;
	$last    = $len - 1;

	$firstStack = [];
	$lastStack  = [];
	$newPoints  = [];

	$markers[$first] = $markers[$last] = 1;
	$index = 0;

	while($last){
		$maxSqDist = 0;

		for($i = $first + 1; $i < $last; $i++){
			$sqDist = getSquareSegmentDistance($points[$i], $points[$first], $points[$last]);

			if($sqDist > $maxSqDist){
				$index     = $i;
				$maxSqDist = $sqDist;
			}
		}

		if($maxSqDist > $sqTolerance){
			$markers[$index] = 1;

			$firstStack[] = $first;
			$firstStack[] = $index;
			$lastStack[]  = $index;
			$lastStack[]  = $last;
		}

		$first = array_pop($firstStack);
		$last  = array_pop($lastStack);
	}

	for($i = 0; $i < $len; $i++){
		if($markers[$i]){
			$newPoints[] = $points[$i];
		}
	}

	return $newPoints;
}
