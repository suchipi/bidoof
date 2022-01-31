# bidoof

Bidoof is a value matching and transforming tool that you can use to declaratively describe patches to apply to arbitrary values.

API documentation is TODO, but here's a taste:

```ts
import { makeBidoof, merge, modify, set, replace, t } from "bidoof";

const bidoof = makeBidoof([
  // For any object with a meta property that is an object with a name property that is the string "bobby":
  { meta: { name: "bobby" } },
  // Set the property "something.blah" to 67, and deepMerge an object into it:
  set("something.blah", 67),
  merge({ nums: [3] }),

  // For any number:
  Number,
  // Increase its value by 56
  modify((value) => value + 56),

  // For any object described by this type:
  t.tuple(
    t.number,
    t.string,
    t.object({
      height: t.number,
    })
  ),
  // Replace the entire object:
  replace("hi there :)"),
]);

// Run bidoof over all the inputs:
const inputs = [
  { meta: { name: "bobby" }, nums: [1, 2] },
  { name: "freddy" },
  45,
  "dsjfkldsjkfl",
  [45, "dsjkfs", { height: 43785 }],
  [45, "dsjkfs", { height: "43785" }],
];

console.log(inputs.map(bidoof));
// Prints:
// [
//   { meta: { name: 'bobby' }, nums: [ 3, 2 ], something: { blah: 67 } },
//   { name: 'freddy' },
//   101,
//   'dsjfkldsjkfl',
//   'hi there :)',
//   [ 45, 'dsjkfs', { height: '43785' } ]
// ]
```
