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

$project_root    = realpath(__DIR__.'/../').'/';
$stylesheet_path = $project_root.trim($argv[1], '/');

if(!file_exists($stylesheet_path) || !is_readable($stylesheet_path)){
	throw new Exception('stylesheet not readable: '.$stylesheet_path);
}


$stylesheet = preg_replace_callback('/url\(([^\)]+)\)/is', function(array $matches) use ($project_root):string{
	$match = $matches[0] ?? '';
	$uri   = trim($matches[1] ?? '', '\'" ');

	if(strpos($uri, 'http') === 0 || strpos($uri, 'data:image') === 0){
		return $match;
	}

	$img = $project_root.$uri;

	if(!is_readable($img)){
		throw new Exception('image not readable: '.$img);
	}

	$bin  = file_get_contents($img);
	$mime = (new finfo(FILEINFO_MIME_TYPE))->buffer($bin);

	return 'url("data:'.$mime.';base64,'.base64_encode($bin).'")';
}, file_get_contents($stylesheet_path));

if(!is_writable($stylesheet_path)){
	throw new Exception('stylesheet not writable: '.$stylesheet_path);
}

file_put_contents($stylesheet_path, $stylesheet);
