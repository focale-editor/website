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

- `.aco` imports colour swatches and exports named RGB swatches. Native alpha,
  catalogue identifiers and group paths are retained by `.fswatch`, not ACO.
  Imports convert supported RGB, HSB, CMYK, Lab and grayscale colours to sRGB;
  named version-2 records take precedence over a version-1 compatibility section.
- `.ase` imports Adobe Swatch Exchange libraries and their groups. `.act`
  imports Photoshop colour tables, omitting the transparent entry. `.acb`
  imports Photoshop colour books (Pantone, HKS, Toyo and others) grouped under
  the book's title, with the names Photoshop shows and without the page
  placeholders; their RGB, CMYK or Lab inks are approximated in sRGB. These
  three formats are import-only; any can be saved afterward as `.fswatch`.
- `.ado` Photoshop duotone options replace the inks of a duotone document
  through Image > Mode > Load duotone options; only the interpretation of the
  gray plate changes. Each ink keeps its name and transfer curve, sampled
  between Photoshop's thirteen points. Process and Lab inks are converted to
  sRGB; Pantone and other matching-system inks only store a catalog code, so
  their colour comes from an imported `.acb` book whose colour has the same
  code, and the file is refused when none matches. The original bytes are kept
  and written back as the PSD duotone data, which Photoshop's documents also
  use: a duotone PSD opens with its real inks under the same rules, while a
  document whose inks cannot be shown previews in black.
- `.grd` imports supported legacy and descriptor-backed custom solid gradients,
  including colour and transparency stops, midpoints and library groups. Noise
  gradients and context-dependent foreground/background stops are skipped.
  GRD export writes user gradients with separate colour and transparency stops,
  quantizing positions and midpoints; Focale's interpolation choice and catalogue
  groups are not retained. Use `.fgradient` for the complete native library.
- `.acv` imports composite RGB, red, green and blue curves from versions 1 and 4.
  AcvKit owns the bounded binary codec and channel-indexed supplemental data.
  Extra channels outside Focale's RGB model are ignored. Export writes the
  current four-channel curve set, not the whole catalogue, on Adobe's numeric
  grid. `.fcurve` retains the complete native library and point precision.

Native export preserves all Focale values. Parsing is bounded and leaves the
user-interface isolate for potentially large files. Layer-effect contours and
SHC interchange are documented in [contour libraries](contours.md); ALV, AHU,
ASV and CHA with their native counterparts are documented in
[standalone adjustment presets](adjustments.md).

Layer-style presets and Photoshop `.asl` interchange are documented separately
in `docs/formats/styles.md`. Brush `.fbrush`/`.abr`, pattern
`.fpattern`/`.pat`, and custom-shape `.fshape`/`.csh` libraries keep their own
typed catalogues and codec-kit boundaries.

ADR 0117 records the common catalogue and format-ownership decisions.

Standalone [Camera Raw](camera-raw.md), [duotone](duotone.md) and [Color Lookup](adjustments.md) settings are also independently exchangeable as `.fcameraraw`, `.fduotone` and `.fcolorlookup`.
