Vue 3 has a super neat reactivity system based on the ES6 [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) object. In this article we build a simplified version of the reactivity system. We will stay as close the [Vue 3 source code](https://github.com/vuejs/vue-next/tree/master/packages/reactivity) as possible. The idea is to prepare you better to read and understand it.

The source code repository is for this article is exclusive to my [GitHub Sponsors](https://github.com/sponsors/lmiller1990).

By the end of this article, you'll be in a position to read through Vue's `reactivity` package and have a general understand of what's going on under the hood.

As we work through our implementation, we will compare what we have written to the actual source code and see what's different, and why.

The initial goal will be the following:

```ts
test('ref', () => {
  const fooref = ref('foo')
  let foo
  effect(() => {
    foo = fooref.value
  })
  foo //=> 'foo'
  expect(foo).toBe('foo')
  fooref.value = 'bar'
  expect(foo).toBe('bar') // foo is now 'bar' via reactivity!
})
```

The implementation will scale to something a (little) more interesting, too:

```ts
test('multiple refs', () => {
  const fooref = ref('')
  const barref = ref('')
  let foo
  let foobar

  effect(() => {
    foo = fooref.value
    foobar = fooref.value + barref.value
  })

  expect(foo).toBe('')
  expect(foobar).toBe('')

  fooref.value = 'foo'
  expect(foo).toBe('foo')
  expect(foobar).toBe('foo')

  barref.value = 'bar'
  expect(foo).toBe('foo')
  expect(foobar).toBe('foobar')
})
```

If you have used Vue with the Composition API, you will be familiar with `ref`. You may not have seen `effect` - that's because it's not actually exposed to the end user. What you will be familiar with is `watch`, `watchEffect` and `computed` - the idea is more or less the same. All of these, as well as Vue's reactivity APIs, are powered by `effect` under the hood. Since we are doing everything from scratch, we will need to implement `effect` before implementing the rest.

Wrapping something in `effect` sets up reactivity. Take this snippet:

```ts
const fooref = ref('foo')
let foo
effect(() => {
  foo = fooref.value
})
fooref.value = 'bar'
console.log(foo) // now it's 'bar' via reactivity!
```

By wrapping `foo = fooref.value` in `effect`, we are saying that the value of `foo` depends on the value of `fooref.value`. Now, any time that `fooref.value` changes, the `effect` will be executed and `foo` will also be updated.

## Defining ref

Let's start by defining `ref` and a simple test case:

```ts
class RefImpl {
  private _value: string

  constructor(val: string) {
    this._value = val
  }

  get value() {
    return this._value
  }
}

const ref = (val: string) => {
  return new RefImpl(val)
}

const effect = (fn: Function) => {
  // TODO
}

test('ref', () => {
  const fooref = ref('foo')
  let foo
  effect(() => {
    foo = fooref.value
  })
  expect(foo).toBe('foo')
})
```

Compare this to the [actual source code](https://github.com/vuejs/vue-next/blob/a238da1082762b88dff38fc732d8f7ab1a52d9c3/packages/reactivity/src/ref.ts#L54). It's pretty similar so far.

This currently fails - `effect` doesn't do anything. The quickest way to get this to pass would simply be to implement `effect` like this:

```ts
const effect = (fn: Function) => {
  fn()
}
```

But this is not exactly reactive. It is enough to get the test to pass, though, which will help us to see the problem with this implementation.

## Triggering Reactivity

Update the test to see why our naive `effect` implementation is not going to work:

```ts
test('ref', () => {
  const fooref = ref('foo')
  let foo
  effect(() => {
    foo = fooref.value
  })
  expect(foo).toBe('foo')
  fooref.value = 'bar'
  expect(foo).toBe('bar')
})
```

`foo` is not going to be reactively updated. What we need is some way to tell our system to *re-run* the effect (that is, re-run `() => { foo = fooref.value }`) every time `fooref.value` changes.

First, update `RefImpl` to have a `set value` method:

```ts
class RefImpl {
  private _value: string

  constructor(val: string) {
    this._value = val
  }

  get value() {
    return this._value
  }

  set value(val: string) {
    this._value = val
  }
}
```

## Trigger and Track

The entire reactivity system is instrumented by two key methods: [`trigger`](https://github.com/vuejs/vue-next/blob/a238da1082762b88dff38fc732d8f7ab1a52d9c3/packages/reactivity/src/effect.ts#L167) and [`track`](https://github.com/vuejs/vue-next/blob/a238da1082762b88dff38fc732d8f7ab1a52d9c3/packages/reactivity/src/effect.ts#L141). Whenever a value is accessed (eg, via `get`), we need to call `track` to see, or *track* who is depending on it. In this case, when we call `fooref.value` inside of `effect`, `get value()` is called. We need to track which `effect`s need to be executed.

Next, when we do `fooref.value = 'bar'`, `set value()` is called. If `fooref.value` is changing, we will need to call `trigger` to execute the relevant `effect` - this will give us "reactivity". See the below diagram:

![trigger-track-diagram](https://raw.githubusercontent.com/lmiller1990/electic/master/screenshots/ref-blog-ss-1.png)

The next step is to implement `track` and `trigger`. First, however, we will define `effect` a little better.

## Track and the Target Map

We need some way to track the current effect (since there could be many, although in our example we only have declared one) and which values have effects depending on them.

This might sound a bit confusing - hopefully it'll make more sense soon. For now, we need two variables. `targetMap`, which will map values to dependencies and effects, and `activeEffect`, which will track the effect that is currently getting tracked.

```ts
type Dep = Set<any>
type KeyToDepMap = Map<any, Dep>

const targetMap = new Map<any, KeyToDepMap>()
let activeEffect: any
```

`any` is not really ideal here. Once things are working and we understand the model for reactivity, the types will be improved.

`targetMap` is a `Map`. The nice thing about the `Map` object is, unlike a regular object, you may use objects as keys. We will be using the `RefImpl` object as a key, which will map to a `KeyToDepMap`.

`KeyToDepMap` is *another* `Map`. Why? We are future-proofing ourselves. At the moment `ref` can only be a `string`. Eventually, we'd like to implement objects, too, so you could do something like:

```ts
const foobar = ref({
  foo: 'foo',
  bar: 'bar'
})

let foo
effect(() => {
  foo = foobar.value.foo
})
```

On this example, `foo` depends on the value of `foobar.value.foo`. Another `effect` might set up a dependency on `foo.value.bar` - we want to track these separately. That's what `KeyToDepMap` is used for. This is lifted directly from the [Vue 3 source code](https://github.com/vuejs/vue-next/blob/a238da1082762b88dff38fc732d8f7ab1a52d9c3/packages/reactivity/src/effect.ts#L8).

Here is the start of our implementation for `track`. It's worth noting that while this is very close to the [actual implementation](https://github.com/vuejs/vue-next/blob/a238da1082762b88dff38fc732d8f7ab1a52d9c3/packages/reactivity/src/effect.ts#L141) in Vue 3. Note the snippet below does `deps.add(activeEffect)` which is currently undefined - this will be fixed soon. The code is followed by a diagram explaining how things work.

```ts
const targetMap = new Map<any, KeyToDepMap>()
let activeEffect: any

const track = (target: object) => {
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }

  let deps = depsMap.get('value')
  if (!deps) {
    deps = new Set()
    depsMap.set('value', deps)
  }

  deps.add(activeEffect)
}
```

Make sure to add `track` in `RefImpl`. Every time `fooref.value` is accessed, we call `track` to see if any is depending on it.

```ts
class RefImpl {
  // ...
  get value() {
    track(this)
    return this._value
  }
}
```

![targetMap flow](https://raw.githubusercontent.com/lmiller1990/electic/master/screenshots/ref-blog-ss-2.png)

Assuming that `activeEffect` is `() => { foo = fooref.value }`, we can now work through `track`:

```ts
const track = (target: object) => {
  let depsMap = targetMap.get(target)
  /**
   * targetMap is currently empty.
   * depsMap is undefined.
   */
  if (!depsMap) {
    /**
     * define depsMap as a new Map
     * add it to targetMap. The key
     * is target, which is the fooref RefImpl
     */
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }

  // ...
}
```

Now targetMap looks like this:

```js
{
  [fooref]: Map // empty Map
}
```

Next we handle the dependencies:

```ts
const track = (target: object) => {
  // ...

  let deps = depsMap.get('value')
  /**
   * deps is also undefined.
   * value refers to `fooref.value`.
   * eventually we'd like to support objects
   * with keys other than just value
   */

  if (!deps) {
    /**
     * create a new Set
     * add it to depsMap.
     * deps will be a Set (like an array with no duplicate values)
     * of all the effects depending on `value`
     *
     * when `value` changes, we invoke all the effects!
     */
    deps = new Set()
    depsMap.set('value', deps)
  }
}
```

Now `targetMap` is something like:

```js
{
  [fooref]: Map: {
    value: Set // empty set
  }
}
```

Finally we add the `activeEffect` (which is `() => { foo = fooref.value }`) to the `deps` `Set`:

```ts
const track = (target: object) => {
  // ...
  deps.add(activeEffect)
}
```

After `track` is called, `targetMap` looks like this:

```js
{
  [fooref]: Map: {
    value: Set: () => { foo = fooref.value }
  }
}
```

The last issue we need to address is making sure `activeEffect` is defined. We can just set it before invoking the effect, then unset it afterwards. Update `effect`:

```ts
const effect = (fn: Function) => {
  activeEffect = fn
  fn()
  activeEffect = undefined
}
```

If you do a `console.log(targetMap)` at the bottom of `track` and run the test now, you get the following:

```js
Map(1) {
  RefImpl { _value: 'foo' } => Map(1) { 'value' => Set(1) { [Function (anonymous)] } }
}
```

## Trigger

Now we are tracking dependencies when `get value()` is called, we need the other part of the reactivity system - `trigger` when `set value()` is called.

All we need to do is grab the correct `depsMap` from `targetMap`, iterate over each `dep` and invoke the associated effect! Note the `console.log` which will help us highlight a problem:

```ts
const trigger = (target: object) => {
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    return
  }

  depsMap.forEach(dep => {
    console.log(dep)
    dep.forEach(eff => {
      eff()
    })
  })
}
```

Make sure to call `trigger` in `set value()`:

```ts
class RefImpl {
  // ...
  set value(val: string) {
    this._value = val
    trigger(this)
  }
}
```

We get the following log:

```sh
Map(1) {
  RefImpl { _value: 'bar' } => Map(1) {
    'value' => Set(2) { [Function (anonymous)], undefined }
  }
}
```

Note the set contains two values... one anonymous function and one `undefined`. The function is the effect. This is correct. `undefined` should not be there, though. This is, somewhat confusingly, because when we invoke `eff()`, we do `() => { foo = fooref.value }` which calls `get value()`. This in turns calls `track` and adds `activeEffect` to `deps` (which is `undefined` at this point)`.

The fix is to simply return early in `track` if `activeEffect` is `undefined`. No `undefined` effects allowed:

```ts
const track = (target: object) => {
  /**
   * return early if activeEffect is undefined.
   */
  if (!activeEffect) {
    return
  }

  // ... implementation ...
}
```

With this fix, our simple test case is now passing! We have reactivity. Try the complex example from the start of the post - it works, too!

## Conclusion

We implemented a very basic reactivity system in a similar fashion to Vue 3. With your new found understanding, try reading through the [actual source code](https://github.com/vuejs/vue-next/tree/master/packages/reactivity). The ideas are similar - the ES6 `Proxy` object is used to handle `get` and `set` for more complex objects, like `reactive`, `Map` and `Set`. I'd like to make a follow up article implementing `reactive` using `Proxy` - if this is interesting to you, let me know.

The source code repository is for this article is exclusive to my [GitHub Sponsors](https://github.com/sponsors/lmiller1990).
