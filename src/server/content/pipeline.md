Welcome to the future. Check out this snippet from a popular web programming language that's gaining traction - it's a functional programming language where all values are immutable:

```js
const sanitized = input
  |> Str.split(?, ',')
  |> Arr.map(?, toNumber)
```

As you can see it has a number operators like `|>` (pipeline) and `?` (partial application).

What year is it, and language are you coding in, you ask? The year is 2021 - and the language is *JavaScript*!

You can watch a video version of this post on my [Youtube channel](https://youtube.com/c/LachlanMiller).

## What is `|>`? Introducing the Pipeline Operator

Many functional language have a *pipeline* operator. Examples include Elm:

```elm
"Hello everyone" 
  |> left 5 
  |> toLower 
  |> append "I say " -- "I say hello"
```

Elixir:

```elm
"Elixir rocks"
  |> String.upcase() 
  |> String.split()
#=> ["ELIXIR", "ROCKS"]
```

F#

```fsharp
let finalSeq = 
    seq { 0..10 }
    |> Seq.filter (fun c -> (c % 2) = 0)
    |> Seq.map ((*) 2)
    |> Seq.map (sprintf "The value is %i.")
```

You see the syntax - lots of `|>` which let you modify data in some way. Why is this a useful feature, and why would we want it in JavaScript? Pipelines make it easy to *chain functions together*. 

## Pipelines are Available JavaScript Today!

There is several proposals for pipelines to become part of JavaScript. Here is the classic example listed in the [tc39 proposal](https://github.com/tc39/proposal-pipeline-operator), the repository that hosts all the proposal for new JavaScript features:

```js
function doubleSay (str) {
  return str + ", " + str
}

function capitalize (str) {
  return str[0].toUpperCase() + str.substring(1)
}

function exclaim (str) {
  return str + '!'
}

let result = "hello"
  |> doubleSay
  |> capitalize
  |> exclaim

result //=> "Hello, hello!"
```

The value to the *left* of the pipeline is passed at the first argument to the next function in the pipeline. Without using the pipeline operator, you'd have to write something like this:

```js
let result = exclaim(capitalize(doubleSay("hello")));
result //=> "Hello, hello!"
```

Not that bad, but one can certainly make a case for the pipeline version as more readable.

With so many other languages having a pipeline operator, there is a lot of prior literature to go on when considering how JavaScript's pipeline might look. So much so that there are three proposals:

- ["simple" pipeline](https://github.com/tc39/proposal-pipeline-operator)
- ["smart" pipeline](https://github.com/js-choi/proposal-smart-pipelines)
- ["fsharp" pipeline](https://github.com/valtech-nyc/proposal-fsharp-pipelines)

Let's take a look at each, and consider the pros and cons.

## The Simple Pipeline

We already saw and example of the simple pipeline above. But what about functions with multiple arguments? The examples above all have a single argument. Different languages handle this differently. 

In Elixir, for example, the first argument to the next function in the pipeline will always be the previous value. For example there is a function, `Enum.map`. It takes two arguments - the array to map over, and the callback to apply to each item. Basic usage is:

```js
## without a pipeline
result = Enum.map([1, 2, 3], fn x -> x + 2 end) 
result #=> [3, 4, 5]

## with a pipeline
# the array is automatically used as the
# first argument to `Enum.map`
[1, 2, 3] |> Enum.map(fn x -> x + 2 end)
```

JavaScript is not really designed in such a manner. There are some alternatives. You can pass a callback to `|>`:

```js
;[1, 2, 3] 
  |> (x => x.map(y => y + 2))
  |> console.log //=> [3, 4, 5]
```

Or, slightly closer to the Elixir example:

```js
;[1, 2, 3] 
  |> (x => Array.prototype.map.call(x, y => y + 2))
  |> console.log //=> [3, 4, 5]
```

If you combine the pipeline proposal with another proposal, [partial application](https://github.com/tc39/proposal-partial-application):

```js
;[1, 2, 3] 
  |> Array.prototype.map.call(?, y => y + 2)
  |> console.log //=> [3, 4, 5]
```

Or if we want to get really ambitious:

```js
const Arr = {
  map: (arr, cb) => Array.prototype.map.call(arr, cb)
}

;[1, 2, 3] 
  |> Arr.map(?, x => x + 2)
  |> console.log //=> [3, 4, 5]
```

This is starting to look more like the original snippet from the introduction:

```js
const sanitized = input
  |> Str.split(?, ',')
  |> Arr.map(?, toNumber)
```

Fun stuff! Let's take look at the other proposals and see what they bring to the table.

## The Smart Pipeline

The [smart pipeline](https://github.com/js-choi/proposal-smart-pipelines) combines the idea of partial application along with a pipeline operator. It uses the `#` symbol instead of `?` (note the symbol could change as the proposal evolves).

```js
const divide = (x, y) => x / y 

10
  |> divide(#, 2)
  |> console.log //=> 5

10
  |> divide(2, #)
  |> console.log //=> 0.2
```

This is pretty neat. You get the power of partial application for free.

The smart pipeline also has a few more features that the simple pipeline doesn't support. You can use `await` with the smart pipeline:

```js
const asyncDouble = val => Promise.resolve(val * 2)

5
  |> asyncDouble
  |> await #
  |> console.log //=> 10
```

A more real world example might be:

```js
fetch('/music/foo.mp3')
  .then(res => res.blob())
  .then(playBlob);

// becomes ...

'/music/foo.mp3'
  |> await fetch(#)
  |> await #.blob()
  |> playBlob
```

Or:

```js
{
  const url = 'https://example.com/'
  const response =
    await fetch(url, { method: 'HEAD' })
  const contentType =
    response.headers.get('content-type')
  console.log(contentType);
}

// becomes ...
'https://example.com/'
  |> await fetch(#, { method: 'HEAD' })
  |> #.headers.get('content-type')
  |> console.log
```

You can avoid a lot of meaningless temporary variables by using the pipeline operator.

## The FSharp Pipeline

There is one more proposal: [fsharp pipelines](https://github.com/valtech-nyc/proposal-fsharp-pipelines). This is my favorite. Instead of using a `#` symbol to mimic partial application, it uses a callback based approach. Here are the previous examples using the fsharp pipeline operator:

```js
10
  |> x => divide(x, 2)
  |> console.log //=> 5

10
  |> x => divide(2, x)
  |> console.log //=> 0.2

const addTwo = x => x + 2

const asyncDouble = val => Promise.resolve(val * 2)

5
  |> asyncDouble
  |> await
  |> console.log //=> 10
```

You also get flexibility similar to that offered by partial application by using a callback. Neat. This one feels the cleanest to me and is my favorite of the two "advanced" pipeline proposals. You can combine it with partial application to get even more concise code.

## How Functional Can We Get?

Let's see what we can build if we go a little crazy. Instead of values and objects having methods, we will assume the only way to operate on them is using functions, which are stored in modules (similar to functional languages like Elixir). Whenever you call a module method and pass in a value or object, you get a new value or object back - no mutation.

First some simple modules:

```js
const Arr = {
  forEach: (...args) => Array.prototype.forEach.call(...args),
  reduce: (...args) => Array.prototype.reduce.call(...args),
  map: (...args) => Array.prototype.map.call(...args),
  filter: (...args) => Array.prototype.filter.call(...args),
  length: (val) => val.length,
  join: (...args) => Array.prototype.join.call(...args),
}

const Num = {
  parseInt: (...args) => parseInt(...args)
}

const Str = {
  trim: (...args) => String.prototype.trim.call(...args),
  length: val => val.length,
  split: (...args) => String.prototype.split.call(...args),
}
```

We will implement the [String Calculator Kata](https://github.com/wix/tdd-katas#string-calculator). I have simplified it a bit to keep the post short. 

The rules are:

- Two or more numbers, comma delimited, returns the sum '1,  2,3, 4   ' => 10
- Consider the numbers may have whitespace
- Negative numbers throw an exception with the message '-1,2,-3' => 'negatives not allowed: -1,-3'

Here is the implementation. I am using the fsharp pipeline operator along with the partial application proposal. An exercise would be to rewrite it only using the smart pipeline proposal, or as-is but without using partial application.

```js
const input = '1,2  ,10  '

const validate = val => {
  if (val < 0) {
    throw Error(`Negatives not allowed: `)
  }
}

const toNumber = val => val 
  |> Str.trim 
  |> Num.parseInt(?, 10)

const sanitized = input
  |> Str.split(?, ',')
  |> Arr.map(?, toNumber)

const negatives = Arr.filter(sanitized, x => x < 0)

if (Arr.length(negatives) > 0) {
  const invalid = Arr.join(negatives, ',')
  throw Error(`No negatives allowed: ${invalid}`)
}

sanitized
  |> Arr.reduce(?, (acc, curr) => acc + curr, 0)
  |> x => console.log(`Sum: ${x}`) //=> 13. 1 + 2 + 10
```

Could this be how we write JavaScript in the future? It might seem unbelievable, but who would have expected to have `=>`, `...` or `import` 10 years ago?

## Conclusion

There you have it - the simple pipeline proposal and two more advanced proposals, and some fun things you can do it. There are a ton more examples - [see here](https://github.com/js-choi/proposal-smart-pipelines/blob/master/core-real-examples.md#whatwg-fetch-standard). See what you can come up with!