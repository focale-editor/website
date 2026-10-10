# Contour preset libraries

[Documentation](../README.md) · [File formats](README.md)

Layer-effect contours reshape an effect's falloff. The shared contour selector
captures the current curve as a named preset and imports or exports user
libraries as native `.fcontour` or Photoshop `.shc` files. Built-in entries
remain available and are excluded from exports. Applying a preset changes the
current effect; editing the catalogue does not change existing documents.

## Native `.fcontour` format

A library is a version-1 UTF-8 JSON envelope with root `format` equal to
`focale-contour-presets` and a nonempty `presets` array:

```json
{
  "format": "focale-contour-presets",
  "version": 1,
  "presets": [
    {
      "id": "contour.user.cone",
      "name": "Cone",
      "groupPath": ["Studio"],
      "curve": [[0, 0], [0.5, 1, 1], [1, 0]]
    }
  ]
}
```

Each entry contains `id`, `name`, optional `groupPath`, and `curve`. Each curve
point is `[x, y]` for a smooth point or `[x, y, 1]` for a corner. Native writers
use normalized 0–1 coordinates. Smooth runs use natural cubic splines; corners
separate the runs. Coordinates retain native precision. Effect-specific range
and antialiasing are part of the layer style, not of this reusable curve.

## Validation and normalization

Libraries are limited to 16 MiB and 4,096 entries. Names and identifiers have
at most 4,096 UTF-16 code units, and group paths at most 32 nonempty segments.
Empty libraries, duplicate identifiers, invalid entries or unsupported versions
reject the complete file. Imports into an existing catalogue resolve identifier
collisions with fresh application identifiers.

A stored curve has 2–256 points with finite numeric coordinates. The reader
normalizes curves by clamping coordinates to the unit square, sorting by x,
replacing points whose x coordinates differ by less than 0.000001, and adding
missing endpoints. The normalized curve must also fit 256 points; an entry
that would exceed this bound after adding endpoints is rejected on import,
before it can produce an unreadable saved library. A third component equal to 1 marks a corner; other values
are treated as smooth. Native exports contain the resulting normalized curve.

## Photoshop interchange

SHC import and export preserve supported contour names, points and corner flags.
Imports are bounded to 4 MiB, 4,096 contours and 256 points per contour. A SHC
library with no usable curves is rejected. SHC uses a 0–255 coordinate grid;
export rounds coordinates to that grid and merges points that land on the same
horizontal coordinate. Catalogue identifiers and groups are not exported.
Use `.fcontour` to retain the full native curve and catalogue metadata.

Applied contours are embedded directly in [layer styles](styles.md) and
[projects](focale.md), so they do not depend on the global library afterward.
