This is the first article in a series on source maps. We will be building an app to show the mapping between some TypeScript code and the compiled JavaScript using source maps. In order to understand exactly how everything works, instead of using libraries like [`source-map`](https://www.npmjs.com/package/source-map) or [`vlq`](https://www.npmjs.com/package/vlq), we will write our own decoder and parser from scratch!

You can watch a video version of this post on my [Youtube channel](https://youtube.com/c/LachlanMiller).

Here are some useful resources I used for this article:

- [Source Map Visualizer](https://sokra.github.io/source-map-visualization/) by Tobias Koppers of Webpack fame
- [Source Map Visualizer](https://evanw.github.io/source-map-visualization/) by Evan Wallace of Figma fame
- [VLQ Source Code](https://github.com/Rich-Harris/vlq) by Rich Harris of Rollup fame
- [The actual "standard" documentation](https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.djovrt4kdvga) which is actually just a Google doc - turns out there is no official "spec" as such
- [Wikipedia Base64 article](https://en.wikipedia.org/wiki/Base64#Base64_table)
- [Wikipedia VLQ article](https://en.wikipedia.org/wiki/Variable-length_quantity)

## What is a Source Map?

Let's say we have this TypeScript code:

```ts
const greet = (name: string) => {
  return `Hello ${name}`
}
```

If you compile it and ask for a source map with `yarn tsc greet.ts --sourceMap`, you get both the compiler JavaScript (`greet.js`):

```js
var greet = function (name) {
    return "Hello " + name;
};
//# sourceMappingURL=greet.js.map
```

...and the source map (`greet.js.map`):

```js
{
  "version": 3,
  "file": "greet.js",
  "sourceRoot": "",
  "sources": [
    "greet.ts"
  ],
  "names": [],
  "mappings": "AAAA,IAAM,KAAK,GAAG,UAAC,IAAY;IACzB,OAAO,WAAS,IAAM,CAAA;AACxB,CAAC,CAAA"
}
```

The main thing we are interested in is `mappings`: 

```
"AAAA,IAAM,KAAK,GAAG,UAAC,IAAY;IACzB,OAAO,WAAS,IAAM,CAAA;AACxB,CAAC,CAAA"
``` 

This incredibly compact jumble of letters tells us that `var` in `greet.js` corresponds to `const` in `greet.ts`, as well as how the rest of it maps up... if we can decode it. 

## Variable Length Quantity

These letters are variable length quantity - a very concise way of encoding large numbers. To hint at where this is all leading, if you decode `AAAA`, you get an array of numbers: `[0, 0, 0, 0]`. `IAAM` gives us `[4, 0, 0, 6]`. The next article will go in depth on what each of these numbers means, but basically they map a row and column in the compiled JavaScript to the original TypeScript:

![source-map-diagram](https://raw.githubusercontent.com/lmiller1990/source-map-visualizer/main/source-maps-diagram.png)

This brings us to the goal of this post: decoding the VLQs to arrays of numbers.

## Segments, Fields and Base 64

The `mappings` property has many segments, divided up by `,`. Each one has several fields. `AAAA` maps to `[0, 0, 0, 0]` - which has four fields. Each line is separated by a `;`. Our mappings field has two `;` - three lines total, which matches up to the compiled JavaScript. The source map always maps from the compiled code to the original code - not the other way around. This means the number of lines represented in the source map will always be the same as the number of lines in the compiled code.

What we are dealing with are base 64 encoded VLQs. According to the standard:

> The VLQ is a Base64 value, where the most significant bit (the 6th bit) is used as the continuation bit, and the “digits” are encoded into the string least significant first, and where the least significant bit of the first digit is used as the sign bit.

Decoding `A` is quite easy, since it is listed in the [Base 64](https://en.wikipedia.org/wiki/Base64#Base64_table) table - it's 0. We can be a bit more thorough in our decoding using the above definition for a VLQ.

A is 0, or in binary, `000000`. As stated above, the most significant bit (the 6th bit) is used as the continuation bit. In this case the most significant bit (the value on the far left) is 0. This means there is no continuation needed - the number fits into five bits. For larger numbers, this is not the case. We will see an example soon.

It also says the least significant bit of the first digit is used as the sign bit. The least significant bit (the value on the far right) is also 0.

## Encoding Negative Numbers

Let's see an example of a negative number. `J` is VLQ for -4. Looking at the [Base 64](https://en.wikipedia.org/wiki/Base64#Base64_table) table again, we can see `J` is 9, or `001001` in binary. The most significant bit is 0 - so we know the entire number fits within 5 bits. The least significant bit is 1 - that means it's a negative number. We are left with `100`, which is 4 in decimal. The final decoded value is -4.

## The Continuation Bit

The final example we need to cover is an encoded VLQ that uses a continuation bit. `yB` decodes to 25. Let's walk through it. Looking at the [Base 64](https://en.wikipedia.org/wiki/Base64#Base64_table) table, we can see `y` is 50 in decimal, or `110010` in binary. The most significant bit is a 1 - this means the number requires more than 5 bits to encode. Truncating the leading 1, we are left with `10010`. `10010` is 19 in decimal.

```
+-----------------------+
|          19           |
+---+---+---+---+---+---+
| X | 1 | 0 | 0 | 1 | 0 |
+---+---+---+---+---+---+
```

Next is `B`, which is 1 in decimal or `000001` in binary. The most significant bit is 0, so we do not need to continue to the next segment.

With this knowledge, `yB` represented in VLQ looks like this:

```
+-----------------------+-----------------------+
| C |       19          |          1            |
+---+---+---+---+---+---+---+---+---+---+---+---+
| 1 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
+---+---+---+---+---+---+---+---+---+---+---+---+
```

Finally, we need to sum the two numbers. Ignoring the initial continuation bit, we have:

```
+-------------------+-----------------------+
|       19          |             1         | 
+---+---+---+---+---+-------+---+---+---+---+
| 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
+---+---+---+---+---+---+---+---+---+---+---+
```

or `10010` and `000001`. It's not as simple as 18 + 1 = 19. Referring back to the standard:

> The VLQ is a Base64 value, where the most significant bit (the 6th bit) is used as the continuation bit, and **the “digits” are encoded into the string least significant first**, and where the least significant bit of the first digit is used as the sign bit. 

This means the second value, `000001` is actually more significant than `10010` - by five orders of magnitude (in binary), or 31 - `111111` in binary. This means for each continuation bit we encounter, the subsequent value needs to be increased by 31. 

This means the final calculation is 18 (`10010`) + ( 1 (`000001`) + 31 (`111111`) ) = 50.

50? Didn't you say `yB` decodes to 25? Yes! We are not done yet. The last part of the standard states:

> The VLQ is a Base64 value, where the most significant bit (the 6th bit) is used as the continuation bit, and the “digits” are encoded into the string least significant first, and where the **least significant bit of the first digit is used as the sign bit**. 

This means the final number is not `50` - which is `110010` in binary, but `11001`. The final bit represents the sign - `0` for positive and `1` for negative. `11001` is 25, and it's +25 because the final bit is 0.

```
+--------------------------+
|       Value       | Sign |
+---+---+---+---+---+------+
| 1 | 1 | 0 | 0 | 1 |   0  |
+---+---+---+---+---+------+
```

The continuation bit is what makes VLQ and source maps complex to understand and decode at first - but with the information above, we are now in a good position to write a `decode` function!

## Decoding VLQs with JavaScript

Time to write some code. As discussed, VLQ supports representing numbers larger than 31 (`11111`) using continuation bit(s). This means our solution is going to be recursive, to support arbitrarily large numbers.

Since we are operating with binary representations, we will use JavaScript's built in binary operators heavily in our solution.

Let's start with the same example as used above, `A`, which decodes to `0`. Ultimately we want to return an array of numbers, since we are building this decode function for use with source maps, so instead of just decoding `A` to 0, we will decode `AAAA` to `[0, 0, 0, 0]`.

```ts
function decode(str: string) {
}

console.log(
  decode('AAAA')
)
```

The first thing we need to do is separate the first character from the rest. So for `AAAA`, we want `A` and `AAA`.

```ts
function decode(str: string) {
  const [char, ...tail] = str
  const rest = tail.join('')

  // char => 'A', rest => 'AAA'
}
```

The next thing we need to do is get the [Base 64](https://en.wikipedia.org/wiki/Base64#Base64_table) value for `A`. The easiest way to get access to a [Base 64](https://en.wikipedia.org/wiki/Base64#Base64_table) -> integer map is simply to hard-code it:

```ts
const charToInteger: Record<string, number> = {}

'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  .split('')
  .forEach((char, i) => {
    charToInteger[char] = i
  })

function decode(str: string) {
  const [char, ...tail] = str
  const rest = tail.join('')
  const integer = charToInteger[char]
}
```

Now things get a little more interesting. We need to see if there is a continuation bit. We can do this using a bitwise `&`. Performing `x & y` will return a new binary value where bit is `1` if both corresponding bits in `x` and `y` are `1`. For example:

```
+---+---+---+---+---+---+
| x | 1 | 1 | 0 | 1 | 0 |
+---+---+---+---+---+---+
| y | 0 | 1 | 0 | 1 | 0 |
|=======================|
| = | 0 | 1 | 0 | 1 | 0 |
+---+---+---+---+---+---+
```

This would return `01010`. A neat trick is just to do `& 32` to see if we have a continuation bit. Why does this work? 32 is `100000`. It will return 0 for any value where the sixth bit is not 1. In this example, `A` is `000000` & `100000` returns `000000` - 0 in decimal - which of course evaluates to false in JavaScript.

```ts
function decode(str: string) {
  const [char, ...tail] = str
  const rest = tail.join('')
  const integer = charToInteger[char]
  const hasContinuationBit = integer & 32
}
```

If there is not continuation bit, we can just check the least significant bit to see if the value is positive or negative, then return the final value.

```ts
function decode(str: string) {
  const [char, ...tail] = str
  const rest = tail.join('')
  const integer = charToInteger[char]
  const hasContinuationBit = integer & 32

  if (hasContinuationBit) {
    // handle it
  } else {
    const isNegative = integer & 1
    const finalValue = isNegative ? -(integer >>> 1) : integer >>> 1
    return finalValue
  }
}
```

We use the bitwise `&` trick again - this time to see if the final bit is 1 or 0. We then need to discard the final bit, since that only represents the sign, it's not part of the actual value, and return the result. We can do that by using a [bitwise right shift](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Unsigned_right_shift), which moves everything to the right, truncating the remaining bits. For example `101 >>> 1` would become `10` - we've removed the final bit.

Success! `decode` returns `0`. We want to iterate over each character, and return an array of `[0, 0, 0, 0]`. All we need to do is call `decode` again, passing in the `rest`. We will also need to keep track of the decoded values:

```ts
function decode(str: string, decoded = []) {
  const [char, ...tail] = str
  const rest = tail.join('')
  const integer = charToInteger[char]
  const hasContinuationBit = integer & 32

  if (hasContinuationBit) {
    // handle it
  } else {
    const isNegative = integer & 1
    const finalValue = isNegative ? -(integer >>> 1) : integer >>> 1
    if (!rest) {
      return decoded.concat(finalValue)
    }

    return decode(rest, decoded.concat(finalValue))
  }
}
```

This gives us the desired result.

## Handling Continuation Bits

Now we need to handle decoding values greater than 31, that use a continuation bit. Let's decode `yB`, which should return `[25]`. First the code, than an explanation:

```ts
function decode(str: string, acc = 0, depth = 0, decoded = []) {
  const [char, ...tail] = str
  const rest = tail.join('')
  const integer = charToInteger[char]

  const hasContinuationBit = integer & 32
  const withoutContBit = integer & 31
  const shifted = (withoutContBit << 5 * depth)
  const value = acc | shifted

  if (hasContinuationBit) {
    return decode(rest, value, depth + 1, decoded)
  } else {
    const isNegative = value & 1
    const finalValue = isNegative ? -(value >>> 1) : value >>> 1
    if (!rest) {
      return decoded.concat(finalValue)
    }

    return decode(rest, 0, 0, decoded.concat(finalValue))
  }
}
```

A bunch of things are going on here. Starting with the updated signature:

```ts
function decode(str: string, acc = 0, depth = 0, decoded = []) {
```

We need to keep track of current accumulated value (eg, we decode `y`, adding it on to `0`, then we decode `B`, adding it on to the result of `decode(y) + 0` from the previous iteration. 

We also need a `depth` variable - for each continuation bit we encounter, we need to add 31 on to the decoded value. That's what is happening here:

```ts
const hasContinuationBit = integer & 32
const withoutContBit = integer & 31
const shifted = (withoutContBit << 5 * depth)
const value = acc | shifted
```

The `& 31` effectively truncates the continuation bit - for example if we have 40, which is `101000` in binary, performing `101000 & 11111` yields `01000`. It's just a concise way to truncate the continuation bit.

Finally we have:

```ts
const shifted = (withoutContBit << 5 * depth)
const value = acc | shifted
```

This effectively sums `acc` (which is the current sum of all previously decoded values in field) and the current value. To really see this in action, work through an example with a larger number such as `63C` (1405).

Using the [Base 64](https://en.wikipedia.org/wiki/Base64#Base64_table) table, `6` is `111010` in binary. It has a continuation bit.

- `acc`: `0`
- `withoutContBit`: `11010`
- `shifted`: `11010 << 5 * 0 = 11010`
- `value`: `0 | 11010 = 11010`

Next is `3` which maps to `110111`. Again, lose the continuation bit. `depth` is now `1`:

- `acc`: `11010`
- `withoutContBit`: `10111`
- `shifted`: `10111 << 5 * 1 = 1011100000`
- `value`: `11010 | 1011100000 = 1011111010`

Next is `C` which maps to `000010`. Last iteration - there is no continuation bit. `depth` is now `2`:

- `acc`: `1011111010`
- `withoutContBit`: `00010`
- `shifted`: `00010 << 5 * 2 = 100000000000`
- `value`: `1011111010 | 100000000000 = 101011111010`

Finally, we see if the final bit is 0 for positive or 1 for negative, truncate it and return the value. In this case it's positive. so we return `+10101111101`, which gives us 1405. A bit messy, but we did it, and learned a thing or two along the way. 

## The Final Implementation 

The final implementation is show below. It has a lot of temporary variables for clarity. It could be refactored to be much more concise.

```ts
const charToInteger: Record<string, number> = {}

'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  .split('')
  .forEach((char, i) => {
    charToInteger[char] = i
  })


function decode(str: string, acc = 0, depth = 0, decoded = []) {
  const [char, ...tail] = str
  const rest = tail.join('')
  const integer = charToInteger[char]

  const hasContinuationBit = integer & 32
  const withoutContBit = integer & 31
  const shifted = (withoutContBit << 5 * depth)
  const value = acc | shifted

  if (hasContinuationBit) {
    return decode(rest, value, depth + 1, decoded)
  }

  const isNegative = value & 1
  const finalValue = isNegative ? -(value >>> 1) : value >>> 1
  if (!rest) {
    return decoded.concat(finalValue)
  }

  return decode(rest, 0, 0, decoded.concat(finalValue))
}
```

Armed with our `decode` function, the next article will look at constructing a data structure to relate the compiled JavaScript and the original TypeScript, which will power the final part of the project, a source map visualization.