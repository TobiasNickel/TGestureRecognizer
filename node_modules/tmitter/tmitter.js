/**
 * @author Tobias Nickel
 * @description minimalistic emitter system 
 */

 /**
  * create an object with ability to handle emittions by defining 4 attributes
  * ._listeners, .on, .off and .trigger
  */

/**
 *	method that you will want to write in the documentation of your class/object.
 *  together with all the events you trigger by yourself
 *@param callback {function} the function to be called when the event is triggered
 */
function on(callback) {
	if (this._listeners.indexOf(callback) === -1)
		this._listeners.push(callback);
}
/**
 *	method to remove an eventlistener or even all.
 *@param callback {function} that will be removed from the listener
 */
function off(callback) {
	if (!callback) {
		this._listeners = [];
	} else {
		var index = this._listeners.indexOf(callback);
		if (index!=-1) {
			this._listeners.splice(index,1);
		}
	}
}
/**
 *  executing all listener that are registered on the event
 *@args args {object} anything that you want to be passed to the listeners callback
 */
function trigger(args) {
	this._listeners.forEach(function(listener){
		listener(args);
	});
};

module.exports.tmitter = function tMitter(){
	return {
		_listeners: [],
		on: on,
		off: off,
		trigger: trigger,
	};
};
