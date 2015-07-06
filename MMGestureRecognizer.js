if (window.goog) {
    goog.provide('MMGestureRecognizer');
}


/**
 * @constructor
 * @param el {htmlElement} the element where the events are going to me detected, you can add this to the body to capture all.
 * @param config {object} used to set some settings, read he first 10 lines of the method, and you see the options
 *  
 * the events are:
 "	'tap'
 *	'doubletap'
 *	'pinchstart'
 *	'pinch'
 *	'pinchend'
 *	'throw'
 *	'throwleft'
 *	'throwright'
 *	'longpress'
 *	'touchstart'
 *	'touchmove'
 *	'panstart'
 *	'pan'
 *	'panend'
 */
var MMGestureRecognizer = function(el, config) {
    "use strict";
    var tMitter=function(){function d(a,b){a=a.toLowerCase();a in this._events||(this._events[a]=[]);-1===this._events[a].indexOf(b)&&this._events[a].push(b)}function e(a,b){a?b?delete this._events[a][this._events[a].indexOf(b)]:delete this._events[a]:this._events={}}function f(a,b){if(a&&this._events[a])for(var c=this._events[a].length;c--;)this._events[a][c](b)}return function(a){a._events={};a.on=d;a.off=e;a.trigger=f}}();
 	tMitter(this);
    config = config !== undefined ? config : {};
    this.swipeSpeed = config.swipeSpeed || 400;
    this.swipePrecision = config.swipePrecision || 6;
    this.minPinchDistance = config.minPinchDistance || 1;
    this.minSwipeDistance = config.minSwipeDistance || 20;
    this.longPressTime = config.longPressTime || 800;
    this.longTolerance = config.longTolerance || 5;
    this.tapTolerance = config.tapTolerance || 5;
    this.panDistance = config.panDistance || 5;
    this.doubleTapSpeed = config.doubleTapSpeed || 400;
    this.doubleTapDistance = config.doubleTapDistance  || 15;
    this.minFirstPanDistance = config.minFirstPanDistance || 5;
    
    
    var touchStartHandler = function(e) {
        updateFinger(e.touches, e.timeStamp, e);
        if(e.touches.length == 1){
            document.addEventListener('touchmove', touchMoveHandler);
            document.addEventListener('touchend', touchEndHandler);
        }
    };
    var touchMoveHandler = function(e) {
        updateFinger(e.touches, e.timeStamp, e);
    };
    var touchEndHandler = function(e) {
        updateFinger(e, e.timeStamp, e);
        if(!e.touches.length){
			document.removeEventListener('touchmove', touchMoveHandler);
			document.removeEventListener('touchend', touchEndHandler);
		}
    };
    
    el.addEventListener('touchstart', touchStartHandler);
    
    this.finger = {};
    var fingerCount = 0;
    var that = this;
    
    /**
     * Method that is called on any touchEvent
     * and executes the GestureDetection-methods
     */
    function updateFinger(finger, time, e) {
        if (!that) return;
        var orgPrevent = e.preventDefault;
        e.preventDefault = function() {
            orgPrevent.apply(e);
        }
        
        var i; // used for loops
        var identifier = []; // list of the touch identifirer on the given event
        
        // handle all finger that are currently on the screen
        for (i = 0; i < finger.length; i++) {
            // copy the touch Object to create compatibility between android and iOS
            // because iOS is not creating a new touch Object on touchmove.
            var curFinger = touchToFinger(finger[i], e);
            identifier.push(curFinger.identifier);
            if (!that.finger[curFinger.identifier]) {
                // for each new finger set the beginFinger
                that.finger[curFinger.identifier] = {
                    beginFinger: curFinger
                };
                that.trigger('touchstart', {finger: that.finger[curFinger.identifier], originalEvent: e});
                
                fingerCount++;
                clearLongPress();
                if (identifier.length === 1 && that != null)
                    detectLongpress(that.finger[curFinger.identifier], e);
            }
            
            if (!that) return;
            that.finger[curFinger.identifier].lastFinger = that.finger[curFinger.identifier].curFinger || curFinger;
            that.finger[curFinger.identifier].curFinger = curFinger;
        }
        
        // detect if Fingers left the screen
        for (i in that.finger) {
            if (identifier.indexOf(i) === -1 && identifier.length == 0) {
                var f = that.finger[i];
                delete that.finger[i];
                fingerCount--;
                detectSwipe(f, e);
                
                if (identifier.length == 0)
                    detectThrow(f, e);
                
                detectTap(f, e);
                that.trigger('touchend', {finger: f, originalEvent: e});
                if (f.panning) {
                    that.trigger('panend', {finger: f, originalEvent: e});
                }
                clearLongPress();
                if (identifier.length < 2 && curPinch) {
                    that.trigger('pinchend', {finger:f, originalEvent: e, pinch: curPinch});
                    curPinch = null;
                }
            } else {
                detectMove(that.finger[i], e);
            }
        }
        detectPinch(e);
    }
    /**
     * helps to clone a touch object and adds a timeStamp 
     */
    function touchToFinger(touch, e) {
        return {
            clientX: touch.clientX,
            clientY: touch.clientY,
            force: touch.force,
            identifier: touch.identifier,
            pageX: touch.pageX,
            pageY: touch.pageY,
            radiusX: touch.radiusX,
            radiusY: touch.radiusY,
            screenX: touch.screenX,
            screenY: touch.screenY,
            target: touch.target,
            timeStamp: e.timeStamp,
            currentTarget: e.currentTarget,
            preventDefault: function() {
                e.preventDefault();
            },
            stopPropagation: function() {
                e.stopPropagation();
            }
        };
    }
    
    function detectMove(f, e) {
        if (fingerCount !== 1 || !f) return;
        f.offset = {
            x: f.curFinger.screenX - f.lastFinger.screenX,
            y: f.curFinger.screenY - f.lastFinger.screenY
        };
        that.trigger('touchmove', {finger:f, originalEvent: e});
        
        f.offset = {x: f.curFinger.screenX - f.lastFinger.screenX,
            y: f.curFinger.screenY - f.lastFinger.screenY};
        if (!f.longPressed) {
            if (f.panning) {
                that.trigger('pan', {finger: f, originalEvent: e});
            } else if (distanceOfFingers(f.beginFinger, f.curFinger) > that.minFirstPanDistance) {
                f.offset = {x: f.curFinger.screenX - f.beginFinger.screenX,
                    y: f.curFinger.screenY - f.beginFinger.screenY};
                f.panning = true;
                that.trigger("panstart", {finger: f, originalEvent: e});
                that.trigger("pan", {finger: f, originalEvent: e});
            }
        }
    }
    var lastTap = null;
    function detectTap(f, e) {
        if (fingerCount > 0) return;
        if (distanceOfFingers(f.beginFinger, f.lastFinger) > that.tapTolerance) return;

        //detect doubleTap
        if (lastTap && f.lastFinger !== lastTap.lastFinger 
        && distanceOfFingers(f.lastFinger, lastTap.lastFinger) < that.doubleTapDistance 
        && (f.curFinger.timeStamp - lastTap.curFinger.timeStamp) < that.doubleTapSpeed) {
            that.trigger('doubletap',{finger: f, originalEvent: e});
        } else if (!f.longPressed) {
            that.trigger('tap', {finger: f, originalEvent: e});
            lastTap = f;
        }
    
    }
    var longPress = null;
    // used to detect a longpress, when only one finger is holded on the screen for 2 seconds
    function detectLongpress(f, e) {
        if (longPress) return;
        longPress = {
            finger: f,
            timeout: setTimeout(function() {
                if (!longPress)
                    return;
                if (longPress.finger.panning)
                    return;
                if (distanceOfFingers(longPress.finger.beginFinger, longPress.finger.lastFinger) > that.longTolerance)
                    return;
                longPress.finger.longPressed = true;
                that.trigger('longpress', {finger:longPress.finger, originalEvent: e});
                longPress = null;
            }, that.longPressTime)
        };
    }
    function clearLongPress() {
        if (!longPress)
            return;
        clearTimeout(longPress.timeout);
        longPress = null;
    }
    
    var lastFingers = [1, 2];
    var lastDistance = null;
    var curPinch = null;
    var originDistance = null;
    function detectPinch(e) {
        var i;
        var finger = [];
        for (i in that.finger) {
            finger.push(that.finger[i]);
        }
        if (finger.length !== 2)
            return;
        if (lastFingers[0] === finger[0] && lastFingers[1] === finger[1]) {
            var dx = finger[0].curFinger.screenX - finger[1].curFinger.screenX;
            var dy = finger[0].curFinger.screenY - finger[1].curFinger.screenY;
            var curDistance = Math.sqrt(dx * dx + dy * dy);
            if (lastDistance) {
                var distanceChange = curDistance - lastDistance;
                if (Math.abs(distanceChange) > that.minPinchDistance) {
                    if (curPinch === null) {
                        curPinch = 0;
                        originDistance = curDistance;
                        that.trigger('pinchstart',{startDistance: originDistance});
                    }
                    curPinch = curDistance / originDistance;
                    that.trigger('pinch', {startDistance: originDistance, curDistance: curDistance, pinch: curDistance / originDistance});
                }
            }
        } else {
            lastDistance == null;
        }
        lastDistance = curDistance;
        lastFingers = finger;
    }
    
    function detectSwipe(finger, e) {
        if ((finger.lastFinger.timeStamp - finger.beginFinger.timeStamp) < that.swipeSpeed) {
            if (distanceOfFingers(finger.beginFinger, finger.lastFinger) < that.minSwipeDistance)
                return;
            if (Math.abs(finger.beginFinger.screenX - finger.lastFinger.screenX) / that.swipePrecision > Math.abs(finger.beginFinger.screenY - finger.lastFinger.screenY)) {
                that.trigger('swipe', {originalEvent: e, direction: finger.beginFinger.screenX - finger.lastFinger.screenX});
                // up-down swipe
                if (finger.beginFinger.screenX - finger.lastFinger.screenX < 0) {
                    that.trigger('swipeleft', {originalEvent: e, lastOffsetX: Math.abs(finger.beginFinger.screenX - finger.lastFinger.screenX)});
                } else {
                    that.trigger('swiperight', {originalEvent: e, lastOffsetX: Math.abs(finger.beginFinger.screenX - finger.lastFinger.screenX)});
                }
            } 
            else if (Math.abs(finger.beginFinger.screenX - finger.lastFinger.screenX) < Math.abs(finger.beginFinger.screenY - finger.lastFinger.screenY) / that.swipePrecision) {
                that.trigger('swipe', finger.beginFinger.screenX - finger.lastFinger.screenX);
                if (finger.beginFinger.screenY - finger.lastFinger.screenY < 0) {
                    that.trigger('swipeup', {originalEvent: e, lastOffsetY: Math.abs(finger.beginFinger.screenY - finger.lastFinger.screenY)});
                } else {
                    that.trigger('swipedown', {originalEvent: e, lastOffsetY: Math.abs(finger.beginFinger.screenY - finger.lastFinger.screenY)});
                }
            }
        }
    }

    //detects left and right throw
    function detectThrow(f) {
        var deltaTime = f.curFinger.timeStamp - f.lastFinger.timeStamp;
        var deltaX = f.curFinger.screenX - f.lastFinger.screenX;
        var deltaY = f.curFinger.screenY - f.lastFinger.screenY;
        var delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        var speedX = (1000 / deltaTime) * deltaX;
        var speed = (1000 / deltaTime) * delta;
        if (speed > 200) {
            that.trigger('throw')
            if(deltaX > deltaY){
                if (deltaX < 0 ) {
                    that.trigger('throwright');
                } else {
                    that.trigger('throwleft');
                }
            } else {
                if (deltaY < 0) {
                    that.trigger('throwup');
                } else {
                    that.trigger('throwdown');
                }
            }
        }
    }
    
    function distanceOfFingers(one, two) {
        var dx = Math.abs(one.screenX - two.screenX);
        var dy = Math.abs(one.screenY - two.screenY);
        return Math.sqrt((dx * dx) + (dy * dy));
    }
    this.destroy = function() {
        el.removeEventListener('touchstart', touchStartHandler);
        el.removeEventListener('touchmove', touchMoveHandler);
        el.removeEventListener('touchend', touchEndHandler);
        this.off();
        this.finger = null;
        lastFingers = null;
        clearLongPress();
        that = null;
        el = null;
    };
}

