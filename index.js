//var tMitter=function(){function d(a,b){a=a.toLowerCase();a in this._events||(this._events[a]=[]);-1===this._events[a].indexOf(b)&&this._events[a].push(b)}function e(a,b){a?b?delete this._events[a][this._events[a].indexOf(b)]:delete this._events[a]:this._events={}}function f(a,b){if(a&&this._events[a])for(var c=this._events[a].length;c--;)this._events[a][c](b)}return function(a){a._events={};a.on=d;a.off=e;a.trigger=f}}();
import { tmitter } from 'tmitter';
/**
 * @constructor
 * @param el {htmlElement} the element where the events are going to me detected, you can add this to the body to capture all.
 * @param config {object} used to set some settings, read he first 10 lines of the method, and you see the options
 * @class
 * the events are:
 "    'tap'
 *    'doubletap'
 *    'pinchstart'
 *    'pinch'
 *    'pinchend'
 *    'throw'
 *    'throwleft'
 *    'throwright'
 *    'throwup'
 *    'throwdown'
 *    'longpress'
 *    'touchstart'
 *    'touchmove'
 *    'touchend'
 *    'panstart'
 *    'pan'
 *    'panend'
 *    'rotate'
 *    'swipe'
 *    'swipeup'
 *    'swiperight'
 *    'swipedown'
 *    'swipeleft'
 *    ''
 */
