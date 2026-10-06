# Custom-shape presets

[Documentation](../README.md) · [File formats](README.md)

Focale's Custom Shape tool uses a global vector catalogue. Five built-in shapes
are always available; portable `.fshape` libraries, Photoshop CSH libraries and
paths defined inside Focale can add user presets without changing the
application bundle.

## Catalogue workflow

The Shape field in the Custom Shape options and the sidebar Shapes panel expose
the same catalogue. Both are searchable and lazily build only visible entries;
the panel additionally presents CSH/`.fshape` hierarchy as collapsible groups.
Selecting a panel thumbnail activates the Custom Shape tool with that preset.
Names and imported group paths participate in search. The import action accepts
`.fshape` and `.csh` files, reports an actionable localized error for an
unsupported or corrupt library, and logs recoverable compatibility notices.
Separate export actions write every user entry, regardless of its original
source, to `.fshape` or `.csh`; built-in shapes are omitted. The Shapes panel
also exports one selected user shape in either format from its context menu.
Imported and locally defined entries can be removed individually from either
catalogue surface.

Edit ▸ Define Custom Shape saves the selected persistent path under a chosen
name. The rendered bounds are normalized to a unit rectangle and their aspect
ratio is retained. The source path is neither modified nor referenced by the
catalogue entry, so later edits to either value remain independent. Empty paths
and paths with zero width or height cannot be defined.

## Native `.fshape` format

`.fshape` is a portable UTF-8 JSON library. Version 1 stores an ordered list of
self-contained vector presets:

```json
{
  "format": "focale-custom-shape-presets",
  "version": 1,
  "presets": [
    {
      "version": 1,
      "id": "shape.user.01234567-89ab-cdef-0123-456789abcdef",
      "name": "Leaf",
      "sourceAspectRatio": 2,
      "groupPath": ["Nature"],
      "sortOrder": 4,
      "outline": {
        "id": "shape.user.01234567-89ab-cdef-0123-456789abcdef",
        "name": "Leaf",
        "subpaths": [
          {
            "closed": true,
            "anchors": [
              {"x": 0, "y": 0.5, "outX": 0.2, "outY": -0.5},
              {"x": 1, "y": 0.5, "inX": -0.2, "inY": -0.5},
              {"x": 0.5, "y": 1}
            ]
          }
        ]
      }
    }
  ]
}
```

Coordinates use the preset's normalized vector space. `inX`/`inY` and
`outX`/`outY` are handles relative to their anchor. Each subpath may additionally
store `closed`, `operation` (`union`, `subtract`, `intersect` or `exclude`),
`fillRule` (`nonZero` or `evenOdd`) and smooth anchor types using the same
`VectorPath` contract as `docs/formats/focale.md`.

Identifiers, names, hierarchy, order and source proportion survive a native
round trip. Importing an identity already used by a built-in or local entry
assigns the incoming preset a fresh `shape.user.*` identity rather than
overwriting existing content. A malformed entry rejects the whole library;
there is no partial native import.

The encoded library is limited to 128 MiB and 8,192 presets. The per-preset,
anchor, hierarchy and coordinate limits in the table below are validated again
before persistence. JSON work for libraries of at least 256 KiB runs outside
the interface isolate.

## Photoshop CSH compatibility

CshKit decodes and encodes the binary container. Focale's adapters retain:

* source names, ordering and nested group paths;
* source width-to-height proportions;
* open and closed cubic Bézier contours;
* linked and unlinked handles;
* combine, subtract, intersect and exclude operations;
* non-zero and even-odd fill rules;
* Photoshop's initial all-pixels fill state.

An unspecified or unknown source operation is imported as Combine and produces
a compatibility notice instead of being silently discarded. CSH export writes
a canonical version-2 library containing the same normalized vector geometry,
source proportions, catalogue order and nested group paths. `.fshape` remains
the lossless Focale backup because it also preserves application identities and
ordering metadata without translating them to Photoshop records. Focale does
not bundle Adobe's proprietary shape catalogue.

## Ownership and persistence

User catalogue entries are stored below application support in the
`custom-shapes` directory. Each `.fcshape` file is bounded JSON owned by Focale;
it is an internal per-entry cache and not a portable interchange format.
`.fshape` is the corresponding user-facing multi-preset format. Preferences
keep only the selected stable identity.

When a preset is drawn, its normalized outline, name, identity and source
proportion are embedded in the shape layer. A `.focale` project consequently
does not depend on the source CSH file or the local catalogue. Removing a preset
does not change existing layers, and reopening the project on another machine
preserves the exact vector outline.

## Resource limits

| Resource                                        | Limit                   |
|-------------------------------------------------|-------------------------|
| CSH/`.fshape` input, output or local catalogue  | 128 MiB                 |
| One user preset payload                         | 16 MiB                  |
| User presets                                    | 8,192                   |
| Anchors per preset                              | 100,000                 |
| Hierarchy depth                                 | 32 groups               |
| Name or identifier source text                  | 4,096 UTF-16 code units |

The CSH decoder applies additional record and tagged-block limits before model
allocation. Inputs of at least 128 KiB are decoded off the interface isolate;
large aggregate catalogue writes are encoded there as well. File writes are
atomic per preset, and a failed batch is rolled back.

## Drawing behaviour

An unconstrained drag fits the selected outline to the drag rectangle. Holding
Shift preserves the source preset's width-to-height proportion; Alt draws from
the initial pointer position as the centre. Shape, Path and Pixels modes reuse
the same normalized geometry, operations and appearance controls.

The picker and Shapes panel render vector thumbnails directly and build only
visible rows. The panel caps visual hierarchy indentation and adapts its column
count to the sidebar width. The catalogue identity index is computed once, so
pointer movement does not scan or reallocate the complete preset list.
