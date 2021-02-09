/**
 * @filesource   Utils.js
 * @created      09.08.2020
 * @author       smiley <smiley@chillerlan.net>
 * @copyright    2020 smiley
 * @license      MIT
 */

export default class Utils{

	/**
	 * @param {Object} target
	 * @param {Object} source
	 * @returns {Object}
	 */
	static extend(target, source) {

		for(let property in source) {
			// eslint-disable-next-line no-prototype-builtins
			if(source.hasOwnProperty(property)) {
				target[property] = source[property];
			}
		}

		return target;
	}

	/**
	 * @link  http://locutus.io/php/var/intval/
	 *
	 * @param {*}      mixed_var
	 * @param {number} base
	 * @returns {*}
	 */
	static intval(mixed_var, base){
		let tmp;
		let type = typeof(mixed_var);

		if(type === 'boolean'){
			return +mixed_var;
		}
		else if(type === 'string'){
			tmp = parseInt(mixed_var, base || 10);
			return (isNaN(tmp) || !isFinite(tmp)) ? 0 : tmp;
		}
		else if(type === 'number' && isFinite(mixed_var)){
			return mixed_var|0;
		}
		else{
			return 0;
		}
	}

	/**
	 * Checks to see if a value in a nested array is set.
	 * isset(() => some.nested.value)
	 *
	 * @link https://stackoverflow.com/a/46256973
	 *
	 * @param {Function} accessor Function that returns our value
	 */
	static isset(accessor){
		try{
			return typeof accessor() !== 'undefined';
		}
		catch(e){
			return false;
		}
	}

}
