# The `.fvector` project format

[Documentation](../README.md) · [File formats](README.md)

`.fvector` stores an editable vector document as UTF-8 JSON. It is a standalone
file, not a ZIP archive or an SVG wrapper. This reference describes the current
version-1 envelope, scene and object records. The [vector data reference](vectors.md)
specifies the detailed feature schemas and SVG, PDF and Illustrator interchange.
The [resource collection format](resource-collection.md) describes the optional
ZIP used to deliver a project together with its dependencies.

## Version and encoding

Writers emit `format: "fvector"` and `version: 1` for all current features.
Readers also accept development envelopes 2–9 and write version 1 on the next
ordinary save. Other format tags or envelope versions are rejected. Those older
numbers describe development builds, not successive public compatibility levels.
Nested recipes, brushes, meshes and retained external formats have their own
schema versions, independently of this envelope.

Publishing this specification does not change the encoded bytes or freeze every
optional feature schema. New readers must validate the feature data they use;
older prototype readers may not understand current resource references. Unknown
JSON fields are not a general round-trip extension mechanism: a field that is not
represented by a supported model can be lost when the document is saved.

## Root record

| Field | Type | Meaning |
| --- | --- | --- |
| `format` | string, required | Exactly `fvector`. |
| `version` | integer, required | Writers use `1`; readers accept `1` through `9`. |
| `id` | string, required | Persistent document identity. |
| `name` | string, required | Authored document name, independent of the file path. |
| `scene` | object, required | Canvas, artwork and document libraries. |
| `binaryResources` | object, optional | Content-addressed binary payload table, described below. |
| `embeddedFonts` | object, optional | Retained font programs indexed by retained family key; each value is a binary payload. |
| `svgSource` | string, optional | Retained source SVG, parsed with the supported SVG limits on load. |
| `pdfOrigin` | object, optional | Retained PDF bytes, page provenance and baseline information. |
| `aiOrigin` | object, optional | Retained Illustrator bytes and native-editing provenance. |

