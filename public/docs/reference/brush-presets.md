# Brush preset libraries

Focale stores reusable procedural and sampled brushes independently from
documents. The Brushes panel applies built-in presets, creates, renames and
deletes user presets, and imports or exports the mutable catalogue as a native
`.fbrush` bundle or a Photoshop `.abr` library.

## Defining a sampled tip from a document

**Edit ▸ Define Brush Preset…** captures the active selection, or the complete
document when nothing is selected. The visible composite is read once at its
native resolution; hidden layers do not contribute, while visible layer
opacity, masks, blend modes, styles and adjustments do.

The source may be at most 2,500 × 2,500 pixels. Colour is converted to Rec. 709
luminance and inverted: black produces full brush coverage, white produces no
mark and grey produces intermediate coverage. Source alpha and the selection's
fractional alpha multiply that result, so a feathered selection creates the
same soft boundary in the saved tip. A fully white or transparent source is
rejected because it could never paint. The new preset records its native size,
a 25% initial spacing and no dynamics; ordinary tool options remain independent
as described below. Focale's painting diameter now reaches Photoshop's
5,000-pixel limit, so every permitted source can initially render at 1:1.

The identifier is derived from dimensions, anchor and coverage. Defining the
same tip more than once therefore creates another named preset without storing
or uploading the pixels again. The document and selection are not modified.
The shared tip control accepts the full 5,000-pixel painting range and exposes
**Use Sample Size** whenever a primary or secondary sampled tip is selected.
This follows Adobe's current definition workflow and colour-to-greyscale rule:
<https://helpx.adobe.com/photoshop/desktop/apply-painting-techniques/brushes-presets/create-brush-tip-image.html>.

## Native `.fbrush` format

`.fbrush` is a portable UTF-8 JSON bundle. Version 1 is the first public baseline. It embeds every
sampled grayscale tip used by either brush stream and every imported RGBA
pattern used by Texture:

```json
{
  "format": "focale-brush-presets",
  "version": 1,
  "presets": [
    {
      "id": "user.example",
      "name": "Example",
      "includesSize": true,
      "protectTexture": true,
      "settings": {
        "size": 32,
        "hardness": 0.8,
        "spacingRatio": 0.1,
        "angle": 0,
        "roundness": 1,
        "shape": "circle",
        "sampledTipId": "sampled.example",
        "dynamics": {},
        "texture": {
          "enabled": true,
          "patternId": "imported.pattern-example",
          "scale": 1,
          "eachTip": true,
          "blendMode": "multiply",
          "depth": 0.75
        },
        "dualBrush": {
          "enabled": true,
          "size": 18,
          "spacingRatio": 0.4,
          "sampledTipId": "sampled.example",
          "blendMode": "multiply"
        },
        "colorDynamics": {
          "enabled": true,
          "applyPerTip": true,
          "foregroundBackgroundJitter": 0.25
        },
        "pose": {
          "tiltX": -0.25,
          "overrideTiltX": true,
          "tiltY": 0,
          "overrideTiltY": false,
          "rotation": 45,
          "overrideRotation": true,
          "pressure": 0.75,
          "overridePressure": true
        },
        "noise": true,
        "wetEdges": true
      }
    }
  ],
  "assets": [
    {
      "id": "sampled.example",
      "width": 2,
      "height": 2,
      "anchorX": 1,
      "anchorY": 1,
      "coverage": "AP+AAA=="
    }
  ],
  "patterns": [
    {
      "id": "imported.pattern-example",
      "width": 2,
      "height": 2,
      "rgba": "/////wAAAP+AgID/QEBA/w=="
    }
  ]
}
```

`coverage` is a row-major Base64 encoding with one unsigned coverage byte per
pixel. `rgba` is row-major straight RGBA with four bytes per pattern pixel.
Each asset identity, dimension, anchor, decoded length and total decoded memory
is validated before a GPU image is created. A referenced asset that is missing
or conflicts with another asset invalidates the import rather than silently
changing the preset. Sampled tips and patterns are part of public version 1;
missing optional catalogues default to empty lists. Development versions 2–3
require the one-time [baseline conversion](persistence-baseline.md).

