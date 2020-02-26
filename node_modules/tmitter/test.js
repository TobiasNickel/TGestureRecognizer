const { tmitter } = require('./tmitter.js')
const assert = require('assert')
var v1Event = tmitter();


var v1=0;
function onV1(){
  v1++;
}
v1Event.on(onV1);

v1Event.trigger();
assert.equal(v1,1,'v1 event trigger once');

v1Event.off(onV1);
v1Event.trigger();
assert.equal(v1,1,'v1 event trigger twice, but events was removed');