The optional origin records do not replace `scene`. The scene holds the current
editable artwork. See [retained SVG](vectors.md#retained-svg-source-unreleased-version-1),
[PDF](vectors.md#pdf-interchange-and-shared-graphics-unreleased-version-1) and
[Illustrator](vectors.md#retained-illustrator-source) for origin schemas.

## Scene record

| Field | Type / default | Meaning |
| --- | --- | --- |
| `width`, `height` | required positive finite numbers | Canvas extent in document units. |
| `objects` | required array | Root objects, painted from back to front. An empty array is valid. |
| `dpi` | number, `96` | Physical conversion resolution, greater than zero and at most `9600`. |
| `colorProfile` | string | Profile identity; a scene without colour metadata defaults to sRGB. |
| `colorMode` | string | Colour-mode name associated with the profile. |
| `iccProfile` | binary payload, optional | Embedded document ICC profile, at most 15 MiB. |
| `sourceProfiles` | object, optional | Portable profiles used by exact source colours. |
| `symbols` | array, empty | Named symbol definitions, including unused masters. |
| `colors` | array, empty | Named document colours and printing inks. |
| `graphicStyles` | array, empty | Named linked appearances. |
| `textStyles` | array, empty | Named character and paragraph styles. |
| `guides` | object, empty | Persistent guides and their metadata. |
| `rulerOrigin` | two-number array, `[0, 0]` | Document-space ruler origin. |
| `variables` | object, empty | Variable bindings and data sets. |
| `compositions` | array, empty | Up to 256 uniquely identified layer compositions. |
| `slices`, `counts`, `inspection` | objects, empty | Export slices, numbered markers and inspection metadata. |
| `metadata` | object, empty | Authored document metadata. |
| `animation` | object, optional | Persistent visibility-frame timeline. |

Scene libraries use arrays of records with stable identifiers, rather than
position-based references. Their dependent object references are resolved and
validated when the scene is loaded. Library schemas, resource ownership and
production metadata are specified in the [vector data reference](vectors.md).

## Object record

An object stores its content, appearance and child objects in one record; there
is no mandatory `type` discriminator. A group has children without an independent
shape, path or text payload. Children use coordinates local to their parent.

| Field | Type / default | Meaning |
| --- | --- | --- |
| `id`, `name` | required strings | Stable object identity and authored name. Object IDs must be nonempty and unique in the validated tree. |
| `children` | required array | Child objects in painting order; `[]` for a leaf. |
| `fill`, `stroke` | required objects | Paint records; `{"color": null}` means no paint. |
| `strokeWidth` | required non-negative number | Stroke width in document units. |
| `opacity` | required number in `[0, 1]` | Opacity of the composed object. |
| `transform` | object, identity | Decomposed affine transform described below. |
| `visible` | boolean, `true` | Visibility flag. |
| `locked` | lock record or legacy boolean, unlocked | Editing locks, retained without changing appearance. |
| `geometry` | object, optional | Parametric shape, selected by `shapeKind`. |
| `path` | object, optional | Editable Bézier contours, anchors and handles. |
| `text` | object, optional | Unicode text, styles, paragraphs, layout, flow and warp. |
| `source` | object, optional | Placed raster or nested editable vector source and its storage metadata. |
| `artboard` | object, optional | Artboard properties; valid only on a root group. |
| `strokeCap`, `strokeJoin`, `strokePosition` | strings | Defaults: `butt`, `miter`, `center`. |
| `strokeDashes` | array, empty | Non-negative lengths in multiples of `strokeWidth`. |
| `strokeMiterLimit`, `strokeDashOffset` | numbers, `4` / `0` | Miter and dash parameters. |
| `fillOpacity`, `strokeOpacity` | numbers, `1` | Separate paint opacity. |
| `fillRule`, `blendMode` | strings | Fill and compositing rules; defaults `nonZero` and `normal`. |

`transform` contains `translateX`, `translateY`, `scaleX`, `scaleY`, `rotation`,
`anchorX` and `anchorY`, with optional `shear`, `flipX` and `flipY`. Translation,
anchor and shear default to zero, scales to one and flips to false. Rotation is
in radians. The transform is relative to the parent; it is not an SVG matrix.

A solid paint uses an integer ARGB `color` or `null`. Additional fields preserve
`exactColor`, named-colour `reference` and printing `ink`. A gradient paint has
`gradient`, `start` and `end`, and may keep radial, focus, transform and extension
parameters. `content`, `pattern` and `tiling` retain fill content and portable
raster or vector patterns. Do not reduce these records to their display colour.

The following optional object families are specified in the companion reference:

| Fields | Detailed schema |
| --- | --- |
| `paintStack`, `style`, `stylePatterns`, `filters` | [Ordered paints](vectors.md#ordered-object-paints-unpublished-version-1), [filter stacks](vectors.md#editable-filter-stacks-and-common-output) and [SVG filter graphs](svg-filters.md) |
| `widthProfile`, `brush` | [Variable-width strokes](vectors.md#retained-variable-width-strokes-unreleased-version-1) and [vector brushes](vectors.md#retained-vector-brushes-unreleased-versions-1-and-2) |
| `symbolId`, `symbolOverrides`, `graphicStyleId` | [Symbols](vectors.md#document-symbols-unpublished-version-1) and [graphic styles](vectors.md#linked-document-graphic-styles-unpublished-version-1) |
| `livePaint`, `blend`, `repeat`, `geometryEffects`, `mesh` | [Live Paint](vectors.md#retained-live-paint-unreleased-version-1), [blends](vectors.md#retained-object-blends-unpublished-version-1), [repeats](vectors.md#retained-object-repeats-unpublished-version-1), [effects](vectors.md#retained-geometry-effects-unpublished-version-1) and [meshes](vectors.md#authored-gradient-mesh-grids-unpublished-version-1) |
| `mask`, `softMask`, `filterMask`, mask settings, `adjustment` | [Common editable artwork](vectors.md#common-editable-artwork-unreleased-version-1) |
| Text frames, linked styles and path bindings | [Text frames](vectors.md#linked-text-frames-unpublished-version-1), [text styles](vectors.md#named-text-styles-unpublished-version-1) and [text paths](vectors.md#editable-text-path-sources-unpublished-version-1) |
| Glyph placement, `glyphProgram`, `deferredPdf`, overprint fields | [PDF graphics](vectors.md#pdf-interchange-and-shared-graphics-unreleased-version-1) and [printing inks](vectors.md#named-printing-inks-unpublished-version-1) |

## Binary resources and portability

`binaryResources` maps lowercase SHA-256 hex digests to records with exactly two
fields: `byteLength` (decoded integer length) and `bytes` (Base64 string).
Participating binary fields contain `{"resource": "<64-character digest>"}`.
Legacy inline Base64 strings remain readable. A reference addresses only the
current project's table; it cannot read a file or another project's resources.

The table covers placed source bytes, nested editable documents, retained PDF/AI
bytes, embedded fonts, ICC profiles and embedded pattern payloads. Nested projects
are opaque byte payloads with their own envelopes and resource tables. Every
declared resource must be consumed by a recognized field. Missing resources,
incorrect hashes or lengths, extra record fields and unused entries are rejected.
See [shared binary resources](vectors.md#shared-binary-resources-unpublished-version-1)
for the complete field list and per-field bounds.

Equal payloads can share one resource without merging the identities of their
placements. Embedded payloads travel with the file; linked source metadata may
still refer to an external path. Fonts are embedded only when retained by the
document and referenced by its artwork or styles. Saving does not automatically
collect every installed font or refresh linked files. Use a
[resource collection](resource-collection.md) to inspect and deliver dependencies.

## Minimal editable example

This complete file contains one editable ellipse. Optional fields use their
documented defaults. The application may add explicit defaults when saving it.

```json
{
  "format": "fvector",
  "version": 1,
  "id": "document.example",
  "name": "Ellipse",
  "scene": {
    "width": 800,
    "height": 600,
    "dpi": 96,
    "objects": [
      {
        "id": "shape.ellipse",
        "name": "Ellipse",
        "geometry": { "shapeKind": "ellipse", "width": 240, "height": 160 },
        "transform": { "translateX": 280, "translateY": 220 },
        "fill": { "color": 4283646677 },
        "stroke": { "color": null },
        "strokeWidth": 0,
        "opacity": 1,
        "children": []
      }
    ]
  }
}
```

## Validation and limits

| Budget | Standard maximum |
| --- | --- |
| Encoded UTF-8 JSON | 128 MiB |
| JSON nesting depth | 100, root at depth zero |
| Visited JSON values, including containers | 2,000,000 |
| Entries in any JSON array or object | 100,000 |
| Objects in the validated scene tree | 100,000 |
| Distinct binary resources | 4,096 |
| Aggregate decoded binary resources | 80 MiB |
| Logical copies made by non-shared binary models | 80 MiB |
| Layer compositions | 256, with distinct IDs |

All numbers must be finite. Scene dimensions must be positive. The reader checks
UTF-8 size and performs a nesting/structure preflight before allocating the JSON
tree. It then validates the resource table, scene libraries, artwork and resource
usage before returning a document. Feature-specific limits still apply, including
32 MiB per placed source, 16 MiB per font and the profile/pattern budgets.
Applications can impose smaller limits and memory admission can reject a file
below these format ceilings.

## Saving and excluded state

A native save writes a temporary file beside the destination before renaming it.
Browser saving produces a `.fvector` download. The file preserves authored
content and production metadata, not the current selection, interface layout,
recent-file list, local preset catalogues or undo history. Recovery checkpoints
are managed separately. A `.focale` photo project can embed a `.fvector` source
without changing either outer format's version.
