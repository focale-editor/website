# Pattern preset libraries

[Documentation](../README.md) · [File formats](README.md)

Focale keeps reusable patterns independently from documents. Every pattern
selector shows the built-in patterns and the imported catalogue.
Its footer imports `.fpattern` or Photoshop `.pat` libraries and offers
separate `.fpattern` and `.pat` exports for the whole mutable catalogue.

## Built-in patterns

The patterns Focale ships are themselves a native bundle,
`assets/presets/patterns.fpattern`, decoded once at startup. Being loaded from
the application rather than from the user's library is what makes a preset
built-in: it cannot be removed or exported, and neither it nor its tile is
written to the saved catalogue, a document or another preset library.

Each preset identifier in that file is `builtin.` followed by the stable name
documents and settings store: `checker`, `dots`, `grid`, `diagonalLines`,
`crossHatch` and `noise`. A name starts with a letter and continues with up to
63 letters, digits, `_` or `-`. The file names its tiles by content like any
bundle, but references use the name, so a tile can be redrawn without touching
the documents that name it. The interface translates a built-in name by
identifier and falls back to the English `name` of the file.

A reader keeps a well-formed built-in name it does not ship and draws it as the
shipped `checker` tile, as it does for any tile it cannot find. A file written
by a later version therefore loses nothing when an earlier one saves it again.
The catalogue is the only description of these tiles: the `noise` tile is also
the grain that the Noise option of shadows and glows thins coverage with, and
should the catalogue itself be unreadable, every pattern draws plain white. See
[ADR 0291](../adr/0291-built-in-presets-as-native-assets.md).

## Defining a pattern from a document

**Edit ▸ Define Pattern…** captures the visible composite inside one
hard-edged rectangular selection. Like Photoshop, the command is unavailable
for ellipses, lassos, disjoint selections or any selection with feathering. If
nothing is selected, Focale uses the complete document, matching the whole-image
Pattern Preview workflow. The document and selection remain unchanged.

The captured tile preserves straight-alpha RGBA pixels; no colour-to-greyscale
conversion is performed. Its identifier is derived from dimensions and bytes,
so defining identical pixels under several names reuses one stored file and one
predecoded GPU image. Locally defined tiles use the same dimension, pixel and
catalogue-memory limits as PAT and `.fpattern` imports. Adobe documents the
rectangular selection with Feather set to zero here:
<https://helpx.adobe.com/photoshop/desktop/repair-retouch/clean-restore-images/define-an-image-as-a-preset-pattern.html>,
and the whole-document Pattern Preview workflow here:
<https://helpx.adobe.com/photoshop/desktop/apply-painting-techniques/create-fill-with-patterns/create-a-new-pattern.html>.

## Editing a stored pattern

Pattern presets are flattened tiles, as they are in Photoshop; neither PAT nor
`.fpattern` retains the layers from the document that originally created one.
The pencil action beside any catalogue entry opens an independent raster copy
at the tile's native dimensions and enables **View ▸ Pattern Preview** for that
new document. Built-in patterns open at the native size of their tile too.

Edits affect only the new document. **Edit ▸ Define Pattern…** stores the
result as a new preset, so an imported library and every existing document that
references the original tile remain unchanged. This completes the documented
document-first workflow without implying that an opaque preset contains a
recoverable layered source.

## Native `.fpattern` format

`.fpattern` is a portable UTF-8 JSON bundle. Version 1 stores preset metadata
separately from deduplicated straight-alpha RGBA tiles:

```json
{
  "format": "focale-pattern-presets",
  "version": 1,
  "presets": [
    {
      "id": "user.example",
      "name": "Blue fabric",
      "patternId": "pattern.2.1.9e2b63675440c0d9",
      "groupPath": ["Materials", "Fabric"]
    }
  ],
  "assets": [
    {
      "id": "pattern.2.1.9e2b63675440c0d9",
      "width": 2,
      "height": 1,
      "rgba": "ChTI/8zq/4A="
    }
  ]
}
```

`rgba` is row-major Base64 with four red, green, blue and alpha bytes per
pixel. An asset identifier is derived from its dimensions and content. The
decoder recomputes that identity, validates the exact byte count and rejects a
missing or conflicting asset instead of substituting a built-in pattern.
Several presets may point to one asset without duplicating its pixels.

A bundle is limited to 256 MiB encoded, 128 MiB decoded RGBA, 4,096 presets,
4,096 assets, 4,096 pixels on either tile edge and 16 million pixels per tile.
Names and group entries are bounded too. These checks happen before Flutter
uploads a GPU image. JSON, Base64, identity calculation and pixel conversion
for large bundles run outside the interface isolate.

[Built-in patterns](#built-in-patterns) are not exported: their stable names
are enough to find them again. A bundle exported from the catalogue therefore
contains only imported presets and the tiles they use.

## Photoshop PAT compatibility

The same import dialog accepts standalone Photoshop `.pat` libraries. PatKit
owns their bounded binary parsing and converts supported grayscale, indexed,
RGB, CMYK, Lab and multichannel sources to eight-bit RGBA, including raw,
PackBits and ZIP-compressed channel data at supported bit depths. Focale keeps
recognized Photoshop group paths and logs recoverable compatibility warnings.

PAT export writes a canonical version-1 library with eight-bit RGB and alpha
planes compressed with PackBits. It preserves each stored tile's straight-alpha
RGBA pixels, display name, order and group path. The catalogue itself still
contains only ordinary `PatternPreset` values and content-addressed
`PatternAsset` tiles; Photoshop records and colour planes do not enter
application state. `.fpattern` remains the lossless native backup format.

## Local assets and rendering

Imported and locally defined RGBA tiles are stored outside preferences as
compressed `.fptile` files in application support. Preferences retain only
preset names, group paths and stable identifiers. The bounded catalogue is
loaded before the first frame, so filling, painting and compositing perform no
file access, decompression or texture upload during an interaction.

One predecoded GPU image is reused by fill layers, shape fills and strokes,
Pattern Overlay, Bevel Texture, the Paint Bucket, Healing Brush, Pattern Stamp
and Patch tool. Pattern Stamp’s non-Impressionist live path uses the shared
effect-brush shader, so it neither decodes nor reads a tile back while the
pointer moves.
The engine receives a `PatternAssetResolver`; PAT and `.fpattern` codec types
remain confined to the data layer.

## Project portability

A `.focale` project embeds each imported pattern tile referenced by any fill,
shape or configured layer effect under `patterns/<content-id>.fptile`. It does
so even when an effect is currently disabled, because enabling it later must
restore the saved appearance. Unused catalogue patterns are omitted. Loading
the project validates and restores those assets as part of the same operation,
so moving a project to another installation never depends on a separately
installed pattern library.

ADR 0048 records the ownership, format-adapter and portability decisions.
