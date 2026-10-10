# Standalone adjustment presets

[Documentation](../README.md) · [File formats](README.md)

Levels, Hue/Saturation, Selective Color, Channel Mixer, Black & White and Color Lookup can
exchange their complete settings independently of a project. In the adjustment editor, Load
preset accepts the native or matching Photoshop file; Color Lookup also accepts CUBE. Save Focale preset writes
native settings; Export Photoshop preset writes the Adobe representation.
Loading replaces the current adjustment's settings after validating the whole
file. It does not create a global catalogue or carry a layer's identity.

## Native formats

| Extension | `kind` | Photoshop counterpart |
| --- | --- | --- |
| `.flevels` | `levels` | `.alv` |
| `.fhuesaturation` | `hueSaturation` | `.ahu` |
| `.fselectivecolor` | `selectiveColor` | `.asv` |
| `.fchannelmixer` | `channelMixer` | `.cha` |
| `.fblackandwhite` | `blackAndWhite` | `.blw` |
| `.fcolorlookup` | `colorLookup` | `.cube` (import only) |

All six are UTF-8 JSON with root `format` equal to
`focale-adjustment-preset`, integer `version` equal to `1`, a `kind` matching
the target adjustment, and one complete `settings` object. They contain one
preset, rather than an array of named catalogue entries. The filename provides
the portable preset's name. There are no external resources.

```json
{
  "format": "focale-adjustment-preset",
  "version": 1,
  "kind": "hueSaturation",
  "settings": {
    "hue": -42.125,
    "saturation": 0.123456789,
    "lightness": -0.125
  }
}
```

Native numbers retain their Focale precision without Adobe integer-grid
quantization. All parameters below are required, even when at their default.
Additional root metadata is ignored for scalar formats; unknown setting names are rejected. Color Lookup requires the exact five-field envelope described below.

## Parameter schemas

### Levels

| Parameters | Range | Default |
| --- | --- | --- |
| `inputBlack`, `outputBlack`, `redBlack`, `greenBlack`, `blueBlack` | 0–1 | 0 |
| `inputWhite`, `outputWhite`, `redWhite`, `greenWhite`, `blueWhite` | 0–1 | 1 |
| `gamma`, `redGamma`, `greenGamma`, `blueGamma` | 0.1–4 | 1 |

The 14 parameters include master input/output levels and each RGB channel's
input levels and gamma. The UI may show levels on a 0–255 scale; the file stores
normalized 0–1 values.

### Hue/Saturation

| Parameter | Range | Default |
| --- | --- | --- |
| `hue` | −180–180 degrees | 0 |
| `saturation`, `lightness` | −1–1 | 0 |

### Selective Color

For each prefix `reds`, `yellows`, `greens`, `cyans`, `blues`, `magentas`,
`whites`, `neutrals` and `blacks`, include four keys ending in `Cyan`,
`Magenta`, `Yellow` and `Black`, for example `redsCyan`. These 36 numbers
range from −1 to 1 and default to 0. The additional `absolute` parameter is
exactly 0 for relative mode or 1 for absolute mode; its default is 0.

### Channel Mixer

For each output prefix `red`, `green` and `blue`, include three keys ending in
`FromRed`, `FromGreen` and `FromBlue`. These nine coefficients range from −2
to 2; same-channel coefficients default to 1 and the others to 0. Also include
`redConstant`, `greenConstant` and `blueConstant`, each from −1 to 1 and
initially 0, and `monochrome`, exactly 0 or 1 and initially 0.

### Black & White

Include `reds`, `yellows`, `greens`, `cyans`, `blues` and `magentas`, each
colour's contribution from −2 to 3 (Photoshop's −200% to 300%), initially 0.4,
0.6, 0.4, 0.6, 0.2 and 0.8. Also include `tint`, exactly 0 or 1, and
`tintColor`, a whole ARGB value from 0 to 4294967295.

### Color Lookup

`.fcolorlookup` uses `kind: "colorLookup"`, an empty `settings: {}` (there are
no scalar parameters), and a required root `lookupTable`. The table has `name`
(nonempty, at most 4096 UTF-16 units), `size` (integer 2–64), and `values`
(exactly `size³ × 3` finite float32 samples in blue-major, green-middle,
red-fastest RGB order). Nondefault `domainMinimum` and `domainMaximum` are
three finite increasing per-channel ranges. Omit a `[0, 0, 0]` minimum and a
`[1, 1, 1]` maximum; exports use this canonical representation.

The file is limited to 32 MiB. Names, domains and native float32 samples must
survive validation without modification. The table is embedded; neither the
original CUBE file nor a local catalogue is needed. Load accepts native files
or CUBE, including supported one-dimensional tables expanded to a cube. Save
Focale preset is enabled once a table exists. There is no CUBE export command.

## Validation and compatibility

Each scalar file is limited to 64 KiB. Invalid UTF-8 or JSON, unsupported versions,
mismatched kinds, missing or unknown parameters, nonnumeric or nonfinite
values, out-of-range values and fractional toggle values fail the entire
import. The native writer applies the same validation and rejects structured
curve, gradient or lookup-table data that these scalar formats cannot store.
Neither reader nor writer clamps, rounds or silently substitutes parameters.
Extension matching is case-insensitive; renaming a file does not change its kind.
Future incompatible parameter schemas require a new version and migration policy.

Photoshop ALV, AHU, ASV, CHA and BLW support both import and export through AdjKit and
the shared PSD adjustment converter. Adobe formats retain only the supported
semantic subset and can quantize native values. Unsupported source settings
are rejected instead of silently approximated. Use the native format for an
exact backup of the Focale settings.

Curves use [`.fcurve`](presets.md), gradients use [`.fgradient`](presets.md),
and layer-effect contours use [`.fcontour`](contours.md). The project still
embeds applied adjustment values using the existing
[`.focale` representation](focale.md); none of these presets requires changing
that container. [ADR 0283](../adr/0283-native-adjustment-preset-files.md) records
the format and workflow decisions.

Structured [Camera Raw](camera-raw.md) and [duotone](duotone.md) recipes have their own complete native envelopes.
