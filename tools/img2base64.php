<?php
/**
 * Replaces images in the styles with base64 data URIs
 *
 * @filesource   img2base64.php
 * @created      31.12.2020
 * @author       smiley <smiley@chillerlan.net>
 * @copyright    2020 smiley
 * @license      MIT
 */

if(!isset($argv[1]) || empty($argv[1])){
	throw new InvalidArgumentException('invalid stylesheet');
}

// determine project root & given path
$project_root    = realpath(__DIR__.'/../').'/';
$stylesheet_path = $project_root.trim($argv[1], '/');

if(!file_exists($stylesheet_path) || !is_readable($stylesheet_path)){
	throw new Exception('stylesheet not readable: '.$stylesheet_path);
}

$excludes = [
	'http',
	'data:image',
	'#default#VML', // leaflet.css
];

$callback = function(array $matches) use ($project_root, $excludes):string{
	// first element is the full match
	$match = $matches[0] ?? '';
	// second match it the content - trim any quotes and space
	$uri   = trim($matches[1] ?? '', '\'" ');

	// don't convert external links and data URIs
	foreach($excludes as $exclude){
		if(strpos($uri, $exclude) === 0){
			return $match;
		}
	}

	// we have a match
	$isLeaflet = strpos($uri, 'images/') === 0 ? 'node_modules/leaflet/dist/' : '';
	$img       = $project_root.$isLeaflet.$uri;

	if(!is_readable($img)){
		throw new Exception('image not readable: '.$img);
	}

	// get contents & determine mime type
	$bin  = file_get_contents($img);
	$mime = (new finfo(FILEINFO_MIME_TYPE))->buffer($bin);

	return sprintf('url("data:%s;base64,%s")', $mime, base64_encode($bin));
};

/** @noinspection RegExpRedundantEscape */
$stylesheet = preg_replace_callback('/url\(([^\)]+)\)/is', $callback, file_get_contents($stylesheet_path));

if(!is_writable($stylesheet_path)){
	throw new Exception('stylesheet not writable: '.$stylesheet_path);
}

file_put_contents($stylesheet_path, $stylesheet);

exit;
