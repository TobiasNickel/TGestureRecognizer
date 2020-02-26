# MMGestureRecognizer
Gesture Recognizer for mobile and desktop HTML apps. The T-Gesture-Recognizer makes it easy for developers to handle touch gestures, starting from a single tap over doubletap to swipe, pinch and throw gestures. 

The usage is very simple. You create a new GestureRecognizer and provide him the DOM-node, where the user will touch on. Then you can add eventlistener to various Events that get triggered as soon as the user is performing a gesture on the element. 

## Motivation
While developing the mobile- and WeChat-version of babel.cc we wanted to provide gesture controls as known in native apps. In the first place we tried to use some libraries that are already available, such as a very popular Hammer.js. But each of them had a downside, that made it impossible to use in our project. One Gesture framework was not able to recognize the gestures we need, others stop the propagation and prevent the default behavior of the browser and the next kind of recognizer only let the user draw fancy images.

## API
To show how it works, I will provide a bunch of code-examples, that you can extend for your needs.

**function GestureRecognizer(elment, options)**
The constructor takes the element, where gestures need to get recognized as first parameter and an object with options as second. The options are:

    1. swipeSpeed, the speed that the users finger need to reach to trigger the swipe (default: 400)
    2. swipePrecision = defines how much the user need to swipe into one direction to recognise that as the corresponging direction. 1: 45deg up/down  2: 30deg up/down... (default: 6)
    3. minPinchDistance = the minimum distance the user need to move his finger, to have a more stable UI (default: 1)
    3. minSwipeDistance = minimum distance that the user need to swipe, so that a swipe is recognized(default: 20)
    4. longPressTime = the duration the user need to press on one position to trigger longpress (default: 800)
    5. longTolerance = this allows the user to move the finger a little, on the road you can't hold your finger przise on a single pixle (default: 5)
    6. tapTolerance = while a shot tap, depending on how you set the finger on the screen, you will move, this parameter is a small tollerance (default: 5)
    7. doubleTapSpeed = Time between two short taps, like doubleclick. (default: 400)
    8. doubleTapDistance = nobody can tap two times on the same pixel, so we allow a tollerance (default: 15)
    9. minFirstPanDistance = the minimum distance before paning starts to trigger on touchmove, is good to be the same as longpress, if you use longpress in your app.(default: 5)
We tested with various devices, in different sizes, operating systems, scree sizes and users. The given defaultvalues will work well for most applications.


**recognizer.on( event, callback)** method to register an eventlistener to an event
**recognizer.off(event, callback)** mothod to remove an eventlistener
**recognizer.destroy()** when you remove the element you should clean up this module as well, it will remove all eventlistener and clean itself up and removes all eventlistener. so there are no memory leaks. after destroy the recognizer can not be used anymore. For further recognizer create a new one.


## events
To register an Event use the on method, the names of the events are in the following in bold font.

 - **tap** is used for a single tap. 
 - **doubletap** will trigger after two finger taps. 
 - For **longpress** the user needs to hold the finger still for some time. 
 - **pinchstart** happens as soon as the user touches with a second finger the screen. 
 - **pinch** when the user moves one of his fingers 
 - and **pinchend** will be executed when the user is lifting one of his fingers.
 - The movement of a finger can be recognized using **pan** or **touchmove**. They are basiclly the same, but pan only happens when the finger has not triggered **longpress**. 
 - For **pan** as well as for **touchmove** we got the corresponding events for start and end (**panstart**, **panend**, **touchstart**, **touchend**).
  - For a **swipe** is a single finger very short on the screen and moves fast in a direction. 
  - Depending on the direction that the finger moves, **swipeup**, **swipedown**, **swipeleft** or **swiperight** are triggered. 
  - In addition to swipe a **throw** is triggered, when the finger is a little longer on the screen and moves fast in a direction, before the finger is taken from the screen. 
  - For throw are also the version **throwup**, **throwdown**, **throwleft** and **throwright**. Throw makes it possible to move some UI element using **pan** or **touchmove** over the screen and throw it back to its original position, without moving the finger all the way back. You know that from Android, when you pull the menu from the top of the screen.
  - The latest update has brought the **rotate** event. That is triggered when pinch, and telling you the angle the two fingers rotate around each other.