export class GestureRecognizer {
    constructor(el, config) {
        this.lastFingers = [1, 2];
        this.el = el;
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
        this.doubleTapDistance = config.doubleTapDistance || 15;
        this.minFirstPanDistance = config.minFirstPanDistance || 5;
        this.touchMode = !!config.touchMode;
        this.events = {
            tap: tmitter(),
            doubletap: tmitter(),
            pinchstart: tmitter(),
            pinch: tmitter(),
            pinchend: tmitter(),
            throw: tmitter(),
            throwleft: tmitter(),
            throwright: tmitter(),
            throwup: tmitter(),
            throwdown: tmitter(),
            longpress: tmitter(),
            touchstart: tmitter(),
            touchmove: tmitter(),
            touchend: tmitter(),
            panstart: tmitter(),
            pan: tmitter(),
            panend: tmitter(),
            rotate: tmitter(),
            swipe: tmitter(),
            swipeup: tmitter(),
            swipedown: tmitter(),
            swipeleft: tmitter(),
            swiperight: tmitter(),
        };
        this.finger = {};
        this.fingerCount = 0;
        this.destroyed = false;
        this.lastDistance = undefined;
        this.originDistance = 0;
        if (this.touchMode) {
            el.addEventListener('touchstart', this.touchStartHandler);
        }
        else {
            this.mouseStartHandler = this.mouseStartHandler.bind(this);
            this.mouseMoveHandler = this.mouseMoveHandler.bind(this);
            this.mouseEndHandler = this.mouseEndHandler.bind(this);
            el.addEventListener('mousedown', this.mouseStartHandler);
        }
    }
    touchStartHandler(e) {
        this.updateFinger(e.touches, e.timeStamp, e);
        if (e.touches.length === 1) {
            document.addEventListener('touchmove', this.touchMoveHandler);
            document.addEventListener('touchend', this.touchEndHandler);
        }
    }
    ;
    touchMoveHandler(e) {
        this.updateFinger(e.touches, e.timeStamp, e);
    }
    ;
    touchEndHandler(e) {
        this.updateFinger(e.touches, e.timeStamp, e);
        if (!e.touches.length) {
            document.removeEventListener('touchmove', this.touchMoveHandler);
            document.removeEventListener('touchend', this.touchEndHandler);
        }
    }
    ;
    mouseStartHandler(e) {
        if (this.touchMode)
            return;
        //this.mouseEventToTouch(e);
        this.updateFinger([e], e.timeStamp, e);
        document.body.addEventListener('mousemove', this.mouseMoveHandler);
        document.body.addEventListener('mouseup', this.mouseEndHandler);
    }
    ;
    mouseMoveHandler(e) {
        //this.mouseEventToTouch(e);
        this.updateFinger([e], e.timeStamp, e);
    }
    ;
    mouseEndHandler(e) {
        this.updateFinger([], e.timeStamp, e);
        document.body.removeEventListener('mousemove', this.mouseMoveHandler);
        document.body.removeEventListener('mouseup', this.mouseEndHandler);
    }
    ;
    /**
     * Method that is called on any touchEvent
     * and executes the GestureDetection-methods
     */
    updateFinger(finger, time, e) {
        if (this.destroyed)
            return;
        var orgPrevent = e.preventDefault;
        e.preventDefault = function () {
            orgPrevent.apply(e);
        };
        var i; // used for loops
        var identifier = []; // list of the touch identifirer on the given event
        // handle all finger that are currently on the screen
        for (i = 0; i < finger.length; i++) {
            // copy the touch Object to create compatibility between android and iOS
            // because iOS is not creating a new touch Object on touchmove.
            var curFinger = this.touchToFinger(finger[i], e);
            identifier.push(curFinger.identifier);
            if (!this.finger[curFinger.identifier]) {
                // for each new finger set the beginFinger
                this.finger[curFinger.identifier] = {
                    beginFinger: curFinger
                };
                this.events.touchstart.trigger({ finger: this.finger[curFinger.identifier], originalEvent: e });
                this.fingerCount++;
                this.clearLongPress();
                if (identifier.length === 1 && !this.destroyed) {
                    this.detectLongpress(this.finger[curFinger.identifier], e);
                }
            }
            if (this.destroyed)
                return;
            this.finger[curFinger.identifier].lastFinger = this.finger[curFinger.identifier].curFinger || curFinger;
            this.finger[curFinger.identifier].curFinger = curFinger;
        }
        // detect if Fingers left the screen
        for (i in this.finger) {
            if (identifier.indexOf(i) === -1 && identifier.length === 0) {
                var f = this.finger[i];
                delete this.finger[i];
                this.fingerCount--;
                this.detectSwipe(f, e);
                if (identifier.length === 0) {
                    this.detectThrow(f, e);
                }
                this.detectTap(f, e);
                this.events.touchend.trigger({ finger: f, originalEvent: e });
                if (f.panning) {
                    this.events.panend.trigger({ finger: f, originalEvent: e });
                }
                this.clearLongPress();
                if (identifier.length < 2 && this.curPinch) {
                    this.events.pinchend.trigger({ finger: f, originalEvent: e, pinch: this.curPinch });
                    this.curPinch = undefined;
                }
            }
            else {
                this.detectMove(this.finger[i], e);
            }
        }
        this.detectPinch(e);
    }
    /**
     * helps to clone a touch object and adds a timeStamp
     */
    touchToFinger(touch, e) {
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
            preventDefault: function () {
                e.preventDefault();
            },
            stopPropagation: function () {
                e.stopPropagation();
            }
        };
    }
    detectMove(f, e) {
        if (this.fingerCount !== 1 || !f)
            return;
        f.offset = {
            x: f.curFinger.screenX - f.lastFinger.screenX,
            y: f.curFinger.screenY - f.lastFinger.screenY
        };
        this.events.touchmove.trigger({ finger: f, originalEvent: e });
        f.offset = {
            x: f.curFinger.screenX - f.lastFinger.screenX,
            y: f.curFinger.screenY - f.lastFinger.screenY
        };
        if (!f.longPressed) {
            if (f.panning) {
                this.events.pan.trigger({ finger: f, originalEvent: e });
            }
            else if (distanceOfFingers(f.beginFinger, f.curFinger) > this.minFirstPanDistance) {
                f.offset = {
                    x: f.curFinger.screenX - f.beginFinger.screenX,
                    y: f.curFinger.screenY - f.beginFinger.screenY
                };
                f.panning = true;
                this.events.panstart.trigger({ finger: f, originalEvent: e });
                this.events.pan.trigger({ finger: f, originalEvent: e });
            }
        }
    }
    detectTap(f, e) {
        if (this.fingerCount > 0)
            return;
        if (distanceOfFingers(f.beginFinger, f.lastFinger) > this.tapTolerance)
            return;
        //detect doubleTap
        if (this.lastTap && f.lastFinger !== this.lastTap.lastFinger
            && distanceOfFingers(f.lastFinger, this.lastTap.lastFinger) < this.doubleTapDistance
            && (f.curFinger.timeStamp - this.lastTap.curFinger.timeStamp) < this.doubleTapSpeed) {
            this.events.doubletap.trigger({ finger: f, originalEvent: e });
        }
        else if (!f.longPressed) {
            this.events.tap.trigger({ finger: f, originalEvent: e });
            this.lastTap = f;
        }
    }
    // used to detect a longpress, when only one finger is holded on the screen for 2 seconds
    detectLongpress(f, e) {
        if (this.longPress) {
            return;
        }
        this.longPress = {
            finger: f,
            timeout: setTimeout(() => {
                if (!this.longPress) {
                    return;
                }
                if (this.longPress.finger.panning) {
                    return;
                }
                if (distanceOfFingers(this.longPress.finger.beginFinger, this.longPress.finger.lastFinger) > this.longTolerance) {
                    return;
                }
                this.longPress.finger.longPressed = true;
                this.events.longpress.trigger({ finger: this.longPress.finger, originalEvent: e });
                this.longPress = null;
            }, this.longPressTime)
        };
    }
    clearLongPress() {
        if (!this.longPress)
            return;
        clearTimeout(this.longPress.timeout);
        this.longPress = null;
    }
    detectPinch(e) {
        var i;
        var finger = [];
        var curDistance;
        for (i in this.finger) {
            finger.push(this.finger[i]);
        }
        if (finger.length !== 2) {
            return;
        }
        if (this.lastFingers[0] === finger[0] && this.lastFingers[1] === finger[1]) {
            var dx = finger[0].curFinger.screenX - finger[1].curFinger.screenX;
            var dy = finger[0].curFinger.screenY - finger[1].curFinger.screenY;
            curDistance = Math.sqrt(dx * dx + dy * dy);
            if (this.lastDistance) {
                var lastAngle = posToAngle(finger[0].lastFinger, finger[1].lastFinger);
                var currAngle = posToAngle(finger[0].curFinger, finger[1].curFinger);
                var angleChanged = angleChange(lastAngle, currAngle);
                if (angleChanged) {
                    this.events.rotate.trigger({ lastAngle: lastAngle, curAngle: currAngle, angleChange: angleChanged });
                }
                var distanceChange = curDistance - this.lastDistance;
                if (Math.abs(distanceChange) > this.minPinchDistance) {
                    if (this.curPinch === null) {
                        this.curPinch = 0;
                        this.originDistance = curDistance;
                        this.events.pinchstart.trigger({ startDistance: this.originDistance });
                    }
                    this.curPinch = curDistance / this.originDistance;
                    this.events.pinch.trigger({ startDistance: this.originDistance, curDistance: curDistance, pinch: curDistance / this.originDistance });
                }
            }
        }
        else {
            this.lastDistance = undefined;
        }
        this.lastDistance = curDistance;
        this.lastFingers = finger;
    }
    detectSwipe(finger, e) {
        if ((finger.lastFinger.timeStamp - finger.beginFinger.timeStamp) < this.swipeSpeed) {
            if (distanceOfFingers(finger.beginFinger, finger.lastFinger) < this.minSwipeDistance) {
                return;
            }
            if (Math.abs(finger.beginFinger.screenX - finger.lastFinger.screenX) / this.swipePrecision > Math.abs(finger.beginFinger.screenY - finger.lastFinger.screenY)) {
                this.events.swipe.trigger({ originalEvent: e, direction: finger.beginFinger.screenX - finger.lastFinger.screenX });
                // up-down swipe
                if (finger.beginFinger.screenX - finger.lastFinger.screenX < 0) {
                    this.events.swipeleft.trigger({ originalEvent: e, lastOffsetX: Math.abs(finger.beginFinger.screenX - finger.lastFinger.screenX) });
                }
                else {
                    this.events.swiperight.trigger({ originalEvent: e, lastOffsetX: Math.abs(finger.beginFinger.screenX - finger.lastFinger.screenX) });
                }
            }
            else if (Math.abs(finger.beginFinger.screenX - finger.lastFinger.screenX) < Math.abs(finger.beginFinger.screenY - finger.lastFinger.screenY) / this.swipePrecision) {
                this.events.swipe.trigger(finger.beginFinger.screenX - finger.lastFinger.screenX);
                if (finger.beginFinger.screenY - finger.lastFinger.screenY < 0) {
                    this.events.swipeup.trigger({ originalEvent: e, lastOffsetY: Math.abs(finger.beginFinger.screenY - finger.lastFinger.screenY) });
                }
                else {
                    this.events.swipedown.trigger({ originalEvent: e, lastOffsetY: Math.abs(finger.beginFinger.screenY - finger.lastFinger.screenY) });
                }
            }
        }
    }
    //detects left and right throw
    detectThrow(f, e) {
        var deltaTime = f.curFinger.timeStamp - f.lastFinger.timeStamp;
        var deltaX = f.curFinger.screenX - f.lastFinger.screenX;
        var deltaY = f.curFinger.screenY - f.lastFinger.screenY;
        var delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        //var speedX = (1000 / deltaTime) * deltaX;
        var speed = (1000 / deltaTime) * delta;
        if (speed > 200) {
            const event = { finger: f.curFinger, event: e };
            this.events.throw.trigger(event);
            if (deltaX > deltaY) {
                if (deltaX < 0) {
                    this.events.throwright.trigger('throwright');
                }
                else {
                    this.events.throwleft.trigger('throwleft');
                }
            }
            else {
                if (deltaY < 0) {
                    this.events.throwup.trigger(event);
                }
                else {
                    this.events.throwdown.trigger(event);
                }
            }
        }
    }
    destroy() {
        this.el.removeEventListener('touchstart', this.touchStartHandler);
        this.el.removeEventListener('touchmove', this.touchMoveHandler);
        this.el.removeEventListener('touchend', this.touchEndHandler);
        this.el.removeEventListener('mousedown', this.mouseStartHandler);
        //this.off();
        this.finger = null;
        this.lastFingers = [];
        this.clearLongPress();
        delete this.el;
    }
    ;
}
/**
 *two helper Methods for the rotation
*/
function posToAngle(startFinger, endFinger) {
    const dx = endFinger.clientX - startFinger.clientX;
    const dy = endFinger.clientY - startFinger.clientY;
    const angle = Math.acos(dx / Math.sqrt(dx * dx + dy * dy)) / Math.PI * 180;
    return 0 > dy ? angle : -angle;
}
;
function angleChange(a, b) {
    return (a - b);
}
function distanceOfFingers(one, two) {
    var dx = Math.abs(one.screenX - two.screenX);
    var dy = Math.abs(one.screenY - two.screenY);
    return Math.sqrt((dx * dx) + (dy * dy));
}
