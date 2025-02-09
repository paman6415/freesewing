---
title: ringsector
---

The `ringsector` macro drafts a ring sector, which is like a part of a donut
with an inside and outside radius. It is particularly useful for drafting
curved waistbands, circle skirts, and so on.

It is provided by the [ringsector plugin](/reference/plugins/ringsector).

<Note>
##### Not a core-plugins macro

The `ringsector` macro is not provided by the [core-plugins](/reference/plugins/core),
so you need to load the [ringsector plugin](/reference/plugins/ringsector) explicitly
if you want to use it.
</Note>

## Signature

```js
macro('ringsector', {
  Point center = new Point(0,0),
  Number angle,
  Number insideRadius,
  Number outsideRadius,
  Boolean rotate = false,
  String id='ringsector',
})
```

## Example

<Example caption="Example of a ring sector drafted by this macro">
```js
({ Point, macro, Path, paths, part }) => {

  macro('ringsector', {
    angle: 60,
    insideRadius: 30,
    outsideRadius: 45,
  })

  return part
}
```
</Example>

## Configuration

| Property       | Default           | Type                | Description |
|---------------:|-------------------|------------|-------------|
| `center`       | `new Point(0,0)`  | [Point][1] | The center point of the ring sector |
| `angle`        |                   | Number     | The angle the ring sector should cover |
| `insideRadius` |                   | Number     | The inside radius of the ring sector |
| `outsideRadius` |                  | Number     | The outside radius of the ring sector |
| `rotate`       | `false`           | Boolean    | Whether or not to rotate the ringsector so one of its sides is vertical (see [example below](#example-when-rotatetrue)) |
| `id`           | `ringsector`      | String     | The id to use in auto-generate macro points and paths |

[1]: /reference/api/point

## Notes

### Nodes generated by this macro

This macro will add points and a single path to your part.
Their IDs will be saved in store under:
`parts.{part.name}.macros.@freesewing/plugin-ringsector.ids.{id}`

### Removing a ring sector

If you inherit a part with a ring sector drafted by this macro and you'd like to remove it,

you can do so with [the rmringsector macro](/reference/macros/rmringsector).
### Example when rotate=true

<Example caption="Example of a ring sector drafted by this macro when rotate is truthy">
```js
({ Point, macro, Path, paths, part }) => {

  macro('ringsector', {
    angle: 60,
    insideRadius: 30,
    outsideRadius: 45,
    rotate: true,
  })

  return part
}
```
</Example>