The settings object uses the complete `BrushSettings` serialization for
forward-compatible decoding. Capture, decoding and export normalize current
tool options — colour, opacity, flow, smoothing and its four advanced modes,
blend mode, Airbrush and Pencil Auto Erase — because applying a brush preset
must preserve them. This matches the difference between a Photoshop brush
preset and a tool preset. `protectTexture` is optional metadata carried by an
imported Photoshop descriptor. Its absence preserves the user's global state,
which is also how locally created presets behave.
Malformed entries are skipped, duplicate preset identifiers are ignored during
decoding and are assigned fresh user identifiers when merging another valid
library.

## Local sampled-tip assets

Imported and locally defined masks are persisted outside preferences as
compressed `.ftip` internal assets below the application-support directory.
Preferences keep only stable identifiers. The catalogue is decoded before the
first frame so a stroke performs neither file access, decompression nor texture
upload while the pointer moves. The format is an implementation detail;
`.fbrush` is the format to use for interchange and backup.

The raster mask is canonical. Normal painting uses its predecoded white-alpha
texture, while CPU effect brushes sample the same bytes. Cursor contours are
traced once at import time and reduced to a bounded resolution. This keeps
preview, commit and effect footprints consistent.

## Advanced Brush Settings groups

Focale persists and renders Texture, Dual Brush, Color Dynamics, Brush Pose,
Noise, Wet Edges and Shape Dynamics' Brush Projection as ordinary immutable
Brush Settings values. Texture can use a built-in or imported pattern,
inversion, scale, per-tip coordinates, tonal mode, brightness, contrast,
depth, minimum depth, jitter and an input control. Dual Brush owns an
independently spaced procedural or sampled tip, scatter, count and a tonal
intersection mode. Color
Dynamics varies foreground/background mix, hue, saturation, brightness and
purity either for the complete stroke or per dab.

Noise multiplies every footprint by one of eight deterministic phases of a
shared normalized grain tile. Procedural and sampled tips pack those phases in
one bounded GPU atlas when possible; exact fallback stamps and CPU effect
coverage evaluate the same hash and transform. Wet Edges lowers pigment in the
stroke body and derives one reinforced inner boundary from the accumulated
coverage with GPU-backed Canvas layers and a bounded blur. Effect brushes use a
documented local approximation because an already processed pointer batch
cannot be revised.

Protect Texture is deliberately not an ordinary per-preset setting. Its
enabled flag, pattern and scale are persisted once for the application and
observed by every compatible brush. Pattern and scale therefore stay aligned
while depth, inversion, tonal mode, per-tip coordinates and dynamics remain
local. An ABR descriptor can explicitly toggle this state; a native preset
without that optional hint leaves it unchanged.

Brush Pose can independently replace the live Tilt X, Tilt Y, Rotation and
Pressure axes before Shape Dynamics, Transfer, Texture depth and Color
Dynamics evaluate a dab. A partial tilt override converts the scalar stylus
tilt and orientation into planar pen-axis slopes, replaces only the requested
component and then reconstructs the neutral engine representation. The live
component that was not overridden is therefore preserved. Current and initial
stroke samples receive the same overrides, so Rotation and Initial Rotation
remain consistent. This is constant input remapping before raster generation;
it needs neither a pixel shader nor a GPU readback.

Brush Projection evaluates the resulting live or overridden pose next. Tilt
contracts the tip's minor axis by the cosine of the angle from the tablet;
tilt orientation and barrel rotation orient the projected footprint. The
result is expressed through the same per-dab angle and roundness geometry as
every other dynamic tip. Procedural and sampled tips, current and predicted
samples, and effect-brush coverage consequently agree without a second raster
implementation. Flutter's canvas still submits the exact transformed
footprints to the GPU. An anisotropic projection cannot use the uniform
scale-and-rotation atlas batch, and a fragment shader would not remove those
independent geometry submissions or justify a readback.

