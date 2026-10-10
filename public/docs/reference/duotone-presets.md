# Standalone duotone presets

[Documentation](../README.md) · [File formats](README.md)

`.fduotone` exchanges one complete ink specification independently of a project.
In a duotone document, **Image → Mode → Load duotone options** accepts native
`.fduotone` and Photoshop `.ado`; **Save duotone preset** writes the native file.
Loading changes the interpretation of the existing gray plate as one undoable
operation. It does not replace pixels or convert an RGB document to duotone.

## Native representation

UTF-8 JSON has exactly three root fields: `format: "focale-duotone-preset"`,
integer `version: 1`, and `settings`. Settings contain an ordered `inks` array
and optional `photoshopData` containing the original Adobe payload in Base64.
There is no catalogue identity and no external resource dependency.

Each of one through four inks has exactly `name`, `color` and `curve`:

| Field | Representation |
| --- | --- |
| `name` | Nonempty, trimmed name, at most 63 UTF-16 code units |
| `color` | Opaque unsigned ARGB integer, from 4278190080 to 4294967295 |
| `curve` | Canonical Base64 of exactly 256 coverage bytes, highlight to shadow |

All 256 native samples are retained without Photoshop's thirteen-level curve
resampling. Names, order and resolved sRGB preview colours accompany the curves.
A file imported after resolving an ACB colour-book ink is portable without that
book on the receiving installation. Optional `photoshopData` preserves the
original opaque Photoshop representation for later PSD/PSB export.

## Complete example

```json
{
  "format": "focale-duotone-preset",
  "version": 1,
  "settings": {
    "inks": [
      {
        "name": "Black",
        "color": 4278190080,
        "curve": "AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn+AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/w=="
      }
    ]
  }
}
```

## Bounds and validation

The complete file is limited to 128 KiB; the decoded Photoshop payload is
limited to 64 KiB. Invalid text, unsupported identifiers or versions, unknown
fields, missing ink fields, empty/excessive ink lists, invalid Base64, translucent
colours, invalid names or incorrect curve lengths reject the whole import.
The writer applies the same limits. Canonical Base64 and names must survive
read/write unchanged; values are never silently normalized.

## Adobe interchange

ADO import resolves RGB, CMYK and other supported ink colours through AdjKit.
Matching-system inks require an imported ACB colour book when their colour is
not present in the ADO file. Unresolved inks reject the import. ADO is currently
an import format in the preset UI; saving a preset writes `.fduotone`.
PSD/PSB export can reuse the retained Adobe payload, or derive an Adobe ink
representation for inks created natively. Adobe curve sampling and rendering
compatibility are separate from the exact native preset round trip.

See [the project representation](focale.md), [colour-book imports](presets.md)
and [ADR 0286](../adr/0286-portable-structured-preset-files.md).
