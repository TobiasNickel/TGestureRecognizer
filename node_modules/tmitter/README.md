# tMitter
minimalistic emitter-system in Javascript, learn maximal 4 method, that you might already know from backbone.events or Emitter.js


```js
var emitter = tmitter();
emitter.on(function(argument){
  console.log('b has updated');
});
emitter.trigger( argument);

```


new: now in typescript.
```ts
interace IEvent{
  some: string;
}

const emitter = tmitter<IEvent>();
emitter.on(arg  => {
  console.log(arg.some); // arg.some is known as a string
});

emitter.trigger({ some: 'Tobias' }); // TS require an object with a string attribute some.

```
