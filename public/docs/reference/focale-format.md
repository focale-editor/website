# The `.focale` project format

[Documentation](../README.md) · [File formats](README.md)

The `.focale` archive stores an editable document, its raster data and reusable
resources. This reference defines its entries, metadata, validation rules and
compatibility policy, including the distinct managed recovery representation.

**Current version:** 1 (first public release)

A `.focale` file is an ordinary ZIP archive. Nothing in it is encrypted or
obfuscated: a project can be inspected, repaired or salvaged with standard
tools, which matters more than a few saved bytes.

## Contents

* [Layout](#layout)
* [`manifest.json`](#manifestjson)
* [Validation on load](#validation-on-load)
* [Slices](#slices)
* [Frame animation](#frame-animation)
* [Layer compositions](#layer-compositions)
* [Variables and data sets](#variables-and-data-sets)
* [Guides](#guides)
* [Count groups](#count-groups)
* [Compatibility policy](#compatibility-policy)
* [Independent raster tiles](#independent-raster-tiles)
* [Managed differential recovery checkpoints](#managed-differential-recovery-checkpoints)
* [Browser portability](#browser-portability)

## Layout

```text
project.focale
├── manifest.json                               required
├── preview.png                                 optional, longest edge ≤ 512 px
├── profiles/document.icc                       required by an embedded ICC descriptor
├── profiles/raster/<encoded-profile-id>.icc     one per distinct non-document embedded ICC profile
├── raster/<encoded-asset-id>.png|.fcraster|.fctiles raster or placed source/display preview
├── masks/<encoded-mask-id>.png|.fctiles         layer or smart-filter mask
├── channels/<encoded-asset-id>.png|.fctiles      alpha or spot channel
├── objects/raster/<number>.fcraster             deduplicated exact tile payloads
├── placed/<encoded-content-id>.bin             one per embedded placed source
├── placed_documents/<encoded-content-id>.focale optional editable nested document
└── patterns/<encoded-content-id>.fptile         one per referenced imported pattern
```

An sRGB RGB 8 Bits/Channel asset is stored as one PNG: lossless, universally
readable and easy to salvage. Every other process raster uses `.fcraster`,
including profiled RGB8, high-depth RGB, CMYK, Grayscale, Lab, Indexed, Bitmap,
Duotone and Multichannel data. Their exact device samples, palette indices,
binary values or high-precision components cannot cross the PNG display-codec
boundary without changing meaning or precision. Whole-image masks and custom
channels remain opaque grayscale sRGB8 PNGs. Placed previews retain their own
engine format and consequently use PNG or `.fcraster` for whole-image entries.
Multi-tile assets, including masks and channels, instead use `.fctiles`
descriptors and exact `.fcraster` objects as specified under Independent raster
tiles below; their logical pixel-format and coverage contracts do not change.

This archive representation is independent of the in-memory representation,
where rasters are split into fixed-size tiles. Archives are written as a stream
and already-compressed PNG and `.fcraster` entries are not deflated a second
time. The encoding cache reuses unchanged payloads. Multi-tile rasters use the
independent tile descriptors and shared archive objects described below.

Undo commands are not embedded in a user project. Crash recovery may retain a
bounded chronological set of managed checkpoints and reopen older states as
coarse Undo checkpoints (ADRs 0125 and 0162). Each checkpoint references its own
complete state in the adjacent shared object store; it does not depend on a
chain of earlier checkpoints. Recovery storage and database rows are application
state, distinct from the self-contained portable file format.

Identifiers used as filenames are URI component-encoded. They therefore remain
opaque document identities without being able to introduce a `/`, `\\`, or
parent-directory segment into the ZIP layout. Readers reject duplicate
project-owned entry names instead of choosing one occurrence ambiguously.
Imported-pattern ids are additionally validated as content-derived
`pattern.*` identifiers by their domain type and binary codec.

The preview is PNG rather than WebP, which was the first thought. The WebP
encoder available to Focale is lossless only, so it would produce a *larger*
file than PNG for a thumbnail while adding a dependency on the encoder for
something as load-bearing as the Home screen. Readers must not assume either
extension; the entry is found by name, `preview.png`.

Readers bound untrusted archives before materializing entries: the complete ZIP
is at most 1 GiB, contains at most 10,000 entries and at most roughly 1 GiB of
declared uncompressed data, including a manifest of at most 16 MiB. One entry
cannot exceed 512 MiB. `preview.png` is additionally limited to 16 MiB and its
IHDR must declare positive dimensions no larger than 512 × 512. An invalid
optional preview is ignored; an invalid required manifest fails the load.
Writers apply the same encoded-container and individual-payload bounds so a
newly saved archive cannot immediately exceed its reader's limits.

PNG raster and mask entries must have a valid signature and positive IHDR
dimensions within the shared 30,000-pixel-per-axis and 100-megapixel per-image
raster limits. Exact rasters validate the equivalent dimensions and decoded
length from their binary header before decompression. One canonical raster is
limited to 500 MiB, which can reduce the pixel ceiling below 100 megapixels for
CMYK and high-depth formats. The aggregate canonical size of project-owned
rasters is capped at 1 GiB on both write and read, so many highly compressed
entries cannot act as a decoded-image bomb.

### Exact raster entries

`.fcraster` version 1 stores interleaved, premultiplied process samples plus
alpha. RGB pixels contain R, G, B, A; CMYK pixels contain C, M, Y, K, A; Lab
pixels contain normalized L*, a*, b*, A. Grayscale, Indexed, Bitmap, Duotone
and the base plate of a Multichannel document contain one process sample plus
alpha. An Indexed sample is a normalized palette index. Additional
Multichannel plates remain document-owned spot-channel rasters.

Sixteen-bit integers and 32-bit IEEE-754 floats use little-endian byte order.
Eight- and 16-bit values are unsigned normalized samples. Bitmap retains one
byte containing `0` or `1` per component in this random-access container even
though PSD packs eight samples per byte. Float alpha and bounded ink remain
between 0 and 1; float RGB process values may exceed 1 to retain HDR content,
but every sample must be finite and non-negative. A fully transparent pixel has
zero process samples in every representation; there is no hidden unassociated
colour behind zero alpha. Bitmap, Duotone and Multichannel pixels are opaque.
Indexed alpha is binary and exists only when the palette designates one
transparent entry.

The fixed 32-byte header is:

| Offset | Size | Meaning |
|--------|------|---------|
| 0 | 8 | ASCII signature `FCRASTER` |
| 8 | 2 | Container version, currently 1 |
| 10 | 1 | Colour-mode index: 0 RGB, 1 CMYK, 2 Grayscale, 3 Lab, 4 Indexed, 5 Bitmap, 6 Duotone, 7 Multichannel |
| 11 | 1 | Bits per channel: 1, 8, 16 or 32 |
| 12 | 1 | Interleaved channel count: 2, 4 or 5 |
| 13 | 1 | Flags: bit 0 premultiplied, bit 1 little-endian, bit 2 zlib payload |
| 14 | 2 | Header length, currently 32 |
| 16 | 4 | Width |
| 20 | 4 | Height |
| 24 | 8 | Decoded canonical byte length |

All header integers are little-endian. Writers set flags to `0x07` and append
one zlib stream. Readers also accept the uncompressed version-1 layout with
flags `0x03`; every other flag combination is rejected. The declared byte
length must equal `width × height × channels × bytesPerChannel`, fit the active
decoded-raster budget and exactly match the decompressed payload.

## `manifest.json`

```json
{
  "format": "focale",
  "version": 1,
  "document": {
    "id": "…",
    "name": "Example",
    "width": 1920,
    "height": 1080,
    "dpi": 96,
    "colorMode": "cmyk",
    "bitsPerChannel": 16,
    "colorProfile": {
      "kind": "embeddedIcc",
      "id": "icc-…",
      "name": "Example CMYK profile",
      "path": "profiles/document.icc"
    },
    "measurementScale": {
      "pixelLength": 50,
      "logicalLength": 1,
      "logicalUnits": "µm"
    },
    "metadata": {
      "title": "Night study",
      "author": "Ada",
      "keywords": ["night", "city"],
      "capturedAt": "2026-09-07T20:15:00.000Z",
      "rating": 4,
      "exif": "SUkqA…",
      "iptc": "HAIF…",
      "xmp": "PD94cGFja2V0…"
    }
  },
  "rootLayerId": "…",
  "layers": [ … ],
  "layerComps": { … },
  "animation": { … },
  "placedContents": [ … ],
  "rasterColorProfiles": {
    "source-preview-raster": {
      "kind": "embeddedIcc",
      "id": "icc-…",
      "name": "Source RGB profile",
      "path": "profiles/raster/icc-….icc"
    },
    "display-preview-raster": {
      "kind": "builtIn",
      "id": "srgb"
    }
  },
  "paths": { … },
  "channels": { … },
  "slices": { … },
  "guides": { … },
  "counts": { … },
  "variables": { … }
}
```

`paths` is absent from a document that has never had one, so opening an older
project and saving it again does not add an empty section. See "Paths" below.
`channels` follows the same rule. See "Channels" below.
`slices` follows the same rule. See "Slices" below.
`guides` is likewise absent until the document contains an authored guide. See
"Guides" below.
`counts` is absent until the document contains an authored Count Tool group.
See "Count groups" below.
`layerComps` is absent until the document contains a saved layer composition.
See "Layer compositions" below.
`variables` is absent until the document contains a variable definition or a
data set. See "Variables and data sets" below.
`animation` is absent from still documents. See "Frame animation" below.
`placedContents` is absent when no live layer references an original placed
source. See "Placed content" below.
`document.metadata` is absent when the document has no authored or preserved
file information. See "Document metadata" below.

`document.colorMode` is `rgb`, `cmyk`, `grayscale`, `lab`, `indexed`, `bitmap`,
`duotone` or `multichannel`. Valid channel depths are:

| Colour mode | `bitsPerChannel` |
|-------------|------------------|
| RGB, Grayscale | 8, 16 or 32 |
| CMYK, Lab, Multichannel | 8 or 16 |
| Indexed, Duotone | 8 |
| Bitmap | 1 |

`colorProfile` must match that model. Version-10 writers use one of these
descriptors:

- `kind: builtIn` with an `id` of `srgb`, `adobeRgb1998`, `proPhotoRgb`,
  `genericCmyk`, `grayGamma22`, `labD50` or `bitmapBlackAndWhite`;
- `kind: embeddedIcc` with an identity, display name and the fixed
  `profiles/document.icc` path;
- `kind: indexedTable` with its content-derived `id`, base64 straight-RGBA
  `rgba` table and optional `transparentIndex`;
- `kind: duotone` with its content-derived `id`, one through four `inks`, each
  containing `name`, opaque ARGB `color` and a base64 256-byte `curve`, plus an
  optional bounded base64 `photoshopData` payload retained opaquely;
- `kind: multichannel` with its content-derived `id` and the base plate's
  `name` and opaque ARGB `color`.

An embedded payload is a complete, bounded ICC v2/v4 RGB or CMYK profile with
an XYZ or Lab profile-connection space; malformed profiles, unsupported working
transforms, missing payloads, identity mismatches and unreferenced profile
entries are rejected. Indexed tables contain 2 through 256 entries and permit
at most one fully transparent entry. Older string-valued built-in profiles
remain readable. The process fields' absence in an older project reads as RGB,
8 Bits/Channel and sRGB.

Every `RasterLayer` asset must exactly match the document mode, depth and
profile; masks, custom channels and other coverage assets retain their
independent sRGB8 contract. Indexed, Bitmap, Duotone and Multichannel documents
are flattened: the root owns exactly one plain raster layer. Multichannel may
add only spot channels, which represent its remaining ordered plates.
Independent placed-source and display-preview rasters are not document working
formats: they may retain exact 32-bit CMYK samples in `.fcraster`, even though
CMYK documents themselves are restricted to 8 or 16 Bits/Channel.

`document.measurementScale` calibrates document-space measurements without
resampling pixels. `pixelLength` and `logicalLength` are finite positive
numbers; `logicalUnits` is a trimmed label containing 1 to 64 characters. The
example means that 50 document pixels represent 1 µm. The field is omitted for
the default `1 px = 1 px` scale, so projects written before its introduction
retain their uncalibrated behaviour. Measurement-log rows are workspace data
and never enter the project archive.

### Document metadata

`document.metadata` stores the editable file information independently from
the document filename. All fields are optional:

| Field | Type | Meaning |
|-------|------|---------|
| `title`, `author`, `description` | string | Authored title, primary creator and caption |
| `keywords` | string array | Ordered subject terms |
| `headline`, `copyrightNotice`, `credit`, `source` | string | Editorial and rights information |
| `city`, `state`, `country` | string | Authored location |
| `cameraMake`, `cameraModel`, `lens` | string | Capture-equipment description |
| `capturedAt` | ISO-8601 string | Original capture time |
| `exposureSeconds`, `aperture`, `iso`, `focalLength` | positive finite number | Capture values |
| `rating` | integer from `-1` through `5` | XMP rejection or star rating |
| `exif`, `iptc`, `xmp` | base64 string | Preserved source packet |

One text value contains at most 1,048,576 UTF-16 code units, a document has at
most 4,096 keywords, and each decoded packet is limited to 4 MiB. Readers
reject malformed types, dates, numbers, ratings and base64 rather than silently
changing their meaning.

The semantic fields are the editable source of truth. On supported raster and
PSD/PSB export, Focale synchronizes them into an application-owned block inside
XMP while preserving unrelated, well-formed XMP nodes. Original EXIF and
IPTC-IIM bytes remain opaque and unchanged; their common fields initialize the
semantic values on import, but editing them does not destructively rewrite
unknown camera maker notes or agency records. PNG, JPEG and WebP can retain
EXIF/XMP through Imcodec inspection, JPEG can additionally retain IPTC, and
TIFF currently retains its IPTC and XMP tags. A malformed or unsupported
optional packet is ignored without preventing the raster itself from opening.

Readers apply the recovery rules documented by each metadata section. Writers
require every in-memory layer, path, slice, guide, count-group and
layer-composition index key to match the object's non-empty id, and every
ordered collection to contain each indexed id exactly once. This prevents a
save from silently omitting data that its own reader would otherwise normalize.

`layers` is a flat array; the tree is expressed by each group's `childIds`,
listed **top-most first**, matching the layers panel.
Every editable raster or mask id has exactly one owner across the document;
sharing one engine asset between layer content, a mask and a custom channel is
rejected as well.

### Common layer fields

| Field         | Type                          | Notes                                                                                                                                  |
|---------------|-------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `id`          | string                        | Stable identity; never a list index                                                                                                    |
| `kind`        | `raster` \| `placed` \| `group` \| `text` \| `adjustment` \| `fill` \| `shape` | Unknown kinds are rejected                                                                  |
| `name`        | string                        |                                                                                                                                        |
| `visible`     | bool                          | Absent means visible                                                                                                                   |
| `clippedToBelow` | bool                       | When true, the layer also uses the alpha of the nearest unclipped sibling below it. Absent means false.            |
| `lockTransparency` | bool                     | Preserves every pixel's existing alpha while allowing colour edits. Absent means false                                                 |
| `lockPixels`  | bool                          | Prevents edits to raster pixels or text content. Absent means false                                                                    |
| `lockPosition` | bool                         | Prevents moves and transforms. Absent means false                                                                                       |
| `opacity`     | number                        | Clamped to 0..1 on read                                                                                                                |
| `blendMode`   | string                        | Unknown values fall back to `normal`                                                                                                   |
| `transform`   | object                        | See below                                                                                                                              |
| `maskId`      | string?                       | Present only when the layer has a mask                                                                                                 |
| `maskEnabled` | bool                          | Only written alongside `maskId`                                                                                                        |
| `maskLinked`  | bool                          | Whether layer transformations also move the pixel mask. Written only as `false` alongside `maskId`; absent means linked                |
| `maskTransform` | object                      | Additional mask-to-layer transform. Written only alongside `maskId` when non-identity; absent means identity                            |
| `maskOffset`  | `[x, y]`?                     | Where the mask's top-left pixel sits in the layer's own space. Written only when non-zero; absent means the origin. |
| `maskSettings` | object?                      | Non-destructive raster-mask density and feather. Written only alongside `maskId` when non-neutral; see below                           |
| `vectorMaskId` | string?                      | Id of an existing document path this layer clips to; dangling references are rejected. Present only when set. Coexists with `maskId` — a layer may have both.   |
| `vectorMaskEnabled` | bool                    | Only written alongside `vectorMaskId`.                                                                              |
| `vectorMaskInverted` | bool                   | Only written as `true` alongside `vectorMaskId`; absent means false.                                                 |
| `vectorMaskSettings` | object?                | Non-destructive vector-mask density and feather. Written only alongside `vectorMaskId` when non-neutral; see below                     |
| `linkGroupId` | string?                       | Layers with the same non-null value move together. A valid link group has at least two non-nested members                              |
| `style`       | object?                       | Blending options and effects. Written only when something is configured; see below                                                     |
| `colorLabel`  | `none` \| `red` \| `orange` \| `yellow` \| `green` \| `blue` \| `violet` \| `gray` | Organizational colour shown in the Layers panel. `none` is omitted; unknown values fall back to `none` |

Versions 1 and 2 may contain the former `locked` boolean. Readers map it to
`lockPixels` and `lockPosition`, leaving transparency unlocked. Development version 3
writers only emit the three independent fields.

Raster and vector masks share the same optional display settings:

```json
{
  "density": 0.65,
  "feather": 12.5
}
```

`density` is normalized from 0 through 1. At 1 the authored coverage is used
unchanged; at 0 the mask no longer attenuates its layer. `feather` is a
non-destructive blur radius in document pixels from 0 through 1000. Missing or
malformed fields independently fall back to density 1 and feather 0. The
settings object is omitted when both values are neutral, and settings found
without their corresponding mask id are ignored.

A pixel mask is painted through `layer.transform × maskTransform ×
translate(maskOffset)`. A linked mask normally keeps an identity
`maskTransform`. When a layer is transformed while `maskLinked` is false, the
editor compensates `maskTransform` so the mask keeps its document-space
placement. The mask raster is not resampled by that operation.

### Kind-specific fields

* `raster` — `rasterAssetId`, and `adjustments` when non-empty. The adjustment
  stack is stored **inline** rather than by id: an adjustment has no identity
  outside its layer, so inlining removes any chance of an orphan outliving it.
  An adjustment of an unknown kind is skipped, losing that one effect rather than
  the whole project.
  A raster carrying `background: true` is the document's unique fixed
  background. It must be the root group's last child, use Normal blending at
  full opacity, lock transparency and position (but not pixels), and have no
  raster or vector mask. The field is omitted for ordinary rasters.
* `placed` — `contentId`, `sourcePreviewAssetId`, `previewAssetId`,
  `sourceGeometry`, `placement`, optional `previewOffset`, and optional
  `pageNumber`/`pageCount`. A non-empty `smartFilters` stack may additionally
  retain `unfilteredPreviewAssetId`, `smartFilterMaskId`,
  `smartFilterMaskEnabled`, and `smartFilterMaskOffset`. Its preview roles use
  the same lossless raster storage and exclusive engine ownership as an
  ordinary raster, while the original source is shared through
  `placedContents`. See “Placed content” below.
* `group` — `childIds`, `expanded`, optional `passThrough`, optional `measurementScaleMarker`, optional `artboard`, and optionally
  `frameGeometry` plus `frameStroke`. A group with `frameGeometry` is an image
  frame; see “Frame groups” below. A group with `artboard` is an independent
  canvas; see “Artboards” below. `passThrough` lets child adjustments and blend
  modes interact with the group's lower siblings; it is omitted for an
  isolated group.
  `measurementScaleMarker: true` identifies an editable printable marker; see
  “Printable scale markers” below. An ordinary group omits the semantic field
  and both frame fields.
* `text` — `content`: editable text plus its base character, paragraph,
  orientation, anti-aliasing and warp settings. Character overrides are stored
  in `styleRanges`; see "Rich text ranges" below. Optional values equal to
  their defaults are omitted. Unknown enum names fall back to their documented
  defaults rather than failing the load.
* `adjustment` — `adjustment`: the same flat payload described below, except
  that `id` and `enabled` are omitted because the layer already owns an id and
  its `visible` field controls whether it contributes. Match Color additionally
  stores its frozen source and target statistics in the payload.
* `fill` — `fill`: procedural content with a `fillKind` of `color`, `gradient`
  or `pattern`. A colour stores packed ARGB `color`; a gradient stores the
  structured `gradient`, `shape`, angle in degrees, scale and reverse flag; a
  pattern stores a stable built-in name or imported content identifier and its
  scale. Fill layers own no raster archive entry; imported tile pixels live in
  `patterns/` as described below.
* `shape` — `shape`: `geometry`, and `fill`/`stroke` when set. See "Shape
  layers" below.

### Artboards

An artboard is a root-level group with an explicit local canvas:

```json
{
  "id": "artboard-1",
  "kind": "group",
  "name": "Mobile",
  "childIds": ["title", "background"],
  "artboard": {
    "left": 80,
    "top": 60,
    "width": 390,
    "height": 844,
    "backgroundColor": 4294967295,
    "presetName": "Mobile"
  }
}
```

`left`, `top`, `width` and `height` are finite group-local pixels; dimensions
must be positive. The group's ordinary transform places this rectangle and all
descendants together in document space, so moving an artboard does not rewrite
each child. Its rectangle clips every descendant. `backgroundColor` is a packed
ARGB colour painted below those descendants; an explicit `null` makes the
artboard transparent. `presetName` is optional interchange metadata and does
not control the current dimensions.

The navigable pasteboard is derived from the document-space union of all
artboard rectangles and visible loose root-layer bounds; it is not serialized.
Artboards and loose content may therefore use negative coordinates or extend
beyond the legacy `document.width` and `document.height` without changing
either value. Tool presets, adjacent-add controls, and the Move tool's Prevent
Auto-Nesting preference are editor state, not project data.

An artboard must be a direct child of the document root. It cannot contain
another artboard or simultaneously use frame geometry, pass-through blending,
or clipping-to-below semantics. Its outline and title are editor overlays and
are never part of the exported composite.

### Printable scale markers

A marker placed through Image ▸ Analysis is ordinary printable layer content,
not document metadata. Its tagged `group` contains one live `shape` layer for
the bar and, when Display Text was enabled, one editable `text` layer for the
logical length and unit. The group's transform initially places the content in
the lower-left of the canvas. The child transforms retain the selected text
position and centre the bar and caption on one another.

Only the root group writes `measurementScaleMarker: true`. This semantic flag
lets a later placement remove existing markers after their groups have been
renamed or moved; it does not introduce a new renderer or restrict ordinary
layer edits. The generated geometry stores the calibrated pixel length at
placement time. Changing `document.measurementScale` later therefore does not
silently resize existing printable content.

### Placed content

Placed layers keep a rendered preview and a format-neutral reference to their
original source:

```json
{
  "id": "placed-layer",
  "kind": "placed",
  "name": "Linked illustration",
  "contentId": "placed-source",
  "sourcePreviewAssetId": "source-preview-raster",
  "unfilteredPreviewAssetId": "unfiltered-preview-raster",
  "previewAssetId": "display-preview-raster",
  "sourceGeometry": [0, 0, 800, 0, 800, 600, 0, 600],
  "placement": [120, 80, 520, 70, 540, 390, 100, 400],
  "previewOffset": [100, 70],
  "pageNumber": 2,
  "pageCount": 5,
  "smartFilters": [
    {
      "id": "filter-1",
      "enabled": true,
      "opacity": 0.75,
      "blendMode": "normal",
      "operation": {
        "type": "catalog",
        "kind": "gaussianBlur",
        "settings": {"radius": 4.0}
      }
    }
  ],
  "smartFilterMaskId": "shared-filter-mask",
  "smartFilterMaskEnabled": true,
  "smartFilterMaskOffset": [100, 70]
}
```

`sourceGeometry` contains four corners in source-preview pixel coordinates.
`placement` contains their four layer-local targets. Both are ordered clockwise
from the top-left corner and must remain finite, strictly convex
quadrilaterals. `previewAssetId` contains the already resampled display image;
`previewOffset` is the layer-local coordinate of its top-left pixel and is
omitted at the origin. `sourcePreviewAssetId` remains unchanged across geometry
edits, preventing repeated resampling from accumulating interpolation damage.
The two identifiers may be equal while the display is an unmodified source
preview. Page fields are one-based, must be positive, and are omitted when both
equal one.

`smartFilters` is omitted for an empty stack and otherwise lists filters in
processing order, from the immutable source towards the display preview. Each
entry has a stable non-empty `id`, one typed `operation`, an `enabled` switch,
normalized `opacity`, and a `blendMode` from `LayerBlendMode`. A catalogue
operation has `type: catalog`, a `kind` from `FilterKind`, and sanitized numeric
`settings`. A Camera Raw operation has `type: cameraRaw` and a complete bounded
`RawDevelopmentSettings` map in `settings`; source-decoding and output-document
choices are normalized away because the operation runs on already rendered
pixels. A cumulative Filter Gallery operation has `type: filterGallery` and a
versioned `stack`:

```json
{
  "type": "filterGallery",
  "stack": {
    "version": 1,
    "effects": [
      {
        "id": "gallery-effect-1",
        "kind": "cutout",
        "settings": {
          "levels": 4.0,
          "edgeSimplicity": 4.0,
          "edgeFidelity": 2.0
        },
        "enabled": true
      }
    ]
  }
}
```

Its one to 32 effects are ordered from source towards display. Identifiers are
unique non-empty strings of at most 128 characters, `kind` must belong to a
Filter Gallery category, numeric settings are sanitized by that kind's
catalogue descriptor, and `enabled` defaults to true. The internal stack is
evaluated cumulatively but remains one Smart Filter entry with one set of
blending options and the shared filter mask.

A custom Shape Blur operation embeds a bounded, catalogue-independent kernel:

```json
{
  "type": "shapeBlur",
  "recipe": {
    "version": 1,
    "radius": 12.0,
    "kernel": {
      "version": 1,
      "builtIn": "heart",
      "samples": [
        [-0.42, -0.76, 0.75],
        [0.42, -0.76, 0.75]
      ]
    }
  }
}
```

`radius` is finite and lies between 1 and 100 pixels. A kernel contains one to
64 `[x, y, weight]` samples: coordinates are finite and normalized to `-1..1`,
and coverage weights are finite in `(0, 1]`. A built-in shape writes its stable
`builtIn` enum name. An imported shape writes `preset` instead, using the full
version-1 `CustomShapePresetEntry` representation described for imported Custom
Shapes below. The sampled footprint is stored as well as that vector metadata,
so rendering and Action playback do not depend on a mutable machine-wide CSH or
`.fshape` catalogue. Malformed or unsupported recipes are ignored as unknown
Smart Filter operations.

Legacy entries with top-level `kind` and `settings` are read as catalogue
operations.

Unknown operation types or catalogue kinds are ignored so a newer project can
retain its ready preview in an older build. Duplicate identifiers after that
filtering are ignored after their first occurrence. The stored
`previewAssetId` is the authoritative ready-to-paint cache: opening a project
never has to evaluate the stack, while the next stack, source, or geometry edit
regenerates it from `sourcePreviewAssetId`. Structured operations without a
verified Photoshop descriptor use the rendered fallback during PSD or PSB
export instead of silently losing their effect.

When present, `unfilteredPreviewAssetId` is the identically projected source
painted below the filtered cache. `smartFilterMaskId` names one opaque
grayscale sRGB8 raster shared by the complete stack: white reveals the filtered
cache and black reveals the unfiltered cache. `smartFilterMaskOffset` locates
its top-left pixel in layer-local coordinates and defaults to the origin;
`smartFilterMaskEnabled` defaults to true. The mask is independently paintable
and follows projective geometry edits. Version-1 files without these optional fields continue to display their authoritative filtered preview.

Version 1 retains the independent colour interpretation of every referenced
source, unfiltered, and display preview in the top-level
`rasterColorProfiles` object. Each placed raster asset id appears exactly once
and no unrelated asset may appear.
A built-in descriptor contains `kind: builtIn` and an `id` of `srgb`,
`adobeRgb1998`, `proPhotoRgb`, or `genericCmyk`. An embedded descriptor contains
`kind: embeddedIcc`, its content-derived `id`, a non-empty display `name`, and
its archive `path`.

An embedded preview that uses the document profile references
`profiles/document.icc`; every other payload uses the deterministic
`profiles/raster/<encoded-profile-id>.icc` path. Equal ICC payloads share one
archive entry even when their container labels differ, while each descriptor
retains its own label. Readers reject missing or extra descriptors, missing or
unreferenced profile entries, unsafe paths, and identity mismatches. The table
is required whenever a placed layer owns source or display previews.

When optional source-preview geometry is absent, readers use `previewAssetId`
for both roles, use `placement` as the source geometry, and assume a zero preview
offset. The required colour-profile table still covers every referenced preview.

Source metadata is stored once even when several layers share it:

```json
{
  "placedContents": [
    {
      "id": "placed-source",
      "name": "illustration.psd",
      "storage": "embedded",
      "formatHint": "8BPS",
      "expectedByteLength": 48192,
      "editableDocumentByteLength": 238144,
      "modifiedAt": "2026-08-29T10:30:00.000Z"
    }
  ]
}
```

`storage` is `embedded` or `linked`. Embedded bytes never enter JSON: they are
written to `placed/<encoded-content-id>.bin`, where the identifier is URI
component-encoded to prevent it from changing the ZIP path. Linked sources may
store `externalUri`, `expectedByteLength`, and `modifiedAt`; a missing external
file does not prevent the retained preview from rendering. Unreferenced source
metadata is not written, which keeps sources held only by undo history out of a
saved project. Readers discard unreferenced source metadata before looking for
or inflating any corresponding payload.

A linked source may itself be a `.focale` archive. In that case `formatHint` is
`focl`, `externalUri` addresses the complete child project, and no duplicate
`placed_documents/` payload is written in the parent. Embedding that link copies
the external archive to `placed_documents/<encoded-content-id>.focale` and
retains a PNG fallback in `placed/`; converting an editable embedded source to a
link performs the inverse transition. These storage changes do not alter the
placed layer's ready source or display previews.

An embedded source may retain optional, format-neutral regeneration
instructions in `developmentRecipe`:

```json
{
  "id": "camera-source",
  "name": "capture.dng",
  "storage": "embedded",
  "formatHint": "cameraRaw",
  "expectedByteLength": 33554432,
  "developmentRecipe": {
    "processor": "cameraRaw",
    "version": 1,
    "parameters": {
      "whiteBalance": "camera",
      "exposure": 0.75,
      "contrast": 12.0,
      "quality": "high"
    }
  }
}
```

When such a developed RAW source becomes linked, its original camera bytes move
to the external file while `developmentRecipe` stays in the parent document.
Reopening Camera Raw performs the same bounded, change-checked linked-source read
as refresh and embedding; the ready preview remains available if that file later
goes missing.

An embedded editable smart object may instead use processor
`focale.statistical-stack`, version `1`, with exactly
`parameters: {"mode": "mean" | "median" | "minimum" | "maximum"}`.
Its existing `placed_documents/` payload retains the original source layers;
the source PNG and layer preview assets contain the computed result. Removing
the recipe restores ordinary layer compositing. Every instance of the same
placed-source identity shares the recipe, while filters remain instance-local.
Saving child edits recomputes the result; opening a parent renders the stored
previews without recomputing. Only embedded sRGB8 sources are currently editable
as stacks; conversion to linked storage is disabled while the recipe is active.
Unknown recipes remain displayable through their cached previews. See ADR 0246
for the alpha rule, resource limits and conservative PSD/PSB raster fallback.

`processor` is an application-owned stable identifier, not a package or class
name. `version` is a positive processor-specific integer and `parameters`
contains only finite JSON values. A recipe accepts at most 128 top-level
parameters, eight nested container levels, a 64-character processor identifier,
and 64 KiB of canonical UTF-8 JSON. Readers reject malformed recipes. The ready
placed-layer preview remains authoritative for display, so a future unsupported
recipe version does not make the document unrenderable. Processor
`cameraRaw` version 1 contains the complete `RawDevelopmentSettings` map; the
original camera payload remains in `placed/<encoded-content-id>.bin` and double
clicking the placed layer can regenerate all occurrences from it.

Decoder controls use `whiteBalance`, `temperature`, `tint`, `exposure`,
`contrast`, `highlights`, `shadows`, `whites`, `blacks`, `saturation`,
`vibrance`, `quality`, and `highlightRecovery`. `outputColorSpace` is `srgb`,
`adobeRgb`, `proPhotoRgb`, or `custom`; the developed 16-bit preview asset
carries the corresponding profile. For `custom`, the recipe includes a
`customOutputProfile` object with the stable ICC `id` and display `name`, but
not another copy of its bytes. The exact ICC payload is already stored and
deduplicated through the source raster's `colorProfileId`. Preset JSON outside
a `.focale` archive may additionally include base64 `data` inside that object
so the preset remains portable. A reader that cannot resolve the custom
identifier safely falls back to sRGB. Detail controls use `curve`,
`luminanceNoiseReduction`, `luminanceNoiseDetail`, `colorNoiseReduction`,
`sharpeningAmount`, and `sharpeningRadius`.

Automatic optics use `useLensProfile`, `removeChromaticAberration`, and the
optional frozen `lensProfile`. The latter records its label, Lensfun maker and
model, capture focal length, and the already interpolated distortion, lateral
chromatic-aberration, and vignetting coefficients. Freezing these values keeps
an existing recipe deterministic when the bundled catalogue changes. Purple
and green defringing use their `Amount`, `HueLow`, and `HueHigh` fields. Manual
optics use `lensDistortion`, `lensVignetteAmount`, and
`lensVignetteMidpoint`.

Manual geometry uses `geometryVertical`, `geometryHorizontal`,
`geometryRotate`, `geometryAspect`, `geometryScale`, `geometryOffsetX`,
`geometryOffsetY`, and `constrainCrop`. `uprightMode` is `off`, `automatic`,
`level`, `vertical`, `full`, or `guided`. `geometryGuides` contains at most four
usable normalized lines, each with an `orientation` of `horizontal` or
`vertical` and finite `startX`, `startY`, `endX`, and `endY` coordinates from
zero to one.

Calibration uses `calibrationShadowsTint` and the `Hue` and `Saturation` fields
for the red, green, and blue camera primaries. `localAdjustments` contains at
most sixteen ordered entries. Each entry has a stable `id`; a `kind` of
`brush`, `linearGradient`, or `radialGradient`; `inverted`, `feather`, and
geometry fields; and the local `exposure`, `contrast`, `highlights`, `shadows`,
and `saturation` controls. A recipe retains at most 4096 brush samples in
aggregate.

Brush samples are stored in `pointData`, a standard base64 string whose decoded
payload is a sequence of seven-byte records. Each record contains `x` as an
unsigned 24-bit big-endian integer, `y` in the same form, and one unsigned
eight-bit pressure value. Coordinates divide by `0xffffff` and pressure divides
by `0xff` when read. The packed representation gives stable subpixel precision
while ensuring the maximum supported point count fits the generic 64 KiB
recipe bound. Malformed base64, partial records, excess points, excess masks,
and recipes that exceed the generic encoded limit are rejected. Missing fields
retain their neutral defaults, including sRGB output, a geometry scale of `100`,
and constrained cropping.

An embedded source may also declare `editableDocumentByteLength`. Its matching
`placed_documents/<encoded-content-id>.focale` entry is a complete nested
Focale archive. Editing that child uses the normal document model; saving it
replaces this payload and refreshes every parent placement sharing the content
id in one undoable revision. The flattened source bytes remain in `placed/` so
the object can still render or be exchanged without recursively opening the
child document.

Each embedded source and editable nested document is limited to 512 MiB. Its
ZIP entry's declared size must match the corresponding manifest length before
decompression begins. Referenced imported pattern entries are likewise checked
against the bounded `.fptile` codec before their payload is inflated. Decoded
imported pattern pixels from one project may not exceed the catalogue's
128 MiB RGBA budget in aggregate.

### Adjustments

Each raster layer's `adjustments` array contains flat objects. The common fields
are `id` (stable string), `kind` (the adjustment's stable enum name) and
`enabled` (absent or true means enabled). Scalar descriptor values sit beside
them using their stable parameter names.

Curves keep the historical `curve` field as the master RGB curve and may add one
curve per channel:

```json
{
  "id": "…",
  "kind": "curves",
  "enabled": true,
  "curve": [0, 1, 0, 1],
  "redCurve": [0, 0.5, 1, 0, 0.7, 1],
  "blueCurve": [0, 1, 0.1, 1]
}
```

A curve is `[x0, x1, …, y0, y1, …]` in normalized coordinates. The master is
applied first, followed by the matching red, green or blue curve. Missing or
malformed channel fields mean an identity curve. Identity channel curves are
not written.

Gradient Map stores its arbitrary stop list as one structured field:

```json
{
  "id": "…",
  "kind": "gradientMap",
  "enabled": true,
  "reverse": 0,
  "gradient": {
    "interpolation": "perceptual",
    "stops": [
      {"position": 0, "color": 4278190080},
      {"position": 0.4, "color": 4294901760, "midpoint": 0.7},
      {"position": 1, "color": 4294967295}
    ]
  }
}
```

Stop positions are normalized, sorted and made to cover zero through one when
read. Colours are packed ARGB integers; Gradient Map uses their RGB channels and
preserves the source pixel's alpha. Each stop may store `midpoint`, the relative
position in the segment leading to the following stop where both colours
contribute equally. It is clamped to `0.05` through `0.95`, defaults to `0.5`
when omitted and is ignored on the final stop. `interpolation` is one of
`perceptual`, `linear`, `encoded`, `classic`, `smooth` or `stripes`; unknown values fall
back to `perceptual`. `encoded` interpolates encoded RGB without easing,
whereas `linear` interpolates linear-light RGB.

The obsolete `startColor`, `midColor`, `endColor`, `useMidpoint` and `midpoint`
fields are still accepted on read and converted to a `classic` gradient. New
files only write `gradient`.

Color Lookup embeds its resolved RGB cube instead of retaining an external
file path:

```json
{
  "id": "…",
  "kind": "colorLookup",
  "enabled": true,
  "lookupTable": {
    "name": "Film stock",
    "size": 33,
    "values": [0, 0, 0, 0.03125, 0, 0],
    "domainMinimum": [0, 0, 0],
    "domainMaximum": [1, 1, 1]
  }
}
```

`size` is between 2 and 64. `values` contains exactly `size³ × 3` finite RGB
components in blue-major, green-middle, red-fastest order. Domain arrays contain
three finite, strictly increasing ranges and are omitted for `[0, 0, 0]` / `[1,
1, 1]`. Standalone one-dimensional CUBE files are expanded into this same
three-dimensional representation during import, so rendering and project
reopening never depend on the original `.cube` file.

### Adjustment layers

An adjustment layer reuses an adjustment payload instead of defining a second
parameter format:

```json
{
  "id": "…",
  "kind": "adjustment",
  "name": "Exposure",
  "adjustment": {
    "kind": "exposure",
    "exposure": 1,
    "offset": 0,
    "gamma": 1
  }
}
```

It affects only the siblings below it in the same group. Its mask, transform,
style, opacity and blend mode remain common layer fields; none of these values
is baked into a raster asset.

### Fill layers

```json
{
  "id": "…",
  "kind": "fill",
  "name": "Gradient",
  "fill": {
    "fillKind": "gradient",
    "gradient": {"interpolation": "linear", "stops": [ … ]},
    "shape": "linear",
    "angle": 45,
    "scale": 1,
    "reverse": false,
    "placement": {"startX": 120, "startY": 80, "endX": 420, "endY": 260},
    "dither": true
  }
}
```

Procedural fills are evaluated over the fixed document bounds. This keeps a
gradient stable across panned or cropped render targets. A gradient created
from the Layers menu omits `placement` and uses the centred `angle`/`scale`
geometry. A live Gradient-tool layer stores its exact two handles in
layer-local pixels; either endpoint may be outside the canvas. A complete,
finite `placement` takes precedence over `angle`/`scale`, while malformed or
zero-length input falls back to the centred geometry. `dither` is optional and
defaults to `false`; it applies deterministic one-byte spatial dithering to the
procedural result without embedding a raster asset.

When the Gradient tool creates a layer inside a transformed group, its initial
layer transform cancels the parent's effective transform. The new layer's local
document rectangle and handles therefore coincide with document coordinates;
later parent transformations still move the child normally. A selected area
can be stored as a bounded mask raster positioned by `maskOffset`, rather than
as a mask covering the entire document.

### Paths

```json
{
  "order": ["p2", "p1"],
  "paths": [
    {"id": "p1", "name": "Path 1", "subpaths": [ … ]},
    {"id": "p2", "name": "Work Path", "subpaths": [ … ]}
  ]
}
```

`order` lists path ids top-most first, matching how the Paths panel and
`GroupLayer.childIds` both order things; a path missing from `order` is
appended at the end, and an id in `order` that has no matching entry in
`paths` is dropped. A duplicate path id keeps the last entry read rather than
rejecting the whole project — nothing else's correctness depends on path
identity yet, unlike a raster asset id. Which path is selected in the Paths
panel is not persisted — like the selected layer, it is session state, not
document data.

Each entry in `subpaths` is:

```json
{
  "closed": true,
  "operation": "subtract",
  "fillRule": "evenOdd",
  "anchors": [
    {"x": 10, "y": 10},
    {"x": 90, "y": 10, "outX": 8, "outY": 0, "inX": -8, "inY": 0}
  ]
}
```

`operation` describes how a closed contour combines with the closed area
built by the contours before it: `union`, `subtract`, `intersect` or
`exclude`. It is omitted for the default `union`. The first closed contour
always establishes the base area, and open contours are retained as outlines
without participating in boolean fill operations.

`fillRule` is `nonZero` or `evenOdd` and determines the interior of a contour
whose edges overlap. It is omitted for the default `nonZero`. Imported CSH
geometry retains this distinction rather than approximating every contour with
one winding rule.

An anchor's `inX`/`inY` and `outX`/`outY` are the Bézier handle for the
segment arriving at and leaving that anchor, as an offset **relative to the
anchor's own `x`/`y`** rather than an absolute point — so moving an anchor
carries its handles with it. A handle pair absent on either side of a segment
means that segment is a straight line. `type` (`corner` or `smooth`) is
written only when it is `smooth`; it is purely presentational, guiding how an
editor moves a handle's opposite counterpart, and does not change the curve
`anchors` already describes.

### Channels

Persistent alpha and spot channels are document content; the selected channel
and open eye icons remain transient editor-session state.

```json
{
  "channels": {
    "order": ["spot-varnish", "alpha-sky"],
    "channels": [
      {
        "id": "alpha-sky",
        "name": "Sky selection",
        "rasterAssetId": "channel-raster-1",
        "kind": "alpha",
        "color": 4294901760,
        "opacity": 0.5,
        "overlayMode": "maskedAreas"
      },
      {
        "id": "spot-varnish",
        "name": "Varnish",
        "rasterAssetId": "channel-raster-2",
        "kind": "spot",
        "color": 4294945280,
        "opacity": 0.75,
        "transform": [1, 0, 0, 1, 12, 8]
      }
    ]
  }
}
```

`order` lists every custom channel exactly once in panel order. Each `id`,
trimmed `name` and `rasterAssetId` is non-empty. At most 52 channels are
accepted by the project model. PSD's 56-plane limit leaves room for at most 52
custom channels in RGB and 51 in CMYK after process planes and merged
transparency; export rejects a CMYK document above that narrower limit. `kind`
is `alpha` or `spot`. `color` is a packed ARGB overlay or spot colour. `opacity` is
normalized to 0–1 and means overlay opacity for alpha channels or solidity for
spot channels. `overlayMode` is `maskedAreas` or `selectedAreas` and applies
only to the alpha overlay. Missing optional fields use the defaults shown by
the model; present fields with an unknown enum, invalid type or out-of-range
value corrupt the project instead of being silently normalized.

Pixels are stored losslessly in
`channels/<encoded-rasterAssetId>.png` as opaque grayscale. Alpha channels use
black for no selection and white for full selection. Spot channels retain the
native plate polarity used by PSD: black means 100% spot ink and white means no
ink. Changing a channel between alpha and spot changes its metadata without
silently inverting authored pixels. Channel rasters share the archive's PNG
dimension, aggregate decoded-memory, entry-count, collision-remapping and
incremental-save limits. Missing required channel pixels corrupt the project.
Decoded channel pixels that are coloured or not fully opaque likewise corrupt
the project instead of being accepted as ambiguous coverage.
An asset has one owner across layer content, masks and channels, so a later edit
can never change two logical objects through a shared mutable raster.

The optional affine `transform` is `[a, b, c, d, tx, ty]` and maps channel
raster coordinates into document coordinates. Identity is omitted. Image
resize composes this mapping without immediately resampling a full raster.
Canvas resize and affine crop materialize channels over the new canvas, use
their native empty value outside the old extent and return the mapping to
identity so newly exposed pixels are immediately editable. Perspective crop
cannot be represented by an affine mapping and therefore resamples each
channel through the document quadrilateral, also returning the result to
identity. Undo retains the original rasters in all materializing cases.

Built-in RGB or CMYK process rows are derived views of the composited document
and have no manifest entries. Spot metadata is independent of the document
mode and does not by itself imply ICC press proofing or print-separation output.

### Frame groups

An image frame is a group whose optional `frameGeometry` is present:

```json
{
  "id": "…",
  "kind": "group",
  "name": "Frame 1",
  "childIds": ["placed-image"],
  "frameGeometry": {
    "shapeKind": "ellipse",
    "width": 320,
    "height": 180
  },
  "frameStroke": {
    "fill": {"fillKind": "color", "color": 4278190080},
    "width": 2,
    "position": "inside"
  }
}
```

`frameGeometry` uses exactly the same geometry payload as a shape layer. It
clips every child in the group’s local space and participates in the group’s
ordinary transform, opacity, blend, masks and style. `frameStroke` is optional
and uses the same stroke payload as a shape layer. The crossed placeholder of
an empty frame is editor state only and is never exported or persisted.

Children remain independent layers. Their transforms are ordinary layer
transforms; Focale initially centres and scales newly inserted raster content
to cover the complete geometry bounds without changing its aspect ratio. The
placement itself needs no extra field and is restored by the child’s existing
`transform` object.

### Shape layers

```json
{
  "id": "…",
  "kind": "shape",
  "name": "Rounded Rectangle",
  "shape": {
    "geometry": {
      "shapeKind": "rectangle",
      "width": 120,
      "height": 80,
      "cornerRadii": {"topLeft": 12, "topRight": 8, "bottomRight": 4, "bottomLeft": 0}
    },
    "extraComponents": [
      {
        "geometry": {"shapeKind": "ellipse", "width": 40, "height": 40},
        "operation": "subtract",
        "transform": {"translateX": 40, "translateY": 20, "scaleX": 1, "scaleY": 1, "rotation": 0, "anchorX": 0, "anchorY": 0}
      }
    ],
    "fill": {"fillKind": "color", "color": 4293312450},
    "stroke": {"fill": {"fillKind": "color", "color": 4278190080}, "width": 4, "dashPattern": [4, 2], "cap": "round", "join": "round", "position": "outside"}
  }
}
```

`geometry`'s `shapeKind` is `rectangle` (`width`, `height`, and optional
`cornerRadii`, whose `topLeft`, `topRight`, `bottomRight` and `bottomLeft`
values are document pixels), `ellipse` (`width`, `height`), `polygon` (`radius`,
`sides`, optional `cornerRadius`, and `rotation` in radians — three sides is
how a triangle is represented; there is no separate triangle kind), `line`
(`length`, optional `startArrowhead`/`endArrowhead`, `arrowheadWidth` and
`arrowheadLength` in document pixels, and `arrowheadConcavity` from -50 through
50), `star` (`outerRadius`, `innerRadius`, `points`, optional
`outerCornerRadius`/`innerCornerRadius`, and `rotation` in radians),
`preset` (`width`, `height`, a fallback built-in `preset` name, and optionally
the imported fields below), or `custom` (`pathId`, resolved against the
document's `paths` at paint time rather than copied, so editing that path
updates every shape layer using it). An unknown `shapeKind` falls back to a
small rectangle rather than failing the load.

A `star` is centred on its local origin. Its layer or component transform
places that centre and carries any non-uniform scaling, so editing either
radius does not translate the shape. Outer and inner corner radii apply to the
tips and indents respectively.

The built-in `preset` names are `heart`, `arrow`, `speechBubble`, `lightning`
and `check`. They identify normalized, application-owned paths and therefore
need no entry in `paths`. `custom`, by contrast, always references a real
document path by id.

An imported Custom Shape remains autonomous from the machine-wide catalogue:

```json
{
  "shapeKind": "preset",
  "width": 240,
  "height": 120,
  "preset": "heart",
  "presetId": "shape.csh.0123456789abcdef",
  "presetName": "Leaf",
  "sourceAspectRatio": 2,
  "outline": {
    "id": "shape.csh.0123456789abcdef",
    "name": "Leaf",
    "subpaths": [ … ]
  }
}
```

`outline` uses the same `VectorPath` representation documented under Paths,
but its coordinates are normalized to the source shape's reference rectangle
or, for Edit ▸ Define Custom Shape, to the selected path's rendered bounds.
Rendering scales them by `width` and `height`. `presetId` lets the properties
panel find the corresponding global entry; `presetName` keeps a readable label
after removal; and `sourceAspectRatio` controls Shift-constrained drawing. The
built-in `preset` remains a harmless fallback for readers that do not receive a
usable outline. Deleting the global preset cannot alter this embedded geometry.
The global catalogue's portable `.fshape` representation is documented in
`docs/formats/shapes.md`; it is not embedded wholesale in a project.

`extraComponents` is optional and ordered. Each entry keeps another procedural
`geometry`, the `operation` that folds it into the accumulated path (`union`,
`subtract`, `intersect` or `exclude`), and an optional decomposed `transform`
placing it in the layer's local space. Omitting `transform` means identity.
Operations are evaluated in array order, so reordering components can change
the result. Keeping each geometry procedural rather than flattening it preserves
kind-specific editing such as rectangle corner radii and polygon side counts.

`fill` and `stroke` are both optional; a shape can have either, both, or
(pointlessly, but not rejected) neither. `fill` is the same procedural content
a fill layer uses. `stroke`'s own `fill` is that same content again — a
stroke is coloured, gradient or patterned exactly like a fill is — plus
`width` in document pixels, an optional `dashPattern` (alternating drawn and
skipped lengths expressed as multiples of the stroke width; absent or empty
means solid), and `cap`/`join`
(`dart:ui`'s `StrokeCap`/`StrokeJoin` names, defaulting to `butt`/`miter` when
absent or unknown). `position` is `center`, `inside` or `outside`, defaulting
to `center`; open contours such as lines render it centred because they have no
interior or exterior.

For `line` geometry, the shaft and arrowheads form one visual Line-tool
object: `stroke` paints the shaft and supplies the content that fills the
arrowheads. The ordinary shape `fill` is ignored for that geometry. This keeps
solid, gradient and pattern strokes consistent without duplicating an
arrowhead appearance field.

### `style`

The Blending Options of a layer, absent unless something is set:

```json
{
  "fillOpacity": 0.5,
  "blendClippedAsGroup": false,
  "blendInteriorAsGroup": true,
  "transparencyShapesLayer": false,
  "knockout": "deep",
  "channels": ["r", "b"],
  "maskHidesEffects": true,
  "vectorMaskHidesEffects": true,
  "blendIf": {
    "gray": {
      "source": [0.1, 0.2, 0.8, 0.9],
      "underlying": [0, 0, 1, 1]
    }
  },
  "effects": [
    {"kind": "dropShadow", "enabled": true, "color": 4278190080, "angle": 120, "distance": 8, "size": 8,
     "spread": 0, "blendMode": "multiply", "contour": {"curve": [[0, 0], [1, 1]], "range": 1, "antiAliased": true}}
  ]
}
```

Effect contours store `curve` as normalized `[x, y]` points, with a third
component equal to `1` for a corner, plus `range` and `antiAliased`. `range` is
half of Photoshop's percentage, from 0.02 to 2, so the default 1 is
Photoshop's 50%; files written before this range accepted 0.1–1.

Effects add Photoshop's options as optional keys, each omitted at its default:
`noise` (0–1) on shadows and glows; `layerKnocksOut: false` on a drop shadow;
`technique` (`softer` or `precise`), `jitter` (0–1), `useGradient` and a
`gradient` ramp on glows; a `contour` on the satin; and on Bevel & Emboss a
`glossContour`, the `chiselSoft` technique, the `strokeEmboss` style, a `depth`
up to 10, and texture `invert`, `linkWithLayer` and `phaseX`/`phaseY`.
Gradient Overlay stores its ramp as a `gradient` object with `shape` (now
including `shapeBurst` for strokes), `angle`, `scale`, `reverse`, and optional
`alignWithLayer: false`, `offsetX`/`offsetY` (fractions of the reference bounds) and
`dither`; files storing `startColor` and `endColor` are still read as a
two-stop `encoded` ramp, preserving the original native shader interpolation. Pattern Overlay stores `pattern` and `scale` (0.01–10) with the
same optional anchoring keys as textures. A stroke filled otherwise than with
its `color` writes `fillType` (`gradient` or `pattern`). Both `gradient` and
`pattern` objects remain stored regardless of the active fill type so switching
types does not discard settings. Imported pattern resources are retained even
for disabled textures and styles captured only in layer compositions.
Unaligned gradients span the document; unlinked motifs remain anchored in
document coordinates, including under transformed ancestor groups.
Curves contain at most 256 points after normalization, including added endpoints;
imports that cannot satisfy this bound are rejected before saving. Antialiasing
smooths curve transitions over the device-pixel coverage footprint without
changing the stored points.
Legacy `profile` names remain readable when no valid curve is supplied. The
[contour library specification](contours.md) describes the curve representation
and native `.fcontour` interchange; applied styles embed the curve itself.

`fillOpacity` is written only when it is below 1, `blendIf` only when at least
one range is active, and `effects` only when at least one is configured, so a
layer without a style costs nothing. Advanced Boolean fields are also omitted
at their defaults: clipped layers blend as a group, interior effects do not,
and content transparency shapes the layer. `knockout` is absent for `none` and
otherwise contains `shallow` or `deep`. `channels` is absent when red, green
and blue all blend; when present, it lists only the enabled `r`, `g` and `b`
channels. `maskHidesEffects` and `vectorMaskHidesEffects` are written only when
true.

`blendInteriorAsGroup` changes the placement of Pattern, Gradient and Color
Overlay, Satin, and Inner Glow. When true, these effects join the content
before the layer blend mode; when false, they retain their own blend modes over
the already-blended pixels. Drop Shadow and Outer Glow remain behind the pixel
plane, while Inner Shadow, Bevel & Emboss, and Stroke remain above it.
`transparencyShapesLayer` controls the source shape of effects and knockout:
true uses content alpha, while false uses the opaque rectangular content extent
before raster and vector masks are applied.

`blendIf` may contain `gray`, `red`, `green`, and `blue`. Each channel may
contain a `source` range evaluated against the current layer and an
`underlying` range evaluated against the composited layers below it. A range
stores normalized shadow-start, shadow-end, highlight-start, and highlight-end
handles in that order. Handles must be ordered from 0 through 1; malformed
ranges become neutral. Equal handle pairs form a hard threshold, while split
pairs interpolate opacity linearly. Neutral channels and ranges are omitted.

Effects are stored **inline and keyed by kind**, at most one of each, for the
same reason the adjustment stack is inline: an effect has no identity outside its
layer. `enabled` is stored separately from presence — unticking an effect keeps
its settings — and an effect of an unknown kind is skipped on read, losing that
one effect rather than the whole project. Built-in patterns keep their
procedural name. Imported patterns keep a content-derived identifier resolved
through the matching `patterns/` entry. Configured disabled effects are
included when collecting these dependencies, because enabling one after load
must reproduce its saved appearance.

### Imported pattern assets

Every imported pattern referenced by a fill layer, shape fill or stroke,
Pattern Overlay, or Bevel Texture is stored once as
`patterns/<content-id>.fptile`. The internal entry contains a bounded zlib
payload with its identity, dimensions and straight-alpha RGBA bytes; the ZIP
stores it without a redundant second compression pass. Built-in patterns and
unused global catalogue entries create no archive entry.

The content identity and decoded byte count are revalidated before a GPU image
is created. A missing, malformed or mismatched referenced entry corrupts the
project instead of silently changing it to the checker pattern. The internal
`.fptile` representation is not an interchange format; `.fpattern` is the
portable pattern-library format documented in `docs/formats/patterns.md`.

### `transform`

Stored decomposed rather than as a raw matrix (see ADR 0003):
`translateX`, `translateY`, `scaleX`, `scaleY`, `rotation` (radians),
optional `shear` and `flipX` / `flipY`, and `anchorX` / `anchorY`.

Composed as `translate ∘ anchor ∘ rotate ∘ shear ∘ scale ∘ flip ∘ -anchor`.
Scales are always positive; mirroring lives in the flip flags.

`shear` is written only when non-zero, so transforms saved before it existed read
back unchanged. It is not user-editable: it exists so that composing an outside
transform onto a layer — a non-uniform Image Size over a rotated layer — stays
exactly representable instead of being approximated.

## Validation on load

A project is rejected with a readable error, never partially loaded, when:

* `format` is not `"focale"`;
* `version` is greater than the version this build understands
  (`ProjectVersionUnsupported`, not "corrupted" — the file is fine, the app is old);
* the root layer is missing or is not a group;
* a layer id referenced by a group does not exist;
* a layer is not reachable from the root;
* the tree contains a cycle;
* an artboard is not a direct root child, contains another artboard, has invalid
  geometry, or combines incompatible group semantics;
* a layer-composition index is inconsistent or contains a blank composition
  name;
* a referenced `raster/`, `masks/`, `channels/` or imported `patterns/` entry is absent from
  the archive;
* a raster has both `.png` and `.fcraster` entries, uses malformed canonical
  samples, or does not match the document format required by its owning raster
  layer;
* an imported pattern entry has invalid dimensions, decompressed length or a
  content identity different from its manifest reference.

Individual field problems degrade instead of failing: an unknown blend mode
becomes `normal`, an out-of-range opacity is clamped, a malformed transform
becomes the identity.

### Rich text ranges

A text layer's `content` keeps `fontFamily`, `fontSize`, `fontWeight`, `italic`,
`fauxBold`, `fauxItalic`, `underline`, `strikethrough`, `color`, `tracking`, `tsume`,
`allCaps`, `smallCaps`, `noBreak`, `standardVerticalRomanAlignment`,
`tateChuYoko`, `mojisoroe`, `openTypeFeatures`, `stylisticSets`, `baselineShift`, `horizontalScale`,
`verticalScale`, `kerningMode` and `language` as its base character style.
`fontWeight` and `italic` request real font variants; the two `faux` flags
preserve synthetic font effects independently. Lengths are document-space
pixels; `tracking` and the range-only `manualKerning` use 1/1000 em, while
`tsume` and both scale values are ratios.

`kerningMode` is `metrics`, `optical` or `none`. Metrics keeps the selected
font's pair data, while `none` disables its `kern` feature. Optical kerning
uses Focale's deterministic Roman side-profile approximation because Flutter
does not expose synchronous glyph-outline bounds; it works across adjacent
character-style ranges without altering the source text. An absent
`manualKerning` keeps that automatic mode. A present value overrides it for the
single following pair, including an explicit zero that disables automatic
pair kerning. Tracking remains cumulative with either automatic or manual
kerning. Newly inserted graphemes inherit the surrounding character style but
never duplicate a manual boundary value.

`tsume` defaults to `0` and is clamped from `0` to `1`, matching the Character
panel's 0–100% value. It compresses the estimated removable side space around
each glyph without scaling its outline. The compositor and in-place editor use
the same Unicode-class estimate because Flutter does not expose synchronous
glyph ink bounds. In vertical text, the value affects the top-to-bottom advance.

`noBreak` prevents automatic wrapping inside the affected character range but
does not remove explicit newlines. `standardVerticalRomanAlignment` defaults to
`true`. In vertical text it keeps eligible half-width Roman glyphs upright;
`false` turns them sideways without rotating full-width East Asian characters
or changing the layer's own flow. It is ignored by horizontal layout. Vertical
East Asian glyphs request the font's `vert` and `vrt2` substitutions at render
time; those derived requests are not stored separately. `openTypeFeatures` is
an ordered JSON list whose supported names are `standardLigatures`, `contextualAlternates`,
`discretionaryLigatures`, `swash`, `stylisticAlternates`, `titlingAlternates`,
`oldStyleFigures`, `ordinals`, `fractions`, `caseSensitiveForms` and
`ornaments`. An absent base list enables standard ligatures and contextual
alternates; an explicit empty list disables every listed substitution.
Unsupported features remain stored and are ignored by the current font.

`tateChuYoko` defaults to `false`. In vertical text, consecutive enabled
graphemes are composed as one horizontal inline block and remain one atomic
unit when columns wrap. Character ranges inside that block keep their other
formatting and every source grapheme retains its own editing geometry. The
field is preserved but has no visual effect in horizontal text.

`mojisoroe` defaults to `romanBaseline`. Other supported values are
`emBoxTopRight`, `emBoxCenter`, `emBoxBottomLeft`, `icfBoxTopRight` and
`icfBoxBottomLeft`. Horizontal text aligns smaller runs against the largest em
used by their visual line; vertical text maps top/right and bottom/left onto
the column's cross axis. ICF values use a bounded inset because Flutter does not
expose the selected font's ideographic character face. The stored choice is
nevertheless lossless and may be rendered more exactly by a future font-metric
backend.

`stylisticSets` is an ordered JSON list containing any of `set01` through
`set20`. Each name maps to the matching standard OpenType tag `ss01` through
`ss20`; several sets may be active on the same character range. An absent or
empty base list enables none. A font that lacks a requested set ignores it at
render time without removing it from the document.

`fontVariations` is an ordered JSON list of `{ "tag": string, "value":
number }` entries. The tag is the four-character identifier from the OpenType
`fvar` table, such as `wght`, `wdth` or `opsz`; the value is its signed 16.16
coordinate represented as a JSON number. Repeated tags keep their final value.
Unknown axes remain stored so the intended appearance returns when the original
font becomes available, while a font without that axis simply ignores the
coordinate. Character-style ranges may override the base list independently.

`glyphAlternate` is an optional `{ "tag": "salt", "value": 2 }` selector.
The tag contains four printable ASCII characters and the integer value is
between 0 and 65535; positive values select an alternate and zero disables that
feature. This last feature override is passed to the font shaper, never inserted
as a Unicode scalar. The base defaults to `null`. Resolved character-style maps
explicitly write `null` to reset a base selector on a range. Unsupported fonts
ignore the selector at rendering time but the native archive retains it. PSD/PSB
export currently rasterizes text requiring such a selector (ADR 0247).

`language` selects the dictionary used when the containing paragraph enables
hyphenation. It stores a BCP 47 tag; the supported values are `en-US` (the
default), `en-GB` and `fr`. It does not translate or alter the stored text.
During horizontal composition, Focale inserts discretionary soft hyphens into
the rendering copy only, so selection offsets and saved content remain
unchanged.

Optional `styleRanges` override that base for selected characters. Each entry
contains `start` (inclusive UTF-16 offset), `end` (exclusive UTF-16 offset), and
a fully resolved `style` map with the same character fields plus
`manualKerning`. Invalid or out-of-bounds ranges are ignored. Ranges should
follow grapheme boundaries; the editor guarantees this for manual kerning. The
field is omitted rather than serialized as `null` when no manual override is
active.

`layoutMode` distinguishes `point` text, which grows from an insertion point,
from `paragraph` text, which flows and clips inside positive `boxWidth` and
`boxHeight` dimensions. `point` is the default and has no box fields. A malformed
paragraph frame degrades to point text rather than producing an invalid layer.

Optional `flow` keeps editable text attached to layer-local vector geometry. It
contains:

* `kind`: `alongPath` or `insideShape`;
* `path`: a complete embedded `VectorPath` snapshot whose id and name are
  normalized on load;
* `subpathIndex`, `startOffset` and optional `endOffset` for the selected
  baseline contour;
* `flipped` and `baselineOffset` for the direction and side of path text;
* `inset` for text constrained inside a closed shape.

Distances use document-space pixels. `alongPath` requires a non-zero contour
but may legitimately have zero-width or zero-height bounds. `insideShape`
requires at least one closed contour and derives missing paragraph dimensions
from the embedded path bounds. The geometry is copied into the text layer, so
editing or deleting the Paths-panel source cannot change an existing text
layer. A valid flow disables warp fields: the two geometric deformations cannot
be active at once, and hostile input is normalized to flow plus no warp.

The base paragraph style contains:

* `alignment`: `left`, `center`, `right`, `justify`, `justifyLastCenter`,
  `justifyLastRight` or `justifyAll`;
* `composerMode`: `everyLine` (the default) or `singleLine`;
* `asianLeadingMode`: `typewriter` (the bottom-to-bottom default) or
  `typographic` (top-to-top);
* `mojikumi`: `none` (the default), `set1`, `set2`, `set3` or `set4`;
* `kinsoku`: `none` (the default), `jisWeak` or `jisMaximum`;
* `kinsokuShori`: `pushInFirst` (the default), `pushOutFirst` or
  `pushOutOnly`;
* `burasagari`: `none` (the default), `regular` or `force`;
* `leftIndent`, `rightIndent`, `firstLineIndent`, `paragraphSpaceBefore` and
  `paragraphSpaceAfter`, in document-space pixels;
* `hyphenation`, using the dictionary of each resolved character range to
  propose line-break positions without modifying the stored text;
* `hyphenationSettings`, containing `wordsLongerThan` (2–25, default 5),
  `afterFirst` (1–15, default 2), `beforeLast` (1–15, default 2), `limit`
  (2–25, default 2), `hyphenationZone` (0–2000 document pixels, default 0)
  and `capitalWords` (default `true`). The base object is omitted when every
  value has its default;
* `listStyle`, omitted for ordinary paragraphs and otherwise containing `kind`
  (`bullet` or `numbered`), `bullet`, `numberStyle` (`decimal`, `lowerAlpha`,
  `upperAlpha`, `lowerRoman` or `upperRoman`), `startAt`, `indent` and
  `markerGap`.

List markers are generated during layout and are not inserted into `text`.
Consequently all UTF-16 character and paragraph ranges continue to address only
user-authored content. Numbering restarts when a contiguous run changes list
style or returns to an ordinary paragraph.

`wordsLongerThan`, `afterFirst`, `beforeLast` and `capitalWords` constrain only
dictionary-generated break points. `limit` caps consecutive horizontal lines
ending at automatic hyphens through bounded reflow. A U+00AD already present in
source text remains an explicit author choice, is never removed by that
fallback and prevents additional dictionary breaks inside its word.
`hyphenationZone` marks a trailing area where automatic breaks are forbidden
for non-justified, boxed horizontal text using `singleLine`; zero allows every
dictionary-approved position. `everyLine` ignores that zone and performs one
bounded paragraph-wide alternative layout when a used automatic hyphen can be
removed without increasing overflow, emergency word breaks or overall
raggedness. Both modes retain Skia shaping, so their exact break choices are a
portable approximation of Adobe's proprietary composers.

`asianLeadingMode` changes only how the leading above the first horizontal
line is measured. `typographic` aligns that line with the paragraph's top;
`typewriter` retains the baseline-derived space. The distance between later
lines is unchanged. Vertical layout preserves but ignores this field.

Mojikumi adjusts punctuation advances without scaling glyphs. Set 1 uses
half-width Japanese punctuation, Set 2 uses a conservative line-ending
compression, Set 3 keeps native full-width punctuation and Set 4 also expands
supported half-width punctuation to a full cell. Flutter does not expose final
line glyph runs to the editable text span builder, so Set 2 is a deterministic
bounded approximation rather than Adobe's private spacing table.

An active Kinsoku table inserts U+2060 WORD JOINER only into the horizontal
rendering copy at prohibited boundaries; the source text and UTF-16 range
offsets stay unchanged. Vertical composition enforces the same boundary table
while forming columns. `jisMaximum` additionally protects small kana and long
vowel marks that `jisWeak` leaves unrestricted. Kinsoku Shori chooses whether a
bounded quarter-em pull-in is attempted before or after moving content to the
next line; `pushOutOnly` never receives that allowance.

Burasagari is effective only when `kinsoku` is not `none`. `regular` reserves
up to half an em and `force` one em beyond the trailing edge for eligible
single- and double-byte periods or commas. That paint overflow is included in
the text layer's measured bounds so tiled rendering does not clip it, while the
stored paragraph frame retains its original dimensions.

For vertical type, the same orientation-independent alignment values mean top,
middle, bottom, justify-last-top, justify-last-middle,
justify-last-bottom and justify-all. Left and right indents likewise become top
and bottom indents in the interface. `firstLineIndent` may be negative; this
creates a hanging first line relative to the paragraph's ordinary leading
indent.

Optional `paragraphStyleRanges` override that base for individual
newline-delimited paragraphs. Each entry stores a paragraph's `start`, its
newline-inclusive `end`, and a fully resolved `style` map containing the fields
above. The final empty paragraph may have `start == end`. Invalid boundaries or
ranges that no longer match a complete paragraph are ignored.

The remaining layer-wide layout fields are `lineHeight`, `autoLineHeight`,
`absoluteLineHeight`, `orientation` (`horizontal` or `vertical`),
`antiAliasing` (`none`, `sharp`, `crisp`, `strong` or `smooth`), `warpStyle`,
`warpOrientation`, `warpBend`, `warpHorizontalDistortion` and
`warpVerticalDistortion`. The editable warp-style names are `none`, `arc`,
`arcLower`, `arcUpper`, `arch`, `bulge`, `flag`, `wave` and `squeeze`.

`layoutMode`, paragraph ranges, `orientation`, `antiAliasing`, warp values,
`noBreak`, `standardVerticalRomanAlignment`, `tateChuYoko`, `tsume`,
`mojisoroe`, `asianLeadingMode`, `mojikumi`, `kinsoku`, `kinsokuShori`,
`burasagari`, `openTypeFeatures`,
`stylisticSets`, `fontVariations`, `listStyle`, `flow`, `language` and the
remaining non-default fields are written
only when they differ from their defaults. Ordinary point text therefore stays
compact. A fully resolved entry in `styleRanges` writes its own Roman-alignment
value even when it is `true`, so it can override a `false` base style.

## Slices

Export slices are persistent document metadata included in public version 1. They
do not affect rendering and the currently selected slice remains transient
editor-session state. Authored entries may be ordinary user slices or
declarations whose live geometry follows a layer.

```json
{
  "slices": {
    "order": ["slice-1", "slice-2"],
    "slices": [
      {
        "id": "slice-1",
        "name": "Slice 1",
        "left": 120,
        "top": 80,
        "width": 640,
        "height": 360,
        "webOptions": {
          "url": "https://example.com/gallery",
          "target": "_blank",
          "messageText": "Open gallery",
          "altText": "Gallery preview",
          "backgroundColor": 4294967295
        }
      },
      {
        "id": "slice-2",
        "name": "Navigation",
        "left": 0,
        "top": 0,
        "width": 320,
        "height": 80,
        "origin": "layer",
        "sourceLayerId": "navigation-layer",
        "webOptions": {
          "contentType": "noImage",
          "text": "<nav>…</nav>",
          "textIsHtml": true,
          "horizontalAlignment": "center",
          "verticalAlignment": "middle"
        }
      }
    ]
  }
}
```

`order` contains stable identifiers and controls display, export, and stacking
order: its first identifier is at the back and its final identifier is at the
front. An absent `origin`, or `"origin": "user"`, owns the serialized rectangle
directly. `"origin": "layer"` requires a non-empty `sourceLayerId`; its
rectangle is the last-known fallback, while overlays, snapping, properties and
export derive current pixel-aligned bounds from the source layer's rendered
content. A malformed layer origin safely becomes a user slice. Deleting a
source layer removes its slice in the same undoable command; promoting the
slice writes its current rectangle and removes the relationship.

Authored slices may overlap and are exported using their complete resolved
rectangle. Coordinates and dimensions are document-space numbers. Missing or
malformed slice data degrades to an empty collection; unknown ids and duplicate
ids in `order` are ignored, and valid slices omitted from `order` are appended.

`webOptions` is absent for the default image slice. `contentType` is `image` or
`noImage`; image entries may carry `url`, `target`, `messageText`, `altText` and
an optional packed ARGB `backgroundColor`. No-image entries additionally carry
`text`, `textIsHtml`, `horizontalAlignment` (`browserDefault`, `left`, `center`,
`right`) and `verticalAlignment` (`browserDefault`, `top`, `baseline`, `middle`,
`bottom`). Empty strings, false booleans, default alignments and absent colours
are omitted. Focale's current image-by-slice export skips no-image entries; the
metadata is consumed by the Save for Web workflow described by ADR 0061. It
does not change the rendered `.focale` document itself.

Automatic coverage and visible sub-slices are derived by partitioning the
document at resolved authored-slice boundaries. Each partition region belongs
to the frontmost covering authored slice; regions without an owner are
automatic. The
derived rectangles are deliberately absent from this format and are
recalculated whenever the document geometry, user slices, or stacking order
change.

## Frame animation

An optional animation orders persistent layer-visibility presentations without
duplicating raster data in the manifest:

```json
{
  "animation": {
    "loopCount": 0,
    "frames": [
      {
        "id": "frame-1",
        "name": "Frame 1",
        "durationMilliseconds": 120,
        "layerVisibility": {
          "frame-layer-1": true,
          "frame-layer-2": false
        }
      },
      {
        "id": "frame-2",
        "name": "Frame 2",
        "durationMilliseconds": 340,
        "layerVisibility": {
          "frame-layer-1": false,
          "frame-layer-2": true
        }
      }
    ]
  }
}
```

`frames` is the presentation order and contains between 1 and 1,000 entries.
Frame ids are stable, non-empty and unique; names are non-empty. A duration is
an integer from 0 through 655,350 milliseconds, matching the range of the
initial GIF interchange. A `layerVisibility` key never names the root layer;
writers omit keys naming layers the document no longer contains, and readers
drop such keys instead of rejecting the project, since they affect no
presentation. Layers omitted from that map retain their authored visibility,
which allows shared overlays to appear in several frames without rewriting the
whole sequence. Imported GIFs therefore store at most two entries per frame:
hiding the first frame's layer and showing the frame's own one.

`loopCount` follows the Netscape GIF convention: omission means one initial
pass, zero means indefinitely, and a positive value counts repetitions after
the initial pass. Imported GIFs use one complete canvas raster layer per frame;
ordinary shared layers remain valid as well. Playback selection, elapsed time
and playing state are editor-session data and are never serialized. Rendering
projects a frame's visibility onto a transient document, leaving authored
layer flags, document revision and undo history unchanged.

## Layer compositions

Layer compositions are ordered, named snapshots of selected layer properties.
They reference the live layer tree and never duplicate raster pixels:

```json
{
  "layerComps": {
    "order": ["comp-mobile", "comp-desktop"],
    "comps": [
      {
        "id": "comp-mobile",
        "name": "Mobile",
        "comment": "Compact navigation",
        "options": {
          "visibility": true,
          "position": true,
          "appearance": false
        },
        "layers": {
          "title": {
            "visible": true,
            "position": [24, 32]
          },
          "desktop-navigation": {
            "visible": false,
            "position": [0, 0]
          }
        }
      }
    ]
  }
}
```

`order` lists every composition exactly once in panel order. A composition id
is stable; its `name` is non-empty and `comment` is optional. The three capture
options independently select visibility, position, and appearance. Position is
the layer transform's translation in its immediate parent's coordinate space.
Appearance stores `opacity`, `blendMode`, the `passThrough` Boolean for groups,
and the complete inline `style` payload described above. Unselected property
families are omitted from each layer state and remain unchanged when the
composition is applied.

Document-wide crop, canvas resize, image resize, rotation and reflection map
captured positions alongside the affected root layers. Reparenting maps the
moved layer from its former parent space into its new one; dissolving an
artboard similarly rebases each captured child position, including layouts
that stored an alternate artboard position.

Captured layer ids may outlive the corresponding layer. They are retained so
the Layer Compositions panel can report an incomplete restore and let the user
clear the stale entries explicitly. Malformed compositions and layer states are
ignored on read; duplicate ids keep their first valid occurrence, and valid
compositions absent from `order` are appended. Writers reject inconsistent
indexes and blank names. “Last Document State”, the selected row, and restore
warnings are editor-session state and are never serialized.

## Variables and data sets

Variables bind replaceable document properties to stable layer identities.
Data sets are ordered, named rows whose values are keyed by variable identity:

```json
{
  "variables": {
    "definitions": [
      {
        "id": "variable-title",
        "name": "Title",
        "layerId": "title-layer",
        "kind": "textReplacement"
      },
      {
        "id": "variable-photo",
        "name": "Photo",
        "layerId": "placed-photo",
        "kind": "pixelReplacement"
      }
    ],
    "dataSets": [
      {
        "id": "data-set-one",
        "name": "First card",
        "values": {
          "variable-title": "Night study",
          "variable-photo": "/images/night.tif"
        }
      }
    ],
    "activeDataSetId": "data-set-one"
  }
}
```

`kind` is `visibility`, `textReplacement`, or `pixelReplacement`. Visibility
values use Boolean text; text replacement stores the complete editable text;
pixel replacement stores a user-selected placed-source path. An unavailable
path is retained so the user can repair it instead of losing the authored
value. The active identity is optional and is accepted only when it names a
stored data set.

Definitions and data sets are persisted in their array order. Their non-empty
ids must be unique. Readers retain the first valid occurrence, discard values
for unknown definitions, and cap definitions at 4,096, data sets at 65,536,
names and identifiers at 1,024 characters, and individual values at one MiB.
The Variables dialog's CSV import and export is external interchange and does
not add archive entries.

## Guides

Authored guides are persistent, non-printing document metadata. They affect
editor alignment only and never enter the composited or exported image.

```json
{
  "guides": {
    "order": ["guide-1", "guide-2"],
    "guides": [
      {
        "id": "guide-1",
        "orientation": "vertical",
        "position": 320
      },
      {
        "id": "guide-2",
        "orientation": "horizontal",
        "position": 180,
        "color": 4294901760
      }
    ]
  }
}
```

`position` is a finite document-space coordinate in pixels. It is an x
coordinate for `vertical` and a y coordinate for `horizontal`. A temporarily
negative coordinate is valid: retaining an off-canvas guide makes canvas
resize, undo and redo reversible. `color` is an optional packed 32-bit ARGB
integer; absent or invalid values use Focale's default guide blue. `order`
contains stable identifiers from oldest to newest. Malformed guides, unknown
ids and duplicate order entries are ignored, while valid guides omitted from
`order` are appended. Grid configuration is a user preference and is not part
of the project archive.

## Count groups

Count Tool markers are persistent, non-printing document metadata. They appear
in the editor and Measurement Log but never enter the composited or exported
image.

```json
{
  "counts": {
    "order": ["count-group-1"],
    "groups": [
      {
        "id": "count-group-1",
        "name": "Cells",
        "color": 4294901760,
        "markerSize": 4,
        "labelSize": 14,
        "markers": [
          {"id": "count-1", "x": 128.5, "y": 96.5},
          {"id": "count-2", "x": 212.5, "y": 104.5}
        ]
      }
    ]
  }
}
```

Group and marker ids are stable strings. Marker coordinates are finite document
pixels and follow document crop, resize, rotation and reflection operations.
`visible` defaults to `true`; `color` defaults to Focale's count red;
`markerSize` is clamped to 1–10 screen pixels and `labelSize` to 8–72 screen
pixels. `order` lists every group exactly once. Readers accept at most 256
groups and 100,000 markers, names contain at most 80 characters, and malformed
or duplicate entries are ignored. The active group is editor-session state and
is deliberately absent from the archive. Writers reject inconsistent group
indexes, duplicate marker ids, out-of-range styles and non-finite coordinates
before creating the archive.

## Compatibility policy

Version 1 is the first public persistence baseline and includes the complete
layout described in this document, including exact rasters, placed content,
colour profiles, animation and document metadata. Readers reject versions above
1. Future incompatible layout changes must increment the format version and
have an explicit migration policy; optional additions retain documented defaults.

Unreleased development numbers 1–10 are not public compatibility versions.
Current development version-10 archives can be converted once with
`tool/persistence/reset_release_versions.py`, including nested editable projects,
without changing their authored metadata or binary image payloads. Dependent
`editableDocumentByteLength` values follow the converted nested archive lengths.
Older development
layouts must first be saved by a compatible development build. See
[Persistence baseline](persistence-policy.md) and [ADR 0265](../adr/0265-first-release-persistence-baseline.md).

In particular, shared tile objects from [ADR 0157](../adr/0157-shared-archive-tile-objects.md)
replace the earlier per-occurrence tile layout. Tiled descriptors without the
required `objects` array are no longer supported. Portable saves remain
self-contained; the managed checkpoint format is internal recovery storage.

### Public version history

* **1** — complete first-release layout, formerly development version 10.

### Unreleased development history

These numbers are historical and are rejected by public readers above version 1.

* **1** — initial archive, raster/group/text layers and one `locked` flag.
* **2** — optional `maskOffset`, notably for group masks.
* **3** — adjustment and fill layer kinds, independent layer locks and linked
  movement groups.
* **4** — shape layer kind and document-level vector paths.
* **5** — vector masks (`vectorMaskId` and `vectorMaskEnabled`), attachable to
  any layer alongside its existing raster mask.
* **6** — persistent named export slices and their ordering, clipping-group
  membership, pass-through groups and inverted vector masks.
* **7** — placed layers, shared embedded or linked source metadata, retained
  four-corner placement and raster previews.
* **8** — separate immutable source and derived display previews for placed
  content, including source geometry and the display raster's local offset.
* **9** — RGB or CMYK document modes, 8/16/32 Bits/Channel, compatible profile
  metadata and exact `.fcraster` storage for every non-RGB8 raster asset.
* **10** — typed built-in, embedded ICC and mode-specific profile descriptors;
  portable ICC payloads; native Grayscale, Lab, Indexed, Bitmap, Duotone and
  Multichannel rasters; and an exact per-raster profile table for placed source
  and display previews. The special-mode additions are optional descriptor
  variants and therefore do not change the manifest version.

Imported pattern references and their `patterns/` assets are optional fields,
so they do not require a version bump under the policy above.
Live gradient `placement` and `dither`, and structured-stop `midpoint`, are
optional for the same reason.
Document `measurementScale` is also optional and therefore does not require a
version bump.
Persistent `counts` are optional for the same reason.
Persistent `channels` and their `channels/` assets are optional for the same
reason.
The optional group-level `measurementScaleMarker` semantic flag likewise does
not require a version bump.
Editable artboards and the optional document-level `layerComps` collection are
also additive fields included in public version 1.
The optional document-level `animation` sequence is additive as well; older
readers safely retain the authored first-frame layer visibility and ignore its
timing metadata. It is included in public version 1.

### The rename from `.toneva`

The app was called Toneva until 0.1.0, and its projects carried the `.toneva`
extension and a `"toneva"` format tag. Both changed with the name, and nothing
was kept to read the old ones: the archive layout is byte-for-byte identical, so
compatibility would have cost one entry in a list — but carrying a legacy before
the first release buys nothing, and an unreadable file is a clearer answer than
a silently migrated one. A pre-rename project can still be salvaged by hand:
unzip it, change `"format"` to `"focale"` in `manifest.json`, and zip it back.

## Independent raster tiles

Multi-tile engine rasters may use `raster/<escaped-id>.fctiles` instead of
`raster/<escaped-id>.png` or `.fcraster`. The same convention applies to the
mask and channel directories. The three payload forms are mutually exclusive.

The UTF-8 JSON descriptor (maximum 1 MiB) contains integer `width`, `height`,
`bits`, the `colorMode` enum name and `tiles`, an array of `[x, y, width, height]`
integer rectangles, plus an `objects` array containing one archive path per
rectangle in matching order. Tiles partition the complete image in row-major order,
without overlap or gaps. Every tile in a row has the same height. Tile axes are
at most 4096 pixels. The descriptor's format must match the expected raster
format, and its complete decoded size must fit the remaining project budget.
Profiles retain their existing manifest/profile-entry interpretation.

Tile number `i` references `objects[i]`, matching the exact path grammar
`objects/raster/(0|[1-9][0-9]{0,3}).fcraster`. Each unique object is stored once,
using the existing exact canonical container, including for sRGB RGBA8 tiles. Each
payload must match its declared rectangle dimensions and descriptor format.
References can be shared across descriptors and rectangles of equal dimensions.
The existing 10,000-entry archive limit counts each object once. The decoded
memory limit still counts each complete logical raster independently. Readers validate
the entire partition before decoding, decode one tile at a time and publish the
restored raster only after all tiles succeed. A missing or corrupt tile aborts
the restoration and releases the staging raster.

During one opening, the reader may retain up to 16 MiB of validated canonical
tile payloads in a reclaimable least-recently-used cache (at most 4,096 entries).
Keys include object path, dimensions, pixel format and colour profile. Cache
hits expose immutable pixels; each consumer still reserves its borrowing
lifetime and each logical raster still counts towards the decoded-memory limit.
Misses retain all payload validation. Failures are not cached; oversized tiles
bypass retention. Memory pressure and archive closure clear retained payloads.
Entries are never reused across openings. This changes reader implementation,
not the archive format or the independence of restored editable rasters.

The disk encoding cache identifies tiles by immutable backing identity, shape,
format and profile. Editing one tile re-encodes that tile; unchanged encoded
files are reused. A per-save dictionary identifies shared objects with the same
backing, shape, format and profile, so copy-on-write clones do not repeat their
payloads in the archive. Independent equal contents are not hashed for this
optimization. Portable archives remain self-contained, with one copy of every
referenced object at each save.

## Managed differential recovery checkpoints

Ordinary project saves and nested editable documents are self-contained ZIPs.
Only the managed recovery writer may omit large payload entries and add a
`checkpoint-objects.json` entry instead. It retains the document manifest,
raster tile descriptors, ICC profiles and preview inside the checkpoint ZIP.
This internal file must stay beside its managed object store; saving a restored
document normally produces a portable `.focale` again.

The reference directory is UTF-8 JSON, limited to 2 MiB:

```json
{
  "owner": "c2Vzc2lvbg",
  "entries": {
    "objects/raster/0.fcraster": ["<64 lowercase SHA-256 hex digits>", 12345]
  }
}
```

`owner` is the recovery session's base64url filename component, without padding
(1–512 ASCII letters, digits, `_` or `-`). Each logical entry maps to the SHA-256
of its exact encoded payload and its byte length. Files live at
`.objects/<owner>/<digest>.object` relative to the checkpoint's parent directory.
The reference directory cannot provide arbitrary filesystem paths. Readers
reject symbolic links in the object root, session directory and payload file.

External logical names are restricted to `raster`, `masks`, `channels`, `placed`,
`placed_documents`, `patterns` and `objects` namespaces. Empty, `.` and `..` path
components and backslashes are rejected. Embedded and external entries cannot
collide. The combined logical entry count is at most 10,000, each object at most
512 MiB, and the sum of referenced encoded payloads at most 1 GiB. Existing
descriptor, raster format, profile, canonical sample and total decoded-pixel
limits also apply. Readers reserve memory before loading an object, check its
length and digest, then run its normal format decoder. A matching digest never
replaces format validation.

Writers flush each new immutable object before atomically publishing the
checkpoint ZIP. Only then is the recovery database record advanced. The next
checkpoint references unchanged objects without copying them again. The
disposable encoding cache remains separate and may be cleared on startup.
Its bytes and the persistent objects both count against recovery disk quotas.

Collection retains the union of every published checkpoint's references for
the session, including checkpoints not yet recorded in the database. Corrupt
reference metadata aborts collection. Failed writes can leave unreferenced
objects or temporary files; a later successful collection removes them. Pruning
always preserves the current and newest published checkpoint, then collects
objects that no retained checkpoint references.

## Browser portability

Browser working copies use origin-private storage; explicit saves download the
same `.focale` container used on desktop. All 64-bit little-endian lengths and
ZIP64 offsets are combined from two 32-bit words on JavaScript targets. Values
above `2^53 - 1` are rejected before access rather than rounded. This does not
change the archive or `.fcraster` byte layout. Canonical 16-bit and float32
samples are serialized directly, independently of browser display readback.
Pattern and sampled-brush content identifiers use exact low-32-bit products on
both native and JavaScript runtimes, preserving references across platforms.

## Independent settings exchange

The applied document representations above are also exchangeable independently through [adjustment presets](adjustments.md), including `.fblackandwhite` and `.fcolorlookup`, [`.fduotone`](duotone.md) ink specifications and [`.fcameraraw`](camera-raw.md) development recipes. These files do not change the project container version.
