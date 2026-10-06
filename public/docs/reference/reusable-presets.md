# Reusable colour, gradient, and curve presets

[Documentation](../README.md) · [File formats](README.md)

Focale keeps colour swatches, gradients and four-channel Curves values in
global persisted catalogues. The Swatches panel can capture, remove, import and
export colours. Every shared gradient editor uses the same gradient catalogue,
and the Curves adjustment exposes the curve catalogue. Applying a value changes
the current editor; editing a catalogue does not alter existing documents.

Built-in entries precede user entries and cannot be removed or exported. An
identifier collision during import receives a fresh application identifier.
Each complete catalogue is limited to 4,096 entries. Names and identifiers are
limited to 4,096 UTF-16 code units and group paths to 32 nonempty segments.

## Native formats

The three native formats are bounded UTF-8 JSON envelopes:

| Extension | Root `format` | Entry value |
|-----------|---------------|-------------|
| `.fswatch` | `focale-color-swatches` | Packed straight-alpha ARGB integer |
| `.fgradient` | `focale-gradient-presets` | Stops, alpha, midpoints and interpolation method |
| `.fcurve` | `focale-curve-presets` | Master, red, green and blue tone curves |

Every envelope has this shape:

```json
{
  "format": "focale-gradient-presets",
  "version": 1,
  "presets": [
    {
      "id": "gradient.user.example",
      "name": "Editorial",
      "groupPath": ["Studio"],
      "gradient": {
        "interpolation": "perceptual",
        "stops": [
          {"position": 0.0, "color": 4279246896, "midpoint": 0.4},
          {"position": 1.0, "color": 4292927712}
        ]
      }
    }
  ]
}
```

A native file is limited to 16 MiB and 4,096 entries. A gradient has two to
256 strictly ordered stops spanning zero to one. A tone curve has two to 256
strictly ordered points in the normalized unit square and includes both input
endpoints. Unknown interpolation values, duplicate identifiers or any malformed
entry reject the complete library instead of falling back to a plausible but
incorrect value.

## Photoshop interchange

- `.aco` versions 1 and 2 import RGB, HSB, CMYK, Lab and grayscale swatches.
  When a file contains the conventional version-1 compatibility section
  followed by version 2, the named version-2 records take precedence.
- `.grd` version 5 imports descriptor-backed custom solid gradients, including
  colour stops, transparency stops, locations and midpoints. RGB, grayscale,
  CMYK, HSB and Lab colours are converted to sRGB. Noise gradients and
  foreground/background-dependent stops are skipped because a context-free
  reusable value cannot reproduce them faithfully.
- `.acv` versions 1 and 4 import the composite RGB curve followed by red, green
  and blue channels. AcvKit owns the binary codec, including the optional
  channel-indexed version-1 section; Focale strictly decodes it with bounded
  allocations and adapts only the effective semantic curves. Channels beyond
  the editable RGB model are ignored.

Adobe files are import-only for these three families; native export preserves
all Focale values without pretending to emit undocumented variants. Parsing is
bounded and leaves the user-interface isolate for potentially large files.

Layer-style presets and Photoshop `.asl` interchange are documented separately
in `docs/formats/styles.md`. Brush `.fbrush`/`.abr`, pattern
`.fpattern`/`.pat`, and custom-shape `.fshape`/`.csh` libraries keep their own
typed catalogues and codec-kit boundaries.

ADR 0117 records the common catalogue and format-ownership decisions.
