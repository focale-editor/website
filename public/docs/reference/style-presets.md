# Layer style preset libraries

[Documentation](../README.md) · [File formats](README.md)

Focale stores reusable layer effects and advanced blending options separately
from documents. The **Styles** panel applies a complete preset to the selected
layer, captures the selected layer's current style and manages portable
libraries. Applying a preset is a normal undoable document command; editing the
catalogue does not modify an open document.

## Native `.fstyle` format

`.fstyle` is a bounded UTF-8 JSON bundle. Version 1 stores editable
`LayerStyle` values rather than rendered thumbnails:

```json
{
  "format": "focale-style-presets",
  "version": 1,
  "presets": [
    {
      "id": "style.user.example",
      "name": "Editorial shadow",
      "groupPath": [
        "Editorial"
      ],
      "style": {
        "fillOpacity": 0.8,
        "effects": [
          {
            "kind": "dropShadow",
            "enabled": true,
            "color": 4279383126,
            "opacity": 0.65,
            "angle": 120,
            "distance": 12,
            "spread": 0,
            "size": 9
          },
          {
            "kind": "patternOverlay",
            "enabled": true,
            "opacity": 0.25,
            "pattern": "pattern.2.1.9e2b63675440c0d9",
            "scale": 1
          }
        ]
      }
    }
  ],
  "patterns": [
    {
      "id": "pattern.2.1.9e2b63675440c0d9",
      "name": "Blue fabric",
      "width": 2,
      "height": 1,
      "rgba": "ChTI/8zq/4A="
    }
  ]
}
```

Each preset identifier and name is nonempty and limited to 4,096 UTF-16 code units.
A group hierarchy contains at most 32 nonempty segments. One library contains
at most 4,096 presets and 256 MiB of encoded data. Duplicate identifiers or one
malformed entry reject the complete import, so a partial catalogue can never
silently replace the user's intent. Built-in styles are not persisted or
exported.

The `style` object uses the same representation as a `.focale` layer. It can
therefore retain enabled and disabled effects, Fill Opacity and the four
**Blend If** channel ranges without maintaining a second effect model.

Imported patterns drawn by a Pattern Overlay, a pattern-filled Stroke or a
Bevel & Emboss texture travel with the library in an optional `patterns` list,
the same one native brush bundles use: each entry holds the pattern `id`, an
optional display `name`, its `width` and `height`, and its straight-alpha
`rgba` pixels in base64. Only patterns the presets reference are written,
including disabled textures and inactive stroke fills. At most 256 MiB of
pixels are decoded, and importing adds them to the pattern catalogue before the
styles.

`patterns[].name` is an optional display name for the embedded pattern, not a
root-level library name or the required `presets[].name` of a style. A provided
name is trimmed on import. If absent or blank, the pattern receives the library
filename without its extension followed by its one-based position, for example
`Studio 1` for `Studio.fstyle`. Imported patterns are grouped under that library
name. The writer includes known, nonblank names; version-1 files without them
remain valid. A non-null pattern name of a type other than string is rejected.

## Photoshop ASL compatibility

The same dialog imports and exports Photoshop `.asl` libraries. AslKit owns the
bounded ASL container, validation and encoding. Focale passes the contained
Photoshop descriptors through the same PsdKit semantic layer-effect converter
used for PSD and PSB, then retains only effects and blending options that its
editable `LayerStyle` model can reproduce. An unsupported style is not inserted
into the semantic catalogue under a misleading appearance.

Imported styles receive a fresh application identifier when their Photoshop
identifier collides with an existing preset. Embedded ASL patterns are decoded
and added to the pattern catalogue, identified by their content, so the
styles drawing them import too. As in Photoshop, they also appear in the
Patterns catalogue under their Photoshop names, grouped by library; a pattern
already listed keeps its entry, so importing a library twice adds nothing.
Export embeds the patterns its presets draw, built-in ones included, named
after their catalogue entries. A pattern with no entry, such as one embedded
in a PSD, is shown as an imported pattern with its size. Export preserves names, supported effects, Fill
Opacity and **Blend If**; `.fstyle` remains the lossless native format.
Effect gradient export supports `classic` and `encoded` interpolation. Other
methods are rejected by ASL export and use raster fallback for PSD, rather than
silently changing the gradient. Native libraries retain every method.

The effect model covers Photoshop's options: multi-stop gradients with their
layout, offset and dither in overlays, strokes and glows; gradient and pattern
strokes, including shape-burst gradients; glow technique, noise, jitter and
contour range; drop-shadow noise and knockout; the satin contour; and the
bevel's chisel-soft technique, stroke emboss, gloss contour, depth up to 1000%
and full texture options. All 958 styles of the libraries shipped with
Photoshop CS1 to CS5 import. Two conversions remain approximate: noise
gradients are regenerated from their seed with Focale's own random generator,
since Photoshop's is undocumented, and the renderer approximates Photoshop's
effect algorithms, including Precise glows, jitter and shape bursts.

ADR 0117 records the catalogue architecture, and ADR 0118 records the dedicated
ASL ownership boundary.
