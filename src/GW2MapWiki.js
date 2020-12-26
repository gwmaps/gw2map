/**
 * @filesource   GW2MapWiki.js
 * @created      09.08.2020
 * @author       smiley <smiley@chillerlan.net>
 * @copyright    2020 smiley
 * @license      MIT
 */

import GW2Map from './GW2Map';
import Utils from './util/Utils';
// noinspection ES6PreferShortImport
import {TileLayer} from '../node_modules/leaflet/dist/leaflet-src.esm';

export default class GW2MapWiki extends GW2Map{

	localTileZoomedRects = {};
	localTileRects = [
		[[0    ,40962], [40184,49152]], // Bottom half of Tyria
		[[21504,21760], [24320,24320]], // Labyrinthine Cliffs
		[[33024,33792], [36352,36352]], // The Key of Ahdashim
		[[22272,43008], [26368,47360]], // Domain of Istan
		[[18432,44544], [22528,47104]], // Fahranur, the First City
		[[18688,38912], [23040,43776]], // Sandswept Isles
		[[29696,43008], [34816,47872]], // Domain of Kourna
		[[29696,39424], [34816,43264]], // Jahai Bluffs
		[[22784,18176], [26880,22528]], // Thunderhead Peaks
		[[10496,31488], [15616,34810]], // Dragonfall
		[[26624,  512], [30208, 4094]], // Grothmar Valley
		[[22016,  256], [26880, 4094]], // Bjora Marches
		[[16384, 1280], [20480, 6144]], // Drizzlewood Coast
	];

	constructor(container, id, options){
		super(container, id, options);

		// pre-calculate zoomed/projected rects for local tiles
		for(let z = this.options.minZoom; z <= this.options.maxZoom; z++){
			this.localTileZoomedRects[z] = this.localTileRects.map(r => r.map(c => this._project(c, z)));
		}

		let that = this;
		// override L.TileLayer.getTileUrl() and add a custom tile getter
		TileLayer.include({
			getTileUrl: function(coords){
				return that._tileGetter(coords, this._getZoomForUrl());
			}
		});
	}

	/**
	 * @param {[*,*]}  coords
	 * @param {number} zoom
	 * @returns {[*,*]}
	 * @protected
	 */
	_project(coords, zoom){
		return coords.map(c => Math.floor((c / (1 << (this.options.maxZoom - zoom))) / 256));
	}

	/**
	 * allow custom local tiles to be used from the wiki (workaround for missing API tiles)
	 *
	 * @param coords
	 * @param zoom
	 * @returns {string}
	 * @private
	 */
	_tileGetter(coords, zoom){
		let clamp = this.viewRect.map(c => this._project(c, zoom));
		let ta    = this.dataset.tileAdjust;

		if(
			coords.x < clamp[0][0] - ta
			|| coords.x > clamp[1][0] + ta
			|| coords.y < clamp[0][1] - ta
			|| coords.y > clamp[1][1] + ta
		){
			return this.options.errorTile;
		}

		let floor = (this.dataset.customFloor || this.dataset.floorId);

		for(let i = 0; i < this.localTileZoomedRects[zoom].length; i++){
			clamp = this.localTileZoomedRects[zoom][i];

			if(Utils.in_array(floor, [1, 2, 3, 4]) && !(
				coords.x < clamp[0][0]
				|| coords.x > clamp[1][0]
				|| coords.y < clamp[0][1]
				|| coords.y > clamp[1][1]
			)){
				let fileName = 'World_map_tile_C' + this.dataset.continentId
					+ ('_Z' + zoom + '_X' + coords.x + '_Y' + coords.y + '.jpg');
				// running md5 for every. single. tile. is HORRIFIC. WTB proper tile server.
				let md5file = this.md5(fileName);

				return 'https://wiki.guildwars2.com/images/' + md5file.slice(0,1) + '/'+ md5file.slice(0,2) + '/' + fileName;
			}
		}

		return [
			this.options.tileBase,
			this.dataset.continentId,
			floor,
			zoom,
			coords.x,
			coords.y + '.' + this.options.tileExt,
		].join('/');
	}

