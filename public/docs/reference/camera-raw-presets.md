# Standalone Camera Raw presets

[Documentation](../README.md) · [File formats](README.md)

`.fcameraraw` exchanges the entire current development recipe independently of
camera files, projects and local preset preferences. In the Camera Raw preset
bar, **Load a Focale or Camera Raw XMP preset** accepts `.fcameraraw` or `.xmp`;
**Export Focale Camera Raw preset** saves the native file. The existing plus
button still saves a named recipe in the local application catalogue.

A native import replaces the current recipe after validating it completely.
It preserves the embedded optical profile instead of rematching it to the
current camera. In Camera Raw Filter, source-only settings are normalized by
the existing raster-filter policy; the file itself retains the entire recipe.

## Native representation

UTF-8 JSON has exactly `format: "focale-camera-raw-preset"`, integer `version: 1`
and `settings`, the canonical portable `RawDevelopmentSettings.toJson()` map.
The website example contains all required fields. Floating values keep native
precision. No name, local identifier, original RAW pixels or filesystem path is
required: the filename identifies the portable preset.

Required fields include white balance (`whiteBalance`, `temperature`, `tint`),
basic tone (`exposure`, `contrast`, `highlights`, `shadows`, `whites`, `blacks`,
`saturation`, `vibrance`), sensor quality and highlight recovery (`quality`,
`highlightRecovery`), `outputColorSpace`, detail (`luminanceNoiseReduction`,
`luminanceNoiseDetail`, `colorNoiseReduction`, `sharpeningAmount`,
`sharpeningRadius`), optical correction toggles and refinements (`useLensProfile`,
`removeChromaticAberration`, the `purpleDefringe*`, `greenDefringe*`,
`lensDistortion`, `lensVignetteAmount`, `lensVignetteMidpoint` fields), geometry
(`geometryVertical`, `geometryHorizontal`, `geometryRotate`, `geometryAspect`,
`geometryScale`, `geometryOffsetX`, `geometryOffsetY`, `constrainCrop`,
`uprightMode`) and the seven `calibration*` controls.

| Optional field | Canonical representation |
| --- | --- |
| `customOutputProfile` | Required for custom output; `id`, `name`, Base64 `data` of a valid RGB ICC profile |
| `curve` | Nonidentity curve in the existing project representation; omit the identity curve |
| `lensProfile` | Full resolved optical model and coefficients, never a catalogue path |
| `geometryGuides` | Nonempty array of bounded guide objects; omit when empty |
| `localAdjustments` | Nonempty array of complete local masks and corrections; omit when empty |

All required values, including defaults, must be supplied. Optional fields are
omitted when the canonical writer omits them; explicit empty arrays, redundant
identity curves, nulls and unknown fields are rejected. Nested objects follow
the same rule. This prevents the tolerant project reader from silently
clamping, dropping or defaulting any preset content.

## Complete example

```json
{
  "format": "focale-camera-raw-preset",
  "version": 1,
  "settings": {
    "whiteBalance": "camera",
    "temperature": 6500.0,
    "tint": 0.0,
    "exposure": 0.0,
    "contrast": 0.0,
    "highlights": 0.0,
    "shadows": 0.0,
    "whites": 0.0,
    "blacks": 0.0,
    "saturation": 0.0,
    "vibrance": 0.0,
    "quality": "balanced",
    "highlightRecovery": "blend",
    "outputColorSpace": "srgb",
    "luminanceNoiseReduction": 0.0,
    "luminanceNoiseDetail": 50.0,
    "colorNoiseReduction": 0.0,
    "sharpeningAmount": 0.0,
    "sharpeningRadius": 1.0,
    "useLensProfile": false,
    "removeChromaticAberration": false,
    "purpleDefringeAmount": 0.0,
    "purpleDefringeHueLow": 0.72,
    "purpleDefringeHueHigh": 0.94,
    "greenDefringeAmount": 0.0,
    "greenDefringeHueLow": 0.22,
    "greenDefringeHueHigh": 0.47,
    "lensDistortion": 0.0,
    "lensVignetteAmount": 0.0,
    "lensVignetteMidpoint": 50.0,
    "geometryVertical": 0.0,
    "geometryHorizontal": 0.0,
    "geometryRotate": 0.0,
    "geometryAspect": 0.0,
    "geometryScale": 100.0,
    "geometryOffsetX": 0.0,
    "geometryOffsetY": 0.0,
    "constrainCrop": true,
    "uprightMode": "off",
    "calibrationShadowsTint": 0.0,
    "calibrationRedHue": 0.0,
    "calibrationRedSaturation": 0.0,
    "calibrationGreenHue": 0.0,
    "calibrationGreenSaturation": 0.0,
    "calibrationBlueHue": 0.0,
    "calibrationBlueSaturation": 0.0
  }
}
```

## Scalar ranges

| Controls | Accepted values |
| --- | --- |
| `whiteBalance` | `camera`, `automatic`, `custom` |
| `quality` | `fast`, `balanced`, `high` |
| `highlightRecovery` | `clip`, `blend`, `reconstruct` |
| `outputColorSpace` | `srgb`, `adobeRgb`, `proPhotoRgb`, `custom` |
| `temperature`, `tint`, `exposure` | 2000–50000 K; −150–150; −10–10 EV |
| Basic tone except exposure; seven calibration controls | −100–100 |
| Noise reduction/detail | 0–100 |
| `sharpeningAmount`, `sharpeningRadius` | 0–500; 0.1–64 |
| Purple/green defringe amounts; hue limits | 0–20; 0–1 |
| Lens distortion and vignette amount; midpoint | −100–100; 0–100 |
| Geometry vertical, horizontal, aspect, offsets | −100–100 |
| `geometryRotate`, `geometryScale` | −45–45 degrees; 50–150 percent |
| `useLensProfile`, `removeChromaticAberration`, `constrainCrop` | Boolean |
| `uprightMode` | `off`, `automatic`, `level`, `vertical`, `full`, `guided` |

The [project recipe schema](focale.md) describes guide geometry, frozen optical
models and local mask objects, including their packed seven-byte brush-point
records. The preset envelope applies stricter completeness and exact-round-trip
validation to that same representation.

## Bounds and validation

The encoded file is limited to 24 MiB, including an embedded ICC profile of at
most 16 MiB before Base64 encoding. Local mask, point and geometry-guide counts
follow the bounded native recipe: at most 16 local adjustments, 4096 total brush
points and four geometry guides. Full parsing and encoding run off the UI
isolate on native platforms. Wrong types, invalid UTF-8/JSON, unsupported
versions or enum values, out-of-range/nonfinite controls, missing required
fields and invalid profiles, curves, guides or masks reject the entire file.

## Adobe interchange

Adobe Camera Raw `.xmp` is import-only and applies the supported subset over the
current recipe. Unsupported Adobe controls are not made portable merely by
converting the file: the native export contains the resulting Focale settings.
XMP is not used as a native backup. Neither format changes the original RAW
file, and the native recipe does not promise identical Adobe rendering.

See [the project representation](focale.md) and
[ADR 0286](../adr/0286-portable-structured-preset-files.md).
