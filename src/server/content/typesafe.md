In this article we explore some advanced TypeScript while building a type safe store with a similar API to [Pinia](https://github.com/posva/pinia) or [Vuex 5](https://github.com/vuejs/rfcs/discussions/270) (which is still in the RFC stage). I learned a lot of what was needed to write this article by reading the [Pinia](https://github.com/posva/pinia/) source code.

You can find the source code [here](https://gist.github.com/lmiller1990/9ef32df8fb401e5f0482692ae974e6e0).

The goal will be a `defineStore` function that looks like this:

```ts
export const useMainStore = defineStore({
  state: {
    counter: 0,
  },
  actions: {
    inc(val: number = 1) {
      this.state.counter += val
    },
  },
});
```

The store can then be used by simply calling `useMainStore()`:

```html
<template>
  <p>Count is: {{ state.counter }}</p>
  <button @click="click">Inc</button>
</template>

<script lang="ts">
import { computed } from 'vue'
import { useMainStore, useOtherStore } from './index2'

export default {
  setup() {
    const store = useMainStore()
    return {
      click: () => store.inc(),
      state: store.state,
    }
  },
}
</script>
```

The primary goal is to explore some advanced TypeScript types.

## `defineStore`

We will start of with `defineStore`. It needs to be generic to be type safe - in this case, both the state and actions needs to be declared as generic parameters:

```ts
function defineStore<
  S extends StateTree,
  A extends Record<string, Method>
>(options) {
  // ...
}
```

We will also need a few utility types - `StateTree` and `Method`. `Method` is simple:

```ts
type Method = (...args: any[]) => any;
```

`StateTree` isn't much more complex - it's basically typing a JavaScript object, where the key can be a `string`, `number` or `symbol`:

```ts
export type StateTree = Record<string | number | symbol, any>;
```

## Typing the Store Options

`defineStore` takes an object of options - `state` and `actions`. `state` is very easy to type - it's just `S`:

```ts
function defineStore<
  S extends StateTree,
  A extends Record<string, Method>
>(options: {
  state: S,
}) {
```

`actions` is a bit more tricky. We know it's going to be a type of `A`, the second generic type passed to `defineStore`, but it also needs to have knowledge of `this`. Specifically, it needs to know that `this.state` exists, and `state` is a typed as `S`.

The way this is typed is using an intersection type (`&`) and [`ThisType`](https://www.typescriptlang.org/docs/handbook/utility-types.html#thistypetype). We need something similar to the example [in the docs](https://www.typescriptlang.org/docs/handbook/utility-types.html#thistypetype):

```ts
actions: A & ThisType<A & _STORE_WITH_STATE_>
```

We just need to declare `_STORE_WITH_STATE_`. We could do it inline:

```ts
actions: A & ThisType<A & { state: S }>
```

Putting it all together:

```ts
export type StateTree = Record<string | number | symbol, any>;
function defineStore<
  S extends StateTree,
  A extends Record<string, Method>
>(options: {
  state: S,
  actions: A & ThisType<A & { state: S }>
}) {
  // ...
}
```

I'd like to add more features to the store later, so I am actually going to extract a type, `StoreWithState`:

```ts
type StoreWithState<S extends StateTree> = {
  state: S
}

export type StateTree = Record<string | number | symbol, any>;
function defineStore<
  S extends StateTree,
  A extends Record<string, Method>
>(options: {
  state: S,
  actions: A & ThisType<A & StoreWithState<S>>
}) {
  // ...
}
```

Now `this` in actions is typed! Let's move on to implementing the actual store.

## Implementing `useStore` and Reactive State

The first thing we need is a store with a state property. Create that (`defineStore` is shown without the types for simplicity):

```ts
function defineStore(options) {
  const initialStore = {
    state: options.state || {}
  }
}
```

`defineStore` should return a function. I will call it `useStore`, and it needs to return what we are going to type as `Store`:

```ts
function defineStore(options) {
  const initialStore = {
    state: options.state || {}
  }

  return function useStore(): Store<S, A> {
    // ...
  }
}
```

Typing `Store` is a bit tricky. It needs to expose a `state` property, as well as all the methods (which we are calling "actions" here). We want the arguments to those methods to be typed, too. We already have a `StoreWithState` type - we also need a `StoreWithActions` type. 

The `Store` type looks like this:

```ts
type Store<
  S extends StateTree,
  A extends Record<string, Method>
> = StoreWithState<S> & S & StoreWithActions<A>;
```

## Typing Actions and Inferring Parameters

Before we write the type, we should figure out what we are actually typing:

```ts
const actions = {
  inc(val: number = 1) {
    this.state.counter += val
  },
}
```

We don't care too much about the body of the function - just the parameters. If we describe `actions` in plain English, it would be "a key value object. If the value exists, and it's a function, infer the type of the arguments and return type". Or something like that.

Let's start with "a key value object":

```ts
type StoreWithActions<A> = {
  [k in keyof A]: any
}
```

This infers the methods exists. `useMainStore().inc` is typed, but not as a function. Let's fix that:

```ts
type StoreWithActions<A> = {
  [k in keyof A]: (...args: any[]) => any
}
```

Now we know it's a function. But the parameters still aren't typed! We need to `infer` them - to infer a function has parameters, though, we first need to validate that it is actually a function:

```ts
type StoreWithActions<A> = {
  [k in keyof A]: A[k] extends (...args: infer P) => infer R
    ? /* type */
    : /* the key does not exist, or it's not a method */
}
```

We use `extends` to see if `A[k]` (in this case, actions['inc']` exists, and is a method - that is to say, it has arguments and returns a type. We don't know the type, so we *infer* it. `infer` is kind of like a generic type, except we are creating it based on a type that already exists. If we did not use `infer`, we'd get an error "cannot find name P", since TypeScript would be expecting us to provide that parameters.

Finish of the type:

```ts
type StoreWithActions<A> = {
  [k in keyof A]: A[k] extends (...args: infer P) => infer R
    ? (...args: P) => R
    : never
}
```

This is definitely an advanced type. It combines conditional types (using `extends`) and `infer`. This is the most complex type in the store.

## Creating the Store Object

Now that we finished the types, we can actually implement the store. Inside of `useStore` create a `store` variable:

```ts
function defineStore(options) {
  const initialStore = {
    state: options.state || {}
  }

  return function useStore(): Store<S, A> {
    const store: Store<S, A> = reactive({
      ...initialStore,
    }) as Store<S, A>
  }
}
```

This has type errors - we need to provide an object typed as `StoreWithActions`. We need the actions to be called with `store` as the `this` context, so we can do `this.state`. This means we will *wrap* the actions and call them with `apply`, passing `store` as the first argument. For this reason the variable is called `wrappedActions` and typed as `StoreWithActions<A>`:

```ts
function defineStore(options) {
  const initialStore = {
    state: options.state || {}
  }

  return function useStore(): Store<S, A> {
    const wrappedActions: StoreWithActions<A> = {} as StoreWithActions<A>

    const store: Store<S, A> = reactive({
      ...initialStore,
      ...wrappedActions
    }) as Store<S, A>

    return store
  }
}
```

A bit messy, but it works. Finally, we just need to wrap the actions. First, type it:

```ts
const wrappedActions: StoreWithActions<A> = {} as StoreWithActions<A>
const actions = (options.actions || {}) as A
for (const actionName in actions) {
  wrappedActions[actionName] = function() {

  } as StoreWithActions<A>[typeof actionName]
}
```

Again, a bit messy. We need the `as StoreWithActions<A>[typeof actionName]` to get the correct typing. This paralells the `[k in keyof A]` typing we did earlier in `StoreWithActions`. 

Finally, call the original `actions[actionName]` with `apply`, passing in `store` as the `this` context:

```ts

function defineStore(options) {
  // ...
  return function useStore(): Store<S, A> {
    const wrappedActions: StoreWithActions<A> = {} as StoreWithActions<A>
    const actions = (options.actions || {}) as A

    for (const actionName in actions) {
      wrappedActions[actionName] = function(...args: any[]) {
        return actions[actionName].apply(store, args)
      } as StoreWithActions<A>[typeof actionName]
    }

    const store: Store<S, A> = reactive({
      ...initialStore,
      ...wrappedActions
    }) as Store<S, A>

    return store
  }
}
```

That's it! A type safe store. 

## Conclusion

We created a type safe store. The types are a bit complex. We covered:

- `infer` keyword
- `ThisType`
- Generics
- Conditional types with `extends`
- Intersections (`&`)

An improvement would be to add `getters` using Vue's `computed` function. 

You can find the source code [here](https://gist.github.com/lmiller1990/9ef32df8fb401e5f0482692ae974e6e0).