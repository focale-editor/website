# SVG filters

[Documentation](../README.md) · [File formats](README.md) · [ADR 0451](../adr/0451-retained-svg-filter-graphs.md)

Focale imports a bounded SVG filter dialect as an editable graph rather than
rasterizing it. The filtered object stays editable; the graph is stored as one
`svgGraph` smart-filter operation and exported back as an SVG `<filter>`.
This is not complete SVG filter conformance.

## Supported dialect

A filtered element must reference exactly one local `<filter>` through
`filter="url(#id)"`. `title`, `desc` and `metadata` children are ignored.

| Primitive | Native kind | Supported attributes |
| --- | --- | --- |
| `feGaussianBlur` | `blur` | `stdDeviation` (one or two values), `edgeMode="none"` |
| `feOffset` | `offset` | `dx`, `dy` |
| `feFlood` | `flood` | `flood-color` (including `currentColor`), `flood-opacity` |
| `feColorMatrix` | `matrix` | `type` `matrix` (20 values), `saturate` (0–1), `hueRotate`, `luminanceToAlpha` |
| `feComponentTransfer` | `transfer` | One `feFuncR/G/B/A` per channel: `identity`, `table`, `discrete`, `linear`, `gamma` |
| `feBlend` | `blend` | `mode`, `in2` |
| `feComposite` | `composite` | `operator` (including `arithmetic` with `k1`–`k4`), `in2` |
| `feMerge` | `merge` | `feMergeNode` children with `in` |

Every primitive also accepts `in`, `result`, `x`, `y`, `width`, `height` and
`color-interpolation-filters` (`linearRGB`, `auto` or `sRGB`; linear by default).
Inputs are `SourceGraphic`, `SourceAlpha`, a previous `result` name, or the
preceding primitive when `in` is absent. `filterUnits` and `primitiveUnits`
accept `objectBoundingBox` and `userSpaceOnUse`; the filter region defaults to
`-10%`, `-10%`, `120%`, `120%`.

## Rejected input

Import fails with an explicit error instead of approximating the result for:

* any other primitive, such as lighting, turbulence, morphology, convolution,
  displacement, tile or image;
* `BackgroundImage`, `BackgroundAlpha`, `FillPaint` and `StrokePaint` inputs, unknown
  result names and forward references;
* unknown attributes (except `class`, `data-*` and `aria-*`), repeated transfer
  channels and unexpected child elements;
* more than 64 primitives per filter, or more than one million expanded filter
  values per scene.

## Native storage

The graph is stored in the owner's `filters` array, as described in the
[vector format](vectors.md#editable-filter-stacks-and-common-output) and the
[`.focale` format](focale.md#retained-svg-filter-graphs). After an edit, the native
graph, not the preserved SVG XML, is authoritative.

## Editing and rendering

The smart-filter stack opens a parameter dialog for each primitive. It edits
numeric values, blend modes and composite operators while preserving input
edges and subregions. Changing the source object or the graph invalidates
derived previews.

Rendering runs off the UI isolate in bounded offscreen buffers. Evaluation is
refused when the raster area multiplied by the primitive count exceeds 64 million
pixel operations. Derived filter pixels are never saved.
