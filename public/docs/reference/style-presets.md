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
      "groupPath": ["Editorial"],
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
          }
        ]
      }
    }
  ]
}
```

Each identifier and name is nonempty and limited to 4,096 UTF-16 code units.
A group hierarchy contains at most 32 nonempty segments. One library contains
at most 4,096 presets and 16 MiB of encoded data. Duplicate identifiers or one
malformed entry reject the complete import, so a partial catalogue can never
silently replace the user's intent. Built-in styles are not persisted or
exported.

The `style` object uses the same representation as a `.focale` layer. It can
therefore retain enabled and disabled effects, Fill Opacity and the four
**Blend If** channel ranges without maintaining a second effect model.

## Photoshop ASL compatibility

The same dialog imports and exports Photoshop `.asl` libraries. AslKit owns the
bounded ASL container, validation and encoding. Focale passes the contained
Photoshop descriptors through the same PsdKit semantic layer-effect converter
used for PSD and PSB, then retains only effects and blending options that its
editable `LayerStyle` model can reproduce. An unsupported style is not inserted
into the semantic catalogue under a misleading appearance.

Imported styles receive a fresh application identifier when their Photoshop
identifier collides with an existing preset. Export preserves names, supported
effects, Fill Opacity and **Blend If**. Import deliberately skips embedded ASL
pattern pixels because they are not currently converted into Focale's
independent pattern catalogue; `.fstyle` remains the lossless native format.

ADR 0117 records the catalogue architecture, and ADR 0118 records the dedicated
ASL ownership boundary.