	/**
	 * @link https://locutus.io/php/md5/
	 * @link https://locutus.io/php/utf8_encode/
	 *
	 * @param str
	 * @returns {string}
	 */
	md5(str){

		let _convertToWordArray = str => {
			let lWordCount;
			let lMessageLength = str.length;
			let lNumberOfWordsTemp1 = lMessageLength + 8;
			let lNumberOfWordsTemp2 = (lNumberOfWordsTemp1 - (lNumberOfWordsTemp1 % 64)) / 64;
			let lNumberOfWords = (lNumberOfWordsTemp2 + 1) * 16;
			let lWordArray = new Array(lNumberOfWords - 1);
			let lBytePosition = 0;
			let lByteCount = 0;

			while(lByteCount < lMessageLength){
				lWordCount = (lByteCount - (lByteCount % 4)) / 4;
				lBytePosition = (lByteCount % 4) * 8;
				lWordArray[lWordCount] = (lWordArray[lWordCount]|(str.charCodeAt(lByteCount) << lBytePosition));
				lByteCount++;
			}

			lWordCount = (lByteCount - (lByteCount % 4)) / 4;
			lBytePosition = (lByteCount % 4) * 8;
			lWordArray[lWordCount] = lWordArray[lWordCount]|(0x80 << lBytePosition);
			lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
			lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;

			return lWordArray;
		}

		let _utf8_encode = str => {

			if(str === null || typeof str === 'undefined'){
				return '';
			}

			// .replace(/\r\n/g, "\n").replace(/\r/g, "\n");
			let string = (str + '');
			let utftext = '';
			let stringl = string.length;
			let start = 0;
			let end = 0;

			for(let n = 0; n < stringl; n++){
				let c1 = string.charCodeAt(n);
				let enc = null;

				if(c1 < 128){
					end++;
				}
				else if(c1 > 127 && c1 < 2048){
					enc = String.fromCharCode((c1 >> 6)|192, (c1&63)|128,);
				}
				else if((c1&0xF800) !== 0xD800){
					enc = String.fromCharCode((c1 >> 12)|224, ((c1 >> 6)&63)|128, (c1&63)|128,);
				}
				else{
					// surrogate pairs
					if((c1&0xFC00) !== 0xD800){
						throw new RangeError('Unmatched trail surrogate at ' + n);
					}

					let c2 = string.charCodeAt(++n);

					if((c2&0xFC00) !== 0xDC00){
						throw new RangeError('Unmatched lead surrogate at ' + (n - 1));
					}

					c1 = ((c1&0x3FF) << 10) + (c2&0x3FF) + 0x10000;
					enc = String.fromCharCode((c1 >> 18)|240, ((c1 >> 12)&63)|128, ((c1 >> 6)&63)|128, (c1&63)|128,);
				}

				if(enc !== null){

					if(end > start){
						utftext += string.slice(start, end);
					}

					utftext += enc;
					start = end = n + 1;
				}
			}

			if(end > start){
				utftext += string.slice(start, stringl);
			}

			return utftext;
		}

		let _addU = (lX, lY) => {
			let lX8 = (lX&0x80000000);
			let lY8 = (lY&0x80000000);
			let lX4 = (lX&0x40000000);
			let lY4 = (lY&0x40000000);
			let lResult = (lX&0x3FFFFFFF) + (lY&0x3FFFFFFF);

			if(lX4&lY4){
				return (lResult^0x80000000^lX8^lY8);
			}

			if(lX4|lY4){

				if(lResult&0x40000000){
					return (lResult^0xC0000000^lX8^lY8);
				}

				return (lResult^0x40000000^lX8^lY8);
			}

			return (lResult^lX8^lY8);
		}

		let _rotateLeft = (lValue, iShiftBits) => (lValue << iShiftBits)|(lValue >>> (32 - iShiftBits));

		let _F = (x, y, z) => (x&y)|((~x)&z);
		let _G = (x, y, z) => (x&z)|(y&(~z));
		let _H = (x, y, z) => (x^y^z);
		let _I = (x, y, z) => (y^(x|(~z)));

		let _FF = (a, b, c, d, x, s, ac) => _addU(_rotateLeft(_addU(a, _addU(_addU(_F(b, c, d), x), ac)), s), b);
		let _GG = (a, b, c, d, x, s, ac) => _addU(_rotateLeft(_addU(a, _addU(_addU(_G(b, c, d), x), ac)), s), b);
		let _HH = (a, b, c, d, x, s, ac) => _addU(_rotateLeft(_addU(a, _addU(_addU(_H(b, c, d), x), ac)), s), b);
		let _II = (a, b, c, d, x, s, ac) => _addU(_rotateLeft(_addU(a, _addU(_addU(_I(b, c, d), x), ac)), s), b);

		let a   = 0x67452301;
		let b   = 0xEFCDAB89;
		let c   = 0x98BADCFE;
		let d   = 0x10325476;
		let S11 = 7;
		let S12 = 12;
		let S13 = 17;
		let S14 = 22;
		let S21 = 5;
		let S22 = 9;
		let S23 = 14;
		let S24 = 20;
		let S31 = 4;
		let S32 = 11;
		let S33 = 16;
		let S34 = 23;
		let S41 = 6;
		let S42 = 10;
		let S43 = 15;
		let S44 = 21;
		let k, AA, BB, CC, DD;
		let x   = _convertToWordArray(_utf8_encode(str));
		let xl  = x.length;

		for(k = 0; k < xl; k += 16){
			AA = a;
			BB = b;
			CC = c;
			DD = d;
			a = _FF(a, b, c, d, x[k     ], S11, 0xD76AA478);
			d = _FF(d, a, b, c, x[k +  1], S12, 0xE8C7B756);
			c = _FF(c, d, a, b, x[k +  2], S13, 0x242070DB);
			b = _FF(b, c, d, a, x[k +  3], S14, 0xC1BDCEEE);
			a = _FF(a, b, c, d, x[k +  4], S11, 0xF57C0FAF);
			d = _FF(d, a, b, c, x[k +  5], S12, 0x4787C62A);
			c = _FF(c, d, a, b, x[k +  6], S13, 0xA8304613);
			b = _FF(b, c, d, a, x[k +  7], S14, 0xFD469501);
			a = _FF(a, b, c, d, x[k +  8], S11, 0x698098D8);
			d = _FF(d, a, b, c, x[k +  9], S12, 0x8B44F7AF);
			c = _FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
			b = _FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
			a = _FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
			d = _FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
			c = _FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
			b = _FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
			a = _GG(a, b, c, d, x[k +  1], S21, 0xF61E2562);
			d = _GG(d, a, b, c, x[k +  6], S22, 0xC040B340);
			c = _GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
			b = _GG(b, c, d, a, x[k     ], S24, 0xE9B6C7AA);
			a = _GG(a, b, c, d, x[k +  5], S21, 0xD62F105D);
			d = _GG(d, a, b, c, x[k + 10], S22, 0x2441453);
			c = _GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
			b = _GG(b, c, d, a, x[k +  4], S24, 0xE7D3FBC8);
			a = _GG(a, b, c, d, x[k +  9], S21, 0x21E1CDE6);
			d = _GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
			c = _GG(c, d, a, b, x[k +  3], S23, 0xF4D50D87);
			b = _GG(b, c, d, a, x[k +  8], S24, 0x455A14ED);
			a = _GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
			d = _GG(d, a, b, c, x[k +  2], S22, 0xFCEFA3F8);
			c = _GG(c, d, a, b, x[k +  7], S23, 0x676F02D9);
			b = _GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
			a = _HH(a, b, c, d, x[k +  5], S31, 0xFFFA3942);
			d = _HH(d, a, b, c, x[k +  8], S32, 0x8771F681);
			c = _HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
			b = _HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
			a = _HH(a, b, c, d, x[k +  1], S31, 0xA4BEEA44);
			d = _HH(d, a, b, c, x[k +  4], S32, 0x4BDECFA9);
			c = _HH(c, d, a, b, x[k +  7], S33, 0xF6BB4B60);
			b = _HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
			a = _HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
			d = _HH(d, a, b, c, x[k     ], S32, 0xEAA127FA);
			c = _HH(c, d, a, b, x[k +  3], S33, 0xD4EF3085);
			b = _HH(b, c, d, a, x[k +  6], S34, 0x4881D05);
			a = _HH(a, b, c, d, x[k +  9], S31, 0xD9D4D039);
			d = _HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
			c = _HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
			b = _HH(b, c, d, a, x[k +  2], S34, 0xC4AC5665);
			a = _II(a, b, c, d, x[k     ], S41, 0xF4292244);
			d = _II(d, a, b, c, x[k +  7], S42, 0x432AFF97);
			c = _II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
			b = _II(b, c, d, a, x[k +  5], S44, 0xFC93A039);
			a = _II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
			d = _II(d, a, b, c, x[k +  3], S42, 0x8F0CCC92);
			c = _II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
			b = _II(b, c, d, a, x[k +  1], S44, 0x85845DD1);
			a = _II(a, b, c, d, x[k +  8], S41, 0x6FA87E4F);
			d = _II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
			c = _II(c, d, a, b, x[k +  6], S43, 0xA3014314);
			b = _II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
			a = _II(a, b, c, d, x[k +  4], S41, 0xF7537E82);
			d = _II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
			c = _II(c, d, a, b, x[k +  2], S43, 0x2AD7D2BB);
			b = _II(b, c, d, a, x[k +  9], S44, 0xEB86D391);
			a = _addU(a, AA);
			b = _addU(b, BB);
			c = _addU(c, CC);
			d = _addU(d, DD);
		}

		let temp = [a, b, c, d].map(lValue => {
			let lByte, lCount;
			let wordToHexValue = '';
			let wordToHexValueTemp = '';

			for(lCount = 0; lCount <= 3; lCount++){
				lByte = (lValue >>> (lCount * 8))&255;
				wordToHexValueTemp = '0' + lByte.toString(16);
				wordToHexValue = wordToHexValue + wordToHexValueTemp.substr(wordToHexValueTemp.length - 2, 2);
			}

			return wordToHexValue;
		});

		return temp.join('').toLowerCase();
	}

}