Random variation is derived from the stroke seed and dab index. Replaying,
previewing and committing the same stroke therefore produces the same masks
and colours. The primary and secondary streams plan and batch their own dabs;
their intersection and pattern modulation stay in GPU-backed canvas layers,
without reading pixels back to Dart during a gesture.

Brush, Pencil and Eraser expose Texture and Dual Brush; Brush and Pencil also
expose Color Dynamics. Photoshop-compatible effect brushes — Clone Stamp,
Pattern Stamp, History Brush, Art History Brush, Dodge, Burn and Sponge —
expose Texture and Dual Brush through the same bounded coverage consumed by
their CPU and GPU paths. Their primary and secondary streams retain separate
spacing carries, deterministic scatter and counts in sparse masks, so a mark
received in a later pointer batch can still intersect earlier coverage. Other
effect brushes clear unsupported advanced groups when a preset is applied.
Color Dynamics remains limited to foreground-colour deposition rather than
silently recolouring sampled or transformed pixels.

Pen Pressure, Pen Tilt, Stylus Wheel, Initial Direction, Direction, Initial
Rotation, Rotation and Fade are representable dynamic controls. Stylet enriches
Flutter pointer events with native tilt components, barrel rotation,
tangential pressure and relative wheel movement. Focale integrates relative
wheel deltas per physical device, uses neutral values when an axis is absent
before it has been observed, retains transiently missing wheel and rotation
values per tool, and keeps the platform package outside domain and raster code. Body gestures,
stylus buttons, inverted-tip switching, tablet-pad mappings and unmatched
native-only samples do not yet have application actions.

## ABR compatibility

The import dialog accepts `.abr`. AbrKit owns bounded decoding of legacy
versions 1 and 2 and modern versions 6, 7, 9 and 10. It covers sampled and
computed tips, supported raw and PackBits masks, modern descriptors, hierarchy
and compatibility warnings. Focale maps names, diameter, hardness, spacing,
angle, roundness, Shape Dynamics, Scattering, Transfer, Texture, Dual Brush,
Color Dynamics, Brush Pose, Brush Projection, Noise, Wet Edges and Protect
Texture where its own brush model can reproduce them.
Each ABR pose value and its override switch are retained independently. Stylus
Wheel, Initial Direction, Direction, Initial Rotation and Rotation retain
distinct controls instead of being discarded or merged. Embedded ABR
pattern records become ordinary content-addressed `PatternAsset` values. Large
libraries are decoded on a worker isolate.

ABR export writes a self-contained modern version-10, subversion-2 library.
Antialiased circular tips remain computed; sampled tips and texture patterns
are embedded with PackBits compression. Focale maps the same supported Brush
Settings groups listed above back to Photoshop descriptors. Because a computed
ABR tip cannot express Focale's square, diamond or non-antialiased procedural
footprints, those tips are baked into bounded 256 × 256 sampled masks instead
of being changed to circles. Re-import therefore preserves their appearance
but represents them as sampled tips. `.fbrush` remains the lossless backup for
Focale identities and procedural semantics.

Orphan sampled masks remain usable when a library has no matching descriptor.
Bristle, erodible and unknown physical engines are skipped rather than
silently approximated as round brushes. External ABR pattern references that
do not carry their pixels, tip-axis flips and settings with no Focale
equivalent remain outside imported behavior. Tonal intersections are
GPU-friendly approximations where Adobe's exact proprietary mask formula is
not documented. An unsupported or malformed library produces a dedicated
error and leaves the user catalogue unchanged.

The format adapters only exchange ordinary `BrushPreset`, `SampledBrushTip`
and `PatternAsset` values with the application; AbrKit records and compression
details do not enter application state or the raster engine. ADRs 0047, 0048,
0052, 0053 and 0181 record these boundaries. Adobe's current user-facing import
workflow is documented at
<https://helpx.adobe.com/photoshop/desktop/apply-painting-techniques/brushes-presets/import-brushes-brush-packs.html>.
