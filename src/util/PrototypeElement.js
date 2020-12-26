/**
 * prototype DOM rewrite inc
 * @link https://github.com/prototypejs/prototype/blob/master/src/prototype/dom/dom.js
 *
 * @filesource   PrototypeElement.js
 * @created      09.08.2020
 * @author       smiley <smiley@chillerlan.net>
 * @copyright    2020 smiley
 * @license      MIT
 */

export default class PrototypeElement{

	static addClassName(element, className){

		if(!this.hasClassName(element, className)){
			element.className += (element.className ? ' ' : '') + className;
		}

		return element;
	}

	static removeClassName(element, className){
		element.className = element.className
			.replace(this.getRegExpForClassName(className), ' ')
			.replace(/^\s+/, '')
			.replace(/\s+$/, '');

		return element;
	}

	static toggleClassName(element, className, bool) {

		if(typeof bool === 'undefined'){
			bool = !this.hasClassName(element, className);
		}

		return this[bool ? 'addClassName' : 'removeClassName'](element, className);
	}

	static hasClassName(element, className){
		let elementClassName = element.className;

		if(elementClassName.length === 0){
			return false;
		}

		if(elementClassName === className){
			return true;
		}

		return this.getRegExpForClassName(className).test(elementClassName);
	}

	static getRegExpForClassName(className){
		return new RegExp('(^|\\s+)' + className + '(\\s+|$)');
	}

}
