# Vector resource collection format

[Documentation](../README.md) · [File formats](README.md)

A resource collection is a standard `.zip` containing a `.fvector` project copy,
captured source files, collectable fonts and a JSON dependency report. It is a
delivery package, not another native project envelope: extract it and open
`project.fvector`. Its project follows the [version-1 specification](fvector.md).

## Archive layout

```text
collection.zip
├── project.fvector
├── report.json
├── resources/<sha256>.<encoding>
└── fonts/<sha256>.ttf|.otf
```

Only the project and report are mandatory. Resources and fonts are optional.
Names use lowercase SHA-256 identities of the actual bytes, independent of source
filenames. Equal payloads at the same archive path are written once. Source
extensions describe their retained encoding: `fvector` for vector sources,
a recognized image extension for raster sources, or `bin` when unrecognized.
Nested editable photo documents use `focale`. Font programs beginning with the
OpenType `OTTO` signature use `otf`; other admitted programs use `ttf`.
The current writer stores ZIP entries without compression.

The project copy embeds available linked snapshots that are not preview-only.
The original document is unchanged. Collection never refreshes source bytes from
an external path. Nested editable archives are copied intact; their dependencies
are not recursively collected. Inactive data-set paths remain unchanged.

## Report envelope

`report.json` is UTF-8 JSON with the following fields:

| Field | Type / value | Meaning |
| --- | --- | --- |
| `format` | `focale-resource-collection` | Report identifier. |
| `version` | integer `1` | Current report schema. |
| `project` | `project.fvector` | Project entry to open after extraction. |
| `incomplete` | boolean | At least one declared dependency remains unresolved or uninspected. |
| `sourcePolicy` | `captured-snapshots-no-external-refresh` | Sources are the captured authored snapshots. |
| `fontPolicy` | `install-available-font-files-with-original-family-names` | Loose fonts retain authored family names and need installation on the receiving system. |
| `sources` | array | One record per inspected source placement. |
| `fonts` | array | One record per distinct requested font face. |
| `uncollectedDataSetSources` | array | Inactive external data-set dependencies. |

Each `sources` record contains:

| Field | Type | Meaning |
| --- | --- | --- |
| `location`, `owner`, `name` | strings | Placement location, owner identity and source name. |
| `originalPath` | string or null | Authored external path; informational, never an extraction destination. |
| `externalState` | string or null | File-metadata inspection result, or null when unavailable/not applicable. |
| `snapshotAvailable` | boolean | Whether captured source bytes are nonempty. |
| `previewOnly` | optional boolean | Present as true when retained bytes are only a preview. |
| `nestedDependenciesNotInspected` | boolean | The vector or nested editable source can contain further dependencies. |
| `snapshot` | optional string | Archive-relative path of captured source bytes. |
| `editableDocument` | optional string | Archive-relative path of a nested editable `.focale` document. |

Each `fonts` record contains `family` (string), `weight` (integer), `italic`
(boolean), `state` (`embedded`, `available`, `unavailable` or `unreadable`),
`permission` (recognized embedding-permission name or null) and `needsRecovery`
(boolean). `file` is present only when a full program is included as a loose
archive entry. An embedded font can remain usable from the project without a
separate file. Font metadata governs loose-file collection; displaying a fallback
font does not prove that the authored face was collected.

Each `uncollectedDataSetSources` record contains the strings `dataSet`, `variable`
and `path`. Collection records these paths but does not read or rewrite them.

## Complete empty-scene report

For a project without placed sources, text or data-set dependencies:

```json
{
  "format": "focale-resource-collection",
  "version": 1,
  "project": "project.fvector",
  "incomplete": false,
  "sourcePolicy": "captured-snapshots-no-external-refresh",
  "fontPolicy": "install-available-font-files-with-original-family-names",
  "sources": [],
  "fonts": [],
  "uncollectedDataSetSources": []
}
```

## Completeness and bounds

`incomplete` is true if a font needs recovery, any inactive data-set path exists,
a source lacks a snapshot, a source is preview-only, or a nested source has
uninspected dependencies. The exporter requires explicit acceptance before
writing such a package. A false flag describes the captured inspection, not a
promise that every external application can reproduce the artwork.

The current limits are 128 MiB for both aggregate uncompressed entries and the
final ZIP, 10,000 entries, 4,096 source placements, 4,096 inactive data-set paths,
256 distinct font-face requests and 64 MiB of distinct inspected font programs.
The nested `.fvector` writer applies its own JSON and binary limits too. A caller
can request smaller archive limits. The report and project count toward the ZIP
budget; the binary payloads copied alongside the project also count.

Source paths and authored metadata are retained in the report. Consumers should
use archive-relative resource names to find collected files, and must not treat
`originalPath` or a data-set `path` as an instruction to access the local system.
